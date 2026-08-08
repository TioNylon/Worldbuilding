import { Plus, X, ArrowUp, ArrowDown } from "lucide-react";
import { uid } from "../utils/misc.js";
import { styles } from "../styles.js";

/* ---------- BLOCK: ESCENA (pasos, Acontecimiento) ---------- */
export function SceneBeatsBlock({ block, updateBlock }) {
  const beats = block.beats || [];
  function addBeat() {
    updateBlock(block.id, { beats: [...beats, { id: uid(), text: "" }] });
  }
  function updateBeat(id, text) {
    updateBlock(block.id, { beats: beats.map((b) => (b.id === id ? { ...b, text } : b)) });
  }
  function removeBeat(id) {
    updateBlock(block.id, { beats: beats.filter((b) => b.id !== id) });
  }
  function moveBeat(id, dir) {
    const idx = beats.findIndex((b) => b.id === id);
    const target = idx + dir;
    if (target < 0 || target >= beats.length) return;
    const next = [...beats];
    [next[idx], next[target]] = [next[target], next[idx]];
    updateBlock(block.id, { beats: next });
  }
  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>Escena (pasos)</div>
      {beats.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 8 }}>Sin pasos todavía.</div>
      )}
      {beats.map((b, i) => (
        <div key={b.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "var(--muted)", minWidth: 16, textAlign: "right" }}>{i + 1}.</span>
          <input value={b.text} onChange={(e) => updateBeat(b.id, e.target.value)}
            placeholder="¿Qué pasa en este paso?" style={{ ...styles.statsInput, flex: 1 }} />
          <button style={styles.miniBtn} onClick={() => moveBeat(b.id, -1)} title="Mover antes"><ArrowUp size={11} /></button>
          <button style={styles.miniBtn} onClick={() => moveBeat(b.id, 1)} title="Mover después"><ArrowDown size={11} /></button>
          <X size={14} style={{ cursor: "pointer", color: "#c45c5c", flexShrink: 0 }} onClick={() => removeBeat(b.id)} />
        </div>
      ))}
      <button style={{ ...styles.pillBtn, alignSelf: "flex-start" }} onClick={addBeat}><Plus size={12} /> Agregar paso</button>
    </div>
  );
}

/* ---------- BLOCK: RAMIFICACIONES (Misión) ---------- */
export function MissionBranchesBlock({ block, updateBlock }) {
  const entries = block.entries || [];
  function addEntry() {
    updateBlock(block.id, { entries: [...entries, { id: uid(), label: "", leadsTo: [] }] });
  }
  function updateEntry(id, patch) {
    updateBlock(block.id, { entries: entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  }
  function removeEntry(id) {
    updateBlock(block.id, {
      entries: entries.filter((e) => e.id !== id).map((e) => ({ ...e, leadsTo: (e.leadsTo || []).filter((t) => t !== id) })),
    });
  }
  function toggleLeadsTo(entryId, targetId) {
    const e = entries.find((x) => x.id === entryId);
    const cur = e.leadsTo || [];
    const next = cur.includes(targetId) ? cur.filter((t) => t !== targetId) : [...cur, targetId];
    updateEntry(entryId, { leadsTo: next });
  }
  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>Ramificaciones</div>
      {entries.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 8 }}>Sin decisiones todavía.</div>
      )}
      {entries.map((e) => (
        <div key={e.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 5px)", padding: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
            <input value={e.label} onChange={(ev) => updateEntry(e.id, { label: ev.target.value })}
              placeholder="Decisión o punto de la misión" style={{ ...styles.statsInput, flex: 1 }} />
            <X size={14} style={{ cursor: "pointer", color: "#c45c5c", flexShrink: 0 }} onClick={() => removeEntry(e.id)} />
          </div>
          {entries.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>Lleva a:</span>
              {entries.filter((o) => o.id !== e.id).map((o) => (
                <button key={o.id} type="button" onClick={() => toggleLeadsTo(e.id, o.id)}
                  style={{
                    ...styles.tagChip, cursor: "pointer", border: "1px solid var(--border)",
                    ...((e.leadsTo || []).includes(o.id) ? { background: "var(--accent)", color: "var(--bg)" } : {}),
                  }}>
                  {o.label || "(sin nombre)"}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <button style={{ ...styles.pillBtn, alignSelf: "flex-start" }} onClick={addEntry}><Plus size={12} /> Agregar punto</button>
    </div>
  );
}
