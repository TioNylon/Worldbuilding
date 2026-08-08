import { Skull, Sword, Flame, Ghost, FileText, Map as MapIcon, Link2, ScrollText, ImageIcon, Clock, ArrowLeftRight, User, Users, Package, Landmark, CalendarDays, Target, Type, CircleAlert, Sparkles, PawPrint, UserRound, Rocket, Compass, BookOpen, KeyRound, Coins, Shield, GitBranch, ShieldCheck, MessageSquare, Zap, Layers } from "lucide-react";

/* ---------- ENTRY TYPES (categorías de página) ---------- */
export const ENTRY_TYPES = {
  character: { label: "Personaje", icon: User, color: "#7aa5d6" },
  organization: { label: "Organización", icon: Users, color: "#c583d6" },
  object: { label: "Objeto", icon: Package, color: "#e9c46a" },
  place: { label: "Lugar", icon: Landmark, color: "#81b29a" },
  event: { label: "Acontecimiento", icon: CalendarDays, color: "#e07a5f" },
  mission: { label: "Misión", icon: Target, color: "#b04848" },
  skill: { label: "Habilidad", icon: Sparkles, color: "#f4a950" },
  pet: { label: "Mascota", icon: PawPrint, color: "#a3d977" },
  npc: { label: "NPC", icon: UserRound, color: "#8aa8c9" },
  enemy: { label: "Enemigo", icon: Skull, color: "#9b4d4d" },
  boss: { label: "Jefe", icon: Flame, color: "#d9622b" },
  ship: { label: "Nave", icon: Rocket, color: "#5089d3" },
  class: { label: "Clase", icon: Shield, color: "#a67c52" },
  symbiont: { label: "Simbionte", icon: Ghost, color: "#7c5fb5" },
  chapter: { label: "Capítulo", icon: Compass, color: "#c9a25a" },
  shop: { label: "Tienda", icon: Coins, color: "#6b9b6b" },
  statusEffect: { label: "Estado alterado", icon: Zap, color: "#5cc9c0" },
  itemSet: { label: "Set de equipo", icon: Layers, color: "#d68f4c" },
  beat: { label: "Beat", icon: ScrollText, color: "#8f6fd1" },
  scene: { label: "Escena", icon: MessageSquare, color: "#d97ba0" },
};

export const ENTRY_TYPE_KEYS = Object.keys(ENTRY_TYPES);

/* ---------- BLOQUES DE PÁGINA ---------- */
// Herramientas del panel derecho (arrastrar hacia la página o clic para añadir).
export const BLOCK_TOOLS = [
  { type: "heading", label: "Título", makeIcon: () => Type },
  { type: "text", label: "Cuadro de texto", makeIcon: () => FileText },
  { type: "image", label: "Imagen", makeIcon: () => ImageIcon },
  { type: "rumor", label: "Rumor/secreto", makeIcon: () => KeyRound },
];

// Herramientas extra que solo aparecen en la paleta según la categoría de la
// entrada (ej. "Estadísticas de objeto" solo en páginas de tipo Objeto).
export const CATEGORY_EXTRA_TOOL = {
  object: [
    { type: "itemStats", label: "Estadísticas de objeto", makeIcon: () => Package },
    { type: "itemIcon", label: "Icono (menú/inventario)", makeIcon: () => ImageIcon },
  ],
  skill: [
    { type: "skillInfo", label: "Info de habilidad", makeIcon: () => Sparkles },
    { type: "skillIcon", label: "Icono de habilidad", makeIcon: () => ImageIcon },
  ],
  character: [
    { type: "charStats", label: "Estadísticas de personaje", makeIcon: () => User },
    { type: "resistances", label: "Resistencias y debilidades", makeIcon: () => ShieldCheck },
    { type: "relations", label: "Relaciones", makeIcon: () => Link2 },
    { type: "storyState", label: "Estado narrativo", makeIcon: () => BookOpen },
    { type: "appearances", label: "Apariciones en el guion", makeIcon: () => ScrollText },
    { type: "menuPortrait", label: "Retrato de menú", makeIcon: () => ImageIcon },
    { type: "expressionSprites", label: "Expresiones (diálogo)", makeIcon: () => MessageSquare },
    { type: "explorationSprites", label: "Sprites de exploración", makeIcon: () => MapIcon },
    { type: "combatSprites", label: "Sprites de combate", makeIcon: () => Sword },
  ],
  place: [{ type: "appearances", label: "Apariciones en el guion", makeIcon: () => ScrollText }],
  organization: [{ type: "members", label: "Miembros", makeIcon: () => Users }],
  npc: [
    { type: "routine", label: "Rutina horaria", makeIcon: () => Clock },
    { type: "charStats", label: "Estadísticas de personaje", makeIcon: () => User },
    { type: "resistances", label: "Resistencias y debilidades", makeIcon: () => ShieldCheck },
    { type: "dialogue", label: "Diálogo", makeIcon: () => MessageSquare },
    { type: "menuPortrait", label: "Retrato de menú", makeIcon: () => ImageIcon },
    { type: "expressionSprites", label: "Expresiones (diálogo)", makeIcon: () => MessageSquare },
    { type: "explorationSprites", label: "Sprites de exploración", makeIcon: () => MapIcon },
    { type: "combatSprites", label: "Sprites de combate", makeIcon: () => Sword },
  ],
  enemy: [
    { type: "lootTable", label: "Tabla de botín", makeIcon: () => Coins },
    { type: "threatLevel", label: "Nivel de amenaza", makeIcon: () => CircleAlert },
    { type: "charStats", label: "Estadísticas de personaje", makeIcon: () => User },
    { type: "resistances", label: "Resistencias y debilidades", makeIcon: () => ShieldCheck },
  ],
  boss: [
    { type: "lootTable", label: "Tabla de botín", makeIcon: () => Coins },
    { type: "threatLevel", label: "Nivel de amenaza", makeIcon: () => CircleAlert },
    { type: "charStats", label: "Estadísticas de personaje", makeIcon: () => User },
    { type: "resistances", label: "Resistencias y debilidades", makeIcon: () => ShieldCheck },
  ],
  event: [
    { type: "sceneBeats", label: "Escena (pasos)", makeIcon: () => ScrollText },
    { type: "causeEffect", label: "Causa y efecto", makeIcon: () => ArrowLeftRight },
    { type: "dialogue", label: "Diálogo", makeIcon: () => MessageSquare },
    { type: "encounter", label: "Encuentro", makeIcon: () => Skull },
  ],
  mission: [
    { type: "missionBranches", label: "Ramificaciones", makeIcon: () => GitBranch },
    { type: "encounter", label: "Encuentro", makeIcon: () => Skull },
  ],
  class: [{ type: "classSummary", label: "Habilidades y objetos de la clase", makeIcon: () => Shield }],
  symbiont: [{ type: "symbiontInfo", label: "Información de simbionte", makeIcon: () => Ghost }],
  shop: [{ type: "shopInventory", label: "Inventario de la tienda", makeIcon: () => Coins }],
  statusEffect: [{ type: "statusEffectInfo", label: "Información de estado alterado", makeIcon: () => Zap }],
  itemSet: [{ type: "setInfo", label: "Información del set", makeIcon: () => Layers }],
  beat: [{ type: "beatInfo", label: "Información del beat", makeIcon: () => ScrollText }],
  scene: [{ type: "sceneInfo", label: "Guion de la escena", makeIcon: () => MessageSquare }],
};

// Tipos de relación entre personajes, cada uno con su color para el árbol de relaciones.
export const RELATION_TYPES = [
  { key: "aliado", label: "Aliado", color: "#45d3a3" },
  { key: "enemigo", label: "Enemigo", color: "#b04848" },
  { key: "familiar", label: "Familiar", color: "#5089d3" },
  { key: "mentor", label: "Mentor/Aprendiz", color: "#e9c46a" },
  { key: "rival", label: "Rival", color: "#e07a5f" },
  { key: "romance", label: "Romance", color: "#c583d6" },
  { key: "contacto", label: "Contacto", color: "#7c8aa3" },
  { key: "otro", label: "Otro", color: "#8a8298" },
];

// Franjas horarias fijas para la rutina de un NPC.
export const ROUTINE_PERIODS = [
  { key: "manana", label: "Mañana" },
  { key: "tarde", label: "Tarde" },
  { key: "noche", label: "Noche" },
  { key: "madrugada", label: "Madrugada" },
];

// Nivel de veracidad de un bloque de rumor/secreto.
export const VERACITY_OPTIONS = [
  { key: "verdadero", label: "Verdadero", color: "#45d3a3" },
  { key: "falso", label: "Falso", color: "#b04848" },
  { key: "parcial", label: "Parcial", color: "#e9c46a" },
];
