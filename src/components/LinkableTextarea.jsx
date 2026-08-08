import { useState, useEffect, useRef } from "react";
import { Bold, Italic, Underline } from "lucide-react";
import { TEXT_COLORS } from "../data/theme.js";
import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";
import { EntryIcon } from "./EntryIcon.jsx";
import { renderRich } from "./RichText.jsx";

// Versión liviana del bloque "Cuadro de texto" (mismo soporte de enlaces
// [[Página]] con autocompletado y render clickeable), para usar dentro de
// otros bloques — Beat, líneas de guion de Escena — sin repetir la barra de
// formato ni la vista previa de diálogo, que ahí no aplican.
export function LinkableTextarea({ value, nodes, navigateByName, onCommit, placeholder, minHeight = 60, keyId }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [suggest, setSuggest] = useState(null);
  const taRef = useRef(null);
  useEffect(() => { setDraft(value || ""); }, [value, keyId]);

  function checkSuggest(text, pos) {
    const before = text.slice(0, pos);
    const openIdx = before.lastIndexOf("[[");
    const closeIdx = before.lastIndexOf("]]");
    if (openIdx === -1 || openIdx < closeIdx) { setSuggest(null); return; }
    const query = before.slice(openIdx + 2);
    if (query.includes("\n") || query.length > 60) { setSuggest(null); return; }
    const matches = query.trim()
      ? nodes.filter((n) => n.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
      : [];
    setSuggest(matches.length ? { openIdx, pos, matches } : null);
  }
  function pickSuggestion(name) {
    if (!suggest) return;
    const before = draft.slice(0, suggest.openIdx);
    const after = draft.slice(suggest.pos);
    setDraft(`${before}[[${name}]]${after}`);
    setSuggest(null);
    requestAnimationFrame(() => taRef.current?.focus());
  }
  function handleKeyDown(e) {
    if (suggest && suggest.matches.length && (e.key === "Enter" || e.key === "Tab")) {
      e.preventDefault();
      pickSuggestion(suggest.matches[0].name);
    } else if (e.key === "Escape" && suggest) setSuggest(null);
  }
  function commit() {
    onCommit(draft);
    setEditing(false);
    setSuggest(null);
  }

  if (editing) {
    return (
      <div style={{ position: "relative" }}>
        <textarea ref={taRef} autoFocus value={draft}
          onChange={(e) => { setDraft(e.target.value); checkSuggest(e.target.value, e.target.selectionStart); }}
          onKeyUp={(e) => checkSuggest(e.target.value, e.target.selectionStart)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          style={{ ...styles.textarea, minHeight }} />
        {suggest && (
          <div style={{ ...styles.linkSuggestBox, top: "100%", marginTop: 2 }}>
            {suggest.matches.map((n) => (
              <div key={n.id} style={styles.linkSuggestItem}
                onMouseDown={(e) => { e.preventDefault(); pickSuggestion(n.name); }}>
                <EntryIcon node={n} size={13} /> {n.name}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ ...styles.renderedContent, minHeight, cursor: "text" }}
      onClick={() => { setDraft(value || ""); setEditing(true); }} role="button" tabIndex={0} onKeyDown={keyActivate}>
      {(value || "").trim()
        ? renderRich(value, nodes, navigateByName, keyId || "lt")
        : <span style={{ color: "var(--muted)", fontStyle: "italic" }}>{placeholder}</span>}
    </div>
  );
}

/* ---------- FORMAT TOOLBAR ---------- */
export function FormatToolbar({ textareaRef, value, onChange }) {
  function wrapSelection(before, after) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = value.slice(start, end) || "texto";
    const next = value.slice(0, start) + before + sel + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + sel.length;
    });
  }
  return (
    <div style={styles.fmtBar}>
      <button style={styles.fmtBtn} title="Negrita" onMouseDown={(e) => { e.preventDefault(); wrapSelection("**", "**"); }}><Bold size={13} /></button>
      <button style={styles.fmtBtn} title="Cursiva" onMouseDown={(e) => { e.preventDefault(); wrapSelection("//", "//"); }}><Italic size={13} /></button>
      <button style={styles.fmtBtn} title="Subrayado" onMouseDown={(e) => { e.preventDefault(); wrapSelection("__", "__"); }}><Underline size={13} /></button>
      <span style={{ width: 1, background: "var(--border)", alignSelf: "stretch", margin: "0 4px" }} />
      {TEXT_COLORS.map((c) => (
        <button key={c} title={`Color ${c}`} style={{ ...styles.fmtBtn, padding: 4 }}
          onMouseDown={(e) => { e.preventDefault(); wrapSelection(`{${c}|`, "}"); }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: c, display: "block" }} />
        </button>
      ))}
    </div>
  );
}
