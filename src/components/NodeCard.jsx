import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { ENTRY_TYPES } from "../data/entryTypes.js";
import { PIXEL_FRAMES } from "../data/theme.js";
import { keyActivate } from "../utils/misc.js";
import { pageSnippet } from "../utils/text.js";
import { colorForNode } from "../utils/tree.js";
import { loadImage } from "../storage.js";
import { styles } from "../styles.js";
import { EntryIcon } from "./EntryIcon.jsx";

/* ---------- NODE CARD (tarjeta reutilizable: panel y pines) ---------- */
export function NodeCard({ node, nodes, onOpen, onRemove, floating, skin }) {
  const [cover, setCover] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const c = node.coverImageKey ? await loadImage(`cover-image:${node.id}`) : null;
      if (alive) setCover(c);
    })();
    return () => { alive = false; };
  }, [node.id, node.coverImageKey]);

  const color = colorForNode(node);
  const et = node.type === "page" ? ENTRY_TYPES[node.category] : null;
  const snippet = node.type === "folder" ? "Carpeta" : pageSnippet(node, floating ? 150 : 110);
  const isPixel = skin?.uiSkin === "pixel";
  const frame = PIXEL_FRAMES[skin?.pixelFrame] || PIXEL_FRAMES.header;
  const cardStyle = isPixel
    ? { ...styles.nodeCard, ...(floating ? styles.nodeCardFloating : {}), borderImage: `url(${frame.src}) ${frame.slice} fill`, borderImageWidth: frame.width, borderStyle: "solid" }
    : { ...styles.nodeCard, ...(floating ? styles.nodeCardFloating : {}), borderTop: `2px solid ${color}`, boxShadow: `0 -1px 10px ${color}55, 0 6px 16px rgba(0,0,0,0.35)` };

  return (
    <div className="node-card" style={cardStyle}
      onClick={onOpen ? () => onOpen(node.id) : undefined}
      title={onOpen ? `Abrir ${node.name}` : node.name} role="button" tabIndex={0} onKeyDown={keyActivate}>
      {onRemove && (
        <span className="node-card-remove" style={styles.nodeCardRemove} title="Quitar del panel"
          onClick={(e) => { e.stopPropagation(); onRemove(); }} role="button" tabIndex={0} onKeyDown={keyActivate}><X size={13} /></span>
      )}
      <div style={{ ...styles.nodeCardImg, borderColor: color }}>
        {cover ? <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <EntryIcon node={node} size={28} />}
      </div>
      <div style={styles.nodeCardBody}>
        <div style={styles.nodeCardTitle}><EntryIcon node={node} size={13} /> <span>{node.name}</span></div>
        {et && <span style={{ fontSize: 10.5, color: et.color, fontWeight: 600 }}>{et.label}</span>}
        {snippet && <div style={styles.nodeCardSnippet}>{snippet}</div>}
      </div>
    </div>
  );
}
