import { useMemo } from "react";
import { Plus, X } from "lucide-react";
import { RELATION_TYPES } from "../data/entryTypes.js";
import { getPageBlocks } from "../utils/blocks.js";
import { uid } from "../utils/misc.js";
import { styles } from "../styles.js";

/* ---------- BLOCK: RELACIONES ENTRE PERSONAJES ---------- */
export function RelationsBlock({ block, nodes, nodeId, updateBlock }) {
  const entries = block.entries || [];
  const characters = nodes
    .filter((n) => n.category === "character" && n.id !== nodeId)
    .sort((a, b) => a.name.localeCompare(b.name));

  function addEntry() {
    updateBlock(block.id, { entries: [...entries, { id: uid(), targetId: characters[0]?.id || null, relType: "aliado" }] });
  }
  function updateEntry(id, patch) {
    updateBlock(block.id, { entries: entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  }
  function removeEntry(id) {
    updateBlock(block.id, { entries: entries.filter((e) => e.id !== id) });
  }

  // Relaciones definidas en OTROS personajes que apuntan a este (no requiere que
  // el usuario la agregue dos veces — se infiere y se muestra solo de lectura).
  const incoming = useMemo(() => {
    const out = [];
    nodes.forEach((n) => {
      if (n.id === nodeId || n.category !== "character") return;
      getPageBlocks(n).filter((b) => b.type === "relations").forEach((b) => {
        (b.entries || []).forEach((e) => {
          if (e.targetId === nodeId) out.push({ from: n, relType: e.relType });
        });
      });
    });
    return out;
  }, [nodes, nodeId]);

  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>Relaciones definidas aquí</div>
      {entries.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 8 }}>Sin relaciones todavía.</div>
      )}
      {entries.map((e) => (
        <div key={e.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
          <select value={e.targetId || ""} onChange={(ev) => updateEntry(e.id, { targetId: ev.target.value || null })} style={{ ...styles.statsInput, flex: 2 }}>
            <option value="">— elegir personaje —</option>
            {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={e.relType} onChange={(ev) => updateEntry(e.id, { relType: ev.target.value })} style={{ ...styles.statsInput, flex: 1 }}>
            {RELATION_TYPES.map((rt) => <option key={rt.key} value={rt.key}>{rt.label}</option>)}
          </select>
          <X size={14} style={{ cursor: "pointer", color: "#c45c5c", flexShrink: 0 }} onClick={() => removeEntry(e.id)} />
        </div>
      ))}
      <button style={{ ...styles.pillBtn, alignSelf: "flex-start" }} onClick={addEntry}><Plus size={12} /> Agregar relación</button>

      {incoming.length > 0 && (
        <>
          <div style={{ ...styles.statsIncidenceTitle2, marginTop: 14 }}>Otros lo consideran</div>
          {incoming.map((inc, i) => {
            const rt = RELATION_TYPES.find((r) => r.key === inc.relType);
            return (
              <div key={i} style={{ fontSize: 12, color: "var(--muted)", padding: "3px 0" }}>
                <span style={{ color: rt?.color, fontWeight: 600 }}>{rt?.label || inc.relType}</span> de <b style={{ color: "var(--text)" }}>{inc.from.name}</b>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
