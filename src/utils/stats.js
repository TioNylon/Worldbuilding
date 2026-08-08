import { RARITY_COLORS, TARGET_SHAPES, TARGET_SIDES } from "../data/statFields.js";

// Umbrales de nivel de amenaza (1-10) para Enemigo/Jefe.
export function threatLabelFor(level) {
  if (level <= 2) return { label: "Trivial", color: "#45d3a3" };
  if (level <= 4) return { label: "Fácil", color: "#a3d977" };
  if (level <= 6) return { label: "Normal", color: "#e9c46a" };
  if (level <= 8) return { label: "Difícil", color: "#e07a5f" };
  return { label: "Mortal", color: "#b04848" };
}

// Resumen en una línea ("3 objetivos · Enemigos") para listados y catálogos.
// "Varios objetivos" es el único caso donde el número no se deduce de la forma.
export function targetSummary(b) {
  if (!b) return "—";
  const shapeKey = b.targetShape || "single";
  const shape = TARGET_SHAPES.find((s) => s.key === shapeKey);
  const side = TARGET_SIDES.find((s) => s.key === (b.targetSide || "enemies"));
  const shapeText = shapeKey === "multi" ? `${b.targetCount || 2} objetivos` : (shape?.label || "—");
  return `${shapeText} · ${side?.label || "—"}`;
}

export function rarityColor(r) { return RARITY_COLORS[Math.max(1, Math.min(10, r || 1)) - 1]; }

export function deriveCharStats(b) {
  const str = b.str ?? 10, dex = b.dex ?? 10, con = b.con ?? 10;
  const int = b.int ?? 10, wis = b.wis ?? 10, cha = b.cha ?? 10;
  const nivel = b.nivel ?? 1;
  const lvlBonus = nivel - 1;
  return {
    maxHp: (b.baseMaxHp ?? 100) + con * 4 + lvlBonus * 8,
    maxResource: (b.baseMaxResource ?? 20) + (b.isMagical ? int : dex) * 2 + lvlBonus * 2,
    atkFisico: str * 2 + lvlBonus * 2,
    atkMagico: int * 2 + lvlBonus * 2,
    defFisica: Math.floor(con * 1.5) + lvlBonus,
    defMagica: Math.floor(wis * 1.5) + lvlBonus,
    velAtaque: Math.floor(dex * 1.2) + lvlBonus,
    velReaccion: dex + lvlBonus,
    resistEstados: con + lvlBonus,
    suerte: cha + lvlBonus,
    xpParaSubir: 40 + nivel * 30,
  };
}

// Fórmula de daño según tipo de habilidad (misma lógica que derived_stats.gd:
// potencia de la habilidad combinada con el atacante y la defensa del objetivo).
export function skillDamageFormula(type) {
  if (type === "Física") return "Daño = ATQ. FÍSICO × (Potencia ÷ 100) − DEF. FÍSICA";
  if (type === "Mágica") return "Daño = ATQ. MÁGICO × (Potencia ÷ 100) − (DEF. MÁGICA ÷ 2)";
  return null;
}

export function computeSkillDamage(type, power, attackerStats, targetStats) {
  if (!attackerStats || !targetStats) return null;
  const p = (power || 0) / 100;
  if (type === "Física") return Math.max(0, Math.round(attackerStats.atkFisico * p - targetStats.defFisica));
  if (type === "Mágica") return Math.max(0, Math.round(attackerStats.atkMagico * p - targetStats.defMagica / 2));
  return null;
}

export function recipeCostLabel(recipe, nodes) {
  const mats = (recipe.materials || []).map((m) => {
    const it = nodes.find((n) => n.id === m.itemId);
    return `${it?.name || "?"} ×${m.qty}`;
  }).join(" + ");
  const gold = recipe.gold ? `${mats ? " + " : ""}${recipe.gold} oro` : "";
  return mats || gold ? `${mats}${gold}` : "—";
}
