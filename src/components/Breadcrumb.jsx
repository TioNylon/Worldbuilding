import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";

// Camino clicable en cada nivel, en vez de un solo botón "← Índice de X" —
// reemplaza generalBookBackRow en las vistas del Gran Libro/Bitácora/
// Herramientas. `items` es [{ label, onClick? }]; el último sin onClick es
// el nivel actual (no clicable).
export function Breadcrumb({ items }) {
  return (
    <div style={styles.breadcrumbRow}>
      {items.map((it, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {i > 0 && <span style={styles.breadcrumbSep}>›</span>}
          {it.onClick ? (
            <span className="crumb-link" style={styles.breadcrumbCrumb} onClick={it.onClick}
              role="button" tabIndex={0} onKeyDown={keyActivate}>{it.label}</span>
          ) : (
            <span style={styles.breadcrumbCurrent}>{it.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
