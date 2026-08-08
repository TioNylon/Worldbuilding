import { useState, useEffect, useMemo } from "react";
import { Plus, X } from "lucide-react";
import { uid } from "../utils/misc.js";
import { styles } from "../styles.js";

/* ---------- BLOCK: INFORMACIÓN DE SET DE EQUIPO ---------- */
// Un bono por cada umbral de piezas equipadas (2, 4...); cada uno puede
// además enlazar una Habilidad existente para representar el poder especial
// que se desbloquea, sin tener que redefinirla acá.
export function SetInfoBlock({ block, nodes, updateBlock }) {
  const [descDraft, setDescDraft] = useState(block.description || "");
  useEffect(() => { setDescDraft(block.description || ""); }, [block.id]);
  const bonuses = block.bonuses || [];
  const skills = useMemo(() => nodes.filter((n) => n.category === "skill").sort((a, b) => a.name.localeCompare(b.name)), [nodes]);

  function addBonus() {
    updateBlock(block.id, { bonuses: [...bonuses, { id: uid(), pieces: 2, description: "", linkedSkillId: null }] });
  }
  function updateBonus(id, patch) {
    updateBlock(block.id, { bonuses: bonuses.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  }
  function removeBonus(id) {
    updateBlock(block.id, { bonuses: bonuses.filter((b) => b.id !== id) });
  }

  return (
    <div>
      <textarea value={descDraft} onChange={(e) => setDescDraft(e.target.value)} onBlur={() => updateBlock(block.id, { description: descDraft })}
        placeholder="¿Qué representa este set?" style={{ ...styles.textarea, minHeight: 70 }} />
      <div style={{ ...styles.statsIncidenceTitle2, marginTop: 10 }}>Bonos por piezas equipadas</div>
      {bonuses.length === 0 && <span style={styles.bookBottomHint}>Sin bonos todavía.</span>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
        {bonuses.map((b) => (
          <div key={b.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={styles.statsLabel}>Piezas equipadas</span>
              <input type="number" min={2} value={b.pieces ?? 2}
                onChange={(e) => updateBonus(b.id, { pieces: Math.max(2, parseInt(e.target.value, 10) || 2) })}
                style={{ ...styles.statsInput, width: 60 }} />
              <X size={13} style={{ marginLeft: "auto", cursor: "pointer", color: "#b04848" }} onClick={() => removeBonus(b.id)} />
            </div>
            <input value={b.description || ""} onChange={(e) => updateBonus(b.id, { description: e.target.value })}
              placeholder="Ej. +15% Ataque Mágico" style={styles.statsInput} />
            <select value={b.linkedSkillId || ""} onChange={(e) => updateBonus(b.id, { linkedSkillId: e.target.value || null })} style={styles.statsInput}>
              <option value="">— sin habilidad especial —</option>
              {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        ))}
      </div>
      <button style={{ ...styles.pillBtn, alignSelf: "flex-start", marginTop: 8 }} onClick={addBonus}>
        <Plus size={13} /> Nuevo bono
      </button>
    </div>
  );
}
