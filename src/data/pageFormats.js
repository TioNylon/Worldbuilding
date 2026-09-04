// Formatos editoriales por tipo. No guardan contenido: definen la jerarquía
// visual, las secciones recomendadas y qué datos quedan como detalle técnico.
export const PAGE_FORMATS = {
  character: { code: "PRSN", title: "Ficha de personaje", description: "Identidad, arco, relaciones y presencia en la historia; el sistema de combate queda en segundo plano.", defaults: ["text", "relations", "appearances", "charStats", "resistances", "menuPortrait"], primary: ["text", "relations", "storyState", "appearances"], technical: ["charStats", "resistances"], media: ["menuPortrait", "expressionSprites", "explorationSprites", "combatSprites", "image"] },
  npc: { code: "NPC", title: "Ficha de PNJ", description: "Función narrativa, voz, rutina y vínculos útiles para escribir sus apariciones.", defaults: ["text", "relations", "dialogue"], primary: ["text", "relations", "dialogue", "routine", "rumor"], technical: ["charStats", "resistances"], media: ["menuPortrait", "expressionSprites", "image"] },
  place: { code: "LOCI", title: "Ficha de lugar", description: "Atmósfera, función dramática, escenas relacionadas y referencia visual.", defaults: ["text", "appearances", "image"], primary: ["text", "appearances", "rumor"], technical: [], media: ["image"] },
  organization: { code: "FACT", title: "Ficha de facción", description: "Propósito, estructura, miembros, recursos y conflictos.", defaults: ["text", "members", "relations"], primary: ["text", "members", "relations", "rumor"], technical: [], media: ["image"] },
  chapter: { code: "CHPT", title: "Capítulo", description: "Resumen dramático y secuencias ordenadas; las escenas conservan el guion detallado.", defaults: ["text"], primary: ["text", "heading"], technical: [], media: ["image"] },
  beat: { code: "BEAT", title: "Secuencia narrativa", description: "Un cambio dramático concreto dentro del capítulo, con personajes, lugar y resultado.", defaults: ["beatInfo"], primary: ["beatInfo", "text"], technical: [], media: ["image"] },
  scene: { code: "SCNE", title: "Escena o segmento", description: "Guion, participantes, localización y notas de ejecución en una única ficha continua.", defaults: ["sceneInfo"], primary: ["sceneInfo", "text", "dialogue", "encounter"], technical: [], media: ["image"] },
  event: { code: "EVNT", title: "Acontecimiento del mundo", description: "Hecho histórico para la cronología; no reemplaza una escena del guion.", defaults: ["text"], primary: ["text", "rumor"], technical: ["encounter"], media: ["image"] },
  mission: { code: "OBJ", title: "Objetivo jugable", description: "Meta, condiciones y recompensa. Las variantes opcionales se anotan como texto, no como árbol de ramas.", defaults: ["text"], primary: ["text", "encounter"], technical: [], media: ["image"] },
  enemy: { code: "ENMY", title: "Ficha de enemigo", description: "Patrón, señal previa, respuesta esperada y función del encuentro.", defaults: ["text", "charStats", "resistances", "lootTable"], primary: ["text"], technical: ["charStats", "resistances", "lootTable"], media: ["image"] },
  boss: { code: "BOSS", title: "Ficha de jefe", description: "Idea central, fases, patrones y propósito narrativo del combate.", defaults: ["text", "charStats", "resistances", "lootTable"], primary: ["text", "heading"], technical: ["charStats", "resistances", "lootTable"], media: ["image"] },
  object: { code: "ITEM", title: "Ficha de objeto", description: "Función narrativa y uso; valores de inventario separados de la descripción.", defaults: ["text", "itemStats", "itemIcon"], primary: ["text", "rumor"], technical: ["itemStats"], media: ["itemIcon", "image"] },
  skill: { code: "SKIL", title: "Ficha de habilidad", description: "Efecto legible primero y parámetros de combate después.", defaults: ["text", "skillInfo", "skillIcon"], primary: ["text"], technical: ["skillInfo"], media: ["skillIcon", "image"] },
  class: { code: "CLSS", title: "Ficha de clase", description: "Fantasía de juego, rol y progresión reunidos en una hoja de estado.", defaults: ["text", "classSummary"], primary: ["text"], technical: ["classSummary"], media: ["image"] },
  symbiont: { code: "SYMB", title: "Ficha de simbionte", description: "Origen, vínculo narrativo y capacidades especiales.", defaults: ["text", "symbiontInfo"], primary: ["text", "rumor"], technical: ["symbiontInfo"], media: ["image"] },
  ship: { code: "SHIP", title: "Ficha de nave", description: "Identidad, función, espacios internos y participación en la historia.", defaults: ["text", "image"], primary: ["text"], technical: [], media: ["image"] },
  pet: { code: "ALLY", title: "Ficha de criatura aliada", description: "Personalidad, vínculo, apariciones y capacidades relevantes.", defaults: ["text", "relations", "appearances"], primary: ["text", "relations", "appearances"], technical: [], media: ["image"] },
  shop: { code: "SHOP", title: "Ficha de tienda", description: "Identidad del comercio, ubicación e inventario disponible.", defaults: ["text", "shopInventory"], primary: ["text"], technical: ["shopInventory"], media: ["image"] },
  statusEffect: { code: "STAT", title: "Estado alterado", description: "Lectura rápida del efecto, duración, acumulación y cura.", defaults: ["statusEffectInfo"], primary: ["text"], technical: ["statusEffectInfo"], media: ["image"] },
  itemSet: { code: "SETS", title: "Conjunto de equipo", description: "Tema del conjunto, piezas y bonificaciones por combinación.", defaults: ["text", "setInfo"], primary: ["text"], technical: ["setInfo"], media: ["image"] },
};

export const FALLBACK_PAGE_FORMAT = {
  code: "NOTE", title: "Nota de archivo", description: "Página libre para información que todavía no necesita una categoría.",
  defaults: ["text"], primary: ["text", "heading", "rumor"], technical: [], media: ["image"],
};

export function pageFormatFor(category) {
  return PAGE_FORMATS[category] || FALLBACK_PAGE_FORMAT;
}

export function sectionTier(format, type) {
  if (format.technical.includes(type)) return "system";
  if (format.media.includes(type)) return "media";
  return "story";
}

export function sectionSpan(type) {
  return ["charStats", "resistances", "menuPortrait", "itemIcon", "skillIcon", "image", "threatLevel"].includes(type) ? "half" : "full";
}

export function formatOrder(format, type) {
  const order = [...format.primary, ...format.technical, ...format.media];
  const index = order.indexOf(type);
  return index === -1 ? order.length + 1 : index;
}
