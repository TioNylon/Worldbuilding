import { Circle, Users, Target, Sparkles, Triangle } from "lucide-react";

// Los 6 atributos base D&D, reutilizados por bloques de Objeto/Personaje.
export const ATTR_FIELDS = [
  ["str", "Fuerza"], ["dex", "Destreza"], ["con", "Constitución"],
  ["int", "Inteligencia"], ["wis", "Sabiduría"], ["cha", "Carisma"],
];

// Las 10 estadísticas de combate FFIX, reutilizadas por Objeto/Personaje.
export const COMBAT_STAT_FIELDS = [
  ["maxHp", "PV"], ["maxResource", "Recurso (SP/MP)"],
  ["atkFisico", "Ataque Físico"], ["atkMagico", "Ataque Mágico"],
  ["defFisica", "Defensa Física"], ["defMagica", "Defensa Mágica"],
  ["velAtaque", "Vel. Ataque"], ["velReaccion", "Vel. Reacción"],
  ["resistEstados", "Resist. Estados"], ["suerte", "Suerte"],
];

export const ITEM_SLOTS = ["Cabeza", "Pecho", "Piernas", "Accesorio", "Mano Principal", "Mano Secundaria", "Consumible", "Material", "Objeto clave", "Otro"];

export const SKILL_TYPES = ["Física", "Mágica", "Soporte", "Especial"];

// Objetivo de una habilidad, en dos ejes independientes: la forma del alcance
// (a cuántos llega y cómo) y el bando al que apunta. Se guardan por separado
// porque cualquier forma puede apuntar a cualquier bando (un cono de curación
// a aliados es tan válido como un cono de fuego a enemigos).
export const TARGET_SHAPES = [
  { key: "single", label: "Un objetivo", icon: Target },
  { key: "multi", label: "Varios objetivos", icon: Users },
  { key: "area", label: "Área", icon: Circle },
  { key: "cone", label: "Cono", icon: Triangle },
  { key: "all", label: "Todos", icon: Sparkles },
];

export const TARGET_SIDES = [
  { key: "enemies", label: "Enemigos", color: "#b04848" },
  { key: "allies", label: "Aliados", color: "#45d3a3" },
  { key: "self", label: "Uno mismo", color: "#e9c46a" },
  { key: "any", label: "Cualquiera", color: "#7aa5d6" },
];

// Colores de rareza 1-10 (estilo Monster Hunter), de común a legendario.
export const RARITY_COLORS = ["#8a8298", "#a3d977", "#7aa5d6", "#5089d3", "#c583d6", "#e9c46a", "#e07a5f", "#d9622b", "#b04848", "#c9a25a"];

// Fórmula FFIX (igual a scripts/battle/derived_stats.gd del proyecto Godot):
// atributos + nivel, sin bonos de equipo (worldbuilding es solo referencia,
// no un sistema de equipo en vivo).
// Niveles de referencia para la vista de Progresión del Catálogo (curva de
// crecimiento de estadísticas), y qué estadísticas derivadas mostrar ahí.
export const PROGRESSION_LEVELS = [1, 5, 10, 15, 20];

export const PROGRESSION_STAT_ROWS = [
  ["PV", "maxHp"], ["Recurso (SP/MP)", "maxResource"],
  ["Atq. Físico", "atkFisico"], ["Atq. Mágico", "atkMagico"],
  ["Def. Física", "defFisica"], ["Def. Mágica", "defMagica"],
];

// Niveles de reacción para el bloque de Resistencias y debilidades: los elementos
// admiten debilidad (más daño) además de resistencia/inmunidad; los estados
// alterados sólo se resisten o son inmunes (no tiene sentido ser "débil" a uno).
export const ELEMENT_RES_LEVELS = [
  { key: "normal", label: "Normal" },
  { key: "debil", label: "Débil (×2 daño)" },
  { key: "resiste", label: "Resiste (×0.5 daño)" },
  { key: "inmune", label: "Inmune" },
];

export const STATUS_RES_LEVELS = [
  { key: "normal", label: "Normal" },
  { key: "resiste", label: "Resiste" },
  { key: "inmune", label: "Inmune" },
];

export const RESIST_BAR_VISUAL = {
  debil: { pct: 100, color: "#c45c5c" },
  resiste: { pct: 40, color: "var(--accent)" },
  inmune: { pct: 12, color: "#7dffb0" },
};
