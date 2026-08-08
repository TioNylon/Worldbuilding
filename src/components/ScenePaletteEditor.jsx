import { X, Palette } from "lucide-react";
import { styles } from "../styles.js";

/* ---------- PALETA DE COLORES DE ESCENA (solo páginas de Lugar) ---------- */
export function ScenePaletteEditor({ colors, onChange }) {
  function addColor(hex) { onChange([...colors, hex]); }
  function removeColor(i) { onChange(colors.filter((_, idx) => idx !== i)); }
  return (
    <div style={styles.tagsRow}>
      <Palette size={13} color="var(--muted)" />
      {colors.length === 0 && (
        <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Sin paleta de escena todavía.</span>
      )}
      {colors.map((c, i) => (
        <span key={i} style={{ ...styles.tagChip, padding: "3px 6px" }}>
          <span style={{ width: 16, height: 16, borderRadius: "50%", background: c, border: "1px solid var(--border)" }} />
          <X size={11} style={{ cursor: "pointer" }} onClick={() => removeColor(i)} />
        </span>
      ))}
      <input type="color" defaultValue="#8899aa" onChange={(e) => addColor(e.target.value)}
        title="Añadir color a la paleta"
        style={{ width: 28, height: 22, padding: 0, border: "1px solid var(--border)", borderRadius: 6, background: "transparent", cursor: "pointer" }} />
    </div>
  );
}
