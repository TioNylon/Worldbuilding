import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Shield, User } from "lucide-react";
import { RELATION_TYPES } from "../data/entryTypes.js";
import { PROGRESSION_LEVELS, PROGRESSION_STAT_ROWS } from "../data/statFields.js";
import { BOOK_TAB_COLORS } from "../data/theme.js";
import { getPageBlocks } from "../utils/blocks.js";
import { narrativeIndex } from "../utils/storyOrder.js";
import { keyActivate } from "../utils/misc.js";
import { deriveCharStats } from "../utils/stats.js";
import { loadImage } from "../storage.js";
import { styles } from "../styles.js";
import { activeElements } from "../state/globals.js";
import { Accordion } from "../components/Accordion.jsx";
import { AppearancesBlock } from "../blocks/AppearancesBlock.jsx";
import { CharStatsSummaryBars } from "../blocks/CharStatsBlock.jsx";
import { ResistanceBars } from "../blocks/ResistancesBlock.jsx";
import { TextBlock } from "../blocks/TextBlock.jsx";
import { SkillListRow } from "./ClassBookView.jsx";

const HISTORY_PROMPTS = [
  { key: "motivacion", label: "Motivación" },
  { key: "secreto", label: "Secreto" },
  { key: "voz", label: "Voz / manera de hablar" },
];

function ReadOnlyPortrait({ block }) {
  const images = useMemo(() => [
    { id: "primary", imageKey: block.imageKey || null, label: block.caption || "" },
    ...(block.extraImages || []),
  ].filter((item) => item.imageKey), [block]);
  const [index, setIndex] = useState(0);
  const [src, setSrc] = useState(null);
  const current = images[Math.min(index, Math.max(0, images.length - 1))];
  useEffect(() => {
    let cancelled = false;
    if (!current?.imageKey) { setSrc(null); return undefined; }
    loadImage(current.imageKey).then((value) => { if (!cancelled) setSrc(value); });
    return () => { cancelled = true; };
  }, [current?.imageKey]);
  useEffect(() => { if (index >= images.length) setIndex(0); }, [images.length, index]);
  if (!images.length || !src) return null;
  return (
    <figure className="atlas-book-portrait">
      <img src={src} alt={current.label || "Retrato del personaje"} />
      {images.length > 1 && <>
        <button type="button" className="previous" onClick={() => setIndex((value) => (value - 1 + images.length) % images.length)} title="Retrato anterior"><ChevronLeft size={14} /></button>
        <button type="button" className="next" onClick={() => setIndex((value) => (value + 1) % images.length)} title="Retrato siguiente"><ChevronRight size={14} /></button>
      </>}
      {current.label && <figcaption>{current.label}</figcaption>}
    </figure>
  );
}

function ReadOnlyRelations({ block, nodes, nodeId }) {
  const outgoing = (block?.entries || []).map((entry) => ({
    ...entry,
    person: nodes.find((node) => node.id === entry.targetId),
    type: RELATION_TYPES.find((type) => type.key === entry.relType),
  })).filter((entry) => entry.person);
  const incoming = [];
  nodes.filter((node) => node.category === "character" && node.id !== nodeId).forEach((node) => {
    getPageBlocks(node).filter((candidate) => candidate.type === "relations").forEach((candidate) => {
      (candidate.entries || []).filter((entry) => entry.targetId === nodeId).forEach((entry) => incoming.push({
        person: node,
        type: RELATION_TYPES.find((type) => type.key === entry.relType),
      }));
    });
  });
  if (!outgoing.length && !incoming.length) return null;
  return (
    <div className="atlas-book-relations">
      {outgoing.map((entry) => <div key={entry.id || `${entry.targetId}-${entry.relType}`}>
        <span style={{ color: entry.type?.color || "var(--accent)" }}>{entry.type?.label || entry.relType}</span>
        <strong>{entry.person.name}</strong>
      </div>)}
      {incoming.map((entry, index) => <div key={`incoming-${entry.person.id}-${index}`}>
        <span style={{ color: entry.type?.color || "var(--accent)" }}>{entry.type?.label || "Relación"} de</span>
        <strong>{entry.person.name}</strong>
      </div>)}
    </div>
  );
}

function SpriteSummary({ blocks }) {
  const groups = [
    ["expressionSprites", "Expresiones"],
    ["explorationSprites", "Exploración"],
    ["combatSprites", "Combate"],
  ].map(([type, label]) => ({ label, sprites: blocks.find((block) => block.type === type)?.sprites || [] }))
    .filter((group) => group.sprites.length);
  if (!groups.length) return null;
  return <div className="atlas-book-sprite-summary">{groups.map((group) => <div key={group.label}>
    <strong>{group.label}</strong>
    <span>{group.sprites.map((sprite) => sprite.label || "Sin nombre").join(" · ")}</span>
  </div>)}</div>;
}

export function CharacterBookView({ nodes, navigateToId, navigateByName, isMobile }) {
  const characters = useMemo(() => {
    const story = narrativeIndex(nodes);
    return nodes.filter((node) => node.category === "character").sort(story.compare);
  }, [nodes]);
  const [activeId, setActiveId] = useState(characters[0]?.id || null);
  useEffect(() => {
    if (!characters.some((character) => character.id === activeId)) setActiveId(characters[0]?.id || null);
  }, [characters, activeId]);
  const active = characters.find((character) => character.id === activeId) || null;

  if (!active) {
    return <div style={styles.bookOuter}><div style={styles.bookEmptyState}>
      <User size={40} color="var(--accent)" />
      <p>No hay páginas de personaje para presentar todavía.</p>
    </div></div>;
  }

  const blocks = getPageBlocks(active);
  const statsBlock = blocks.find((block) => block.type === "charStats");
  const resistBlock = blocks.find((block) => block.type === "resistances");
  const relBlock = blocks.find((block) => block.type === "relations");
  const bioBlock = blocks.find((block) => block.type === "text");
  const portraitBlock = blocks.find((block) => block.type === "menuPortrait");
  const activeClass = nodes.find((node) => node.id === active.classIds?.[0] && node.category === "class");
  const skills = nodes.filter((node) => node.category === "skill" && getPageBlocks(node).some((block) => block.type === "skillInfo" && block.usableBy === active.id));
  const weakElements = Object.entries(resistBlock?.elementRes || {}).filter(([, level]) => level === "debil");
  const historyFields = HISTORY_PROMPTS.filter((item) => bioBlock?.[item.key]);
  const relationCount = (relBlock?.entries || []).length;
  const hasSprites = blocks.some((block) => ["expressionSprites", "explorationSprites", "combatSprites"].includes(block.type) && (block.sprites || []).length);

  return (
    <div style={styles.bookOuter}>
      <div style={styles.bookTopTabs}>
        {characters.map((character, index) => (
          <div key={character.id} style={{ ...styles.bookTab, background: BOOK_TAB_COLORS[index % BOOK_TAB_COLORS.length], ...(character.id === active.id ? styles.bookTabActive : {}) }}
            onClick={() => setActiveId(character.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
            <span>{character.name}</span>
          </div>
        ))}
      </div>

      <div style={styles.bookBody}><div style={styles.bookFrame}>
        <div style={{ ...styles.bookSpread, flexDirection: "column" }}>
          <div style={{ ...styles.bookPage, overflowY: "auto" }}>
            <div className="atlas-book-character-hero" style={{ gridTemplateColumns: isMobile || !portraitBlock?.imageKey ? "1fr" : "190px minmax(0,1fr)" }}>
              {portraitBlock?.imageKey && <ReadOnlyPortrait block={portraitBlock} />}
              <div>
                <span className="atlas-entry-kicker">REGISTRO DE PERSONAJE</span>
                <h2 style={{ ...styles.bookPageTitle, textAlign: "left", margin: "4px 0 10px" }}>{active.name}</h2>
                {activeClass && <div className="atlas-book-class-readout"><Shield size={14} /><span>Clase principal</span><strong>{activeClass.name}</strong></div>}
                {bioBlock && <TextBlock block={bioBlock} nodes={nodes} nodeId={active.id} navigateByName={navigateByName} readOnly />}
                {historyFields.length > 0 && <dl className="atlas-book-facts">{historyFields.map((item) => <div key={item.key}><dt>{item.label}</dt><dd>{bioBlock[item.key]}</dd></div>)}</dl>}
              </div>
            </div>

            {statsBlock && <Accordion title="Estadísticas y progresión" defaultOpen={false} summary={<CharStatsSummaryBars block={statsBlock} />}>
              <CharStatsSummaryBars block={statsBlock} />
              <div style={{ overflowX: "auto", marginTop: 12 }}><table style={styles.statsTable}>
                <thead><tr><th style={styles.statsTh}>Estadística</th>{PROGRESSION_LEVELS.map((level) => <th key={level} style={styles.statsTh}>Nv. {level}</th>)}</tr></thead>
                <tbody>{PROGRESSION_STAT_ROWS.map(([label, key]) => <tr key={key} className="catalog-row">
                  <td style={styles.statsTd}>{label}</td>{PROGRESSION_LEVELS.map((level) => <td key={level} style={styles.statsTdTotal}>{deriveCharStats({ ...statsBlock, nivel: level })[key]}</td>)}
                </tr>)}</tbody>
              </table></div>
            </Accordion>}

            {resistBlock && <Accordion title="Resistencias" defaultOpen={false} summary={<ResistanceBars block={resistBlock} />}>
              <ResistanceBars block={resistBlock} />
              {weakElements.length > 0 && <div className="atlas-book-weaknesses">{weakElements.map(([key]) => {
                const element = activeElements.find((item) => item.key === key);
                return <span key={key}><Flame size={12} /> {element?.label || key}</span>;
              })}</div>}
            </Accordion>}

            {relBlock && relationCount > 0 && <Accordion title="Relaciones" defaultOpen>
              <ReadOnlyRelations block={relBlock} nodes={nodes} nodeId={active.id} />
            </Accordion>}

            {hasSprites && <Accordion title="Recursos visuales" defaultOpen={false}><SpriteSummary blocks={blocks} /></Accordion>}

            {skills.length > 0 && <Accordion title="Habilidades registradas" defaultOpen>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {skills.map((skill) => <SkillListRow key={skill.id} skill={skill} block={getPageBlocks(skill).find((block) => block.type === "skillInfo")} onOpen={() => navigateToId(skill.id)} />)}
              </div>
            </Accordion>}

            <Accordion title="Apariciones en el guion" defaultOpen><AppearancesBlock nodes={nodes} nodeId={active.id} /></Accordion>
            <button type="button" className="atlas-book-open-page" onClick={() => navigateToId(active.id)}>Abrir página completa para editar</button>
          </div>
        </div>
      </div></div>
    </div>
  );
}