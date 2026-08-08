import { useState, useEffect, useMemo } from "react";
import { Plus, X } from "lucide-react";
import { SKILL_TYPES, TARGET_SHAPES, TARGET_SIDES } from "../data/statFields.js";
import { getPageBlocks } from "../utils/blocks.js";
import { uid } from "../utils/misc.js";
import { computeSkillDamage, deriveCharStats, skillDamageFormula } from "../utils/stats.js";
import { deleteImage } from "../storage.js";
import { styles } from "../styles.js";
import { ElementPicker, StatusPicker } from "../components/ConfigListPicker.jsx";
import { SearchSelect } from "../components/SearchSelect.jsx";
import { SpriteImageUploader } from "../components/SpriteUploader.jsx";
import { UsableByPicker } from "./ItemStatsBlock.jsx";

// Sección reutilizable de "Potencia + fórmula + atacante/objetivo + resultado",
// usada tanto por Habilidad como por el Ataque final de un Simbionte.
export function DamageCalculator({ skillType, power, calcAttackerId, calcTargetId, nodes, onChange }) {
  const formula = skillDamageFormula(skillType);
  const statNodes = useMemo(
    () => nodes.filter((n) => getPageBlocks(n).some((b) => b.type === "charStats")).sort((a, b) => a.name.localeCompare(b.name)),
    [nodes]
  );
  const attacker = nodes.find((n) => n.id === calcAttackerId);
  const target = nodes.find((n) => n.id === calcTargetId);
  const attackerStats = attacker ? deriveCharStats(getPageBlocks(attacker).find((b) => b.type === "charStats")) : null;
  const targetStats = target ? deriveCharStats(getPageBlocks(target).find((b) => b.type === "charStats")) : null;
  const damage = computeSkillDamage(skillType, power, attackerStats, targetStats);

  if (!formula) {
    return <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Sin fórmula (efecto de soporte/especial, no inflige daño numérico).</div>;
  }
  return (
    <>
      <label style={styles.statsField}>
        <span style={styles.statsLabel}>Potencia</span>
        <input type="number" value={power ?? 10} style={styles.statsMiniInput}
          onChange={(e) => { const n = parseInt(e.target.value, 10); onChange({ power: Number.isNaN(n) ? 0 : n }); }} />
      </label>
      <div style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic", marginBottom: 8 }}>{formula}</div>

      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <select value={calcAttackerId || ""} onChange={(e) => onChange({ calcAttackerId: e.target.value || null })} style={{ ...styles.statsInput, flex: 1 }}>
          <option value="">— atacante —</option>
          {statNodes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
        <select value={calcTargetId || ""} onChange={(e) => onChange({ calcTargetId: e.target.value || null })} style={{ ...styles.statsInput, flex: 1 }}>
          <option value="">— objetivo —</option>
          {statNodes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
      </div>
      <div style={styles.statsField}>
        <span style={styles.statsLabel}>Daño estimado</span>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>{damage === null ? "—" : damage}</div>
      </div>
    </>
  );
}

// Selector de objetivo, compartido por Habilidad y por el Ataque final de un
// Simbionte. Recibe los tres campos sueltos (no el bloque) porque el ataque
// final los guarda anidados en finalAttack, no en la raíz del bloque.
export function TargetPicker({ shape, side, count, onChange }) {
  const curShape = shape || "single";
  const curSide = side || "enemies";
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {TARGET_SHAPES.map((s) => (
          <button key={s.key} type="button" onClick={() => onChange({ targetShape: s.key })}
            style={{ ...styles.pillBtn, ...(curShape === s.key ? styles.pillBtnActive : {}) }}>
            <s.icon size={12} /> {s.label}
          </button>
        ))}
      </div>
      {curShape === "multi" && (
        <label style={{ ...styles.statsField, marginBottom: 8 }}>
          <span style={styles.statsLabel}>¿A cuántos alcanza?</span>
          <input type="number" min={2} value={count ?? 2}
            onChange={(e) => onChange({ targetCount: Math.max(2, parseInt(e.target.value, 10) || 2) })}
            style={styles.statsInput} />
        </label>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {TARGET_SIDES.map((s) => (
          <button key={s.key} type="button" onClick={() => onChange({ targetSide: s.key })}
            style={{ ...styles.pillBtn, ...(curSide === s.key ? { background: s.color, borderColor: s.color, color: "var(--bg)" } : { color: s.color }) }}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SkillInfoBlock({ block, nodes, nodeId, updateBlock }) {
  const [draft, setDraft] = useState(block.effect || "");
  useEffect(() => { setDraft(block.effect || ""); }, [block.id]);

  return (
    <div>
      <div style={styles.statsField}>
        <span style={styles.statsLabel}>Tipo de habilidad</span>
        <select value={block.skillType || "Física"} onChange={(e) => updateBlock(block.id, { skillType: e.target.value })} style={styles.statsInput}>
          {SKILL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={styles.statsField}>
        <span style={styles.statsLabel}>Efecto (resumen corto)</span>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => updateBlock(block.id, { effect: draft })}
          placeholder="Ej. Daño físico a un enemigo" style={styles.statsInput} />
      </div>

      <div style={styles.statsIncidenceTitle2}>Objetivo</div>
      <TargetPicker shape={block.targetShape} side={block.targetSide} count={block.targetCount}
        onChange={(patch) => updateBlock(block.id, patch)} />

      <div style={styles.statsIncidenceTitle2}>Elemento</div>
      <ElementPicker value={block.element || null} onChange={(v) => updateBlock(block.id, { element: v })} />

      <div style={styles.statsIncidenceTitle2}>Estado que inflige (opcional)</div>
      <StatusPicker value={block.inflictsStatusId || null} onChange={(v) => updateBlock(block.id, { inflictsStatusId: v })} />

      <div style={styles.statsIncidenceTitle2}>Quién puede usarla</div>
      <UsableByPicker nodes={nodes} value={block.usableBy} onChange={(v) => updateBlock(block.id, { usableBy: v })} />

      <div style={styles.statsIncidenceTitle2}>Árbol de talentos</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ ...styles.statsField, flex: 1, minWidth: 160 }}>
          <span style={styles.statsLabel}>Requiere (prerrequisito)</span>
          <SearchSelect
            options={nodes.filter((n) => n.category === "skill" && n.id !== nodeId).sort((a, b) => a.name.localeCompare(b.name)).map((n) => ({ id: n.id, label: n.name }))}
            value={block.prereqSkillId || null} onChange={(v) => updateBlock(block.id, { prereqSkillId: v })}
            placeholder="Buscar habilidad…" clearLabel="— ninguna (raíz del árbol) —" />
        </div>
        <label style={styles.statsField}>
          <span style={styles.statsLabel}>Costo en puntos</span>
          <input type="number" min={1} value={block.pointCost ?? 1}
            onChange={(e) => updateBlock(block.id, { pointCost: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            style={{ ...styles.statsMiniInput, width: 60 }} />
        </label>
      </div>

      <div style={styles.statsIncidenceTitle2}>Cálculo de daño</div>
      <DamageCalculator skillType={block.skillType} power={block.power} calcAttackerId={block.calcAttackerId} calcTargetId={block.calcTargetId}
        nodes={nodes} onChange={(patch) => updateBlock(block.id, patch)} />

      <div style={styles.statsIncidenceTitle2}>Animación por personaje</div>
      <SkillAnimationsBlock animations={block.animations} usableBy={block.usableBy} nodes={nodes}
        onChange={(v) => updateBlock(block.id, { animations: v })} />
    </div>
  );
}

// La misma habilidad puede lucir distinto según quién la use (un Guerrero y
// un Mago no castean igual "Bola de Fuego" aunque sea la misma clase), así
// que la animación es una lista por personaje, no una imagen única del
// bloque. "Quién puede usarla" no restringe la lista — solo ordena el
// selector para sugerir primero a quienes ya califican, sin bloquear si
// alguien reasigna la habilidad más adelante.
export function SkillAnimationsBlock({ animations, usableBy, nodes, onChange }) {
  const list = animations || [];
  const allCharacters = useMemo(
    () => nodes.filter((n) => n.category === "character").sort((a, b) => a.name.localeCompare(b.name)),
    [nodes]
  );
  const eligibleIds = useMemo(() => {
    if (!usableBy || usableBy === "any") return new Set(allCharacters.map((c) => c.id));
    const isClass = nodes.some((n) => n.id === usableBy && n.category === "class");
    if (isClass) return new Set(allCharacters.filter((c) => (c.classIds || []).includes(usableBy)).map((c) => c.id));
    return new Set([usableBy]);
  }, [usableBy, allCharacters, nodes]);
  const eligible = allCharacters.filter((c) => eligibleIds.has(c.id));
  const others = allCharacters.filter((c) => !eligibleIds.has(c.id));

  function add() {
    const first = eligible.find((c) => !list.some((a) => a.characterId === c.id)) || allCharacters[0];
    onChange([...list, { id: uid(), characterId: first?.id || null, imageKey: null }]);
  }
  function update(id, patch) { onChange(list.map((a) => (a.id === id ? { ...a, ...patch } : a))); }
  function remove(id) {
    const row = list.find((a) => a.id === id);
    if (row?.imageKey) deleteImage(row.imageKey);
    onChange(list.filter((a) => a.id !== id));
  }

  return (
    <div>
      {list.length === 0 && <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 6 }}>Ninguna todavía.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map((a) => {
          const imgKey = `cover-image:skillanim-${a.id}`;
          return (
            <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <SpriteImageUploader imgKey={imgKey} hasImage={!!a.imageKey} onUploaded={() => update(a.id, { imageKey: imgKey })} />
              <select value={a.characterId || ""} onChange={(e) => update(a.id, { characterId: e.target.value || null })} style={{ ...styles.statsInput, flex: 1 }}>
                <option value="">— elegir personaje —</option>
                {eligible.length > 0 && (
                  <optgroup label="Pueden usar esta habilidad">
                    {eligible.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                )}
                {others.length > 0 && (
                  <optgroup label="Otros">
                    {others.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                )}
              </select>
              <X size={14} style={{ cursor: "pointer", color: "#c45c5c", flexShrink: 0 }} onClick={() => remove(a.id)} />
            </div>
          );
        })}
      </div>
      <button type="button" style={{ ...styles.pillBtn, alignSelf: "flex-start", marginTop: 8 }} onClick={add}>
        <Plus size={12} /> Agregar animación
      </button>
    </div>
  );
}
