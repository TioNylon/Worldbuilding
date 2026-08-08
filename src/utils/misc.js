import { useState, useEffect } from "react";
import { Skull, Sword, Flame, Gem, Ghost, FileText, Map as MapIcon, Link2, ScrollText, ImageIcon, Clock, ArrowLeftRight, User, Users, Package, Type, CircleAlert, Sparkles, BookOpen, KeyRound, Coins, Shield, Star, Heart, GitBranch, ShieldCheck, MessageSquare, Zap, Layers } from "lucide-react";
import { GRID_PX } from "../data/layoutConstants.js";
import { ATTR_FIELDS, COMBAT_STAT_FIELDS } from "../data/statFields.js";
import { blockSearchText } from "./blocks.js";

/* ---------- HELPERS ---------- */
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// Deja operar por teclado (Enter/Espacio) los mismos elementos clickeables que ya
// tienen onClick, sin tener que repetir el handler: re-dispara el click nativo.
export function keyActivate(e) {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); }
}

/* ---------- RESPONSIVE HOOK ---------- */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

export function skillTypeIcon(type) {
  if (type === "Física") return Sword;
  if (type === "Mágica") return Flame;
  if (type === "Soporte") return Heart;
  if (type === "Especial") return Star;
  return Sparkles;
}

// Ícono por posición de objeto: espada para armas, escudo para armaduras,
// paquete genérico para el resto (accesorios, consumibles, etc.).
export function itemSlotIcon(slot) {
  if (slot === "Mano Principal" || slot === "Mano Secundaria") return Sword;
  if (slot === "Cabeza" || slot === "Pecho" || slot === "Piernas") return ShieldCheck;
  if (slot === "Material") return Gem;
  return Package;
}

/* ---------- CATÁLOGOS (tablas resumen de Objetos/Habilidades/Personajes) ---------- */
// Lista compacta de los bonos distintos de cero de un bloque de objeto/personaje.
export function bonusList(block) {
  return [...ATTR_FIELDS, ...COMBAT_STAT_FIELDS]
    .map(([k, label]) => [label, block[`bonus_${k}`] || 0])
    .filter(([, v]) => v !== 0)
    .map(([label, v]) => `${label} ${v > 0 ? "+" : ""}${v}`)
    .join(" · ");
}

// Texto legible de a quién restringe usableBy (clase o personaje puntual).
export function usableByLabel(usableBy, nodes) {
  if (!usableBy || usableBy === "any") return "Cualquiera";
  const target = nodes.find((n) => n.id === usableBy);
  if (!target) return "—";
  return target.category === "class" ? `Clase: ${target.name}` : target.name;
}

/* ---------- LIENZO: item (recuadro movible + redimensionable) ---------- */
export function typeLabel(type) {
  return type === "heading" ? "Título" : type === "text" ? "Texto"
    : type === "image" ? "Imagen" : type === "itemStats" ? "Estadísticas de objeto"
    : type === "skillInfo" ? "Info de habilidad" : type === "charStats" ? "Estadísticas de personaje"
    : type === "members" ? "Miembros" : type === "relations" ? "Relaciones"
    : type === "lootTable" ? "Tabla de botín" : type === "routine" ? "Rutina horaria"
    : type === "rumor" ? "Rumor/secreto" : type === "threatLevel" ? "Nivel de amenaza"
    : type === "sceneBeats" ? "Escena (pasos)" : type === "missionBranches" ? "Ramificaciones"
    : type === "storyState" ? "Estado narrativo" : type === "causeEffect" ? "Causa y efecto"
    : type === "classSummary" ? "Habilidades y objetos de la clase"
    : type === "symbiontInfo" ? "Información de simbionte"
    : type === "resistances" ? "Resistencias y debilidades"
    : type === "dialogue" ? "Diálogo" : type === "encounter" ? "Encuentro"
    : type === "shopInventory" ? "Inventario de la tienda"
    : type === "statusEffectInfo" ? "Información de estado alterado"
    : type === "setInfo" ? "Información del set"
    : type === "beatInfo" ? "Información del beat" : type === "sceneInfo" ? "Guion de la escena"
    : type === "appearances" ? "Apariciones en el guion"
    : type === "expressionSprites" ? "Expresiones (diálogo)" : type === "explorationSprites" ? "Sprites de exploración"
    : type === "combatSprites" ? "Sprites de combate"
    : type === "menuPortrait" ? "Retrato de menú" : type === "skillIcon" ? "Icono de habilidad"
    : type === "itemIcon" ? "Icono (menú/inventario)" : "Recuadro";
}

export function typeIcon(type) {
  return type === "heading" ? Type : type === "image" ? ImageIcon : type === "itemStats" ? Package
    : type === "skillInfo" ? Sparkles : type === "charStats" ? User
    : type === "members" ? Users : type === "relations" ? Link2
    : type === "lootTable" ? Coins : type === "routine" ? Clock
    : type === "rumor" ? KeyRound : type === "threatLevel" ? CircleAlert
    : type === "sceneBeats" ? ScrollText : type === "missionBranches" ? GitBranch
    : type === "storyState" ? BookOpen : type === "causeEffect" ? ArrowLeftRight
    : type === "classSummary" ? Shield
    : type === "symbiontInfo" ? Ghost
    : type === "resistances" ? ShieldCheck
    : type === "dialogue" ? MessageSquare : type === "encounter" ? Skull
    : type === "shopInventory" ? Coins
    : type === "statusEffectInfo" ? Zap
    : type === "setInfo" ? Layers
    : type === "beatInfo" ? ScrollText : type === "sceneInfo" ? MessageSquare
    : type === "appearances" ? ScrollText
    : type === "expressionSprites" ? MessageSquare : type === "explorationSprites" ? MapIcon
    : type === "combatSprites" ? Sword
    : type === "menuPortrait" || type === "skillIcon" || type === "itemIcon" ? ImageIcon : FileText;
}

export function snapPx(px) { return Math.round(px / GRID_PX) * GRID_PX; }

/* ---------- PAGE EDITOR ---------- */
// Texto combinado (bloques + contenido de slots) para escanear [[enlaces]].
export function scanTextOf(blocks, slotData) {
  const parts = [];
  (blocks || []).forEach((b) => { const t = blockSearchText(b); if (t) parts.push(t); });
  Object.values(slotData || {}).forEach((v) => { if (v && typeof v.text === "string") parts.push(v.text); });
  return parts.join("\n");
}

/* ---------- TIMELINE EDITOR ---------- */
export function normalizeEvents(events) {
  const withSlot = events.map((e, i) => ({ ...e, slot: e.slot ?? i }));
  const slots = [...new Set(withSlot.map((e) => e.slot))].sort((a, b) => a - b);
  const remap = {};
  slots.forEach((s, i) => { remap[s] = i; });
  return withSlot.map((e) => ({ ...e, slot: remap[e.slot] }));
}

/* ---------- EDGE HELPERS ---------- */
export function edgeDash(style) {
  if (style === "dashed") return "8 5";
  if (style === "dotted") return "2 4";
  return undefined;
}
