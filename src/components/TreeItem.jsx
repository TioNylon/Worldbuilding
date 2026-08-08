import { useState } from "react";
import { ChevronRight, ChevronDown, Trash2, Palette } from "lucide-react";
import { keyActivate } from "../utils/misc.js";
import { childrenOf } from "../utils/tree.js";
import { styles } from "../styles.js";
import { EntryIcon } from "./EntryIcon.jsx";
import { FolderCustomizePanel } from "./FolderCustomizePanel.jsx";

export function TreeItem({ node, nodes, depth, selectedId, setSelectedId, expanded, setExpanded, addNode, deleteNode, renameNode, moveNode, updateNode }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [dropHint, setDropHint] = useState(null);
  const kids = node.type === "folder" ? childrenOf(nodes, node.id) : [];
  const isOpen = !!expanded[node.id];
  const active = node.id === selectedId;

  function handleDragOver(e) {
    e.preventDefault(); e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    if (node.type === "folder" && ratio < 0.65) setDropHint("into");
    else setDropHint("after");
  }
  function handleDrop(e) {
    e.preventDefault(); e.stopPropagation();
    const dragId = e.dataTransfer.getData("text/wb-node");
    setDropHint(null);
    if (!dragId || dragId === node.id) return;
    moveNode(dragId, node.id, dropHint === "into" ? "into" : "after");
  }

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/wb-node", node.id);
          e.dataTransfer.setData("text/wb-node-name", node.name);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={handleDragOver}
        onDragLeave={() => setDropHint(null)}
        onDrop={handleDrop}
        className="tree-row"
        style={{
          ...styles.treeRow, paddingLeft: 8 + depth * 16,
          background: active ? "color-mix(in srgb, var(--accent) 18%, transparent)" : dropHint === "into" ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "transparent",
          borderBottom: dropHint === "after" ? "2px solid var(--accent)" : "2px solid transparent",
        }}
        onClick={() => setSelectedId(node.id)}
       role="button" tabIndex={0} onKeyDown={keyActivate}>
        {node.type === "folder" ? (
          <span onClick={(e) => { e.stopPropagation(); setExpanded((ex) => ({ ...ex, [node.id]: !isOpen })); }} style={{ display: "flex" }} role="button" tabIndex={0} onKeyDown={keyActivate}>
            {isOpen ? <ChevronDown size={13} color="var(--muted)" /> : <ChevronRight size={13} color="var(--muted)" />}
          </span>
        ) : (<span style={{ width: 13 }} />)}
        <EntryIcon node={node} size={14} isOpen={isOpen} />
        {editing ? (
          <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { setEditing(false); if (draft.trim()) renameNode(node.id, draft.trim()); }}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            style={styles.renameInput} onClick={(e) => e.stopPropagation()} />
        ) : (
          <span style={styles.treeLabel} onDoubleClick={() => setEditing(true)}>{node.name}</span>
        )}
        <span className={`tree-row-menu${menuOpen ? " is-open" : ""}`} style={{ marginLeft: "auto", cursor: "pointer", padding: "0 4px" }}
          onClick={(e) => { e.stopPropagation(); setAddOpen(false); setMenuOpen((m) => !m); }} role="button" tabIndex={0} onKeyDown={keyActivate}>⋮</span>
      </div>
      {menuOpen && (
        <div style={{ ...styles.contextMenu, marginLeft: 8 + depth * 16 + 18 }}>
          {node.type === "folder" && (
            <>
              <div style={styles.contextItem} onClick={() => setAddOpen((a) => !a)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                + Añadir {addOpen ? "▾" : "▸"}
              </div>
              {addOpen && (
                <div style={{ marginLeft: 10, borderLeft: "1px solid var(--border)", paddingLeft: 6 }}>
                  <div style={styles.contextItem} onClick={() => { addNode("folder", node.id); setMenuOpen(false); }} role="button" tabIndex={0} onKeyDown={keyActivate}>Subcarpeta</div>
                  <div style={styles.contextItem} onClick={() => { addNode("page", node.id); setMenuOpen(false); }} role="button" tabIndex={0} onKeyDown={keyActivate}>Página</div>
                  <div style={styles.contextItem} onClick={() => { addNode("map", node.id); setMenuOpen(false); }} role="button" tabIndex={0} onKeyDown={keyActivate}>Mapa</div>
                  <div style={styles.contextItem} onClick={() => { addNode("timeline", node.id); setMenuOpen(false); }} role="button" tabIndex={0} onKeyDown={keyActivate}>Línea de tiempo</div>
                  <div style={styles.contextItem} onClick={() => { addNode("board", node.id); setMenuOpen(false); }} role="button" tabIndex={0} onKeyDown={keyActivate}>Pizarra</div>
                </div>
              )}
              <div style={styles.contextItem} onClick={() => { setCustomizing(true); setMenuOpen(false); }} role="button" tabIndex={0} onKeyDown={keyActivate}>
                <Palette size={12} style={{ marginRight: 4, verticalAlign: "middle" }} /> Personalizar
              </div>
            </>
          )}
          <div style={styles.contextItem} onClick={() => { setEditing(true); setMenuOpen(false); }} role="button" tabIndex={0} onKeyDown={keyActivate}>Renombrar</div>
          <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
          <div style={{ ...styles.contextItem, color: "#c45c5c" }} onClick={() => { deleteNode(node.id); setMenuOpen(false); }} role="button" tabIndex={0} onKeyDown={keyActivate}>
            <Trash2 size={12} style={{ marginRight: 4, verticalAlign: "middle" }} /> Eliminar
          </div>
        </div>
      )}
      {customizing && (
        <FolderCustomizePanel node={node} updateNode={updateNode} depth={depth} onClose={() => setCustomizing(false)} />
      )}
      {node.type === "folder" && isOpen &&
        kids.map((c) => (
          <TreeItem key={c.id} node={c} nodes={nodes} depth={depth + 1}
            selectedId={selectedId} setSelectedId={setSelectedId}
            expanded={expanded} setExpanded={setExpanded}
            addNode={addNode} deleteNode={deleteNode} renameNode={renameNode} moveNode={moveNode} updateNode={updateNode} />
        ))}
    </div>
  );
}
