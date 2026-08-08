import { useState, useEffect } from "react";
import { Sword, ShieldCheck } from "lucide-react";
import { ATTR_FIELDS, COMBAT_STAT_FIELDS, ITEM_SLOTS } from "../data/statFields.js";
import { rarityColor } from "../utils/stats.js";
import { styles } from "../styles.js";
import { activeArmorTypes, activeWeaponTypes, setActiveArmorTypes, setActiveWeaponTypes } from "../state/globals.js";
import { ConfigListPicker, ElementPicker, StatusPicker } from "../components/ConfigListPicker.jsx";
import { LinkPicker } from "../components/LinkPicker.jsx";
import { QuickCreateButton } from "../components/QuickCreateButton.jsx";

/* ---------- BLOCK: ESTADÍSTICAS DE OBJETO ---------- */
// Selector "quién puede usarlo": Cualquiera o un Personaje (protagonista)
// específico. Los NPC/Enemigo/Jefe/etc. no cuentan como protagonistas.
export function UsableByPicker({ nodes, value, onChange }) {
  const classes = nodes.filter((n) => n.category === "class").sort((a, b) => a.name.localeCompare(b.name));
  const characters = nodes.filter((n) => n.category === "character").sort((a, b) => a.name.localeCompare(b.name));
  return (
    <select value={value || "any"} onChange={(e) => onChange(e.target.value)} style={styles.statsInput}>
      <option value="any">— Cualquiera —</option>
      {classes.length > 0 && (
        <optgroup label="Por clase">
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </optgroup>
      )}
      {characters.length > 0 && (
        <optgroup label="Personaje específico">
          {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </optgroup>
      )}
    </select>
  );
}

// Efecto de uso en combate de un objeto Consumible (curar HP/recurso y/o un
// estado alterado), como una versión sencilla e inversa del DamageCalculator.
export function ConsumableEffectFields({ consumableEffect, onChange }) {
  const ce = consumableEffect || {};
  const [descDraft, setDescDraft] = useState(ce.description || "");
  useEffect(() => { setDescDraft(ce.description || ""); }, [ce.description]);
  function setNum(field, value) {
    const n = value === "" || value === "-" ? 0 : parseInt(value, 10);
    onChange({ [field]: Number.isNaN(n) ? 0 : n });
  }
  return (
    <>
      <div style={styles.statsIncidenceTitle2}>Efecto de uso en combate</div>
      <input value={descDraft} onChange={(e) => setDescDraft(e.target.value)}
        onBlur={() => onChange({ description: descDraft })}
        placeholder="Ej. Restaura HP y cura Veneno" style={styles.statsInput} />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <label style={styles.statsField}>
          <span style={styles.statsLabel}>Cura HP</span>
          <input type="number" value={ce.healHp ?? 0} style={styles.statsMiniInput} onChange={(e) => setNum("healHp", e.target.value)} />
        </label>
        <label style={styles.statsField}>
          <span style={styles.statsLabel}>Cura Recurso (SP/MP)</span>
          <input type="number" value={ce.healResource ?? 0} style={styles.statsMiniInput} onChange={(e) => setNum("healResource", e.target.value)} />
        </label>
      </div>
      <div style={{ marginTop: 8 }}>
        <span style={styles.statsLabel}>Cura estado alterado</span>
        <StatusPicker value={ce.curesStatusId || null} onChange={(v) => onChange({ curesStatusId: v })} />
      </div>
    </>
  );
}

export function ItemStatsBlock({ block, nodes, updateBlock, addSkillItem, nodeId }) {
  function setNum(field, value) {
    const n = value === "" || value === "-" ? 0 : parseInt(value, 10);
    updateBlock(block.id, { [field]: Number.isNaN(n) ? 0 : n });
  }
  const skill = nodes.find((n) => n.id === block.teachesSkillId);
  return (
    <div>
      <div style={styles.statsField}>
        <span style={styles.statsLabel}>Tipo de objeto</span>
        <select value={block.itemSlot || "Accesorio"} onChange={(e) => updateBlock(block.id, { itemSlot: e.target.value })} style={styles.statsInput}>
          {ITEM_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <label style={{ ...styles.statsField, marginTop: 8 }}>
        <span style={styles.statsLabel}>Precio (oro)</span>
        <input type="number" min={0} value={block.price ?? 0} style={styles.statsMiniInput}
          onChange={(e) => setNum("price", e.target.value)} />
      </label>
      <div style={{ ...styles.statsField, marginTop: 8 }}>
        <span style={styles.statsLabel}>Rareza</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="range" min={1} max={10} value={block.rarity ?? 1}
            onChange={(e) => setNum("rarity", e.target.value)} style={{ flex: 1 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: rarityColor(block.rarity ?? 1), minWidth: 16, textAlign: "right" }}>
            {block.rarity ?? 1}
          </span>
        </div>
      </div>
      <div style={{ ...styles.statsField, marginTop: 8 }}>
        <span style={styles.statsLabel}>Set de equipo (opcional)</span>
        <select value={block.setId || ""} onChange={(e) => updateBlock(block.id, { setId: e.target.value || null })} style={styles.statsInput}>
          <option value="">— ninguno —</option>
          {nodes.filter((n) => n.category === "itemSet").sort((a, b) => a.name.localeCompare(b.name))
            .map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
      </div>

      {(block.itemSlot === "Mano Principal" || block.itemSlot === "Mano Secundaria") && (
        <>
          <div style={styles.statsIncidenceTitle2}>Tipo de arma</div>
          <ConfigListPicker list={activeWeaponTypes} setList={setActiveWeaponTypes}
            value={block.weaponType || null} onChange={(v) => updateBlock(block.id, { weaponType: v })}
            icon={Sword} placeholder="+ tipo de arma…" />
          <div style={styles.statsIncidenceTitle2}>Elemento</div>
          <ElementPicker value={block.element || null} onChange={(v) => updateBlock(block.id, { element: v })} />
        </>
      )}
      {(block.itemSlot === "Cabeza" || block.itemSlot === "Pecho" || block.itemSlot === "Piernas") && (
        <>
          <div style={styles.statsIncidenceTitle2}>Tipo de armadura</div>
          <ConfigListPicker list={activeArmorTypes} setList={setActiveArmorTypes}
            value={block.armorType || null} onChange={(v) => updateBlock(block.id, { armorType: v })}
            icon={ShieldCheck} placeholder="+ tipo de armadura…" />
        </>
      )}
      {block.itemSlot === "Consumible" && (
        <ConsumableEffectFields consumableEffect={block.consumableEffect} onChange={(patch) => updateBlock(block.id, { consumableEffect: { ...(block.consumableEffect || {}), ...patch } })} />
      )}

      <div style={styles.statsIncidenceTitle2}>Bonos a atributos</div>
      <div style={styles.statsGrid6}>
        {ATTR_FIELDS.map(([k, label]) => (
          <label key={k} style={styles.statsField}>
            <span style={styles.statsLabel}>{label}</span>
            <input type="number" value={block[`bonus_${k}`] ?? 0} style={styles.statsMiniInput}
              onChange={(e) => setNum(`bonus_${k}`, e.target.value)} />
          </label>
        ))}
      </div>

      <div style={styles.statsIncidenceTitle2}>Bonos a estadísticas de combate</div>
      <div style={styles.statsGrid6}>
        {COMBAT_STAT_FIELDS.map(([k, label]) => (
          <label key={k} style={styles.statsField}>
            <span style={styles.statsLabel}>{label}</span>
            <input type="number" value={block[`bonus_${k}`] ?? 0} style={styles.statsMiniInput}
              onChange={(e) => setNum(`bonus_${k}`, e.target.value)} />
          </label>
        ))}
      </div>

      <div style={styles.statsIncidenceTitle2}>Habilidad que enseña</div>
      <LinkPicker nodes={nodes} value={block.teachesSkillId} onChange={(v) => updateBlock(block.id, { teachesSkillId: v })} excludeId={block.id} />
      {addSkillItem && nodeId && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>o crear una nueva:</span>
          <QuickCreateButton title="Crear habilidad nueva y asignarla acá"
            onCreate={(name) => addSkillItem(name, { nodeId, blockId: block.id, apply: (b, newId) => ({ ...b, teachesSkillId: newId }) })} />
        </div>
      )}
      {skill && (
        <label style={styles.statsField}>
          <span style={styles.statsLabel}>AP para dominar</span>
          <input type="number" value={block.apToMaster ?? 0} style={styles.statsMiniInput}
            onChange={(e) => setNum("apToMaster", e.target.value)} />
        </label>
      )}

      <div style={styles.statsIncidenceTitle2}>Quién puede usarlo</div>
      <UsableByPicker nodes={nodes} value={block.usableBy} onChange={(v) => updateBlock(block.id, { usableBy: v })} />
    </div>
  );
}
