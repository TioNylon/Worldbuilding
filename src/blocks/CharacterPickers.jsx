import { useMemo } from "react";
import { Plus, X } from "lucide-react";
import { uid } from "../utils/misc.js";
import { styles } from "../styles.js";
import { SearchSelect } from "../components/SearchSelect.jsx";

/* ---------- GUION: BEAT Y ESCENA ---------- */
// Lista de personajes presentes, reutilizada por Beat y Escena — mismo
// patrón de fila que MembersBlock, pero sin el campo "rol" porque acá solo
// importa quién está, no qué hace.
export function CharacterMultiPicker({ characterIds, nodes, onChange }) {
  const ids = characterIds || [];
  const characters = useMemo(
    () => nodes.filter((n) => n.category === "character").sort((a, b) => a.name.localeCompare(b.name)),
    [nodes]
  );
  function addOne() {
    const first = characters.find((c) => !ids.includes(c.id));
    onChange([...ids, first?.id || null]);
  }
  function updateOne(i, id) {
    onChange(ids.map((v, idx) => (idx === i ? id : v)));
  }
  function removeOne(i) {
    onChange(ids.filter((_, idx) => idx !== i));
  }
  return (
    <div>
      {ids.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 6 }}>Sin personajes todavía.</div>
      )}
      {ids.map((id, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            <SearchSelect options={characters.map((c) => ({ id: c.id, label: c.name }))}
              value={id || null} onChange={(v) => updateOne(i, v)}
              placeholder="Buscar personaje…" clearLabel="— ninguno —" />
          </div>
          <X size={14} style={{ cursor: "pointer", color: "#c45c5c", flexShrink: 0 }} onClick={() => removeOne(i)} />
        </div>
      ))}
      <button type="button" style={{ ...styles.pillBtn, alignSelf: "flex-start" }} onClick={addOne}>
        <Plus size={12} /> Agregar personaje
      </button>
    </div>
  );
}

// Lista simple de flags en texto libre, reutilizada por "qué desbloquea o
// cambia" (Beat) y "efectos al terminar" (Escena) — mismo patrón que
// SceneBeatsBlock pero sin reordenar, porque acá el orden no importa.
export function FlagListEditor({ items, onChange, addLabel, placeholder }) {
  const list = items || [];
  function add() { onChange([...list, { id: uid(), text: "" }]); }
  function update(id, text) { onChange(list.map((f) => (f.id === id ? { ...f, text } : f))); }
  function remove(id) { onChange(list.filter((f) => f.id !== id)); }
  return (
    <div>
      {list.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 6 }}>Ninguno todavía.</div>
      )}
      {list.map((f) => (
        <div key={f.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
          <input value={f.text} onChange={(e) => update(f.id, e.target.value)} placeholder={placeholder} style={{ ...styles.statsInput, flex: 1 }} />
          <X size={14} style={{ cursor: "pointer", color: "#c45c5c", flexShrink: 0 }} onClick={() => remove(f.id)} />
        </div>
      ))}
      <button type="button" style={{ ...styles.pillBtn, alignSelf: "flex-start" }} onClick={add}>
        <Plus size={12} /> {addLabel}
      </button>
    </div>
  );
}
