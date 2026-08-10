import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";

// Grilla de tarjetas para el "Índice" del Gran Libro/Bitácora/Herramientas —
// reemplaza las filas planas de generalBookTile por un medallón grande con
// anillo del color de la sección, un glifo de fondo (mismo ícono, muy tenue)
// y un contador real opcional, en vez de un ícono chico + un renglón de texto.
// `sections` es el array de *_SECTIONS ({key,label,icon,color,desc});
// `counts` es un mapa opcional key -> número.
export function SectionCardGrid({ sections, onSelect, counts }) {
  return (
    <div style={styles.sectionCardGrid}>
      {sections.map((s) => {
        const Icon = s.icon;
        const count = counts ? counts[s.key] : null;
        return (
          <div key={s.key} className="section-card" style={{ ...styles.sectionCard, "--cc": s.color }}
            onClick={() => onSelect(s.key)} role="button" tabIndex={0} onKeyDown={keyActivate}>
            <div style={styles.sectionCardGlyph}><Icon size={110} strokeWidth={1.4} /></div>
            <div style={styles.sectionCardIcon}><Icon size={26} /></div>
            <div style={styles.sectionCardTitle}>{s.label}</div>
            {count != null && <div style={styles.sectionCardCount}>{count}</div>}
            <p style={styles.sectionCardDesc}>{s.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
