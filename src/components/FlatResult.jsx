import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";
import { EntryIcon } from "./EntryIcon.jsx";

export function FlatResult({ node, active, onClick, snippet }) {
  return (
    <div onClick={onClick}
      style={{
        ...styles.treeRow, height: "auto", padding: "6px 8px",
        flexDirection: snippet ? "column" : "row", alignItems: snippet ? "stretch" : "center", gap: snippet ? 2 : 6,
        background: active ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "transparent",
      }} role="button" tabIndex={0} onKeyDown={keyActivate}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <EntryIcon node={node} size={14} />
        <span style={styles.treeLabel}>{node.name}</span>
      </div>
      {snippet && (
        <div style={{ fontSize: 10.5, color: "var(--muted)", fontStyle: "italic", paddingLeft: 20, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {snippet}
        </div>
      )}
    </div>
  );
}
