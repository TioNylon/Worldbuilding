import { useState, useEffect, useMemo } from "react";
import { Search, Skull, Plus, ChevronRight, ChevronLeft, X } from "lucide-react";
import { ENTRY_TYPES } from "../data/entryTypes.js";
import { BESTIARY_BLOCK_TYPES } from "../data/pageSections.js";
import { getPageBlocks, makeBlock } from "../utils/blocks.js";
import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";
import { useModals } from "../components/Modals.jsx";
import { SearchSelect } from "../components/SearchSelect.jsx";
import { CharStatsBlock } from "../blocks/CharStatsBlock.jsx";
import { LootTableBlock } from "../blocks/LootTableBlock.jsx";
import { ThreatLevelBlock } from "../blocks/NpcBlocks.jsx";
import { ResistancesBlock } from "../blocks/ResistancesBlock.jsx";

// Libro de monstruos: mismo lenguaje visual y de páginas que el Libro de clases,
// pero en vez de campos propios reutiliza los bloques que ya existen para
// Enemigo/Jefe (Nivel de amenaza, Estadísticas, Resistencias, Botín) — así toda
// la lógica de edición vive en un solo lugar y el libro es sólo una manera más
// cómoda de recorrerla y completarla.
// A diferencia de Clases o Personajes (pocas entradas), el Bestiario crece
// mucho más — así que en vez de una pestaña por bicho (que deja de andar a
// partir de cierta cantidad), la portada es un índice ordenado: primero los
// enemigos comunes en alfabético, después los jefes en alfabético.
export function BestiaryView({ nodes, navigateToId, updateNode, addMonster, deleteNode, isMobile, addObjectItem, cloneCharacterStats }) {
  const { promptValue } = useModals();
  const monsters = useMemo(() => {
    const enemies = nodes.filter((n) => n.category === "enemy").sort((a, b) => a.name.localeCompare(b.name));
    const bosses = nodes.filter((n) => n.category === "boss").sort((a, b) => a.name.localeCompare(b.name));
    return [...enemies, ...bosses];
  }, [nodes]);
  const [query, setQuery] = useState("");
  const visibleMonsters = query.trim()
    ? monsters.filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase()))
    : monsters;

  const [activeId, setActiveId] = useState(null);
  useEffect(() => {
    if (!monsters.some((m) => m.id === activeId)) setActiveId(monsters[0]?.id || null);
  }, [monsters, activeId]);

  const active = monsters.find((m) => m.id === activeId) || null;

  const [page, setPage] = useState("ficha");
  useEffect(() => { setPage("ficha"); }, [activeId]);

  useEffect(() => {
    if (!active) return;
    const blocks = getPageBlocks(active);
    const missing = BESTIARY_BLOCK_TYPES.filter((t) => !blocks.some((b) => b.type === t));
    if (missing.length) updateNode(active.id, { blocks: [...blocks, ...missing.map((t) => makeBlock(t))] });
  }, [active?.id]);

  const [descDraft, setDescDraft] = useState(active?.monsterDescription || "");
  useEffect(() => { setDescDraft(active?.monsterDescription || ""); }, [active?.id]);

  function updateMonsterBlock(blockId, patch) {
    if (!active) return;
    updateNode(active.id, { blocks: getPageBlocks(active).map((b) => (b.id === blockId ? { ...b, ...patch } : b)) });
  }

  async function handleAddMonster(category) {
    const name = await promptValue(category === "boss" ? "Nombre del nuevo jefe:" : "Nombre del nuevo enemigo:");
    if (!name) return;
    setActiveId(addMonster(category, name));
  }

  if (monsters.length === 0) {
    return (
      <div style={styles.bookOuter}>
        <div style={styles.bookEmptyState}>
          <Skull size={40} color="var(--accent)" />
          <p>Todavía no hay enemigos ni jefes. Creá el primero para empezar el bestiario.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={styles.bookAddClassBtn} onClick={() => handleAddMonster("enemy")}><Plus size={14} /> Nuevo enemigo</button>
            <button style={styles.bookAddClassBtn} onClick={() => handleAddMonster("boss")}><Plus size={14} /> Nuevo jefe</button>
          </div>
        </div>
      </div>
    );
  }

  const threatBlock = active ? getPageBlocks(active).find((b) => b.type === "threatLevel") : null;
  const statsBlock = active ? getPageBlocks(active).find((b) => b.type === "charStats") : null;
  const resistBlock = active ? getPageBlocks(active).find((b) => b.type === "resistances") : null;
  const lootBlock = active ? getPageBlocks(active).find((b) => b.type === "lootTable") : null;

  return (
    <div style={styles.bookOuter}>
      <div style={styles.bookBody}>
        <div style={styles.bookFrame}>
          {page === "ficha" ? (
            <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
              <div style={styles.bookPage}>
                <h2 style={styles.bookPageTitle}>Bestiario</h2>
                <div style={{ position: "relative", marginBottom: 8 }}>
                  <input value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar enemigo o jefe…" style={{ ...styles.statsInput, paddingRight: 26 }} />
                  <Search size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
                </div>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {visibleMonsters.length === 0 && (
                    <div style={{ color: "var(--muted)", fontSize: 12.5, fontStyle: "italic", padding: "4px 2px" }}>Sin resultados para "{query.trim()}".</div>
                  )}
                  {visibleMonsters.map((m) => {
                    const Icon = ENTRY_TYPES[m.category]?.icon || Skull;
                    return (
                      <div key={m.id}
                        style={{ ...styles.bookSkillRow, ...(m.id === activeId ? { background: "color-mix(in srgb, var(--accent) 16%, transparent)" } : {}) }}
                        onClick={() => setActiveId(m.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                        <Icon size={14} />
                        <span style={{ flex: 1 }}>{m.name}</span>
                        <span style={styles.bookSkillRowType}>{m.category === "boss" ? "Jefe" : "Enemigo"}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button style={{ ...styles.bookAddClassBtn, alignSelf: "flex-start" }} onClick={() => handleAddMonster("enemy")}>
                    <Plus size={14} /> Nuevo enemigo
                  </button>
                  <button style={{ ...styles.bookAddClassBtn, alignSelf: "flex-start" }} onClick={() => handleAddMonster("boss")}>
                    <Plus size={14} /> Nuevo jefe
                  </button>
                </div>
              </div>
              {!isMobile && <div style={styles.bookSpine} />}
              <div style={styles.bookPage}>
                {active ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <h2 style={{ ...styles.bookPageTitle, margin: 0 }}>{active.name}</h2>
                      <X size={14} style={{ cursor: "pointer", color: "#b04848", flexShrink: 0 }} onClick={() => deleteNode(active.id)} />
                    </div>
                    <div style={{ overflowY: "auto", flex: 1 }}>
                      {cloneCharacterStats && (
                        <div style={{ ...styles.statsField, marginBottom: 10 }}>
                          <span style={styles.statsLabel}>Clonar stats de…</span>
                          <SearchSelect options={monsters.filter((m) => m.id !== active.id).map((m) => ({ id: m.id, label: m.name, sublabel: m.category === "boss" ? "Jefe" : "Enemigo" }))}
                            value={null} onChange={(v) => v && cloneCharacterStats(active.id, v)}
                            placeholder="Buscar enemigo o jefe…" clearLabel="— ninguno —" />
                        </div>
                      )}
                      {threatBlock && <ThreatLevelBlock block={threatBlock} updateBlock={updateMonsterBlock} />}
                      <textarea value={descDraft} onChange={(e) => setDescDraft(e.target.value)}
                        onBlur={() => updateNode(active.id, { monsterDescription: descDraft })}
                        placeholder="Describe esta criatura: aspecto, comportamiento, hábitat…"
                        style={{ ...styles.bookTextarea, minHeight: 90, marginTop: 10, flex: "none" }} />
                      {statsBlock && <div style={{ marginTop: 10 }}><CharStatsBlock block={statsBlock} updateBlock={updateMonsterBlock} /></div>}
                    </div>
                  </>
                ) : (
                  <div style={{ color: "var(--muted)", fontStyle: "italic", margin: "auto" }}>Elige un enemigo o jefe de la lista.</div>
                )}
              </div>
              {active && (
                <div style={{ ...styles.bookPageTurn, right: 10 }} onClick={() => setPage("debilidades")} title="Ver debilidades y botín" role="button" tabIndex={0} onKeyDown={keyActivate}>
                  <ChevronRight size={18} />
                </div>
              )}
            </div>
          ) : (
            <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
              <div style={styles.bookPage}>
                <h2 style={styles.bookPageTitle}>Debilidades</h2>
                {resistBlock && <ResistancesBlock block={resistBlock} updateBlock={updateMonsterBlock} />}
              </div>
              {!isMobile && <div style={styles.bookSpine} />}
              <div style={styles.bookPage}>
                {lootBlock && <LootTableBlock block={lootBlock} nodes={nodes} updateBlock={updateMonsterBlock} addObjectItem={addObjectItem} nodeId={active?.id} />}
              </div>
              <div style={{ ...styles.bookPageTurn, left: 10 }} onClick={() => setPage("ficha")} title="Volver" role="button" tabIndex={0} onKeyDown={keyActivate}>
                <ChevronLeft size={18} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
