import { X } from "lucide-react";
import { FOLDER_COLORS, ICONS, ICON_KEYS } from "../data/icons.js";
import { styles } from "../styles.js";

/* ---------- PERSONALIZAR CARPETA (ícono + color) ---------- */
export function FolderCustomizePanel({ node, updateNode, depth, onClose }) {
  return (
    <div style={{ ...styles.contextMenu, marginLeft: 8 + depth * 16 + 18, width: 210, padding: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Ícono y color de carpeta</span>
        <X size={13} style={{ cursor: "pointer", color: "var(--muted)" }} onClick={onClose} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4, marginBottom: 8 }}>
        {ICON_KEYS.map((key) => {
          const Icon = ICONS[key];
          const active = node.folderIcon === key;
          return (
            <button key={key} title={key} onClick={() => updateNode(node.id, { folderIcon: active ? null : key })}
              style={{
                width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                background: active ? "var(--accentDim, color-mix(in srgb, var(--accent) 20%, transparent))" : "var(--panel2)",
                border: active ? "1px solid var(--accent)" : "1px solid var(--border)", borderRadius: "var(--radius-sm, 4px)", cursor: "pointer",
              }}>
              <Icon size={13} color={active ? "var(--accent)" : "var(--muted)"} />
            </button>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4, marginBottom: 8 }}>
        {FOLDER_COLORS.map((c) => {
          const active = node.folderColor === c;
          return (
            <button key={c} title={c} onClick={() => updateNode(node.id, { folderColor: active ? null : c })}
              style={{
                width: 20, height: 20, borderRadius: "50%", background: c, cursor: "pointer",
                border: active ? "2px solid var(--text)" : "2px solid transparent",
              }} />
          );
        })}
      </div>
      <button style={{ ...styles.pillBtn, width: "100%", justifyContent: "center", fontSize: 11.5 }}
        onClick={() => updateNode(node.id, { folderIcon: null, folderColor: null })}>
        Quitar personalización
      </button>
    </div>
  );
}
