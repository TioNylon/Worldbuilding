import { Plus, X } from "lucide-react";
import { uid } from "../utils/misc.js";
import { styles } from "../styles.js";

/* ---------- BLOCK: TABLA DE BOTÍN (Enemigo/Jefe) ---------- */
export function LootTableBlock({ block, nodes, updateBlock }) {
  const entries = block.entries || [];
  const items = nodes.filter((n) => n.category === "object").sort((a, b) => a.name.localeCompare(b.name));

  function addEntry() {
    updateBlock(block.id, { entries: [...entries, { id: uid(), itemId: items[0]?.id || null, chance: 100, notes: "" }] });
  }
  function updateEntry(id, patch) {
    updateBlock(block.id, { entries: entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  }
  function removeEntry(id) {
    updateBlock(block.id, { entries: entries.filter((e) => e.id !== id) });
  }

  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>Tabla de botín</div>
      {entries.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 8 }}>Sin objetos todavía.</div>
      )}
      {entries.map((e) => (
        <div key={e.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <select value={e.itemId || ""} onChange={(ev) => updateEntry(e.id, { itemId: ev.target.value || null })} style={{ ...styles.statsInput, flex: 2 }}>
            <option value="">— elegir objeto —</option>
            {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
          </select>
          <input type="number" min={0} max={100} value={e.chance ?? 100}
            onChange={(ev) => updateEntry(e.id, { chance: Math.max(0, Math.min(100, parseInt(ev.target.value, 10) || 0)) })}
            style={{ ...styles.statsMiniInput, width: 56 }} />
          <span style={{ fontSize: 11, color: "var(--muted)" }}>%</span>
          <input value={e.notes || ""} onChange={(ev) => updateEntry(e.id, { notes: ev.target.value })}
            placeholder="Notas (cantidad, condición…)" style={{ ...styles.statsInput, flex: 1 }} />
          <X size={14} style={{ cursor: "pointer", color: "#c45c5c", flexShrink: 0 }} onClick={() => removeEntry(e.id)} />
        </div>
      ))}
      <button style={{ ...styles.pillBtn, alignSelf: "flex-start" }} onClick={addEntry}><Plus size={12} /> Agregar objeto</button>
    </div>
  );
}
