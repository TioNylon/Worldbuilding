import { useState, useMemo } from "react";
import { descendantIds, pathTo } from "../utils/tree.js";
import { styles } from "../styles.js";
import { SearchSelect } from "./SearchSelect.jsx";

/* ---------- LINK PICKER (carpeta -> entrada) ---------- */
export function LinkPicker({ nodes, value, onChange, excludeId }) {
  const [folderId, setFolderId] = useState("");
  const folders = nodes.filter((n) => n.type === "folder");
  const folderOptions = folders
    .map((f) => ({ id: f.id, label: pathTo(nodes, f.id).map((p) => p.name).join(" / ") }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const entries = useMemo(() => {
    let pool;
    if (!folderId) pool = nodes;
    else if (folderId === "__root__") pool = nodes.filter((n) => n.parentId === null);
    else {
      const ids = new Set(descendantIds(nodes, folderId));
      ids.delete(folderId);
      pool = nodes.filter((n) => ids.has(n.id));
    }
    return pool
      .filter((n) => n.id !== excludeId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [nodes, folderId, excludeId]);

  return (
    <>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>1. Filtrar por carpeta</div>
      <select value={folderId} onChange={(e) => setFolderId(e.target.value)} style={styles.pinSelect}>
        <option value="">— Todas las carpetas —</option>
        <option value="__root__">(Raíz del atlas)</option>
        {folderOptions.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
      </select>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>2. Elegir entrada</div>
      <SearchSelect options={entries.map((p) => ({ id: p.id, label: p.name }))}
        value={value || null} onChange={onChange}
        placeholder="Buscar página…" clearLabel="— Sin enlace —" />
    </>
  );
}
