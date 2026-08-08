import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Eye } from "lucide-react";
import { keyActivate } from "../utils/misc.js";
import { stripMarkup } from "../utils/text.js";
import { styles } from "../styles.js";
import { DialoguePortraitThumb } from "../components/DialoguePortraitThumb.jsx";
import { EntryIcon } from "../components/EntryIcon.jsx";
import { FormatToolbar } from "../components/LinkableTextarea.jsx";
import { renderRich } from "../components/RichText.jsx";

/* ---------- BLOCK: TEXTO ---------- */
export function TextBlock({ block, nodes, nodeId, navigateByName, updateBlock, onEditingChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(block.text || "");
  const [suggest, setSuggest] = useState(null);
  const [dialoguePreview, setDialoguePreview] = useState(false);
  const taRef = useRef(null);
  useEffect(() => { setDraft(block.text || ""); setEditing(false); setSuggest(null); }, [block.id]);
  useEffect(() => { onEditingChange?.(editing); return () => onEditingChange?.(false); }, [editing]);

  // Mientras se escribe, el cuadro crece para mostrar todo el texto en vez de
  // recortarlo con scroll interno — recupera su tamaño guardado al terminar.
  function autoGrow() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }
  useEffect(() => { if (editing) autoGrow(); }, [editing]);

  function commit() {
    // El alto lo ajusta el usuario manualmente con el asa de redimensión;
    // al terminar de escribir el bloque vuelve a su tamaño guardado.
    updateBlock(block.id, { text: draft });
    setEditing(false);
    setSuggest(null);
  }

  // Ubica el cuadro de sugerencias cerca de la línea del cursor (no al final
  // del textarea, que puede ser muy alto mientras crece durante la edición).
  function caretTop(ta, pos) {
    if (!ta) return 0;
    const rowsBefore = ta.value.slice(0, pos).split("\n").length - 1;
    const style = getComputedStyle(ta);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    return ta.offsetTop + paddingTop + (rowsBefore + 1) * lineHeight;
  }

  // Detecta si el cursor está dentro de un "[[..." sin cerrar, para sugerir
  // páginas existentes y evitar duplicados por errores de tipeo.
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
    if (!matches.length) { setSuggest(null); return; }
    setSuggest({ openIdx, pos, matches, top: caretTop(taRef.current, pos) });
  }
  function pickSuggestion(name) {
    if (!suggest) return;
    const before = draft.slice(0, suggest.openIdx);
    const after = draft.slice(suggest.pos);
    const next = `${before}[[${name}]]${after}`;
    setDraft(next);
    setSuggest(null);
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus();
      const cursor = before.length + name.length + 4;
      ta.selectionStart = ta.selectionEnd = cursor;
    });
  }
  function handleKeyDown(e) {
    if (suggest && suggest.matches.length && (e.key === "Enter" || e.key === "Tab")) {
      e.preventDefault();
      pickSuggestion(suggest.matches[0].name);
    } else if (e.key === "Escape" && suggest) {
      setSuggest(null);
    }
  }

  if (editing) {
    return (
      <div style={{ position: "relative" }}>
        <FormatToolbar textareaRef={taRef} value={draft} onChange={setDraft} />
        <textarea ref={taRef} autoFocus value={draft}
          onChange={(e) => { setDraft(e.target.value); checkSuggest(e.target.value, e.target.selectionStart); autoGrow(); }}
          onKeyUp={(e) => checkSuggest(e.target.value, e.target.selectionStart)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          style={{ ...styles.textarea, minHeight: 120, height: "auto", overflow: "hidden", resize: "none", textAlign: block.align || "left" }} />
        {suggest && (
          <div style={{ ...styles.linkSuggestBox, top: suggest.top, marginTop: 0 }}>
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
  const speakerNode = nodes.find((n) => n.id === nodeId);
  return (
    <div>
      {block.dialogueReady && (
        <div style={styles.dialogueReadyBadge}><CheckCircle2 size={11} /> Listo para diálogo</div>
      )}
      <div style={{ ...styles.renderedContent, minHeight: 36, textAlign: block.align || "left", ...(block.boxed ? styles.textBlockBoxed : {}) }}
        onClick={() => { setDraft(block.text || ""); setEditing(true); }} role="button" tabIndex={0} onKeyDown={keyActivate}>
        {(block.text || "").trim()
          ? renderRich(block.text, nodes, navigateByName, block.id)
          : <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Cuadro de texto vacío — haz clic para escribir…</span>}
      </div>
      {(block.text || "").trim() && (
        <button style={styles.dialoguePreviewToggle} onClick={(e) => { e.stopPropagation(); setDialoguePreview((v) => !v); }}>
          <Eye size={11} /> {dialoguePreview ? "Ocultar vista previa de diálogo" : "Vista previa de diálogo"}
        </button>
      )}
      {dialoguePreview && (
        <div style={styles.dialoguePreviewBox}>
          <DialoguePortraitThumb nodeId={nodeId} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.dialoguePreviewName}>{speakerNode?.name || "???"}</div>
            <div style={styles.dialoguePreviewText}>{stripMarkup(block.text)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- BLOCK: TÍTULO ---------- */
export function HeadingBlock({ block, updateBlock }) {
  const [val, setVal] = useState(block.text || "");
  useEffect(() => { setVal(block.text || ""); }, [block.id]);
  return (
    <input value={val} onChange={(e) => setVal(e.target.value)} onBlur={() => updateBlock(block.id, { text: val })}
      placeholder="Título de sección" style={styles.headingInput} />
  );
}
