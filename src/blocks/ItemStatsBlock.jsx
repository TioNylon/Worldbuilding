import { useState, useEffect, useMemo } from "react";
import { Sword, ShieldCheck, ChevronRight, X } from "lucide-react";
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

const ALL_BONUS_FIELDS = [...ATTR_FIELDS, ...COMBAT_STAT_FIELDS];

// En vez de 16 casilleros siempre visibles, se muestran solo los que ya
// tienen un valor cargado (como chips), con un botón para agregar más — la
// grilla completa queda plegada salvo que ya haya algo puesto o el usuario la
// abra a propósito. Reduce el ruido en objetos con pocos bonos reales.
function BonusSection({ block, updateBlock, setNum }) {
  function setBonus(k, value) { setNum(`bonus_${k}`, value); }
  const activeFields = useMemo(
    () => ALL_BONUS_FIELDS.filter(([k]) => (block[`bonus_${k}`] || 0) !== 0),
    [block]
  );
  const [open, setOpen] = useState(activeFields.length > 0);
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        onClick={() => setOpen((o) => !o)} role="button" tabIndex={0}>
        <span style={{ ...styles.statsIncidenceTitle2, margin: 0 }}>Bonos</span>
        <ChevronRight size={13} color="var(--muted)" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .12s ease" }} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" }}>
        {activeFields.length === 0 && !open && (
          <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Sin bonos configurados.</span>
        )}
        {!open && activeFields.map(([k, label]) => (
          <span key={k} style={styles.statPill} title={label} onClick={(e) => e.stopPropagation()}>
            <span style={styles.statPillLabel}>{label}</span>
            <input type="number" value={block[`bonus_${k}`] ?? 0} style={styles.statPillInput}
              onChange={(e) => setBonus(k, e.target.value)} />
            <X size={11} style={{ cursor: "pointer", opacity: 0.6, flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); setBonus(k, "0"); }} />
          </span>
        ))}
        {!open && (
          <button type="button" onClick={() => setOpen(true)} style={{ ...styles.pillBtn, fontSize: 11.5, padding: "4px 10px", borderStyle: "dashed" }}>
            + agregar bono
          </button>
        )}
      </div>
      {open && (
        <>
          <div style={{ ...styles.statsIncidenceTitle2, marginTop: 10 }}>Atributos</div>
          <div style={styles.statsGrid6}>
            {ATTR_FIELDS.map(([k, label]) => (
              <label key={k} style={styles.statsField}>
                <span style={styles.statsLabel}>{label}</span>
                <input type="number" value={block[`bonus_${k}`] ?? 0} style={styles.statsMiniInput}
                  onChange={(e) => setBonus(k, e.target.value)} />
              </label>
            ))}
          </div>
          <div style={styles.statsIncidenceTitle2}>Estadísticas de combate</div>
          <div style={styles.statsGrid6}>
            {COMBAT_STAT_FIELDS.map(([k, label]) => (
              <label key={k} style={styles.statsField}>
                <span style={styles.statsLabel}>{label}</span>
                <input type="number" value={block[`bonus_${k}`] ?? 0} style={styles.statsMiniInput}
                  onChange={(e) => setBonus(k, e.target.value)} />
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Slots que nunca llevan bonos de combate ni ranura de equipo real: un
// material solo existe como ingrediente de otras recetas, un objeto clave es
// puramente narrativo — mostrarles la grilla de 16 bonos es ruido puro.
const SLOTS_WITHOUT_BONUSES = ["Material", "Objeto clave"];

export function ItemStatsBlock({ block, nodes, updateBlock, addSkillItem, nodeId }) {
  function setNum(field, value) {
    const n = value === "" || value === "-" ? 0 : parseInt(value, 10);
    updateBlock(block.id, { [field]: Number.isNaN(n) ? 0 : n });
  }
  const skill = nodes.find((n) => n.id === block.teachesSkillId);
  const slot = block.itemSlot || "Accesorio";
  return (
    <div>
      <div style={styles.statsField}>
        <span style={styles.statsLabel}>Tipo de objeto</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
          {ITEM_SLOTS.map((s) => (
            <button key={s} type="button" onClick={() => updateBlock(block.id, { itemSlot: s })}
              style={{ ...styles.pillBtn, fontSize: 11.5, padding: "5px 10px", ...(slot === s ? styles.pillBtnActive : {}) }}>
              {s}
            </button>
          ))}
        </div>
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

      {!SLOTS_WITHOUT_BONUSES.includes(slot) && <BonusSection block={block} updateBlock={updateBlock} setNum={setNum} />}

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
