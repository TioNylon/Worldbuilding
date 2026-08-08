import { useState, useEffect, useMemo } from "react";
import { getPageBlocks } from "../utils/blocks.js";
import { styles } from "../styles.js";

/* ---------- BLOCK: ESTADO NARRATIVO (Personaje) ---------- */
export function StoryStateBlock({ block, updateBlock }) {
  const [draft, setDraft] = useState(block.text || "");
  useEffect(() => { setDraft(block.text || ""); }, [block.id]);
  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>Estado narrativo actual</div>
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => updateBlock(block.id, { text: draft })}
        placeholder="Ej. Capítulo 3: recién traicionado por Corvin, esconde su ira." style={{ ...styles.textarea, minHeight: 70 }} />
    </div>
  );
}

/* ---------- BLOCK: CAUSA Y EFECTO (Acontecimiento) ---------- */
export function CauseEffectBlock({ block, nodes, nodeId, updateBlock }) {
  const events = nodes.filter((n) => n.category === "event" && n.id !== nodeId).sort((a, b) => a.name.localeCompare(b.name));

  // Otros Acontecimientos cuyo "es consecuencia de" apunta a este (inferido,
  // igual patrón que las relaciones entrantes de Personaje).
  const causedThese = useMemo(() => {
    const out = [];
    nodes.forEach((n) => {
      if (n.id === nodeId || n.category !== "event") return;
      getPageBlocks(n).filter((b) => b.type === "causeEffect").forEach((b) => {
        if (b.causedById === nodeId) out.push(n);
      });
    });
    return out;
  }, [nodes, nodeId]);

  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>Es consecuencia de</div>
      <select value={block.causedById || ""} onChange={(e) => updateBlock(block.id, { causedById: e.target.value || null })} style={styles.statsInput}>
        <option value="">— ninguno —</option>
        {events.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
      </select>
      {causedThese.length > 0 && (
        <>
          <div style={{ ...styles.statsIncidenceTitle2, marginTop: 14 }}>Esto causó</div>
          {causedThese.map((n) => (
            <div key={n.id} style={{ fontSize: 12, color: "var(--muted)", padding: "3px 0" }}>
              <b style={{ color: "var(--text)" }}>{n.name}</b>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
