import { useMemo } from "react";
import { Plus, X, ArrowUp, ArrowDown } from "lucide-react";
import { uid } from "../utils/misc.js";
import { styles } from "../styles.js";
import { SearchSelect } from "../components/SearchSelect.jsx";

/* ---------- BLOCK: DIÁLOGO (Acontecimiento/NPC) ---------- */
// Líneas ordenadas (como Escena) con un hablante opcional (Personaje/NPC) y
// ramificaciones simples (como Ramificaciones de Misión): cada línea puede
// "llevar a" una o más líneas de este mismo bloque, en vez de seguir el orden.
// Pensado para poder exportarse luego como diálogo de Godot por capítulo.
export function DialogueBlock({ block, nodes, updateBlock }) {
  const lines = block.lines || [];
  const speakers = useMemo(
    () => nodes.filter((n) => n.category === "character" || n.category === "npc").sort((a, b) => a.name.localeCompare(b.name)),
    [nodes]
  );
  function addLine() {
    updateBlock(block.id, { lines: [...lines, { id: uid(), speakerId: null, text: "", leadsTo: [] }] });
  }
  function updateLine(id, patch) {
    updateBlock(block.id, { lines: lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  }
  function removeLine(id) {
    updateBlock(block.id, {
      lines: lines.filter((l) => l.id !== id).map((l) => ({ ...l, leadsTo: (l.leadsTo || []).filter((t) => t !== id) })),
    });
  }
  function moveLine(id, dir) {
    const idx = lines.findIndex((l) => l.id === id);
    const target = idx + dir;
    if (target < 0 || target >= lines.length) return;
    const next = [...lines];
    [next[idx], next[target]] = [next[target], next[idx]];
    updateBlock(block.id, { lines: next });
  }
  function toggleLeadsTo(lineId, targetId) {
    const l = lines.find((x) => x.id === lineId);
    const cur = l.leadsTo || [];
    updateLine(lineId, { leadsTo: cur.includes(targetId) ? cur.filter((t) => t !== targetId) : [...cur, targetId] });
  }
  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>Diálogo</div>
      {lines.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 8 }}>Sin líneas todavía.</div>
      )}
      {lines.map((l, i) => (
        <div key={l.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 5px)", padding: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "var(--muted)", minWidth: 16, textAlign: "right" }}>{i + 1}.</span>
            <div style={{ flex: 1 }}>
              <SearchSelect options={speakers.map((s) => ({ id: s.id, label: s.name }))}
                value={l.speakerId || null} onChange={(v) => updateLine(l.id, { speakerId: v })}
                placeholder="Buscar hablante…" clearLabel="— narrador —" />
            </div>
            <button style={styles.miniBtn} onClick={() => moveLine(l.id, -1)} title="Mover antes"><ArrowUp size={11} /></button>
            <button style={styles.miniBtn} onClick={() => moveLine(l.id, 1)} title="Mover después"><ArrowDown size={11} /></button>
            <X size={14} style={{ cursor: "pointer", color: "#c45c5c", flexShrink: 0 }} onClick={() => removeLine(l.id)} />
          </div>
          <textarea value={l.text} onChange={(e) => updateLine(l.id, { text: e.target.value })}
            placeholder="¿Qué dice?" style={{ ...styles.textarea, minHeight: 50 }} />
          {lines.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, marginTop: 6 }}>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>Lleva a:</span>
              {lines.filter((o) => o.id !== l.id).map((o) => (
                <button key={o.id} type="button" onClick={() => toggleLeadsTo(l.id, o.id)}
                  style={{
                    ...styles.tagChip, cursor: "pointer", border: "1px solid var(--border)",
                    ...((l.leadsTo || []).includes(o.id) ? { background: "var(--accent)", color: "var(--bg)" } : {}),
                  }}>
                  {lines.indexOf(o) + 1}. {(o.text || "(vacío)").slice(0, 24)}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <button style={{ ...styles.pillBtn, alignSelf: "flex-start" }} onClick={addLine}><Plus size={12} /> Agregar línea</button>
    </div>
  );
}
