import { useState, useEffect, useMemo } from "react";
import { Flame, Plus, ChevronRight, X, User, Shield } from "lucide-react";
import { CHARACTER_PORTRAIT_BLOCK_TYPES } from "../data/pageSections.js";
import { PROGRESSION_LEVELS, PROGRESSION_STAT_ROWS } from "../data/statFields.js";
import { BOOK_TAB_COLORS } from "../data/theme.js";
import { getPageBlocks, makeBlock } from "../utils/blocks.js";
import { keyActivate } from "../utils/misc.js";
import { deriveCharStats } from "../utils/stats.js";
import { styles } from "../styles.js";
import { activeElements } from "../state/globals.js";
import { useModals } from "../components/Modals.jsx";
import { SearchSelect } from "../components/SearchSelect.jsx";
import { QuickCreateButton } from "../components/QuickCreateButton.jsx";
import { PortraitCarousel } from "../components/PortraitCarousel.jsx";
import { SpriteListEditor } from "../components/SpriteUploader.jsx";
import { AppearancesBlock } from "../blocks/AppearancesBlock.jsx";
import { CharStatsBlock, CharStatsSummaryBars } from "../blocks/CharStatsBlock.jsx";
import { RelationsBlock } from "../blocks/RelationsBlock.jsx";
import { ResistanceBars, ResistancesBlock } from "../blocks/ResistancesBlock.jsx";
import { TextBlock } from "../blocks/TextBlock.jsx";
import { SkillListRow } from "./ClassBookView.jsx";

const HISTORY_PROMPTS = [
  { key: "motivacion", label: "Motivación" },
  { key: "secreto", label: "Secreto" },
  { key: "voz", label: "Voz / manera de hablar" },
];

// Sección plegable: colapsada por defecto salvo que ya tenga contenido, con
// un resumen siempre visible arriba (children del summary) — mismo patrón
// que BonusSection en ItemStatsBlock, generalizado para reusarlo acá con
// varias secciones distintas.
function Accordion({ title, tag, defaultOpen, summary, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        onClick={() => setOpen((o) => !o)} role="button" tabIndex={0} onKeyDown={keyActivate}>
        <span style={{ ...styles.bookSectionTitle, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          {title}
          {tag && <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--warn, #ffb454)", background: "color-mix(in srgb, var(--warn, #ffb454) 18%, transparent)", border: "1px solid color-mix(in srgb, var(--warn, #ffb454) 45%, transparent)", borderRadius: 999, padding: "1px 7px" }}>{tag}</span>}
        </span>
        <ChevronRight size={14} color="var(--muted)" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .12s ease", flexShrink: 0 }} />
      </div>
      {!open && summary && <div style={{ marginTop: 8 }}>{summary}</div>}
      {open && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}

export function CharacterBookView({ nodes, navigateToId, updateNode, addCharacter, addSkillForCharacter, cloneCharacterStats, addClass, addSubclass, addObjectItem, deleteNode, navigateByName, isMobile }) {
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

  // Clases: solo las clases base (sin parentClassId) se eligen arriba; las
  // subclases de cada clase base ya elegida aparecen anidadas debajo, con su
  // propia arma que las despierta — ver comentario en app.jsx (addSubclass).
  const allClasses = useMemo(() => nodes.filter((n) => n.category === "class"), [nodes]);
  const baseClasses = useMemo(
    () => allClasses.filter((c) => !c.parentClassId).sort((a, b) => a.name.localeCompare(b.name)),
    [allClasses]
  );
  const selectedClassIds = active?.classIds || [];
  const weaponOptions = useMemo(
    () => nodes.filter((n) => n.category === "object").map((n) => ({ id: n.id, label: n.name })),
    [nodes]
  );

  function toggleClass(id) {
    if (!active) return;
    updateNode(active.id, { classIds: selectedClassIds.includes(id) ? selectedClassIds.filter((x) => x !== id) : [...selectedClassIds, id] });
  }
  async function handleAddClassInline() {
    if (!active) return;
    const name = await promptValue("Nombre de la nueva clase:");
    if (!name) return;
    addClass(name, { nodeId: active.id, apply: (n, newId) => ({ ...n, classIds: [...(n.classIds || []), newId] }) });
  }
  async function handleAddSubclassInline(baseClassId) {
    if (!active) return;
    const name = await promptValue("Nombre de la nueva subclase:");
    if (!name) return;
    addSubclass(baseClassId, name, { nodeId: active.id, apply: (n, newId) => ({ ...n, classIds: [...(n.classIds || []), newId] }) });
  }

  // Clonar de…: copia clases/atributos/resistencias de otro personaje como
  // punto de partida — no toca nombre, retrato, historia ni relaciones.
  const cloneOptions = useMemo(
    () => characters.filter((c) => c.id !== active?.id).map((c) => ({ id: c.id, label: c.name })),
    [characters, active]
  );
  const [cloneNote, setCloneNote] = useState(null);
  function handleClone(sourceId) {
    if (!active || !cloneCharacterStats) return;
    cloneCharacterStats(active.id, sourceId);
    setCloneNote(nodes.find((n) => n.id === sourceId)?.name || null);
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
  const weakElements = Object.entries(resistBlock?.elementRes || {}).filter(([, level]) => level === "debil");

  const usedPrompts = HISTORY_PROMPTS.filter((p) => bioBlock?.[p.key]);
  const unusedPrompts = HISTORY_PROMPTS.filter((p) => !bioBlock?.[p.key]);

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
          <div style={{ ...styles.bookSpread, flexDirection: "column" }}>
            <div style={{ ...styles.bookPage, overflowY: "auto" }}>
              <div style={{ display: "flex", gap: 22, flexDirection: isMobile ? "column" : "row" }}>
                <div style={{ width: isMobile ? "100%" : 190, flexShrink: 0 }}>
                  {portraitBlock && <PortraitCarousel block={portraitBlock} updateBlock={updateCharBlock} />}
                  {cloneCharacterStats && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ ...styles.statsIncidenceTitle2, marginTop: 0 }}>Clonar stats de…</div>
                      <SearchSelect options={cloneOptions} value={null} onChange={(id) => id && handleClone(id)} placeholder="Buscar personaje base…" />
                      {cloneNote && (
                        <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 6 }}>
                          ✓ Clon de <b>{cloneNote}</b> — clases, atributos y resistencias copiados.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ ...styles.bookPageTitle, textAlign: "left", margin: "0 0 4px" }}>{active.name}</h2>

                  <div style={{ ...styles.statsIncidenceTitle2, marginTop: 10 }}>Clases</div>
                  <div style={styles.tagsRow}>
                    <Shield size={13} color="var(--muted)" />
                    {baseClasses.map((c) => {
                      const isActive = selectedClassIds.includes(c.id);
                      return (
                        <button key={c.id} type="button" onClick={() => toggleClass(c.id)}
                          style={{ ...styles.tagChip, cursor: "pointer", border: "1px solid var(--border)", ...(isActive ? { background: "var(--accent)", color: "var(--bg)" } : {}) }}>
                          {c.name}
                        </button>
                      );
                    })}
                    <button type="button" onClick={handleAddClassInline}
                      style={{ ...styles.tagChip, cursor: "pointer", border: "1px dashed var(--border)", background: "transparent", color: "var(--muted)" }}>
                      + crear nueva…
                    </button>
                  </div>
                  {baseClasses.length === 0 && (
                    <div style={styles.bookBottomHint}>Todavía no hay clases — creá una con el botón de arriba.</div>
                  )}

                  {baseClasses.filter((c) => selectedClassIds.includes(c.id)).map((baseClass) => {
                    const subclasses = allClasses.filter((sc) => sc.parentClassId === baseClass.id).sort((a, b) => a.name.localeCompare(b.name));
                    return (
                      <div key={baseClass.id} style={{ marginLeft: 18, marginTop: 4 }}>
                        {subclasses.map((sc) => (
                          <div key={sc.id}
                            style={{ margin: "6px 0", padding: "8px 10px", borderLeft: "2px solid var(--border)", background: "color-mix(in srgb, var(--panel2) 55%, transparent)", borderRadius: "0 6px 6px 0" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <button type="button" onClick={() => toggleClass(sc.id)}
                                style={{ ...styles.tagChip, cursor: "pointer", border: "1px solid var(--border)", fontSize: 11.5, ...(selectedClassIds.includes(sc.id) ? { background: "var(--accent)", color: "var(--bg)" } : {}) }}>
                                {sc.name}
                              </button>
                              <span style={{ fontSize: 10.5, color: "var(--muted)" }}>subclase de {baseClass.name}</span>
                            </div>
                            {sc.awakenWeaponId ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--muted)" }}>
                                🗡️ Se despierta con <b style={{ color: "var(--text)" }}>{nodes.find((n) => n.id === sc.awakenWeaponId)?.name || "?"}</b>
                                <X size={11} style={{ cursor: "pointer", opacity: 0.6 }} onClick={() => updateNode(sc.id, { awakenWeaponId: null })} />
                              </div>
                            ) : (
                              <AwakenWeaponPicker options={weaponOptions}
                                onPick={(weaponId) => updateNode(sc.id, { awakenWeaponId: weaponId })}
                                onCreate={addObjectItem ? (name) => addObjectItem(name, { nodeId: sc.id, apply: (n, newId) => ({ ...n, awakenWeaponId: newId }) }) : null} />
                            )}
                          </div>
                        ))}
                        {addSubclass && (
                          <button type="button" onClick={() => handleAddSubclassInline(baseClass.id)}
                            style={{ fontSize: 10.5, color: "var(--muted)", background: "transparent", border: "1px dashed var(--border)", borderRadius: 999, padding: "3px 9px", cursor: "pointer", marginTop: 2 }}>
                            + nueva subclase de {baseClass.name}
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <div style={{ ...styles.statsIncidenceTitle2, marginTop: 16 }}>Historia</div>
                  {bioBlock && <TextBlock block={bioBlock} nodes={nodes} nodeId={active.id} navigateByName={navigateByName} updateBlock={updateCharBlock} />}
                  {usedPrompts.map((p) => (
                    <label key={p.key} style={{ display: "block", marginTop: 8 }}>
                      <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted)" }}>{p.label}</span>
                      <input value={bioBlock?.[p.key] || ""} onChange={(e) => updateCharBlock(bioBlock.id, { [p.key]: e.target.value })}
                        style={{ ...styles.statsInput, marginTop: 3 }} />
                    </label>
                  ))}
                  {unusedPrompts.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {unusedPrompts.map((p) => (
                        <button key={p.key} type="button"
                          onClick={() => updateCharBlock(bioBlock.id, { [p.key]: "" })}
                          style={{ fontSize: 10.5, color: "var(--muted2, var(--muted))", background: "transparent", border: "1px dashed var(--border)", borderRadius: 999, padding: "3px 9px", cursor: "pointer" }}>
                          + {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Accordion title="Estadísticas y progresión" defaultOpen={false}
                summary={statsBlock && <CharStatsSummaryBars block={statsBlock} />}>
                {statsBlock && <CharStatsBlock block={statsBlock} updateBlock={updateCharBlock} />}
                {statsBlock && (
                  <>
                    <div style={{ ...styles.statsIncidenceTitle2, marginTop: 14 }}>Escalado por nivel</div>
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
                  </>
                )}
              </Accordion>

              <Accordion title="Resistencias" defaultOpen={false}
                summary={resistBlock && <ResistanceBars block={resistBlock} />}>
                {resistBlock && <ResistancesBlock block={resistBlock} updateBlock={updateCharBlock} />}
                <div style={{ ...styles.statsIncidenceTitle2, marginTop: 12 }}>Debilidades</div>
                {weakElements.length === 0 ? <span style={styles.bookBottomHint}>Sin debilidades configuradas.</span> : weakElements.map(([key]) => {
                  const el = activeElements.find((e) => e.key === key);
                  return (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#c45c5c", padding: "4px 0" }}>
                      <Flame size={12} /> {el?.label || key} <span style={{ opacity: 0.65, fontSize: 10.5 }}>×2 daño</span>
                    </div>
                  );
                })}
              </Accordion>

              <Accordion title="Relaciones" defaultOpen={(relBlock?.entries || []).length > 0}>
                {relBlock && <RelationsBlock block={relBlock} nodes={nodes} nodeId={active.id} updateBlock={updateCharBlock} addCharacter={addCharacter} />}
              </Accordion>

              <Accordion title="Retratos y posturas" defaultOpen={false}>
                <div style={styles.statsIncidenceTitle2}>Expresiones (diálogo)</div>
                {expressionBlock && <SpriteListEditor block={expressionBlock} keyPrefix="expr" title=""
                  placeholder="Ej. Normal, Enojada, Sorprendida…" addLabel="Agregar expresión" updateBlock={updateCharBlock} />}
                <div style={{ ...styles.statsIncidenceTitle2, marginTop: 16 }}>Sprites de exploración</div>
                {explorationBlock && <SpriteListEditor block={explorationBlock} keyPrefix="explore" title=""
                  placeholder="Ej. Caminar arriba, Idle…" addLabel="Agregar sprite" updateBlock={updateCharBlock} />}
                <div style={{ ...styles.statsIncidenceTitle2, marginTop: 16 }}>Sprites de combate</div>
                {combatBlock && <SpriteListEditor block={combatBlock} keyPrefix="combat" title=""
                  placeholder="Ej. Idle, Ataque, Herido…" addLabel="Agregar sprite" updateBlock={updateCharBlock} />}
              </Accordion>

              <Accordion title="Habilidades únicas" defaultOpen={skills.length > 0}>
                {skills.length === 0 && <span style={styles.bookBottomHint}>Sin habilidades propias todavía.</span>}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {skills.map((s) => (
                    <SkillListRow key={s.id} skill={s} block={getPageBlocks(s).find((b) => b.type === "skillInfo")} onOpen={() => navigateToId(s.id)} />
                  ))}
                </div>
                <button style={{ ...styles.bookAddClassBtn, marginTop: 8, alignSelf: "flex-start" }} onClick={handleAddSkill}>
                  <Plus size={14} /> Nueva habilidad
                </button>
              </Accordion>

              <Accordion title="Apariciones" tag="nuevo" defaultOpen={false}>
                <AppearancesBlock nodes={nodes} nodeId={active.id} />
              </Accordion>

              <span style={{ ...styles.catalogLink, display: "inline-block", marginTop: 18 }} onClick={() => navigateToId(active.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                Abrir página completa →
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Combo de búsqueda + creación al vuelo para "arma que despierta esta
// subclase" — mismo patrón que el resto de la app (SearchSelect + botón de
// creación rápida separado), en vez de escribir un widget nuevo.
function AwakenWeaponPicker({ options, onPick, onCreate }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, maxWidth: 260 }}>
      <div style={{ flex: 1 }}>
        <SearchSelect options={options} value={null} onChange={(id) => id && onPick(id)} placeholder="🗡️ Sin arma — elegí una…" />
      </div>
      {onCreate && <QuickCreateButton title="Crear arma nueva y asignarla" onCreate={onCreate} />}
    </div>
  );
}
