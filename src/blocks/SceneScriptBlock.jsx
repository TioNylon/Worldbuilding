import { useState, useEffect, useMemo } from "react";
import { Plus, X, ArrowUp, ArrowDown } from "lucide-react";
import { SCRIPT_LINE_TYPES } from "../data/pageSections.js";
import { getPageBlocks } from "../utils/blocks.js";
import { uid } from "../utils/misc.js";
import { styles } from "../styles.js";
import { LinkableTextarea } from "../components/LinkableTextarea.jsx";
import { CharacterMultiPicker, FlagListEditor } from "./CharacterPickers.jsx";

// Qué expresión (retrato) mostrar en esta línea, tomada de las que el
// hablante ya definió en su propia ficha (bloque "Expresiones (diálogo)").
// Si el personaje no tiene ninguna cargada todavía, no se muestra nada en
// vez de un selector vacío.
export function ExpressionPicker({ characterId, nodes, value, onChange }) {
  const character = nodes.find((n) => n.id === characterId);
  const block = character ? getPageBlocks(character).find((b) => b.type === "expressionSprites") : null;
  const sprites = block?.sprites || [];
  if (!sprites.length) return null;
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value || null)} style={{ ...styles.statsInput, marginBottom: 6 }}>
      <option value="">— expresión por defecto —</option>
      {sprites.map((s) => <option key={s.id} value={s.id}>{s.label || "(sin nombre)"}</option>)}
    </select>
  );
}

export function SceneScriptBlock({ lines, nodes, navigateByName, onChange }) {
  const list = lines || [];
  const speakers = useMemo(
    () => nodes.filter((n) => n.category === "character" || n.category === "npc").sort((a, b) => a.name.localeCompare(b.name)),
    [nodes]
  );
  function addLine() { onChange([...list, { id: uid(), type: "dialogo", speakerId: null, text: "", expressionId: null }]); }
  function updateLine(id, patch) { onChange(list.map((l) => (l.id === id ? { ...l, ...patch } : l))); }
  function removeLine(id) { onChange(list.filter((l) => l.id !== id)); }
  function moveLine(id, dir) {
    const idx = list.findIndex((l) => l.id === id);
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }
  return (
    <div>
      {list.length === 0 && <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 8 }}>Sin líneas todavía.</div>}
      {list.map((l, i) => {
        const type = l.type || "dialogo";
        return (
          <div key={l.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 5px)", padding: 8, marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "var(--muted)", minWidth: 16, textAlign: "right" }}>{i + 1}.</span>
              {SCRIPT_LINE_TYPES.map((t) => (
                <button key={t.key} type="button" onClick={() => updateLine(l.id, { type: t.key })}
                  style={{
                    ...styles.pillBtn, fontSize: 10.5, padding: "2px 8px",
                    ...(type === t.key ? { background: t.color, borderColor: t.color, color: "var(--bg)" } : { color: t.color }),
                  }}>
                  {t.label}
                </button>
              ))}
              <button style={{ ...styles.miniBtn, marginLeft: "auto" }} onClick={() => moveLine(l.id, -1)} title="Mover antes"><ArrowUp size={11} /></button>
              <button style={styles.miniBtn} onClick={() => moveLine(l.id, 1)} title="Mover después"><ArrowDown size={11} /></button>
              <X size={14} style={{ cursor: "pointer", color: "#c45c5c", flexShrink: 0 }} onClick={() => removeLine(l.id)} />
            </div>
            {type === "dialogo" && (
              <>
                <select value={l.speakerId || ""} onChange={(e) => updateLine(l.id, { speakerId: e.target.value || null, expressionId: null })}
                  style={{ ...styles.statsInput, marginBottom: 6 }}>
                  <option value="">— narrador —</option>
                  {speakers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {l.speakerId && (
                  <ExpressionPicker characterId={l.speakerId} nodes={nodes} value={l.expressionId}
                    onChange={(v) => updateLine(l.id, { expressionId: v })} />
                )}
              </>
            )}
            <LinkableTextarea value={l.text} nodes={nodes} navigateByName={navigateByName}
              onCommit={(v) => updateLine(l.id, { text: v })} minHeight={50} keyId={l.id}
              placeholder={
                type === "dialogo" ? "¿Qué dice?" : type === "acotacion" ? "Acotación de escena…"
                  : type === "sfx" ? "Efecto de sonido…" : "Qué dispara este trigger…"
              } />
          </div>
        );
      })}
      <button style={{ ...styles.pillBtn, alignSelf: "flex-start" }} onClick={addLine}><Plus size={12} /> Agregar línea</button>
    </div>
  );
}

/* ---------- BLOCK: GUION DE ESCENA ---------- */
export function SceneInfoBlock({ block, nodes, navigateByName, updateBlock }) {
  const [condDraft, setCondDraft] = useState(block.entryCondition || "");
  useEffect(() => { setCondDraft(block.entryCondition || ""); }, [block.id]);
  const beats = useMemo(() => nodes.filter((n) => n.category === "beat").sort((a, b) => a.name.localeCompare(b.name)), [nodes]);
  const places = useMemo(() => nodes.filter((n) => n.category === "place").sort((a, b) => a.name.localeCompare(b.name)), [nodes]);

  return (
    <div>
      <label style={styles.statsField}>
        <span style={styles.statsLabel}>Beat</span>
        <select value={block.beatId || ""} onChange={(e) => updateBlock(block.id, { beatId: e.target.value || null })} style={styles.statsInput}>
          <option value="">— sin beat —</option>
          {beats.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>
      <label style={{ ...styles.statsField, marginTop: 8 }}>
        <span style={styles.statsLabel}>Ubicación</span>
        <select value={block.placeId || ""} onChange={(e) => updateBlock(block.id, { placeId: e.target.value || null })} style={styles.statsInput}>
          <option value="">— ninguna —</option>
          {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <div style={{ ...styles.statsIncidenceTitle2, marginTop: 10 }}>Personajes presentes</div>
      <CharacterMultiPicker characterIds={block.characterIds} nodes={nodes} onChange={(v) => updateBlock(block.id, { characterIds: v })} />
      <label style={{ ...styles.statsField, marginTop: 10 }}>
        <span style={styles.statsLabel}>Condición de entrada</span>
        <input value={condDraft} onChange={(e) => setCondDraft(e.target.value)} onBlur={() => updateBlock(block.id, { entryCondition: condDraft })}
          placeholder="Ej. flag_puerta_abierta = true" style={styles.statsInput} />
      </label>
      <div style={{ ...styles.statsIncidenceTitle2, marginTop: 10 }}>Guion</div>
      <SceneScriptBlock lines={block.lines} nodes={nodes} navigateByName={navigateByName} onChange={(v) => updateBlock(block.id, { lines: v })} />
      <div style={{ ...styles.statsIncidenceTitle2, marginTop: 10 }}>Efectos al terminar</div>
      <FlagListEditor items={block.effects} onChange={(v) => updateBlock(block.id, { effects: v })}
        addLabel="Agregar efecto" placeholder="Ej. flag_confio_en_aria = true" />
    </div>
  );
}
