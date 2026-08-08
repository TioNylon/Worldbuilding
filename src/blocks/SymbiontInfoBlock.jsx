import { useState, useEffect, useMemo } from "react";
import { ATTR_FIELDS, COMBAT_STAT_FIELDS, SKILL_TYPES } from "../data/statFields.js";
import { styles } from "../styles.js";
import { ElementPicker, StatusPicker } from "../components/ConfigListPicker.jsx";
import { DamageCalculator, TargetPicker } from "./SkillInfoBlock.jsx";

/* ---------- BLOCK: ESTADÍSTICAS DE PERSONAJE (FFIX) ---------- */
/* ---------- BLOCK: INFORMACIÓN DE SIMBIONTE ---------- */
// Los simbiontes son equipables por Personajes (node.symbiontIds[], como las
// clases), pero con su propia ficha: tipo, origen, una pasiva (bonos de
// estadísticas y/o un hechizo existente), una activa (enlaza a una Habilidad)
// y un ataque final propio con su propia fórmula de daño.
export function SymbiontInfoBlock({ block, nodes, updateBlock }) {
  const [kindDraft, setKindDraft] = useState(block.kind || "");
  const [originDraft, setOriginDraft] = useState(block.origin || "");
  useEffect(() => { setKindDraft(block.kind || ""); setOriginDraft(block.origin || ""); }, [block.id]);

  const skills = useMemo(() => nodes.filter((n) => n.category === "skill").sort((a, b) => a.name.localeCompare(b.name)), [nodes]);

  function setBonus(key, value) {
    const n = value === "" || value === "-" ? 0 : parseInt(value, 10);
    updateBlock(block.id, { [`bonus_${key}`]: Number.isNaN(n) ? 0 : n });
  }
  function setFinal(patch) {
    updateBlock(block.id, { finalAttack: { ...(block.finalAttack || {}), ...patch } });
  }
  const fa = block.finalAttack || {};

  return (
    <div>
      <div style={styles.statsField}>
        <span style={styles.statsLabel}>Tipo de simbionte</span>
        <input value={kindDraft} onChange={(e) => setKindDraft(e.target.value)} onBlur={() => updateBlock(block.id, { kind: kindDraft })}
          placeholder="Ej. Parásito de combate" style={styles.statsInput} />
      </div>
      <div style={styles.statsField}>
        <span style={styles.statsLabel}>Origen</span>
        <input value={originDraft} onChange={(e) => setOriginDraft(e.target.value)} onBlur={() => updateBlock(block.id, { origin: originDraft })}
          placeholder="¿De dónde viene este simbionte?" style={styles.statsInput} />
      </div>

      <div style={styles.statsIncidenceTitle2}>Habilidad pasiva</div>
      <div style={styles.statsGrid6}>
        {ATTR_FIELDS.map(([k, label]) => (
          <label key={k} style={styles.statsField}>
            <span style={styles.statsLabel}>{label}</span>
            <input type="number" value={block[`bonus_${k}`] ?? 0} style={styles.statsMiniInput} onChange={(e) => setBonus(k, e.target.value)} />
          </label>
        ))}
        {COMBAT_STAT_FIELDS.map(([k, label]) => (
          <label key={k} style={styles.statsField}>
            <span style={styles.statsLabel}>{label}</span>
            <input type="number" value={block[`bonus_${k}`] ?? 0} style={styles.statsMiniInput} onChange={(e) => setBonus(k, e.target.value)} />
          </label>
        ))}
      </div>
      <label style={{ ...styles.statsField, marginTop: 8 }}>
        <span style={styles.statsLabel}>O vincular a un hechizo existente</span>
        <select value={block.passiveSkillId || ""} onChange={(e) => updateBlock(block.id, { passiveSkillId: e.target.value || null })} style={styles.statsInput}>
          <option value="">— ninguno —</option>
          {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>

      <div style={styles.statsIncidenceTitle2}>Habilidad activa</div>
      <select value={block.activeSkillId || ""} onChange={(e) => updateBlock(block.id, { activeSkillId: e.target.value || null })} style={styles.statsInput}>
        <option value="">— elegir habilidad —</option>
        {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      <div style={styles.statsIncidenceTitle2}>Ataque final</div>
      <input value={fa.name || ""} onChange={(e) => setFinal({ name: e.target.value })}
        placeholder="Nombre del ataque final" style={styles.statsInput} />
      <input value={fa.description || ""} onChange={(e) => setFinal({ description: e.target.value })}
        placeholder="Descripción del efecto" style={{ ...styles.statsInput, marginTop: 6 }} />
      <label style={{ ...styles.statsField, marginTop: 6 }}>
        <span style={styles.statsLabel}>Tipo</span>
        <select value={fa.skillType || "Física"} onChange={(e) => setFinal({ skillType: e.target.value })} style={styles.statsInput}>
          {SKILL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <div style={{ marginTop: 8 }}>
        <span style={styles.statsLabel}>Objetivo</span>
        <TargetPicker shape={fa.targetShape} side={fa.targetSide} count={fa.targetCount}
          onChange={(patch) => setFinal(patch)} />
      </div>
      <div style={{ marginTop: 8 }}>
        <span style={styles.statsLabel}>Elemento</span>
        <ElementPicker value={fa.element || null} onChange={(v) => setFinal({ element: v })} />
      </div>
      <div style={{ marginTop: 8 }}>
        <span style={styles.statsLabel}>Estado que inflige (opcional)</span>
        <StatusPicker value={fa.inflictsStatusId || null} onChange={(v) => setFinal({ inflictsStatusId: v })} />
      </div>
      <div style={{ ...styles.statsIncidenceTitle2, marginTop: 10 }}>Cálculo de daño</div>
      <DamageCalculator skillType={fa.skillType} power={fa.power} calcAttackerId={fa.calcAttackerId} calcTargetId={fa.calcTargetId}
        nodes={nodes} onChange={(patch) => setFinal(patch)} />
    </div>
  );
}
