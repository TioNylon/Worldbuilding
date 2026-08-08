import { Plus, X } from "lucide-react";
import { uid } from "../utils/misc.js";
import { styles } from "../styles.js";

/* ---------- BLOCK: MIEMBROS (organización/facción) ---------- */
export function MembersBlock({ block, nodes, updateBlock }) {
  const entries = block.entries || [];
  const characters = nodes
    .filter((n) => n.category === "character")
    .sort((a, b) => a.name.localeCompare(b.name));

  function addEntry() {
    updateBlock(block.id, { entries: [...entries, { id: uid(), characterId: characters[0]?.id || null, role: "" }] });
  }
  function updateEntry(id, patch) {
    updateBlock(block.id, { entries: entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  }
  function removeEntry(id) {
    updateBlock(block.id, { entries: entries.filter((e) => e.id !== id) });
  }

  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>Miembros</div>
      {entries.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 8 }}>Sin miembros todavía.</div>
      )}
      {entries.map((e) => (
        <div key={e.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
          <select value={e.characterId || ""} onChange={(ev) => updateEntry(e.id, { characterId: ev.target.value || null })} style={{ ...styles.statsInput, flex: 2 }}>
            <option value="">— elegir personaje —</option>
            {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={e.role || ""} onChange={(ev) => updateEntry(e.id, { role: ev.target.value })}
            placeholder="Rol (líder, miembro…)" style={{ ...styles.statsInput, flex: 1 }} />
          <X size={14} style={{ cursor: "pointer", color: "#c45c5c", flexShrink: 0 }} onClick={() => removeEntry(e.id)} />
        </div>
      ))}
      <button style={{ ...styles.pillBtn, alignSelf: "flex-start" }} onClick={addEntry}><Plus size={12} /> Agregar miembro</button>
    </div>
  );
}
