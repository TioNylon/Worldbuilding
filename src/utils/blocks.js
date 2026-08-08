import { ROUTINE_PERIODS } from "../data/entryTypes.js";
import { ATTR_FIELDS, COMBAT_STAT_FIELDS } from "../data/statFields.js";
import { uid } from "./misc.js";

// Alto por defecto (px) de cada tipo en el lienzo libre. Múltiplos de
// GRID_PX (ver CanvasEditor) para que nazcan ya calzados con la cuadrícula.
export function defaultBlockH(type) {
  if (type === "heading") return 60;
  if (type === "image") return 240;
  if (type === "menuPortrait" || type === "skillIcon" || type === "itemIcon") return 200;
  if (type === "itemStats") return 480;
  if (type === "skillInfo") return 780;
  if (type === "charStats") return 560;
  if (type === "members") return 220;
  if (type === "relations") return 240;
  if (type === "lootTable") return 260;
  if (type === "routine") return 300;
  if (type === "rumor") return 240;
  if (type === "threatLevel") return 170;
  if (type === "sceneBeats") return 260;
  if (type === "missionBranches") return 280;
  if (type === "storyState") return 140;
  if (type === "causeEffect") return 200;
  if (type === "classSummary") return 280;
  if (type === "symbiontInfo") return 1040;
  if (type === "resistances") return 480;
  if (type === "dialogue") return 320;
  if (type === "encounter") return 220;
  if (type === "shopInventory") return 260;
  if (type === "statusEffectInfo") return 420;
  if (type === "setInfo") return 380;
  if (type === "beatInfo") return 460;
  if (type === "sceneInfo") return 640;
  if (type === "appearances") return 220;
  if (type === "expressionSprites" || type === "explorationSprites" || type === "combatSprites") return 260;
  return 160;
}

// Layout de lienzo: x,w en % del ancho; y,h en px. El alto crece hacia abajo.
export function defaultLayout(type) { return { x: 2, y: 0, w: 96, h: defaultBlockH(type) }; }

export function makeBlock(type) {
  const base = { id: uid(), type, ...defaultLayout(type) };
  if (type === "text") return { ...base, text: "", align: "left", boxed: false, dialogueReady: false };
  if (type === "heading") return { ...base, text: "" };
  if (type === "image") return { ...base, imageKey: null, caption: "", fit: "cover" };
  if (type === "menuPortrait") {
    return { ...base, imageKey: null, caption: "", fit: "cover", extraImages: [] };
  }
  if (type === "skillIcon" || type === "itemIcon") {
    return { ...base, imageKey: null, caption: "", fit: "cover" };
  }
  if (type === "itemStats") {
    const bonuses = {};
    ATTR_FIELDS.forEach(([k]) => { bonuses[`bonus_${k}`] = 0; });
    COMBAT_STAT_FIELDS.forEach(([k]) => { bonuses[`bonus_${k}`] = 0; });
    return {
      ...base, itemSlot: "Accesorio", ...bonuses,
      teachesSkillId: null, apToMaster: 0, usableBy: "any",
      weaponType: null, armorType: null, element: null, price: 0, rarity: 1, setId: null,
      consumableEffect: { description: "", healHp: 0, healResource: 0, curesStatusId: null },
      recipes: [],
    };
  }
  if (type === "skillInfo") {
    return {
      ...base, skillType: "Física", effect: "", usableBy: "any", element: null, power: 10,
      calcAttackerId: null, calcTargetId: null, inflictsStatusId: null,
      targetShape: "single", targetSide: "enemies", targetCount: 2,
      prereqSkillId: null, pointCost: 1,
      animations: [],
    };
  }
  if (type === "charStats") {
    return {
      ...base,
      str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
      baseMaxHp: 100, baseMaxResource: 20, isMagical: false,
      nivel: 1, xpActual: 0,
    };
  }
  if (type === "members") return { ...base, entries: [] };
  if (type === "relations") return { ...base, entries: [] };
  if (type === "lootTable") return { ...base, entries: [] };
  if (type === "routine") return { ...base, slots: ROUTINE_PERIODS.map((p) => ({ period: p.key, location: "", activity: "" })) };
  if (type === "rumor") return { ...base, text: "", veracity: "parcial", revealTo: "", resolved: false };
  if (type === "threatLevel") return { ...base, level: 5, note: "" };
  if (type === "sceneBeats") return { ...base, beats: [] };
  if (type === "missionBranches") return { ...base, entries: [] };
  if (type === "storyState") return { ...base, text: "" };
  if (type === "causeEffect") return { ...base, causedById: null };
  if (type === "classSummary") return { ...base };
  if (type === "symbiontInfo") {
    const bonuses = {};
    ATTR_FIELDS.forEach(([k]) => { bonuses[`bonus_${k}`] = 0; });
    COMBAT_STAT_FIELDS.forEach(([k]) => { bonuses[`bonus_${k}`] = 0; });
    return {
      ...base, kind: "", origin: "", ...bonuses,
      passiveSkillId: null, activeSkillId: null,
      finalAttack: {
        name: "", description: "", skillType: "Física", element: null, power: 10,
        calcAttackerId: null, calcTargetId: null, inflictsStatusId: null,
        targetShape: "all", targetSide: "enemies", targetCount: 2,
      },
    };
  }
  if (type === "resistances") return { ...base, elementRes: {}, statusRes: {} };
  if (type === "dialogue") return { ...base, lines: [] };
  if (type === "encounter") return { ...base, enemies: [] };
  if (type === "shopInventory") return { ...base, entries: [] };
  if (type === "statusEffectInfo") return { ...base, kind: "debuff", linkedStatusKey: null, duration: "", stackable: false, cureNote: "", description: "" };
  if (type === "setInfo") return { ...base, description: "", bonuses: [] };
  if (type === "beatInfo") {
    return { ...base, chapterId: null, order: 1, description: "", characterIds: [], placeId: null, flags: [] };
  }
  if (type === "sceneInfo") {
    return { ...base, beatId: null, placeId: null, characterIds: [], entryCondition: "", lines: [], effects: [] };
  }
  if (type === "appearances") return { ...base };
  if (type === "expressionSprites" || type === "explorationSprites" || type === "combatSprites") return { ...base, sprites: [] };
  return base;
}

// Un "slot" de plantilla: layout + etiqueta, sin contenido.
export function makeSlot(type) {
  return { slotId: uid(), type, label: "", ...defaultLayout(type) };
}

// Coloca un item nuevo debajo de los existentes (apila en el lienzo).
export function bottomOf(items) {
  return items.reduce((m, it) => Math.max(m, (it.y || 0) + (it.h || defaultBlockH(it.type))), 0);
}

// Deriva bloques para páginas antiguas (que aún guardan content/content2) sin
// perder datos: se muestran como cuadros de texto y se persisten al primer cambio.
export function getPageBlocks(node) {
  const raw = Array.isArray(node.blocks) ? node.blocks : legacyDerivedBlocks(node);
  return withLayout(raw);
}

export function legacyDerivedBlocks(node) {
  const derived = [];
  if (node.content && node.content.trim())
    derived.push({ id: `legacy-main-${node.id}`, type: "text", w: "full", text: node.content, align: "left", boxed: false });
  if (node.content2 && node.content2.trim())
    derived.push({ id: `legacy-alt-${node.id}`, type: "text", w: "full", text: node.content2, align: "left", boxed: false });
  return derived;
}

// Da coordenadas de lienzo a bloques que aún no las tienen (flujo antiguo → pila
// vertical). full → ancho 96%, half → 47%. No pierde contenido.
export function withLayout(blocks) {
  let y = 0;
  return blocks.map((b) => {
    if (typeof b.x === "number" && typeof b.y === "number" && typeof b.w === "number" && typeof b.h === "number") {
      return b;
    }
    const w = b.w === "half" ? 47 : 96;
    const h = defaultBlockH(b.type);
    const laid = { ...b, x: 2, y, w, h };
    y += h + 12;
    return laid;
  });
}

// Texto que aporta un bloque a la búsqueda por contenido. Cada bloque con
// texto libre debe declararse aquí, o el buscador nunca lo va a encontrar.
export function blockSearchText(b) {
  if (b.type === "text" || b.type === "heading") return b.text || "";
  if (b.type === "rumor") return `${b.text || ""} ${b.revealTo || ""}`;
  if (b.type === "storyState") return b.text || "";
  if (b.type === "sceneBeats") return (b.beats || []).map((x) => x.text || "").join(" ");
  if (b.type === "missionBranches") return (b.entries || []).map((x) => x.label || "").join(" ");
  if (b.type === "dialogue") return (b.lines || []).map((x) => x.text || "").join(" ");
  if (b.type === "beatInfo") return `${b.description || ""} ${(b.flags || []).map((x) => x.text || "").join(" ")}`;
  if (b.type === "sceneInfo") {
    return [b.entryCondition || "", (b.lines || []).map((x) => x.text || "").join(" "), (b.effects || []).map((x) => x.text || "").join(" ")].join(" ");
  }
  return "";
}

/* ---------- SEED DATA ---------- */
// Apila bloques uno debajo del otro en el lienzo (misma cuenta que usa la app
// al agregar un bloque desde la UI, ver bottomOf), para que las páginas de
// ejemplo no arranquen con los recuadros superpuestos en (0,0).
export function stackBlocks(blocks) {
  let y = 0;
  return blocks.map((b) => {
    const laid = { ...b, y };
    y += (b.h || defaultBlockH(b.type)) + 12;
    return laid;
  });
}

// Todo tipo de bloque que guarda su imagen bajo cover-image:blk-<id> (el
// recuadro "Imagen" y los tres iconos/retratos con tag propio), para saber
// cuándo limpiar la imagen guardada al borrar el bloque.
export function isSingleImageBlockType(type) {
  return type === "image" || type === "menuPortrait" || type === "skillIcon" || type === "itemIcon";
}
