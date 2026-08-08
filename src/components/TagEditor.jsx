import { useState } from "react";
import { X, Tag } from "lucide-react";
import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";

/* ---------- ETIQUETAS (tags libres, además de la categoría) ---------- */
export function TagEditor({ tags, onChange, onTagClick }) {
  const [draft, setDraft] = useState("");
  function addTag(raw) {
    const t = raw.trim();
    if (!t) return;
    if (!tags.some((x) => x.toLowerCase() === t.toLowerCase())) onChange([...tags, t]);
    setDraft("");
  }
  function removeTag(t) { onChange(tags.filter((x) => x !== t)); }
  return (
    <div style={styles.tagsRow}>
      <Tag size={13} color="var(--muted)" />
      {tags.map((t) => (
        <span key={t} style={styles.tagChip}>
          <span style={{ cursor: onTagClick ? "pointer" : "default" }}
            title={onTagClick ? "Ver todas las entradas con esta etiqueta" : undefined}
            onClick={() => onTagClick?.(t)} role="button" tabIndex={0} onKeyDown={keyActivate}>{t}</span>
          <X size={11} style={{ cursor: "pointer" }} onClick={() => removeTag(t)} />
        </span>
      ))}
      <input value={draft} onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(draft); }
          else if (e.key === "Backspace" && !draft && tags.length) removeTag(tags[tags.length - 1]);
        }}
        onBlur={() => { if (draft) addTag(draft); }}
        placeholder="Añadir etiqueta…" style={styles.tagInput} />
    </div>
  );
}
