import { makeBlock, stackBlocks } from "../utils/blocks.js";
import { uid } from "../utils/misc.js";

export const UNASSIGNED_FOLDER = "Sin asignar";

// Un mundo nuevo ya no arranca completamente vacío: trae un personaje, un
// lugar y un objeto de ejemplo (borrables) que muestran cómo se usan los
// bloques de cada tipo de entrada y el marcado de texto enriquecido.
export const seedNodes = () => {
  const worldId = uid();
  const charFolderId = uid(); const charSubFolderId = uid(); const charPageId = uid();
  const placeFolderId = uid(); const placePageId = uid();
  const objectFolderId = uid(); const objectPageId = uid();
  return [
    { id: worldId, parentId: null, order: 0, type: "map", name: "Mapa del Mundo", content: "", content2: "", mapImageKey: null, pins: [] },

    { id: charFolderId, parentId: null, order: 1, type: "folder", name: "Personajes", content: "", content2: "" },
    { id: charSubFolderId, parentId: charFolderId, order: 0, type: "folder", name: "Casa Real", content: "", content2: "" },
    {
      id: charPageId, parentId: charSubFolderId, order: 0, type: "page", name: "Reina Ysolde",
      content: "", content2: "", category: "character",
      blocks: stackBlocks([
        {
          ...makeBlock("text"),
          text: "La gobernante de [[Mapa del Mundo]] desde la caída del último dragón.\n\n" +
            "Esta página es un ejemplo — podés editarla o borrarla. Podés usar **negritas**, //cursivas//, " +
            "__subrayado__ y {#e07a5f|texto con color}, y enlazar otras páginas escribiendo su nombre exacto " +
            "entre corchetes dobles, como en [[Puerto de Ysolde]].",
        },
        { ...makeBlock("charStats"), str: 14, dex: 12, con: 13, int: 10, wis: 11, cha: 15, baseMaxHp: 120, baseMaxResource: 30, nivel: 5 },
        { ...makeBlock("resistances"), elementRes: { fuego: "resiste" }, statusRes: { paralizado: "inmune" } },
      ]),
    },

    { id: placeFolderId, parentId: null, order: 2, type: "folder", name: "Lugares", content: "", content2: "" },
    {
      id: placePageId, parentId: placeFolderId, order: 0, type: "page", name: "Puerto de Ysolde",
      content: "", content2: "", category: "place",
      blocks: stackBlocks([
        {
          ...makeBlock("text"),
          text: "El puerto principal del reino, nombrado en honor a [[Reina Ysolde]].\n\n" +
            "Cada tipo de entrada (Personaje, Lugar, Objeto, Habilidad...) tiene sus propios bloques disponibles " +
            "— abrí \"+ Añadir bloque\" en el lienzo para ver cuáles hay para Lugar.",
        },
      ]),
    },

    { id: objectFolderId, parentId: null, order: 3, type: "folder", name: "Objetos", content: "", content2: "" },
    {
      id: objectPageId, parentId: objectFolderId, order: 0, type: "page", name: "Espada de la Reina",
      content: "", content2: "", category: "object",
      blocks: stackBlocks([
        {
          ...makeBlock("text"),
          text: "Un arma ceremonial forjada para [[Reina Ysolde]]. El bloque de Estadísticas de objeto de acá abajo " +
            "es el mismo que usan armas, armaduras y consumibles.",
        },
        { ...makeBlock("itemStats"), itemSlot: "Mano Principal", weaponType: "cuerpo-a-cuerpo", price: 250, rarity: 3, bonus_str: 4, bonus_atkFisico: 12 },
      ]),
    },
  ];
};

// Elementos de partida (clásicos de FF); el usuario puede agregar o quitar
// cualquiera desde el selector de elemento en un bloque de Habilidad.
export const DEFAULT_ELEMENTS = [
  { key: "fuego", label: "Fuego", color: "#e07a5f" },
  { key: "hielo", label: "Hielo", color: "#7aa5d6" },
  { key: "rayo", label: "Rayo", color: "#e9c46a" },
  { key: "tierra", label: "Tierra", color: "#a3d977" },
  { key: "viento", label: "Viento", color: "#81b29a" },
  { key: "agua", label: "Agua", color: "#5089d3" },
  { key: "luz", label: "Luz", color: "#f4e9c1" },
  { key: "oscuridad", label: "Oscuridad", color: "#7c8aa3" },
];

export const DEFAULT_ROLES = [
  { key: "tanque", label: "Tanque", color: "#7aa5d6" },
  { key: "dps", label: "DPS", color: "#e07a5f" },
  { key: "soporte", label: "Soporte", color: "#a3d977" },
  { key: "sanador", label: "Sanador", color: "#81b29a" },
  { key: "control", label: "Control", color: "#c583d6" },
];

export const DEFAULT_WEAPON_TYPES = [
  { key: "cuerpo-a-cuerpo", label: "Cuerpo a cuerpo", color: "#e07a5f" },
  { key: "corta-distancia", label: "Corta distancia", color: "#e9c46a" },
  { key: "media-distancia", label: "Media distancia", color: "#7aa5d6" },
  { key: "larga-distancia", label: "Larga distancia", color: "#5089d3" },
];

export const DEFAULT_ARMOR_TYPES = [
  { key: "ligera", label: "Ligera", color: "#a3d977" },
  { key: "media", label: "Media", color: "#e9c46a" },
  { key: "pesada", label: "Pesada", color: "#9b4d4d" },
];

// Estados alterados clásicos de FF; igual que elementos/roles/tipos, el usuario
// puede agregar o quitar cualquiera desde el bloque de Resistencias y debilidades.
export const DEFAULT_STATUS_EFFECTS = [
  { key: "veneno", label: "Veneno", color: "#7a9b3f" },
  { key: "quemado", label: "Quemado", color: "#e07a5f" },
  { key: "congelado", label: "Congelado", color: "#7aa5d6" },
  { key: "paralizado", label: "Paralizado", color: "#e9c46a" },
  { key: "dormido", label: "Dormido", color: "#c583d6" },
  { key: "confundido", label: "Confundido", color: "#9b4d4d" },
  { key: "silenciado", label: "Silenciado", color: "#8a8298" },
  { key: "cegado", label: "Cegado", color: "#5089d3" },
];
