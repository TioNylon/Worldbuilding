import { useState, useEffect, useMemo } from "react";
import { getPageBlocks } from "../utils/blocks.js";
import { styles } from "../styles.js";
import { SearchSelect } from "../components/SearchSelect.jsx";

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
      <SearchSelect options={events.map((n) => ({ id: n.id, label: n.name }))}
        value={block.causedById || null} onChange={(v) => updateBlock(block.id, { causedById: v })}
        placeholder="Buscar acontecimiento…" clearLabel="— ninguno —" />
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
