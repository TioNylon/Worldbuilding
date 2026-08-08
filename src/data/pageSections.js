import { Skull, Link2, Brain, Columns, User, Package, LayoutDashboard, CircleAlert, Shield, Zap, Layers, Download } from "lucide-react";

// Bloques que necesita cada ficha del Bestiario; se crean solos la primera vez
// que se abre un Enemigo/Jefe que todavía no los tiene (por ejemplo, uno viejo
// creado antes de que existiera este bloque, o desde el catálogo genérico).
export const BESTIARY_BLOCK_TYPES = ["threatLevel", "charStats", "resistances", "lootTable"];

// Libro de historia: pestañas superiores por Capítulo (igual que Clases), y
// dentro dos hojas por página que listan Lugares/Acontecimientos (página 1) y
// Misiones/NPC (página 2) de ese capítulo — cada listado usa ChapterEntryList.
// Tocar una entrada abre su página real (con Causa y efecto, relaciones, etc.);
// el libro no duplica esa información, sólo ayuda a organizarla por capítulo.
// Guion (antes su propia sección del Gran Libro) vive acá adentro: un Beat
// apunta a un Capítulo (beatInfo.chapterId), así que separarlo en otro libro
// solo duplicaba la navegación para llegar a lo mismo. La tercera página del
// capítulo lista sus Beats (ordenados) y, del lado derecho, la ficha del Beat
// elegido con sus Escenas — editar el guion completo de una Escena se sigue
// haciendo en su propia página, como ya hacía ScriptBookView.
export const CHAPTER_BOOK_PAGES = ["lugares", "misiones", "guion"];

// Libro de personajes: pestañas superiores por Personaje (igual que Clases/
// Bestiario), y tres páginas que consolidan lo que ya está repartido en su
// página real — Ficha (clases/simbiontes + estadísticas), Resistencias y
// relaciones, y Progresión + Habilidades únicas — reutilizando los bloques y
// pickers que ya existen en vez de duplicar su lógica de edición.
export const CHARACTER_BOOK_PAGES = ["ficha", "resistencias", "retratos", "progresion"];

export const CHARACTER_PORTRAIT_BLOCK_TYPES = ["menuPortrait", "expressionSprites", "explorationSprites", "combatSprites"];

// Índice del Gran Libro: qué otro libro abre cada sección, con un ícono y una
// descripción corta de qué información consolida.
export const GENERAL_BOOK_SECTIONS = [
  { key: "characters", label: "Personajes", icon: User, color: "#7aa5d6", desc: "Clases, estadísticas, resistencias, relaciones y progresión de cada personaje." },
  { key: "classes", label: "Clases", icon: Shield, color: "#a67c52", desc: "Roles, subclases, bonificaciones y habilidades de cada clase." },
  { key: "items", label: "Objetos", icon: Package, color: "#e9c46a", desc: "Armas, armaduras y objetos, filtrables por posición y clasificación." },
  { key: "bestiary", label: "Bestiario", icon: Skull, color: "#9b4d4d", desc: "Amenaza, estadísticas, debilidades y botín de enemigos y jefes." },
  { key: "statusEffects", label: "Estados alterados", icon: Zap, color: "#5cc9c0", desc: "Buffs y debuffs: duración, si se acumulan y cómo se curan (a desarrollar)." },
  { key: "itemSets", label: "Sets de equipo", icon: Layers, color: "#d68f4c", desc: "Bonos por piezas equipadas (2, 4...), con habilidad especial opcional." },
];

// Índice de la Bitácora: qué sección abre cada tarjeta. A diferencia del Gran
// Libro, ninguna de estas 4 secciones es "un libro" en sí misma (son una
// tabla con pestañas, un mapa de vínculos, o un listado simple), así que al
// elegir una se muestra tal cual, a pantalla completa, bajo una fila con el
// botón de volver — el mismo patrón de vuelta que el Gran Libro, pero sin
// forzar cada sección dentro de dos hojas de libro.
export const HANDBOOK_SECTIONS = [
  { key: "catalogs", label: "Catálogos", icon: Package, color: "#e9c46a", desc: "Resumen y balance de objetos, habilidades, personajes, clases, simbiontes y progresión." },
  { key: "brain", label: "Cerebro", icon: Brain, color: "#c583d6", desc: "Mapa global de vínculos entre todas las páginas del mundo." },
  { key: "looseEnds", label: "Cabos sueltos", icon: CircleAlert, color: "#e07a5f", desc: "Misiones sin resolver y rumores/secretos pendientes." },
  { key: "relations", label: "Árbol de relaciones", icon: Link2, color: "#5089d3", desc: "Relaciones entre personajes, en un mapa aparte del Cerebro." },
];

// Índice de Herramientas: mismo patrón que Gran Libro/Bitácora, para Formatos
// por tipo y Comparar páginas — ninguna es "un libro" en sí misma, así que al
// elegir una se muestra a pantalla completa bajo la fila de volver.
export const TOOLS_SECTIONS = [
  { key: "templates", label: "Formatos por tipo", icon: LayoutDashboard, color: "#5089d3", desc: "Diseña la maqueta de cada tipo de entrada; se aplica a las existentes y nuevas." },
  { key: "compare", label: "Comparar páginas", icon: Columns, color: "#81b29a", desc: "Mirá dos páginas lado a lado para revisarlas o compararlas." },
  { key: "backup", label: "Respaldo y exportación", icon: Download, color: "#e07a5f", desc: "Descargá tu mundo como archivo de respaldo, o volvé a la última versión guardada." },
];

// Tipo de cada línea del guion de una Escena.
export const SCRIPT_LINE_TYPES = [
  { key: "dialogo", label: "Diálogo", color: "#7aa5d6" },
  { key: "acotacion", label: "Acotación", color: "#a3d977" },
  { key: "sfx", label: "SFX", color: "#e9c46a" },
  { key: "trigger", label: "Trigger", color: "#b04848" },
];
