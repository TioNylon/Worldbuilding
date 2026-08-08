import { BLOCK_TOOLS, CATEGORY_EXTRA_TOOL } from "../data/entryTypes.js";
import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";

/* ---------- BLOCK PALETTE (barra de herramientas derecha) ---------- */
export function BlockPalette({ onAdd, horizontal, category }) {
  const extra = category && CATEGORY_EXTRA_TOOL[category] ? CATEGORY_EXTRA_TOOL[category] : [];
  const tools = [...BLOCK_TOOLS, ...extra];
  return (
    <div style={horizontal ? styles.paletteH : styles.palette}>
      {!horizontal && <div style={styles.paletteTitle}>Herramientas</div>}
      <div style={horizontal ? { display: "flex", gap: 6, flexWrap: "wrap" } : { display: "flex", flexDirection: "column", gap: 6 }}>
        {tools.map((t) => {
          const Icon = t.makeIcon();
          return (
            <div key={t.type} draggable
              onDragStart={(e) => { e.dataTransfer.setData("text/wb-newblock", t.type); e.dataTransfer.effectAllowed = "copy"; }}
              onClick={() => onAdd(t.type)}
              style={styles.paletteItem}
              title={`Arrastra a la página o haz clic para añadir: ${t.label}`} role="button" tabIndex={0} onKeyDown={keyActivate}>
              <Icon size={15} color="var(--accent)" /> <span>{t.label}</span>
            </div>
          );
        })}
      </div>
      {!horizontal && <div style={styles.paletteHint}>Arrastra a la página o haz clic para insertar un elemento.</div>}
    </div>
  );
}
