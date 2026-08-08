import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { ENTRY_TYPES } from "../data/entryTypes.js";
import { PIXEL_FRAMES } from "../data/theme.js";
import { keyActivate } from "../utils/misc.js";
import { childrenOf, colorForNode } from "../utils/tree.js";
import { loadImage } from "../storage.js";
import { styles } from "../styles.js";
import { CoverImage } from "../components/CoverImage.jsx";
import { EntryIcon } from "../components/EntryIcon.jsx";
import { FreeBlockCanvas } from "./PageEditor.jsx";

/* ---------- FOLDER VIEW ---------- */
export function FolderView({ node, nodes, addNode, setSelectedId, updateNode, updateNodeWithLinks, navigateByName, isMobile, skin }) {
  const kids = childrenOf(nodes, node.id);
  const isPixel = skin?.uiSkin === "pixel";
  const frame = PIXEL_FRAMES[skin?.pixelFrame] || PIXEL_FRAMES.header;
  return (
    <div style={styles.folderView}>
      <CoverImage node={node} updateNode={updateNode} margin="20px 16px 0" />
      <h1 style={styles.pageTitle}>{node.name}</h1>
      <div style={styles.folderActions}>
        <button style={styles.pillBtn} onClick={() => addNode("page", node.id)}><Plus size={13} /> Página</button>
        <button style={styles.pillBtn} onClick={() => addNode("folder", node.id)}><Plus size={13} /> Subcarpeta</button>
        <button style={styles.pillBtn} onClick={() => addNode("map", node.id)}><Plus size={13} /> Mapa</button>
        <button style={styles.pillBtn} onClick={() => addNode("timeline", node.id)}><Plus size={13} /> Línea de tiempo</button>
        <button style={styles.pillBtn} onClick={() => addNode("board", node.id)}><Plus size={13} /> Pizarra</button>
      </div>
      <div style={styles.folderGrid}>
        {kids.length === 0 && (
          <div style={{ color: "var(--muted)", fontStyle: "italic", padding: "0 16px" }}>Carpeta vacía.</div>
        )}
        {kids.map((k) => {
          const entryType = k.type === "page" ? ENTRY_TYPES[k.category] : null;
          return (
            <div key={k.id} className="folder-card"
              style={isPixel
                ? { ...styles.folderCard, borderImage: `url(${frame.src}) ${frame.slice} fill`, borderImageWidth: frame.width, borderStyle: "solid" }
                : { ...styles.folderCard, borderTop: `2px solid ${colorForNode(k)}`, boxShadow: `0 -1px 10px ${colorForNode(k)}55, 0 6px 16px rgba(0,0,0,0.35)` }}
              onClick={() => setSelectedId(k.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
              {k.coverImageKey ? <FolderCardThumb coverKey={`cover-image:${k.id}`} /> : <EntryIcon node={k} size={20} />}
              <span>{k.name}</span>
              {k.type === "folder" && <span style={styles.subBadge}>carpeta</span>}
              {entryType && <span style={{ ...styles.subBadge, color: entryType.color }}>{entryType.label}</span>}
            </div>
          );
        })}
      </div>
      <div style={{ padding: "0 16px" }}>
        <FreeBlockCanvas node={node} nodes={nodes} updateNodeWithLinks={updateNodeWithLinks} navigateByName={navigateByName} isMobile={isMobile} />
      </div>
    </div>
  );
}

export function FolderCardThumb({ coverKey }) {
  const [src, setSrc] = useState(null);
  useEffect(() => { (async () => setSrc(await loadImage(coverKey)))(); }, [coverKey]);
  if (!src) return <div style={{ width: 40, height: 40 }} />;
  return <img src={src} alt="" style={{ width: 40, height: 40, borderRadius: "var(--radius-md, 7px)", objectFit: "cover" }} />;
}
