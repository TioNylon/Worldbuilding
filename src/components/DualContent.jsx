import { useState, useEffect, useRef } from "react";
import { Link2 } from "lucide-react";
import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";
import { FormatToolbar } from "./LinkableTextarea.jsx";
import { renderRich } from "./RichText.jsx";

/* ---------- DUAL CONTENT ---------- */
export function DualContent({ node, nodes, updateNodeWithLinks, navigateByName }) {
  const [tab, setTab] = useState("main");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const taRef = useRef(null);
  const field = tab === "main" ? "content" : "content2";
  const value = node[field] || "";

  useEffect(() => { setEditing(false); setTab("main"); }, [node.id]);
  useEffect(() => { setDraft(value); }, [node.id, tab]);

  function commit() {
    updateNodeWithLinks(node.id, { [field]: draft }, draft);
    setEditing(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={styles.tabRow}>
        <button style={{ ...styles.tabBtn, ...(tab === "main" ? styles.tabBtnActive : {}) }}
          onClick={() => { if (editing) commit(); setTab("main"); }}>Contenido</button>
        <button style={{ ...styles.tabBtn, ...(tab === "alt" ? styles.tabBtnActive : {}) }}
          onClick={() => { if (editing) commit(); setTab("alt"); }}>Notas del máster</button>
      </div>
      <div style={styles.linkHint}>
        <Link2 size={12} /> <code>[[Página]]</code> enlaza (si no existe se crea en "{UNASSIGNED_FOLDER}") · <code>**negrita**</code> · <code>//cursiva//</code> · <code>__subrayado__</code>
      </div>
      {editing ? (
        <>
          <FormatToolbar textareaRef={taRef} value={draft} onChange={setDraft} />
          <textarea ref={taRef} autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} style={styles.textarea} />
        </>
      ) : (
        <div style={styles.renderedContent} onClick={() => { setDraft(value); setEditing(true); }} role="button" tabIndex={0} onKeyDown={keyActivate}>
          {value.trim()
            ? renderRich(value, nodes, navigateByName, tab)
            : <span style={{ color: "var(--muted)", fontStyle: "italic" }}>
                {tab === "main" ? "Haz clic para escribir el contenido…" : "Haz clic para escribir notas privadas, secretos, datos de trama…"}
              </span>}
        </div>
      )}
    </div>
  );
}
