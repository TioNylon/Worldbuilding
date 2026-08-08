import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";

// Sección plegable: colapsada por defecto salvo que ya tenga contenido, con
// un resumen siempre visible arriba (children de `summary`) — mismo patrón
// que BonusSection en ItemStatsBlock, generalizado para reusarlo en varias
// fichas (Personajes, Clases) sin duplicar el componente en cada una.
export function Accordion({ title, tag, defaultOpen, summary, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        onClick={() => setOpen((o) => !o)} role="button" tabIndex={0} onKeyDown={keyActivate}>
        <span style={{ ...styles.bookSectionTitle, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          {title}
          {tag && <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--warn, #ffb454)", background: "color-mix(in srgb, var(--warn, #ffb454) 18%, transparent)", border: "1px solid color-mix(in srgb, var(--warn, #ffb454) 45%, transparent)", borderRadius: 999, padding: "1px 7px" }}>{tag}</span>}
        </span>
        <ChevronRight size={14} color="var(--muted)" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .12s ease", flexShrink: 0 }} />
      </div>
      {!open && summary && <div style={{ marginTop: 8 }}>{summary}</div>}
      {open && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}
