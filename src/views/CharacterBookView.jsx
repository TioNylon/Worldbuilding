import { useState, useEffect, useMemo } from "react";
import { Flame, Plus, ChevronRight, ChevronLeft, X, User } from "lucide-react";
import { CHARACTER_BOOK_PAGES, CHARACTER_PORTRAIT_BLOCK_TYPES } from "../data/pageSections.js";
import { PROGRESSION_LEVELS, PROGRESSION_STAT_ROWS } from "../data/statFields.js";
import { BOOK_TAB_COLORS } from "../data/theme.js";
import { getPageBlocks, makeBlock } from "../utils/blocks.js";
import { keyActivate } from "../utils/misc.js";
import { deriveCharStats } from "../utils/stats.js";
import { styles } from "../styles.js";
import { activeElements } from "../state/globals.js";
import { useModals } from "../components/Modals.jsx";
import { SpriteListEditor } from "../components/SpriteUploader.jsx";
import { CharStatsBlock, CharStatsSummaryBars } from "../blocks/CharStatsBlock.jsx";
import { CharacterClassDropdown } from "../blocks/ClassSummaryBlock.jsx";
import { ImageBlock } from "../blocks/ImageBlock.jsx";
import { RelationsBlock } from "../blocks/RelationsBlock.jsx";
import { ResistanceBars, ResistancesBlock } from "../blocks/ResistancesBlock.jsx";
import { TextBlock } from "../blocks/TextBlock.jsx";
import { SkillListRow } from "./ClassBookView.jsx";

export function CharacterBookView({ nodes, navigateToId, updateNode, addCharacter, addSkillForCharacter, deleteNode, navigateByName, isMobile }) {
  const { promptValue } = useModals();
  const characters = useMemo(
    () => nodes.filter((n) => n.category === "character").sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)),
    [nodes]
  );
  const [activeId, setActiveId] = useState(characters[0]?.id || null);
  useEffect(() => {
    if (!characters.some((c) => c.id === activeId)) setActiveId(characters[0]?.id || null);
  }, [characters, activeId]);
  const active = characters.find((c) => c.id === activeId) || null;

  const [page, setPage] = useState("ficha");
  useEffect(() => { setPage("ficha"); }, [activeId]);
  function turnPage(dir) {
    const idx = CHARACTER_BOOK_PAGES.indexOf(page);
    setPage(CHARACTER_BOOK_PAGES[(idx + dir + CHARACTER_BOOK_PAGES.length) % CHARACTER_BOOK_PAGES.length]);
  }

  useEffect(() => {
    if (!active) return;
    const blocks = getPageBlocks(active);
    const missing = ["charStats", "resistances", "relations", "text", ...CHARACTER_PORTRAIT_BLOCK_TYPES].filter((t) => !blocks.some((b) => b.type === t));
    if (missing.length) updateNode(active.id, { blocks: [...blocks, ...missing.map((t) => makeBlock(t))] });
  }, [active?.id]);

  function updateCharBlock(blockId, patch) {
    if (!active) return;
    updateNode(active.id, { blocks: getPageBlocks(active).map((b) => (b.id === blockId ? { ...b, ...patch } : b)) });
  }

  const skills = useMemo(() => {
    if (!active) return [];
    return nodes.filter((n) => n.category === "skill" && getPageBlocks(n).some((b) => b.type === "skillInfo" && b.usableBy === active.id));
  }, [nodes, active]);

  async function handleAddCharacter() {
    const name = await promptValue("Nombre del nuevo personaje:");
    if (!name) return;
    setActiveId(addCharacter(name));
  }
  async function handleAddSkill() {
    if (!active) return;
    const name = await promptValue("Nombre de la nueva habilidad:");
    if (!name) return;
    navigateToId(addSkillForCharacter(active.id, name));
  }

  if (!active) {
    return (
      <div style={styles.bookOuter}>
        <div style={styles.bookEmptyState}>
          <User size={40} color="var(--accent)" />
          <p>Todavía no hay personajes. Creá el primero para empezar el libro.</p>
          <button style={styles.bookAddClassBtn} onClick={handleAddCharacter}><Plus size={14} /> Nuevo personaje</button>
        </div>
      </div>
    );
  }

  const statsBlock = getPageBlocks(active).find((b) => b.type === "charStats");
  const resistBlock = getPageBlocks(active).find((b) => b.type === "resistances");
  const relBlock = getPageBlocks(active).find((b) => b.type === "relations");
  const bioBlock = getPageBlocks(active).find((b) => b.type === "text");
  const portraitBlock = getPageBlocks(active).find((b) => b.type === "menuPortrait");
  const expressionBlock = getPageBlocks(active).find((b) => b.type === "expressionSprites");
  const explorationBlock = getPageBlocks(active).find((b) => b.type === "explorationSprites");
  const combatBlock = getPageBlocks(active).find((b) => b.type === "combatSprites");

  return (
    <div style={styles.bookOuter}>
      <div style={styles.bookTopTabs}>
        {characters.map((c, i) => (
          <div key={c.id}
            style={{ ...styles.bookTab, background: BOOK_TAB_COLORS[i % BOOK_TAB_COLORS.length], ...(c.id === active.id ? styles.bookTabActive : {}) }}
            onClick={() => setActiveId(c.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
            <span>{c.name}</span>
            <X size={11} style={styles.bookTabRemove} onClick={(e) => { e.stopPropagation(); deleteNode(c.id); }} />
          </div>
        ))}
        <button style={styles.bookAddTab} onClick={handleAddCharacter} title="Agregar personaje"><Plus size={13} /></button>
      </div>

      <div style={styles.bookBody}>
        <div style={styles.bookFrame}>
          {page === "ficha" && (
            <div style={{ ...styles.bookSpread, flexDirection: "column" }}>
              <div style={{ ...styles.bookPage, overflowY: "auto" }}>
                <h2 style={styles.bookPageTitle}>{active.name}</h2>
                <div style={{ display: "flex", gap: 22, flexDirection: isMobile ? "column" : "row" }}>
                  <div style={{ width: isMobile ? "100%" : 150, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                    {portraitBlock && <ImageBlock block={portraitBlock} updateBlock={updateCharBlock} />}
                    <div style={{ ...styles.bookSectionTitle, marginTop: 10 }}>Clases</div>
                    <CharacterClassDropdown nodes={nodes} classIds={active.classIds} onChange={(classIds) => updateNode(active.id, { classIds })} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.bookSectionTitle}>Historia</div>
                    {bioBlock && <TextBlock block={bioBlock} nodes={nodes} nodeId={active.id} navigateByName={navigateByName} updateBlock={updateCharBlock} />}
                  </div>
                </div>
                <div style={{ ...styles.bookSectionTitle, marginTop: 18 }}>Estadísticas</div>
                {statsBlock && <CharStatsSummaryBars block={statsBlock} />}
                <div style={{ ...styles.bookSectionTitle, marginTop: 14 }}>Resistencias</div>
                {resistBlock && <ResistanceBars block={resistBlock} />}
                <span style={{ ...styles.catalogLink, display: "inline-block", marginTop: 14 }} onClick={() => navigateToId(active.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                  Abrir página completa →
                </span>
              </div>
              <div style={{ ...styles.bookPageTurn, right: 10 }} onClick={() => turnPage(1)} title="Ver resistencias y relaciones" role="button" tabIndex={0} onKeyDown={keyActivate}>
                <ChevronRight size={18} />
              </div>
            </div>
          )}
          {page === "resistencias" && (
            <div style={{ ...styles.bookSpread, flexDirection: "column" }}>
              <div style={{ ...styles.bookPage, overflowY: "auto" }}>
                <h2 style={styles.bookPageTitle}>Resistencias y relaciones</h2>
                <div style={{ display: "flex", gap: 20, flexDirection: isMobile ? "column" : "row" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.bookSectionTitle}>Resistencias</div>
                    {resistBlock && <ResistancesBlock block={resistBlock} updateBlock={updateCharBlock} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.bookSectionTitle}>Debilidades</div>
                    {(() => {
                      const weak = Object.entries(resistBlock?.elementRes || {}).filter(([, level]) => level === "debil");
                      if (weak.length === 0) return <span style={styles.bookBottomHint}>Sin debilidades configuradas.</span>;
                      return weak.map(([key]) => {
                        const el = activeElements.find((e) => e.key === key);
                        return (
                          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#c45c5c", padding: "4px 0" }}>
                            <Flame size={12} /> {el?.label || key} <span style={{ opacity: 0.65, fontSize: 10.5 }}>×2 daño</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.bookSectionTitle}>Relaciones</div>
                    {relBlock && <RelationsBlock block={relBlock} nodes={nodes} nodeId={active.id} updateBlock={updateCharBlock} />}
                  </div>
                </div>
              </div>
              <div style={{ ...styles.bookPageTurn, left: 10 }} onClick={() => turnPage(-1)} title="Volver a la ficha" role="button" tabIndex={0} onKeyDown={keyActivate}>
                <ChevronLeft size={18} />
              </div>
              <div style={{ ...styles.bookPageTurn, right: 10 }} onClick={() => turnPage(1)} title="Ver retratos y posturas" role="button" tabIndex={0} onKeyDown={keyActivate}>
                <ChevronRight size={18} />
              </div>
            </div>
          )}
          {page === "retratos" && (
            <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ ...styles.bookPage, alignItems: "center" }}>
                <h2 style={styles.bookPageTitle}>Retrato de menú</h2>
                <div style={{ width: "100%", maxWidth: 240 }}>
                  {portraitBlock && <ImageBlock block={portraitBlock} updateBlock={updateCharBlock} />}
                </div>
              </div>
              {!isMobile && <div style={styles.bookSpine} />}
              <div style={{ ...styles.bookPage, overflowY: "auto" }}>
                <h2 style={styles.bookPageTitle}>Posturas y sprites</h2>
                <div style={styles.bookSectionTitle}>Expresiones (diálogo)</div>
                {expressionBlock && <SpriteListEditor block={expressionBlock} keyPrefix="expr" title=""
                  placeholder="Ej. Normal, Enojada, Sorprendida…" addLabel="Agregar expresión" updateBlock={updateCharBlock} />}
                <div style={{ ...styles.bookSectionTitle, marginTop: 16 }}>Sprites de exploración</div>
                {explorationBlock && <SpriteListEditor block={explorationBlock} keyPrefix="explore" title=""
                  placeholder="Ej. Caminar arriba, Idle…" addLabel="Agregar sprite" updateBlock={updateCharBlock} />}
                <div style={{ ...styles.bookSectionTitle, marginTop: 16 }}>Sprites de combate</div>
                {combatBlock && <SpriteListEditor block={combatBlock} keyPrefix="combat" title=""
                  placeholder="Ej. Idle, Ataque, Herido…" addLabel="Agregar sprite" updateBlock={updateCharBlock} />}
              </div>
              <div style={{ ...styles.bookPageTurn, left: 10 }} onClick={() => turnPage(-1)} title="Volver a resistencias" role="button" tabIndex={0} onKeyDown={keyActivate}>
                <ChevronLeft size={18} />
              </div>
              <div style={{ ...styles.bookPageTurn, right: 10 }} onClick={() => turnPage(1)} title="Ver progresión y habilidades" role="button" tabIndex={0} onKeyDown={keyActivate}>
                <ChevronRight size={18} />
              </div>
            </div>
          )}
          {page === "progresion" && (
            <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ ...styles.bookPage, overflowY: "auto" }}>
                <h2 style={styles.bookPageTitle}>Progresión</h2>
                <div style={styles.bookSectionTitle}>Cálculo</div>
                {statsBlock && <CharStatsBlock block={statsBlock} updateBlock={updateCharBlock} />}
                <div style={{ ...styles.bookSectionTitle, marginTop: 18 }}>Escalado por nivel</div>
                {statsBlock && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={styles.statsTable}>
                      <thead>
                        <tr>
                          <th style={styles.statsTh}>Estadística</th>
                          {PROGRESSION_LEVELS.map((lv) => <th key={lv} style={styles.statsTh}>Nv. {lv}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {PROGRESSION_STAT_ROWS.map(([label, key]) => (
                          <tr key={key} className="catalog-row">
                            <td style={styles.statsTd}>{label}</td>
                            {PROGRESSION_LEVELS.map((lv) => (
                              <td key={lv} style={styles.statsTdTotal}>{deriveCharStats({ ...statsBlock, nivel: lv })[key]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {!isMobile && <div style={styles.bookSpine} />}
              <div style={styles.bookPage}>
                <h2 style={styles.bookPageTitle}>Habilidades únicas</h2>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {skills.length === 0 && <span style={styles.bookBottomHint}>Sin habilidades propias todavía.</span>}
                  {skills.map((s) => (
                    <SkillListRow key={s.id} skill={s} block={getPageBlocks(s).find((b) => b.type === "skillInfo")} onOpen={() => navigateToId(s.id)} />
                  ))}
                </div>
                <button style={{ ...styles.bookAddClassBtn, marginTop: 8, alignSelf: "flex-start" }} onClick={handleAddSkill}>
                  <Plus size={14} /> Nueva habilidad
                </button>
              </div>
              <div style={{ ...styles.bookPageTurn, left: 10 }} onClick={() => turnPage(-1)} title="Volver" role="button" tabIndex={0} onKeyDown={keyActivate}>
                <ChevronLeft size={18} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
