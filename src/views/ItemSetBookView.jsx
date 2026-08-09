import { useState, useEffect, useMemo } from "react";
import { Plus, X, Layers, Search } from "lucide-react";
import { getPageBlocks } from "../utils/blocks.js";
import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";
import { useModals } from "../components/Modals.jsx";
import { SearchSelect } from "../components/SearchSelect.jsx";
import { SetInfoBlock } from "../blocks/SetInfoBlock.jsx";

// Sets de equipo: igual de simple que Estados alterados (una ficha, sin
// forja), pero con un dato extra — qué objetos pertenecen al set — calculado
// leyendo setId de cada Objeto en vez de guardar la lista de miembros acá
// (mismo truco de "no duplicar la referencia" que predecessorMap en Forja).
export function ItemSetBookView({ nodes, navigateToId, updateNode, addItemSet, cloneSetInfo, deleteNode, isMobile }) {
  const { promptValue } = useModals();
  const allSets = useMemo(
    () => nodes.filter((n) => n.category === "itemSet").sort((a, b) => a.name.localeCompare(b.name)),
    [nodes]
  );
  const [query, setQuery] = useState("");
  const visibleSets = query.trim()
    ? allSets.filter((n) => n.name.toLowerCase().includes(query.trim().toLowerCase()))
    : allSets;
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    if (!allSets.some((n) => n.id === selectedId)) setSelectedId(allSets[0]?.id || null);
  }, [allSets, selectedId]);
  const selected = allSets.find((n) => n.id === selectedId) || null;
  const selectedBlock = selected ? getPageBlocks(selected).find((b) => b.type === "setInfo") : null;

  const members = useMemo(() => {
    if (!selected) return [];
    return nodes.filter((n) => {
      if (n.category !== "object") return false;
      const b = getPageBlocks(n).find((x) => x.type === "itemStats");
      return b?.setId === selected.id;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [nodes, selected]);

  function updateSelectedBlock(blockId, patch) {
    if (!selected) return;
    updateNode(selected.id, { blocks: getPageBlocks(selected).map((b) => (b.id === blockId ? { ...b, ...patch } : b)) });
  }
  async function handleAdd() {
    const name = await promptValue("Nombre del nuevo set:");
    if (!name) return;
    setSelectedId(addItemSet(name));
  }

  return (
    <div style={styles.bookOuter}>
      <div style={styles.bookBody}>
        <div style={styles.bookFrame}>
          <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
            <div style={styles.bookPage}>
              <h2 style={styles.bookPageTitle}>Sets de equipo</h2>
              {allSets.length > 0 && (
                <div style={{ position: "relative", marginBottom: 8 }}>
                  <input value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar set…" style={{ ...styles.statsInput, paddingRight: 26 }} />
                  <Search size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
                </div>
              )}
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {allSets.length === 0 && <span style={styles.bookBottomHint}>Todavía no hay sets definidos.</span>}
                {allSets.length > 0 && visibleSets.length === 0 && (
                  <span style={styles.bookBottomHint}>Sin resultados para "{query.trim()}".</span>
                )}
                {visibleSets.map((n) => {
                  const b = getPageBlocks(n).find((x) => x.type === "setInfo");
                  const count = (b?.bonuses || []).length;
                  return (
                    <div key={n.id}
                      style={{ ...styles.bookSkillRow, ...(n.id === selectedId ? { background: "color-mix(in srgb, var(--accent) 16%, transparent)" } : {}) }}
                      onClick={() => setSelectedId(n.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                      <Layers size={14} />
                      <span style={{ flex: 1 }}>{n.name}</span>
                      <span style={styles.bookSkillRowType}>{count} bono{count === 1 ? "" : "s"}</span>
                    </div>
                  );
                })}
              </div>
              <button style={{ ...styles.bookAddClassBtn, alignSelf: "flex-start", marginTop: 10 }} onClick={handleAdd}>
                <Plus size={14} /> Nuevo set
              </button>
            </div>
            {!isMobile && <div style={styles.bookSpine} />}
            <div style={styles.bookPage}>
              {selected && selectedBlock ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <h2 style={{ ...styles.bookPageTitle, margin: 0 }}>{selected.name}</h2>
                    <X size={14} style={{ cursor: "pointer", color: "#b04848", flexShrink: 0 }} onClick={() => deleteNode(selected.id)} />
                  </div>
                  <span style={{ ...styles.catalogLink, display: "inline-block", marginBottom: 10 }} onClick={() => navigateToId(selected.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                    Abrir página completa →
                  </span>
                  {cloneSetInfo && (
                    <div style={{ ...styles.statsField, marginBottom: 10 }}>
                      <span style={styles.statsLabel}>Clonar de…</span>
                      <SearchSelect options={allSets.filter((n) => n.id !== selected.id).map((n) => ({ id: n.id, label: n.name }))}
                        value={null} onChange={(v) => v && cloneSetInfo(selected.id, v)}
                        placeholder="Buscar set…" clearLabel="— ninguno —" />
                    </div>
                  )}
                  {members.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>
                        Objetos de este set ({members.length})
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {members.map((m) => (
                          <span key={m.id} style={{ ...styles.catalogLink, fontSize: 12 }} onClick={() => navigateToId(m.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>{m.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    <SetInfoBlock block={selectedBlock} nodes={nodes} updateBlock={updateSelectedBlock} />
                  </div>
                </>
              ) : (
                <div style={{ color: "var(--muted)", fontStyle: "italic", margin: "auto" }}>Elige un set de la lista.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
