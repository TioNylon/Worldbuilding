import { ENTRY_TYPES, ENTRY_TYPE_KEYS } from "../data/entryTypes.js";
import { styles } from "../styles.js";

/* ---------- ENTRY TYPE PICKER ---------- */
// Antes era una fila de botones (uno por categoría) que ocupaba mucho
// espacio a medida que se agregaban tipos nuevos; ahora es un desplegable.
export function EntryTypePicker({ node, updateNode }) {
  const current = node.category ? ENTRY_TYPES[node.category] : null;
  return (
    <select value={node.category || ""} onChange={(e) => updateNode(node.id, { category: e.target.value || null })}
      style={{ ...styles.statsInput, maxWidth: 260, marginBottom: 16, fontWeight: 600, color: current ? current.color : "var(--muted)" }}>
      <option value="">— sin tipo —</option>
      {ENTRY_TYPE_KEYS.map((key) => (
        <option key={key} value={key} style={{ color: ENTRY_TYPES[key].color }}>{ENTRY_TYPES[key].label}</option>
      ))}
    </select>
  );
}
