import { useState, useEffect, useMemo } from "react";
import { Plus, X, Zap } from "lucide-react";
import { getPageBlocks } from "../utils/blocks.js";
import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";
import { useModals } from "../components/Modals.jsx";
import { StatusEffectInfoBlock } from "../blocks/NpcBlocks.jsx";

// Estados alterados: a propósito la sección más simple del Gran Libro (una
// sola ficha, sin forja ni progresión) porque hoy es solo el punto de partida
// — un lugar donde volcar cada buff/debuff para desarrollarlo más adelante.
// linkedStatusKey conecta cada entrada con el mismo tag que ya usan las
// Habilidades ("inflige") y las Resistencias de Personaje, para no duplicar
// la lista de estados que ya existía.
export function StatusEffectBookView({ nodes, navigateToId, updateNode, addStatusEffect, deleteNode, isMobile }) {
  const { promptValue } = useModals();
  const allEffects = useMemo(
    () => nodes.filter((n) => n.category === "statusEffect").sort((a, b) => a.name.localeCompare(b.name)),
    [nodes]
  );
  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    if (!allEffects.some((n) => n.id === selectedId)) setSelectedId(allEffects[0]?.id || null);
  }, [allEffects, selectedId]);
  const selected = allEffects.find((n) => n.id === selectedId) || null;
  const selectedBlock = selected ? getPageBlocks(selected).find((b) => b.type === "statusEffectInfo") : null;

  function updateSelectedBlock(blockId, patch) {
    if (!selected) return;
    updateNode(selected.id, { blocks: getPageBlocks(selected).map((b) => (b.id === blockId ? { ...b, ...patch } : b)) });
  }
  async function handleAdd() {
    const name = await promptValue("Nombre del nuevo estado alterado:");
    if (!name) return;
    setSelectedId(addStatusEffect(name));
  }

  return (
    <div style={styles.bookOuter}>
      <div style={styles.bookBody}>
        <div style={styles.bookFrame}>
          <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
            <div style={styles.bookPage}>
              <h2 style={styles.bookPageTitle}>Estados alterados</h2>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {allEffects.length === 0 && <span style={styles.bookBottomHint}>Todavía no hay estados alterados definidos.</span>}
                {allEffects.map((n) => {
                  const b = getPageBlocks(n).find((x) => x.type === "statusEffectInfo");
                  const kind = b?.kind || "debuff";
                  return (
                    <div key={n.id}
                      style={{ ...styles.bookSkillRow, ...(n.id === selectedId ? { background: "color-mix(in srgb, var(--accent) 16%, transparent)" } : {}) }}
                      onClick={() => setSelectedId(n.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                      <Zap size={14} color={kind === "buff" ? "var(--accent)" : "#b04848"} />
                      <span style={{ flex: 1 }}>{n.name}</span>
                      <span style={{ ...styles.bookSkillRowType, color: kind === "buff" ? "var(--accent)" : "#b04848" }}>
                        {kind === "buff" ? "Buff" : "Debuff"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button style={{ ...styles.bookAddClassBtn, alignSelf: "flex-start", marginTop: 10 }} onClick={handleAdd}>
                <Plus size={14} /> Nuevo estado
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
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    <StatusEffectInfoBlock block={selectedBlock} updateBlock={updateSelectedBlock} />
                  </div>
                </>
              ) : (
                <div style={{ color: "var(--muted)", fontStyle: "italic", margin: "auto" }}>Elige un estado de la lista.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
