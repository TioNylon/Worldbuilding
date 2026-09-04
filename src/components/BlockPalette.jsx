import { BLOCK_TOOLS, CATEGORY_EXTRA_TOOL } from "../data/entryTypes.js";
import { pageFormatFor } from "../data/pageFormats.js";
import { styles } from "../styles.js";

function PaletteButton({ tool, onAdd }) {
  const Icon = tool.makeIcon();
  return (
    <button type="button" draggable onDragStart={(event) => { event.dataTransfer.setData("text/wb-newblock", tool.type); event.dataTransfer.effectAllowed = "copy"; }}
      onClick={() => onAdd(tool.type)} className="atlas-palette-item" style={styles.paletteItem}
      title={`Arrastra a la página o haz clic para añadir: ${tool.label}`}>
      <Icon size={15} color="var(--accent)" /><span>{tool.label}</span>
    </button>
  );
}

/* Paleta contextual: primero muestra el formato recomendado y deja el resto
   como recursos opcionales. Amenaza y ramificaciones antiguas siguen siendo
   legibles en fichas existentes, pero ya no se ofrecen para páginas nuevas. */
export function BlockPalette({ onAdd, horizontal, category }) {
  const extra = category && CATEGORY_EXTRA_TOOL[category] ? CATEGORY_EXTRA_TOOL[category] : [];
  const all = [...BLOCK_TOOLS, ...extra].filter((tool, index, list) => list.findIndex((item) => item.type === tool.type) === index);
  const format = pageFormatFor(category);
  const recommendedTypes = new Set([...format.defaults, ...format.primary]);
  const recommended = all.filter((tool) => recommendedTypes.has(tool.type));
  const optional = all.filter((tool) => !recommendedTypes.has(tool.type));
  const groups = horizontal ? [{ label: null, tools: [...recommended, ...optional] }] : [
    { label: "Formato recomendado", tools: recommended },
    { label: "Recursos opcionales", tools: optional },
  ];

  return (
    <div className={`atlas-block-palette ${horizontal ? "is-horizontal" : ""}`} style={horizontal ? styles.paletteH : styles.palette}>
      {!horizontal && <div style={styles.paletteTitle}>{format.title}</div>}
      {groups.map((group, index) => group.tools.length > 0 && <div className="atlas-palette-group" key={group.label || index}>
        {group.label && <div className="atlas-palette-group-label">{group.label}</div>}
        <div style={horizontal ? { display: "flex", gap: 6, flexWrap: "wrap" } : { display: "flex", flexDirection: "column", gap: 6 }}>
          {group.tools.map((tool) => <PaletteButton key={tool.type} tool={tool} onAdd={onAdd} />)}
        </div>
      </div>)}
      {!horizontal && <div style={styles.paletteHint}>Cada sección crece según su contenido y puede plegarse desde su encabezado.</div>}
    </div>
  );
}