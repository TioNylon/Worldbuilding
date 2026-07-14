import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import {
  Castle, Skull, Sword, TreePine, Mountain, Anchor, Flame, Gem, Tent,
  Crown, MapPin, Ghost, Building2, Waves, Plus, Folder, FolderOpen,
  FileText, Map as MapIcon, ChevronRight, ChevronDown, Search, X,
  Upload, Trash2, Link2, Save, ScrollText, PanelLeftClose,
  PanelLeftOpen, ImageIcon, Clock, Share2, Brain, Settings,
  Bold, Italic, Underline, Palette, MoveVertical, Square, Circle,
  ArrowLeftRight, ArrowUpDown, Columns, Pencil,
  User, Users, Package, Landmark, CalendarDays, Target,
  Type, AlignLeft, AlignCenter, GripVertical, ArrowUp, ArrowDown,
  LayoutDashboard, Unlink, CircleAlert,
  Sparkles, PawPrint, UserRound, Rocket,
} from "lucide-react";

/* ---------- ICON LIBRARY ---------- */
const ICONS = {
  castle: Castle, skull: Skull, sword: Sword, tree: TreePine, mountain: Mountain,
  anchor: Anchor, flame: Flame, gem: Gem, tent: Tent, crown: Crown,
  pin: MapPin, ghost: Ghost, building: Building2, waves: Waves,
};
const ICON_KEYS = Object.keys(ICONS);

/* ---------- ENTRY TYPES (categorías de página) ---------- */
const ENTRY_TYPES = {
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
};
const ENTRY_TYPE_KEYS = Object.keys(ENTRY_TYPES);

/* ---------- BLOQUES DE PÁGINA ---------- */
// Herramientas del panel derecho (arrastrar hacia la página o clic para añadir).
const BLOCK_TOOLS = [
  { type: "heading", label: "Título", makeIcon: () => Type },
  { type: "text", label: "Cuadro de texto", makeIcon: () => FileText },
  { type: "image", label: "Imagen", makeIcon: () => ImageIcon },
];
// Herramienta extra que solo aparece en la paleta según la categoría de la
// entrada (ej. "Estadísticas de objeto" solo en páginas de tipo Objeto).
const CATEGORY_EXTRA_TOOL = {
  object: { type: "itemStats", label: "Estadísticas de objeto", makeIcon: () => Package },
};

// Los 6 atributos base D&D, reutilizados por bloques de Objeto/Personaje.
const ATTR_FIELDS = [
  ["str", "Fuerza"], ["dex", "Destreza"], ["con", "Constitución"],
  ["int", "Inteligencia"], ["wis", "Sabiduría"], ["cha", "Carisma"],
];
// Las 10 estadísticas de combate FFIX, reutilizadas por Objeto/Personaje.
const COMBAT_STAT_FIELDS = [
  ["maxHp", "PV"], ["maxResource", "Recurso (SP/MP)"],
  ["atkFisico", "Ataque Físico"], ["atkMagico", "Ataque Mágico"],
  ["defFisica", "Defensa Física"], ["defMagica", "Defensa Mágica"],
  ["velAtaque", "Vel. Ataque"], ["velReaccion", "Vel. Reacción"],
  ["resistEstados", "Resist. Estados"], ["suerte", "Suerte"],
];
const ITEM_SLOTS = ["Cabeza", "Pecho", "Piernas", "Accesorio", "Mano Principal", "Mano Secundaria", "Consumible", "Objeto clave", "Otro"];

// Alto por defecto (px) de cada tipo en el lienzo libre. Múltiplos de
// GRID_PX (ver CanvasEditor) para que nazcan ya calzados con la cuadrícula.
function defaultBlockH(type) {
  if (type === "heading") return 60;
  if (type === "image") return 240;
  if (type === "itemStats") return 480;
  return 160;
}
// Layout de lienzo: x,w en % del ancho; y,h en px. El alto crece hacia abajo.
function defaultLayout(type) { return { x: 2, y: 0, w: 96, h: defaultBlockH(type) }; }

function makeBlock(type) {
  const base = { id: uid(), type, ...defaultLayout(type) };
  if (type === "text") return { ...base, text: "", align: "left", boxed: false };
  if (type === "heading") return { ...base, text: "" };
  if (type === "image") return { ...base, imageKey: null, caption: "", fit: "cover" };
  if (type === "itemStats") {
    const bonuses = {};
    ATTR_FIELDS.forEach(([k]) => { bonuses[`bonus_${k}`] = 0; });
    COMBAT_STAT_FIELDS.forEach(([k]) => { bonuses[`bonus_${k}`] = 0; });
    return {
      ...base, itemSlot: "Accesorio", ...bonuses,
      teachesSkillId: null, apToMaster: 0, usableBy: "any",
    };
  }
  return base;
}

// Un "slot" de plantilla: layout + etiqueta, sin contenido.
function makeSlot(type) {
  return { slotId: uid(), type, label: "", ...defaultLayout(type) };
}

// Coloca un item nuevo debajo de los existentes (apila en el lienzo).
function bottomOf(items) {
  return items.reduce((m, it) => Math.max(m, (it.y || 0) + (it.h || defaultBlockH(it.type))), 0);
}
// Deriva bloques para páginas antiguas (que aún guardan content/content2) sin
// perder datos: se muestran como cuadros de texto y se persisten al primer cambio.
function getPageBlocks(node) {
  const raw = Array.isArray(node.blocks) ? node.blocks : legacyDerivedBlocks(node);
  return withLayout(raw);
}
function legacyDerivedBlocks(node) {
  const derived = [];
  if (node.content && node.content.trim())
    derived.push({ id: `legacy-main-${node.id}`, type: "text", w: "full", text: node.content, align: "left", boxed: false });
  if (node.content2 && node.content2.trim())
    derived.push({ id: `legacy-alt-${node.id}`, type: "text", w: "full", text: node.content2, align: "left", boxed: false });
  return derived;
}
// Da coordenadas de lienzo a bloques que aún no las tienen (flujo antiguo → pila
// vertical). full → ancho 96%, half → 47%. No pierde contenido.
function withLayout(blocks) {
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

// Texto plano combinado de una entrada (bloques nuevos o content/content2 antiguos).
function nodeAllText(node) {
  if (Array.isArray(node.blocks)) {
    return node.blocks.filter((b) => b.type === "text" || b.type === "heading").map((b) => b.text || "").join("\n");
  }
  return [node.content, node.content2].filter(Boolean).join("\n");
}
// Quita el marcado enriquecido para previsualizaciones.
function stripMarkup(txt) {
  return (txt || "")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\/\/([^/]+)\/\//g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\{#[0-9a-fA-F]{3,8}\|([^}]*)\}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
function pageSnippet(node, max = 120) {
  const txt = stripMarkup(nodeAllText(node));
  return txt.length > max ? txt.slice(0, max).trimEnd() + "…" : txt;
}
function pageHasDescription(node) { return stripMarkup(nodeAllText(node)).length > 0; }

const BUBBLE_COLORS = ["#b8860b", "#7a4fb5", "#3a8a6e", "#b04848", "#3a6ea5", "#a55d2e"];
const EDGE_COLORS = ["#8a8298", "#b8860b", "#7a4fb5", "#3a8a6e", "#b04848", "#3a6ea5", "#c9bfa0"];
const TEXT_COLORS = ["#e9c46a", "#e07a5f", "#81b29a", "#7aa5d6", "#c583d6", "#d6d67a"];
const SHAPE_COLORS = ["#b8860b", "#7a4fb5", "#3a8a6e", "#b04848", "#3a6ea5", "#8a8298"];

const UNASSIGNED_FOLDER = "Sin asignar";

/* ---------- HELPERS ---------- */
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function findNode(nodes, id) { return nodes.find((n) => n.id === id); }
function childrenOf(nodes, parentId) {
  return nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
}
function pathTo(nodes, id) {
  const path = [];
  let cur = findNode(nodes, id);
  while (cur) {
    path.unshift(cur);
    cur = cur.parentId ? findNode(nodes, cur.parentId) : null;
  }
  return path;
}
function descendantIds(nodes, id) {
  const out = [id];
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop();
    nodes.filter((n) => n.parentId === cur).forEach((c) => { out.push(c.id); stack.push(c.id); });
  }
  return out;
}
function iconForType(type, isOpen) {
  if (type === "folder") return isOpen ? FolderOpen : Folder;
  if (type === "map") return MapIcon;
  if (type === "timeline") return Clock;
  if (type === "board") return Share2;
  return FileText;
}
function iconForNode(node, isOpen) {
  if (node.type === "page" && ENTRY_TYPES[node.category]) return ENTRY_TYPES[node.category].icon;
  return iconForType(node.type, isOpen);
}
function colorForNode(node) {
  if (node.type === "page" && ENTRY_TYPES[node.category]) return ENTRY_TYPES[node.category].color;
  return "var(--accent)";
}
function nextOrder(nodes, parentId) {
  const kids = nodes.filter((n) => n.parentId === parentId);
  return kids.length ? Math.max(...kids.map((k) => k.order ?? 0)) + 1 : 0;
}
function extractWikiNames(text) {
  if (!text) return [];
  const out = [];
  const re = /\[\[([^\]]+)\]\]/g;
  let m;
  while ((m = re.exec(text))) out.push(m[1].trim());
  return out;
}

/* ---------- RESPONSIVE HOOK ---------- */
function useIsMobile() {
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

/* ---------- DEFAULT THEME ---------- */
const DEFAULT_THEME = {
  bg: "#161a24", panel: "#1a1f2e", panel2: "#22273a",
  border: "#2c3144", accent: "#b8860b", text: "#e9dfc0", muted: "#8a7f63",
  radius: 10,
};

/* Temas predeterminados (paletas + redondez). El usuario puede partir de uno
   y luego ajustar colores y forma a su gusto. */
const THEME_PRESETS = [
  { name: "Pergamino", theme: { ...DEFAULT_THEME } },
  { name: "Lavanda pastel", theme: { bg: "#f4f1fa", panel: "#ffffff", panel2: "#efe9f8", border: "#e3ddee", accent: "#a877d4", text: "#463f57", muted: "#9a90ad", radius: 18 } },
  { name: "Menta pastel", theme: { bg: "#eef7f2", panel: "#ffffff", panel2: "#e4f1ea", border: "#d4e8de", accent: "#3ba980", text: "#33463f", muted: "#84a196", radius: 18 } },
  { name: "Cielo pastel", theme: { bg: "#eef3fb", panel: "#ffffff", panel2: "#e5edf9", border: "#d5e0f1", accent: "#5089d3", text: "#33415c", muted: "#8293ac", radius: 18 } },
  { name: "Neón cian", theme: { bg: "#0c0e18", panel: "#141726", panel2: "#1c2036", border: "#293251", accent: "#33e0cf", text: "#e6f2ff", muted: "#6f7ca6", radius: 12 } },
  { name: "Neón fucsia", theme: { bg: "#110a17", panel: "#1b1125", panel2: "#271634", border: "#3b2052", accent: "#ff57ae", text: "#f6e9ff", muted: "#9a7bb2", radius: 12 } },
  { name: "Esmeralda", theme: { bg: "#0d1512", panel: "#12201b", panel2: "#193026", border: "#26463a", accent: "#4fc98a", text: "#e4f3ea", muted: "#7ba394", radius: 14 } },
];

/* ---------- SEED DATA ---------- */
const seedNodes = () => {
  const worldId = uid(); const folderId = uid(); const subFolderId = uid(); const pageId = uid();
  return [
    { id: worldId, parentId: null, order: 0, type: "map", name: "Mapa del Mundo", content: "", content2: "", mapImageKey: null, pins: [] },
    { id: folderId, parentId: null, order: 1, type: "folder", name: "Personajes", content: "", content2: "" },
    { id: subFolderId, parentId: folderId, order: 0, type: "folder", name: "Casa Real", content: "", content2: "" },
    {
      id: pageId, parentId: subFolderId, order: 0, type: "page", name: "Reina Ysolde",
      content: "La gobernante de [[Mapa del Mundo]] desde la caída del último dragón.\n\nPuedes usar **negritas**, //cursivas//, __subrayado__ y {#e07a5f|texto con color}.",
      content2: "",
    },
  ];
};

/* ---------- STORAGE (API remota: Cloudflare D1 + KV) ---------- */
const PROJECTS_KEY = "world-projects";
const THEME_KEY = "world-theme";
const TREE_KEY = "world-tree";

function treeKeyFor(pid) { return pid === "default" ? "world-tree" : `p:${pid}:world-tree`; }
function brainKeyFor(pid) { return pid === "default" ? "brain-positions" : `p:${pid}:brain-positions`; }
function dashKeyFor(pid) { return pid === "default" ? "world-dashboard" : `p:${pid}:world-dashboard`; }
function dashBgKeyFor(pid) { return `cover-image:dash-${pid}`; }
function templatesKeyFor(pid) { return pid === "default" ? "world-templates" : `p:${pid}:world-templates`; }

function getAccessKey() { return localStorage.getItem("wb-access-key") || ""; }

async function apiFetch(key, options = {}) {
  const res = await fetch(`/api/storage/${encodeURIComponent(key)}`, {
    ...options,
    headers: { Authorization: `Bearer ${getAccessKey()}`, ...(options.headers || {}) },
  });
  if (res.status === 401) {
    localStorage.removeItem("wb-access-key");
    window.location.reload();
    throw new Error("No autorizado");
  }
  return res;
}

async function storageGetJSON(key) {
  try {
    const res = await apiFetch(key);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (e) { return null; }
}
async function storageSetJSON(key, obj) {
  try { await apiFetch(key, { method: "PUT", body: JSON.stringify(obj) }); }
  catch (e) { console.error(e); }
}
async function loadImage(key) {
  if (!key) return null;
  try {
    const res = await apiFetch(key);
    if (!res.ok) return null;
    const text = await res.text();
    return text || null;
  } catch (e) { return null; }
}
async function saveImage(key, dataUrl) {
  try {
    const res = await apiFetch(key, { method: "PUT", body: dataUrl });
    return res.ok;
  } catch (e) { console.error(e); return false; }
}
async function deleteImage(key) {
  if (!key) return;
  try { await apiFetch(key, { method: "DELETE" }); } catch (e) {}
}

/* ---------- RICH TEXT RENDERER ---------- */
function renderRich(text, nodes, navigateByName, keyPrefix = "r") {
  const tokenRe = /(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|\/\/[^/]+\/\/|__[^_]+__|\{#[0-9a-fA-F]{3,8}\|[^}]*\})/g;
  const parts = text.split(tokenRe);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    let m;
    if ((m = part.match(/^\[\[([^\]]+)\]\]$/))) {
      const exists = nodes.some((n) => n.name.toLowerCase() === m[1].trim().toLowerCase());
      return (
        <span key={key} onClick={() => exists && navigateByName(m[1])}
          style={{ color: exists ? "var(--accent)" : "#b04848", borderBottom: `1px dashed ${exists ? "var(--accent)" : "#b04848"}`, cursor: exists ? "pointer" : "default", fontWeight: 600 }}
          title={exists ? `Ir a "${m[1]}"` : "Página no encontrada"}>
          {m[1]}
        </span>
      );
    }
    if ((m = part.match(/^\*\*([^*]+)\*\*$/))) return <strong key={key}>{m[1]}</strong>;
    if ((m = part.match(/^\/\/([^/]+)\/\/$/))) return <em key={key}>{m[1]}</em>;
    if ((m = part.match(/^__([^_]+)__$/))) return <u key={key}>{m[1]}</u>;
    if ((m = part.match(/^\{(#[0-9a-fA-F]{3,8})\|([^}]*)\}$/))) return <span key={key} style={{ color: m[1] }}>{m[2]}</span>;
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

/* ---------- FORMAT TOOLBAR ---------- */
function FormatToolbar({ textareaRef, value, onChange }) {
  function wrapSelection(before, after) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = value.slice(start, end) || "texto";
    const next = value.slice(0, start) + before + sel + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + sel.length;
    });
  }
  return (
    <div style={styles.fmtBar}>
      <button style={styles.fmtBtn} title="Negrita" onMouseDown={(e) => { e.preventDefault(); wrapSelection("**", "**"); }}><Bold size={13} /></button>
      <button style={styles.fmtBtn} title="Cursiva" onMouseDown={(e) => { e.preventDefault(); wrapSelection("//", "//"); }}><Italic size={13} /></button>
      <button style={styles.fmtBtn} title="Subrayado" onMouseDown={(e) => { e.preventDefault(); wrapSelection("__", "__"); }}><Underline size={13} /></button>
      <span style={{ width: 1, background: "var(--border)", alignSelf: "stretch", margin: "0 4px" }} />
      {TEXT_COLORS.map((c) => (
        <button key={c} title={`Color ${c}`} style={{ ...styles.fmtBtn, padding: 4 }}
          onMouseDown={(e) => { e.preventDefault(); wrapSelection(`{${c}|`, "}"); }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: c, display: "block" }} />
        </button>
      ))}
    </div>
  );
}

/* ---------- LINK PICKER (carpeta -> entrada) ---------- */
function LinkPicker({ nodes, value, onChange, excludeId }) {
  const [folderId, setFolderId] = useState("");
  const folders = nodes.filter((n) => n.type === "folder");
  const folderOptions = folders
    .map((f) => ({ id: f.id, label: pathTo(nodes, f.id).map((p) => p.name).join(" / ") }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const entries = useMemo(() => {
    let pool;
    if (!folderId) pool = nodes;
    else if (folderId === "__root__") pool = nodes.filter((n) => n.parentId === null);
    else {
      const ids = new Set(descendantIds(nodes, folderId));
      ids.delete(folderId);
      pool = nodes.filter((n) => ids.has(n.id));
    }
    return pool
      .filter((n) => n.id !== excludeId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [nodes, folderId, excludeId]);

  return (
    <>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>1. Filtrar por carpeta</div>
      <select value={folderId} onChange={(e) => setFolderId(e.target.value)} style={styles.pinSelect}>
        <option value="">— Todas las carpetas —</option>
        <option value="__root__">(Raíz del atlas)</option>
        {folderOptions.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
      </select>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>2. Elegir entrada</div>
      <select value={value || ""} onChange={(e) => onChange(e.target.value || null)} style={styles.pinSelect}>
        <option value="">— Sin enlace —</option>
        {entries.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </>
  );
}

/* ---------- SHAPES (figuras para pizarra y cerebro) ---------- */
function ShapesLayer({ shapes, updateShape, selectShape, selectedId, containerRef }) {
  const dragRef = useRef(null);
  useEffect(() => {
    function move(e) {
      const d = dragRef.current;
      if (!d || !containerRef.current) return;
      const point = e.touches ? e.touches[0] : e;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((point.clientX - d.startX) / rect.width) * 100;
      const dy = ((point.clientY - d.startY) / rect.height) * 100;
      if (d.mode === "move") {
        updateShape(d.id, {
          x: Math.max(0, Math.min(95, d.orig.x + dx)),
          y: Math.max(0, Math.min(95, d.orig.y + dy)),
        });
      } else {
        updateShape(d.id, {
          w: Math.max(4, Math.min(100, d.orig.w + dx)),
          h: Math.max(4, Math.min(100, d.orig.h + dy)),
        });
      }
      if (e.cancelable) e.preventDefault();
    }
    function up() { dragRef.current = null; }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [updateShape]);

  return (
    <>
      {shapes.map((s) => (
        <div key={s.id}
          onMouseDown={(e) => {
            e.stopPropagation();
            dragRef.current = { id: s.id, mode: "move", startX: e.clientX, startY: e.clientY, orig: { ...s } };
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            const p = e.touches[0];
            dragRef.current = { id: s.id, mode: "move", startX: p.clientX, startY: p.clientY, orig: { ...s } };
          }}
          onClick={(e) => { e.stopPropagation(); selectShape(s.id); }}
          style={{
            position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%`,
            border: `2px ${selectedId === s.id ? "solid" : "dashed"} ${s.color}`,
            background: `${s.color}14`,
            borderRadius: s.kind === "ellipse" ? "50%" : 12,
            cursor: "grab", zIndex: 1,
          }}
          title={s.label || ""}
        >
          {s.label && (
            <span style={{ position: "absolute", top: 4, left: 10, fontSize: 11, color: s.color, fontWeight: 600, whiteSpace: "nowrap" }}>
              {s.label}
            </span>
          )}
          <span
            onMouseDown={(e) => {
              e.stopPropagation();
              dragRef.current = { id: s.id, mode: "resize", startX: e.clientX, startY: e.clientY, orig: { ...s } };
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              const p = e.touches[0];
              dragRef.current = { id: s.id, mode: "resize", startX: p.clientX, startY: p.clientY, orig: { ...s } };
            }}
            style={{ position: "absolute", right: -6, bottom: -6, width: 14, height: 14, background: s.color, borderRadius: "var(--radius-sm, 4px)", cursor: "nwse-resize" }}
          />
        </div>
      ))}
    </>
  );
}

function ShapePanel({ shape, updateShape, deleteShape, onClose, isMobile }) {
  return (
    <div style={isMobile ? styles.pinPanelMobile : styles.pinPanel}>
      <div style={styles.pinPanelHeader}>
        <span>Figura</span>
        <X size={14} style={{ cursor: "pointer" }} onClick={onClose} />
      </div>
      <input value={shape.label || ""} onChange={(e) => updateShape(shape.id, { label: e.target.value })}
        placeholder="Etiqueta del grupo (opcional)" style={styles.pinInput} />
      <div style={{ display: "flex", gap: 5 }}>
        <button onClick={() => updateShape(shape.id, { kind: "rect" })}
          style={{ ...styles.miniBtn, background: shape.kind === "rect" ? "var(--accent)" : "var(--panel2)", color: shape.kind === "rect" ? "#1a1f2e" : "var(--text)" }}>
          <Square size={12} /> Rectángulo
        </button>
        <button onClick={() => updateShape(shape.id, { kind: "ellipse" })}
          style={{ ...styles.miniBtn, background: shape.kind === "ellipse" ? "var(--accent)" : "var(--panel2)", color: shape.kind === "ellipse" ? "#1a1f2e" : "var(--text)" }}>
          <Circle size={12} /> Óvalo
        </button>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Color</div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {SHAPE_COLORS.map((c) => (
          <button key={c} onClick={() => updateShape(shape.id, { color: c })}
            style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: shape.color === c ? "2px solid var(--text)" : "2px solid transparent", cursor: "pointer" }} />
        ))}
      </div>
      <button style={{ ...styles.pillBtn, color: "#c45c5c" }} onClick={() => deleteShape(shape.id)}>
        <Trash2 size={13} /> Eliminar figura
      </button>
    </div>
  );
}

/* ---------- MAIN APP ---------- */
export default function WorldBuilder() {
  const [projects, setProjects] = useState(null);
  const [nodes, setNodes] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState("node");
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [themeOpen, setThemeOpen] = useState(false);
  const [typeTemplates, setTypeTemplates] = useState({});
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [catalogsOpen, setCatalogsOpen] = useState(false);
  const isMobile = useIsMobile();
  const saveTimer = useRef(null);
  const templatesSaveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      let pj = await storageGetJSON(PROJECTS_KEY);
      if (!pj || !pj.list || !pj.list.length) {
        pj = { list: [{ id: "default", name: "Atlas de Mundos" }], activeId: "default" };
        await storageSetJSON(PROJECTS_KEY, pj);
      }
      if (!pj.list.some((p) => p.id === pj.activeId)) pj.activeId = pj.list[0].id;
      setProjects(pj);
      const th = await storageGetJSON(THEME_KEY);
      if (th) setTheme({ ...DEFAULT_THEME, ...th });
    })();
  }, []);

  useEffect(() => {
    if (!projects) return;
    setNodes(null);
    (async () => {
      const stored = await storageGetJSON(treeKeyFor(projects.activeId));
      const initial = stored && stored.length ? stored : seedNodes();
      setNodes(initial);
      setSelectedId(initial[0]?.id ?? null);
      setView("dashboard");
      setExpanded({ [initial[0]?.id]: true });
      const tpl = await storageGetJSON(templatesKeyFor(projects.activeId));
      setTypeTemplates(tpl && typeof tpl === "object" ? tpl : {});
    })();
  }, [projects?.activeId]);

  useEffect(() => { if (isMobile) setSidebarCollapsed(true); }, [isMobile]);

  const persist = useCallback((next) => {
    setNodes(next);
    clearTimeout(saveTimer.current);
    const key = treeKeyFor(projects.activeId);
    saveTimer.current = setTimeout(async () => {
      await storageSetJSON(key, next);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    }, 400);
  }, [projects?.activeId]);

  function updateTheme(patch) {
    const next = { ...theme, ...patch };
    setTheme(next);
    storageSetJSON(THEME_KEY, next);
  }

  const saveTypeTemplates = useCallback((next) => {
    setTypeTemplates(next);
    clearTimeout(templatesSaveTimer.current);
    const key = templatesKeyFor(projects.activeId);
    templatesSaveTimer.current = setTimeout(() => storageSetJSON(key, next), 400);
  }, [projects?.activeId]);

  function saveProjects(pj) { setProjects(pj); storageSetJSON(PROJECTS_KEY, pj); }
  function switchProject(id) { saveProjects({ ...projects, activeId: id }); }
  function addProject() {
    const name = window.prompt("Nombre de la nueva campaña / proyecto:");
    if (!name || !name.trim()) return;
    const p = { id: uid(), name: name.trim() };
    saveProjects({ list: [...projects.list, p], activeId: p.id });
  }
  function renameProject(name) {
    if (!name.trim()) return;
    saveProjects({
      ...projects,
      list: projects.list.map((p) => p.id === projects.activeId ? { ...p, name: name.trim() } : p),
    });
  }
  function deleteProject() {
    if (projects.list.length <= 1) { window.alert("Debe existir al menos un proyecto."); return; }
    const cur = projects.list.find((p) => p.id === projects.activeId);
    if (!window.confirm(`¿Quitar el proyecto "${cur.name}" de la lista? Sus datos quedarán archivados pero dejarán de mostrarse.`)) return;
    const list = projects.list.filter((p) => p.id !== projects.activeId);
    saveProjects({ list, activeId: list[0].id });
  }

  const activeProject = projects?.list.find((p) => p.id === projects.activeId);

  if (!projects || !nodes) {
    return (
      <div style={{ ...styles.loadingShell, background: DEFAULT_THEME.bg }}>
        <div style={styles.loadingSeal}><ScrollText size={28} color="#b8860b" /></div>
        <div style={{ color: "#c9bfa0", fontFamily: "'Cormorant Garamond', serif", fontSize: 18, marginTop: 12 }}>
          Desenrollando el mapa…
        </div>
      </div>
    );
  }

  const selected = findNode(nodes, selectedId);

  function addNode(type, parentId) {
    const names = { folder: "Nueva carpeta", map: "Nuevo mapa", timeline: "Nueva línea de tiempo", board: "Nueva pizarra", page: "Nueva página" };
    const node = { id: uid(), parentId: parentId ?? null, order: nextOrder(nodes, parentId ?? null), type, name: names[type] || "Nueva página", content: "", content2: "" };
    if (type === "map") { node.mapImageKey = null; node.pins = []; }
    if (type === "timeline") { node.events = []; }
    if (type === "board") { node.boardNodes = []; node.boardEdges = []; node.boardShapes = []; }
    persist([...nodes, node]);
    setSelectedId(node.id); setView("node");
    if (parentId) setExpanded((e) => ({ ...e, [parentId]: true }));
    if (isMobile) setSidebarCollapsed(true);
  }

  // Crea una entrada de catálogo (Objeto/Habilidad/Personaje) con su bloque
  // de estadísticas ya puesto, desde el botón "+ Nuevo..." de un catálogo.
  function addCatalogEntry(category, blockType, name) {
    const node = {
      id: uid(), parentId: null, order: nextOrder(nodes, null), type: "page",
      name: name || "Nueva entrada", content: "", content2: "",
      category, blocks: [makeBlock(blockType)],
    };
    persist([...nodes, node]);
    setSelectedId(node.id); setView("node");
    if (isMobile) setSidebarCollapsed(true);
  }

  function deleteNode(id) {
    const toRemove = new Set(descendantIds(nodes, id));
    const next = nodes.filter((n) => !toRemove.has(n.id));
    persist(next);
    if (toRemove.has(selectedId)) setSelectedId(next[0]?.id ?? null);
  }

  function renameNode(id, name) { persist(nodes.map((n) => (n.id === id ? { ...n, name } : n))); }
  function updateNode(id, patch) { persist(nodes.map((n) => (n.id === id ? { ...n, ...patch } : n))); }

  function updateNodeWithLinks(id, patch, textToScan) {
    let next = nodes.map((n) => (n.id === id ? { ...n, ...patch } : n));
    const names = extractWikiNames(textToScan);
    const missing = names.filter(
      (nm) => nm && !next.some((n) => n.name.toLowerCase() === nm.toLowerCase())
    );
    if (missing.length) {
      let unassigned = next.find((n) => n.type === "folder" && n.parentId === null && n.name === UNASSIGNED_FOLDER);
      if (!unassigned) {
        unassigned = { id: uid(), parentId: null, order: nextOrder(next, null), type: "folder", name: UNASSIGNED_FOLDER, content: "", content2: "" };
        next = [...next, unassigned];
      }
      const seen = new Set();
      missing.forEach((nm) => {
        const lower = nm.toLowerCase();
        if (seen.has(lower)) return;
        seen.add(lower);
        next = [...next, { id: uid(), parentId: unassigned.id, order: nextOrder(next, unassigned.id), type: "page", name: nm, content: "", content2: "" }];
      });
    }
    persist(next);
  }

  function moveNode(dragId, targetId, mode) {
    if (dragId === targetId) return;
    const desc = new Set(descendantIds(nodes, dragId));
    if (desc.has(targetId)) return;
    const target = findNode(nodes, targetId);
    if (!target) return;
    let next;
    if (mode === "into") {
      next = nodes.map((n) => n.id === dragId ? { ...n, parentId: targetId, order: nextOrder(nodes, targetId) } : n);
      setExpanded((e) => ({ ...e, [targetId]: true }));
    } else {
      const parentId = target.parentId;
      const siblings = childrenOf(nodes, parentId).filter((s) => s.id !== dragId);
      const idx = siblings.findIndex((s) => s.id === targetId);
      const reordered = [...siblings.slice(0, idx + 1), findNode(nodes, dragId), ...siblings.slice(idx + 1)];
      const orderMap = {};
      reordered.forEach((s, i) => { orderMap[s.id] = i; });
      next = nodes.map((n) => {
        if (n.id === dragId) return { ...n, parentId, order: orderMap[dragId] };
        if (orderMap[n.id] !== undefined) return { ...n, order: orderMap[n.id] };
        return n;
      });
    }
    persist(next);
  }

  function moveToRoot(dragId) {
    persist(nodes.map((n) => n.id === dragId ? { ...n, parentId: null, order: nextOrder(nodes, null) } : n));
  }

  function navigateByName(name) {
    const target = nodes.find((n) => n.name.toLowerCase() === name.trim().toLowerCase());
    if (target) navigateToId(target.id);
  }
  function navigateToId(id) {
    setSelectedId(id); setView("node");
    const p = pathTo(nodes, id);
    setExpanded((e) => { const ne = { ...e }; p.forEach((n) => (ne[n.id] = true)); return ne; });
    if (isMobile) setSidebarCollapsed(true);
  }
  function selectAndMaybeCollapse(id) {
    setSelectedId(id); setView("node");
    if (isMobile) setSidebarCollapsed(true);
  }

  const r = typeof theme.radius === "number" ? theme.radius : 10;
  const themeVars = {
    "--bg": theme.bg, "--panel": theme.panel, "--panel2": theme.panel2,
    "--border": theme.border, "--accent": theme.accent, "--text": theme.text, "--muted": theme.muted,
    "--radius-sm": Math.round(r * 0.5) + "px",
    "--radius-md": r + "px",
    "--radius-lg": Math.round(r * 1.5) + "px",
    "--radius-pill": Math.round(r * 2) + "px",
    "--app-bg": "radial-gradient(1100px 620px at 12% -8%, color-mix(in srgb, var(--panel) 60%, var(--bg)) 0%, var(--bg) 58%)",
  };

  return (
    <div style={{ ...styles.app, ...themeVars }}>
      <style>{fontImports}</style>

      {isMobile && !sidebarCollapsed && (
        <div style={styles.backdrop} onClick={() => setSidebarCollapsed(true)} />
      )}

      {!sidebarCollapsed && (
        <Sidebar
          nodes={nodes} selectedId={selectedId} setSelectedId={selectAndMaybeCollapse}
          expanded={expanded} setExpanded={setExpanded} search={search} setSearch={setSearch}
          addNode={addNode} deleteNode={deleteNode} renameNode={renameNode}
          moveNode={moveNode} moveToRoot={moveToRoot}
          onCollapse={() => setSidebarCollapsed(true)} isMobile={isMobile}
          openDashboard={() => { setView("dashboard"); if (isMobile) setSidebarCollapsed(true); }}
          dashActive={view === "dashboard"}
          openBrain={() => { setView("brain"); if (isMobile) setSidebarCollapsed(true); }}
          brainActive={view === "brain"}
          openTheme={() => setThemeOpen(true)}
          openTemplates={() => setTemplatesOpen(true)}
          openCatalogs={() => setCatalogsOpen(true)}
          projects={projects} activeProject={activeProject}
          switchProject={switchProject} addProject={addProject}
          renameProject={renameProject} deleteProject={deleteProject}
        />
      )}
      {sidebarCollapsed && (
        <button style={styles.expandHandle} onClick={() => setSidebarCollapsed(false)} title="Mostrar panel">
          <PanelLeftOpen size={16} color="var(--text)" />
        </button>
      )}
      <main style={styles.main}>
        <TopBar selected={view === "node" ? selected : null} brainMode={view === "brain"} dashMode={view === "dashboard"} nodes={nodes} savedFlash={savedFlash} isMobile={isMobile} />
        {view === "dashboard" ? (
          <DashboardView key={projects.activeId} nodes={nodes} navigateToId={navigateToId} isMobile={isMobile}
            dashKey={dashKeyFor(projects.activeId)} dashBgKey={dashBgKeyFor(projects.activeId)} />
        ) : view === "brain" ? (
          <BrainView key={projects.activeId} nodes={nodes} navigateToId={navigateToId} isMobile={isMobile} brainKey={brainKeyFor(projects.activeId)} />
        ) : !selected ? (
          <div style={styles.emptyState}>
            <ScrollText size={48} color="var(--muted)" />
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--muted)", textAlign: "center", padding: "0 20px" }}>
              Selecciona o crea una entrada para comenzar.
            </p>
          </div>
        ) : selected.type === "page" ? (
          <PageEditor node={selected} nodes={nodes} updateNode={updateNode} updateNodeWithLinks={updateNodeWithLinks} navigateByName={navigateByName} isMobile={isMobile} typeTemplates={typeTemplates} />
        ) : selected.type === "map" ? (
          <MapEditor node={selected} nodes={nodes} updateNode={updateNode} setSelectedId={navigateToId} isMobile={isMobile} />
        ) : selected.type === "folder" ? (
          <FolderView node={selected} nodes={nodes} addNode={addNode} setSelectedId={navigateToId} updateNode={updateNode} updateNodeWithLinks={updateNodeWithLinks} navigateByName={navigateByName} isMobile={isMobile} />
        ) : selected.type === "timeline" ? (
          <TimelineEditor node={selected} nodes={nodes} updateNode={updateNode} setSelectedId={navigateToId} isMobile={isMobile} />
        ) : selected.type === "board" ? (
          <BoardEditor node={selected} nodes={nodes} updateNode={updateNode} setSelectedId={navigateToId} isMobile={isMobile} />
        ) : null}
      </main>

      {themeOpen && (
        <ThemePanel theme={theme} updateTheme={updateTheme} onClose={() => setThemeOpen(false)} isMobile={isMobile} />
      )}
      {templatesOpen && (
        <TypeTemplatesPanel typeTemplates={typeTemplates} saveTypeTemplates={saveTypeTemplates}
          onClose={() => setTemplatesOpen(false)} isMobile={isMobile} />
      )}
      {catalogsOpen && (
        <CatalogsPanel nodes={nodes} navigateToId={navigateToId} addCatalogEntry={addCatalogEntry}
          onClose={() => setCatalogsOpen(false)} isMobile={isMobile} />
      )}
    </div>
  );
}

/* ---------- THEME PANEL ---------- */
function ThemePanel({ theme, updateTheme, onClose, isMobile }) {
  const fields = [
    ["accent", "Acento"], ["bg", "Fondo"], ["panel", "Paneles"],
    ["panel2", "Botones"], ["border", "Bordes"], ["text", "Texto"], ["muted", "Texto tenue"],
  ];
  const radius = typeof theme.radius === "number" ? theme.radius : 10;
  const paletteKeys = ["bg", "panel", "panel2", "border", "accent", "text", "muted"];
  const activePreset = THEME_PRESETS.find((p) => paletteKeys.every((k) => p.theme[k] === theme[k]) && p.theme.radius === radius);

  return (
    <div style={isMobile ? styles.pinPanelMobile : { ...styles.pinPanel, top: 60, bottom: "auto", width: 268 }}>
      <div style={styles.pinPanelHeader}>
        <span><Palette size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Apariencia</span>
        <X size={14} style={{ cursor: "pointer" }} onClick={onClose} />
      </div>

      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Temas</div>
      <div style={styles.presetGrid}>
        {THEME_PRESETS.map((p) => {
          const active = activePreset && activePreset.name === p.name;
          return (
            <button key={p.name} onClick={() => updateTheme({ ...p.theme })} title={p.name}
              style={{ ...styles.presetBtn, borderColor: active ? "var(--accent)" : "var(--border)", outline: active ? "1px solid var(--accent)" : "none" }}>
              <span style={{ display: "flex", gap: 3 }}>
                <span style={{ ...styles.presetDot, background: p.theme.bg }} />
                <span style={{ ...styles.presetDot, background: p.theme.panel2 }} />
                <span style={{ ...styles.presetDot, background: p.theme.accent }} />
              </span>
              <span style={{ fontSize: 11, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
            </button>
          );
        })}
      </div>

      <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--text)", marginTop: 4 }}>
        Redondez de bordes <span style={{ color: "var(--muted)" }}>{radius} px</span>
      </label>
      <input type="range" min={0} max={22} value={radius}
        onChange={(e) => updateTheme({ radius: Number(e.target.value) })}
        style={{ width: "100%", accentColor: "var(--accent)" }} />

      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>Colores</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        {fields.map(([key, label]) => (
          <label key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--text)", gap: 6 }}>
            {label}
            <input type="color" value={theme[key]} onChange={(e) => updateTheme({ [key]: e.target.value })}
              style={{ width: 30, height: 22, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0 }} />
          </label>
        ))}
      </div>

      <button style={{ ...styles.pillBtn, justifyContent: "center", marginTop: 4 }} onClick={() => updateTheme({ ...DEFAULT_THEME })}>Restaurar por defecto</button>
    </div>
  );
}

/* ---------- FORMATOS POR TIPO (diseñador de plantillas) ---------- */
function TypeTemplatesPanel({ typeTemplates, saveTypeTemplates, onClose, isMobile }) {
  const [activeType, setActiveType] = useState(ENTRY_TYPE_KEYS[0]);
  const slots = (typeTemplates[activeType] && typeTemplates[activeType].slots) || [];
  const slotsRef = useRef(slots);
  useEffect(() => {
    slotsRef.current = (typeTemplates[activeType] && typeTemplates[activeType].slots) || [];
  }, [typeTemplates, activeType]);

  function commitSlots(next) {
    slotsRef.current = next;
    saveTypeTemplates({ ...typeTemplates, [activeType]: { slots: next } });
  }
  function addSlot(type, pos) {
    const s = makeSlot(type);
    s.x = pos?.x ?? 2;
    s.y = pos?.y ?? bottomOf(slotsRef.current) + 12;
    commitSlots([...slotsRef.current, s]);
  }
  function updateSlot(slotId, patch) { commitSlots(slotsRef.current.map((s) => (s.slotId === slotId ? { ...s, ...patch } : s))); }
  function deleteSlot(slotId) { commitSlots(slotsRef.current.filter((s) => s.slotId !== slotId)); }

  const items = slots.map((s) => ({ ...s, id: s.slotId }));

  return (
    <div style={styles.templatesOverlay} onClick={onClose}>
      <div style={isMobile ? styles.templatesModalMobile : styles.templatesModal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.pinPanelHeader}>
          <span><LayoutDashboard size={13} style={{ verticalAlign: "middle", marginRight: 4 }} /> Formatos por tipo de entrada</span>
          <X size={16} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
          Diseña la maqueta de cada tipo arrastrando y redimensionando los recuadros. Se aplica a las
          entradas de ese tipo (existentes y nuevas); cada entrada podrá reacomodarla luego.
        </div>
        <div style={styles.templatesTypeRow}>
          {ENTRY_TYPE_KEYS.map((k) => {
            const t = ENTRY_TYPES[k]; const Icon = t.icon; const active = k === activeType;
            const count = ((typeTemplates[k] && typeTemplates[k].slots) || []).length;
            return (
              <button key={k} onClick={() => setActiveType(k)}
                style={{ ...styles.pillBtn, ...(active ? { background: t.color, borderColor: t.color, color: "#1a1f2e" } : { color: t.color }) }}>
                <Icon size={13} /> {t.label}{count ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", flex: 1, minHeight: 0, gap: 10 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: 4 }}>
            <CanvasEditor items={items} mode="template" nodes={[]} navigateByName={() => {}}
              onUpdate={updateSlot} onDelete={deleteSlot} onAdd={addSlot} isMobile={isMobile}
              emptyHint="Añade recuadros desde la paleta y colócalos para formar la ficha de este tipo." />
          </div>
          {!isMobile && <BlockPalette onAdd={(t) => addSlot(t)} category={activeType} />}
        </div>
        {isMobile && <BlockPalette onAdd={(t) => addSlot(t)} horizontal category={activeType} />}
      </div>
    </div>
  );
}

/* ---------- CATÁLOGOS (tablas resumen de Objetos/Habilidades/Personajes) ---------- */
// Lista compacta de los bonos distintos de cero de un bloque de objeto/personaje.
function bonusList(block) {
  return [...ATTR_FIELDS, ...COMBAT_STAT_FIELDS]
    .map(([k, label]) => [label, block[`bonus_${k}`] || 0])
    .filter(([, v]) => v !== 0)
    .map(([label, v]) => `${label} ${v > 0 ? "+" : ""}${v}`)
    .join(" · ");
}

function ObjectsCatalogTab({ nodes, navigateToId, addCatalogEntry }) {
  const items = nodes.filter((n) => n.category === "object");
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 4, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
        Resumen de todos los objetos y sus bonos, para revisar el balance de un vistazo. Haz clic
        en un nombre para abrir su página.
      </div>
      {items.length === 0 ? (
        <div style={styles.canvasEmpty}>Aún no hay objetos. Crea el primero abajo.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.statsTable}>
            <thead>
              <tr>
                <th style={styles.statsTh}>Nombre</th>
                <th style={styles.statsTh}>Tipo</th>
                <th style={styles.statsTh}>Bonos</th>
                <th style={styles.statsTh}>Enseña</th>
                <th style={styles.statsTh}>AP</th>
                <th style={styles.statsTh}>Usable por</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => {
                const b = (n.blocks || []).find((x) => x.type === "itemStats");
                if (!b) return (
                  <tr key={n.id}>
                    <td style={styles.statsTd}><span style={styles.catalogLink} onClick={() => navigateToId(n.id)}>{n.name}</span></td>
                    <td style={{ ...styles.statsTd, color: "var(--muted)", fontStyle: "italic" }} colSpan={5}>Sin bloque de estadísticas de objeto</td>
                  </tr>
                );
                const skill = nodes.find((x) => x.id === b.teachesSkillId);
                const usable = !b.usableBy || b.usableBy === "any" ? "Cualquiera" : (nodes.find((x) => x.id === b.usableBy)?.name || "—");
                return (
                  <tr key={n.id}>
                    <td style={styles.statsTd}><span style={styles.catalogLink} onClick={() => navigateToId(n.id)}>{n.name}</span></td>
                    <td style={styles.statsTd}>{b.itemSlot}</td>
                    <td style={styles.statsTd}>{bonusList(b) || "—"}</td>
                    <td style={styles.statsTd}>{skill ? skill.name : "—"}</td>
                    <td style={styles.statsTd}>{skill ? (b.apToMaster ?? 0) : "—"}</td>
                    <td style={styles.statsTd}>{usable}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <button style={{ ...styles.pillBtn, alignSelf: "flex-start" }}
        onClick={() => addCatalogEntry("object", "itemStats", "Nuevo objeto")}>
        <Plus size={13} /> Nuevo objeto
      </button>
    </div>
  );
}

function CatalogsPanel({ nodes, navigateToId, addCatalogEntry, onClose, isMobile }) {
  const [tab, setTab] = useState("object");
  return (
    <div style={styles.templatesOverlay} onClick={onClose}>
      <div style={isMobile ? styles.templatesModalMobile : styles.templatesModal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.pinPanelHeader}>
          <span><Package size={13} style={{ verticalAlign: "middle", marginRight: 4 }} /> Catálogos</span>
          <X size={16} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>
        <div style={styles.templatesTabRow}>
          <button style={{ ...styles.pillBtn, ...(tab === "object" ? styles.pillBtnActive : {}) }}
            onClick={() => setTab("object")}><Package size={13} /> Objetos</button>
        </div>
        {tab === "object" && <ObjectsCatalogTab nodes={nodes} navigateToId={navigateToId} addCatalogEntry={addCatalogEntry} />}
      </div>
    </div>
  );
}

/* ---------- TOP BAR ---------- */
function TopBar({ selected, brainMode, dashMode, nodes, savedFlash, isMobile }) {
  const crumbs = selected ? pathTo(nodes, selected.id) : [];
  return (
    <div style={styles.topbar}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", whiteSpace: "nowrap", flex: 1, paddingLeft: isMobile ? 40 : 0 }}>
        {dashMode ? (
          <span style={{ color: "var(--text)", fontSize: isMobile ? 13 : 15, fontFamily: "'Cinzel Decorative', serif" }}>
            <LayoutDashboard size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />Panel del mundo
          </span>
        ) : brainMode ? (
          <span style={{ color: "var(--text)", fontSize: isMobile ? 13 : 15, fontFamily: "'Cinzel Decorative', serif" }}>
            <Brain size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />Cerebro
          </span>
        ) : crumbs.map((c, i) => (
          <React.Fragment key={c.id}>
            {i > 0 && <ChevronRight size={14} color="var(--muted)" />}
            <span style={{ color: i === crumbs.length - 1 ? "var(--text)" : "var(--muted)", fontSize: isMobile ? 12.5 : 14, fontFamily: "'Cormorant Garamond', serif" }}>
              {c.name}
            </span>
          </React.Fragment>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: savedFlash ? "var(--accent)" : "var(--muted)", fontSize: 11.5, transition: "color .3s", flexShrink: 0, opacity: savedFlash ? 1 : 0.5 }}>
        <Save size={13} />
        {!isMobile && (savedFlash ? "Guardado" : "Autoguardado")}
      </div>
    </div>
  );
}

/* ---------- SIDEBAR ---------- */
function Sidebar({ nodes, selectedId, setSelectedId, expanded, setExpanded, search, setSearch, addNode, deleteNode, renameNode, moveNode, moveToRoot, onCollapse, isMobile, openBrain, brainActive, openDashboard, dashActive, openTheme, openTemplates, openCatalogs, projects, activeProject, switchProject, addProject, renameProject, deleteProject }) {
  const roots = childrenOf(nodes, null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(activeProject?.name || "");
  useEffect(() => { setTitleDraft(activeProject?.name || ""); setEditingTitle(false); }, [activeProject?.id, activeProject?.name]);

  const filtered = search.trim()
    ? nodes.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <aside style={isMobile ? styles.sidebarMobile : styles.sidebar}>
      <div style={styles.sidebarHeader}>
        <div style={styles.brandSeal}><Crown size={16} color="#1a1f2e" /></div>
        {editingTitle ? (
          <input autoFocus value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => { setEditingTitle(false); renameProject(titleDraft); }}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            style={{ ...styles.renameInput, fontFamily: "'Cinzel Decorative', serif", fontSize: 14 }} />
        ) : (
          <span onDoubleClick={() => setEditingTitle(true)} title="Doble clic para renombrar"
            style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 15, color: "var(--text)", letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "text" }}>
            {activeProject?.name}
          </span>
        )}
        <button onClick={() => setEditingTitle(true)} style={{ ...styles.collapseBtn, marginLeft: "auto" }} title="Renombrar título">
          <Pencil size={13} color="var(--muted)" />
        </button>
        <button onClick={openTheme} style={styles.collapseBtn} title="Personalizar colores">
          <Settings size={15} color="var(--muted)" />
        </button>
        <button onClick={onCollapse} style={styles.collapseBtn} title="Contraer panel">
          <PanelLeftClose size={16} color="var(--muted)" />
        </button>
      </div>

      <div style={styles.projectRow}>
        <select value={projects.activeId} onChange={(e) => switchProject(e.target.value)} style={{ ...styles.pinSelect, flex: 1 }}>
          {projects.list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button style={styles.miniBtn} onClick={addProject} title="Nueva campaña / proyecto"><Plus size={12} /></button>
        <button style={{ ...styles.miniBtn, color: "#c45c5c" }} onClick={deleteProject} title="Quitar proyecto actual"><Trash2 size={12} /></button>
      </div>

      <button onClick={openDashboard} style={{ ...styles.brainBtn, background: dashActive ? "var(--accent)" : "var(--panel2)", color: dashActive ? "#1a1f2e" : "var(--text)" }}>
        <LayoutDashboard size={14} /> Panel del mundo
      </button>

      <button onClick={openBrain} style={{ ...styles.brainBtn, background: brainActive ? "var(--accent)" : "var(--panel2)", color: brainActive ? "#1a1f2e" : "var(--text)" }}>
        <Brain size={14} /> Cerebro — mapa global de vínculos
      </button>

      <button onClick={openTemplates} style={{ ...styles.brainBtn, background: "var(--panel2)", color: "var(--text)" }}>
        <LayoutDashboard size={14} /> Formatos por tipo
      </button>

      <button onClick={openCatalogs} style={{ ...styles.brainBtn, background: "var(--panel2)", color: "var(--text)" }}>
        <Package size={14} /> Catálogos
      </button>

      <div style={styles.searchBox}>
        <Search size={14} color="var(--muted)" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar página, mapa…" style={styles.searchInput} />
        {search && <X size={14} color="var(--muted)" style={{ cursor: "pointer" }} onClick={() => setSearch("")} />}
      </div>

      <div style={styles.newRow}>
        <button style={styles.newBtn} onClick={() => addNode("folder", null)}><Folder size={13} /> Carpeta</button>
        <button style={styles.newBtn} onClick={() => addNode("page", null)}><FileText size={13} /> Página</button>
        <button style={styles.newBtn} onClick={() => addNode("map", null)}><MapIcon size={13} /> Mapa</button>
        <button style={styles.newBtn} onClick={() => addNode("timeline", null)}><Clock size={13} /> Línea de tiempo</button>
        <button style={styles.newBtn} onClick={() => addNode("board", null)}><Share2 size={13} /> Pizarra</button>
      </div>

      <div style={styles.tree}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const dragId = e.dataTransfer.getData("text/wb-node");
          if (dragId && e.target === e.currentTarget) moveToRoot(dragId);
        }}
      >
        {filtered
          ? filtered.map((n) => (
              <FlatResult key={n.id} node={n} active={n.id === selectedId} onClick={() => setSelectedId(n.id)} />
            ))
          : roots.map((n) => (
              <TreeItem key={n.id} node={n} nodes={nodes} depth={0}
                selectedId={selectedId} setSelectedId={setSelectedId}
                expanded={expanded} setExpanded={setExpanded}
                addNode={addNode} deleteNode={deleteNode} renameNode={renameNode} moveNode={moveNode} />
            ))}
        {!filtered && roots.length === 0 && (
          <div style={{ color: "var(--muted)", fontSize: 13, padding: "12px 8px", fontStyle: "italic" }}>
            Este proyecto está vacío. Crea tu primera entrada.
          </div>
        )}
        <div style={{ minHeight: 40 }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { const dragId = e.dataTransfer.getData("text/wb-node"); if (dragId) moveToRoot(dragId); }}
        />
      </div>
      <div style={{ fontSize: 10.5, color: "var(--muted)", padding: "6px 4px 0", fontStyle: "italic" }}>
        Arrastra entradas para reordenar, meterlas en carpetas o soltarlas en una pizarra.
      </div>
    </aside>
  );
}

function FlatResult({ node, active, onClick }) {
  const Icon = iconForNode(node, false);
  return (
    <div onClick={onClick} style={{ ...styles.treeRow, background: active ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "transparent" }}>
      <Icon size={14} color={colorForNode(node)} />
      <span style={styles.treeLabel}>{node.name}</span>
    </div>
  );
}

function TreeItem({ node, nodes, depth, selectedId, setSelectedId, expanded, setExpanded, addNode, deleteNode, renameNode, moveNode }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropHint, setDropHint] = useState(null);
  const kids = node.type === "folder" ? childrenOf(nodes, node.id) : [];
  const isOpen = !!expanded[node.id];
  const Icon = iconForNode(node, isOpen);
  const active = node.id === selectedId;

  function handleDragOver(e) {
    e.preventDefault(); e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    if (node.type === "folder" && ratio < 0.65) setDropHint("into");
    else setDropHint("after");
  }
  function handleDrop(e) {
    e.preventDefault(); e.stopPropagation();
    const dragId = e.dataTransfer.getData("text/wb-node");
    setDropHint(null);
    if (!dragId || dragId === node.id) return;
    moveNode(dragId, node.id, dropHint === "into" ? "into" : "after");
  }

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/wb-node", node.id);
          e.dataTransfer.setData("text/wb-node-name", node.name);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={handleDragOver}
        onDragLeave={() => setDropHint(null)}
        onDrop={handleDrop}
        style={{
          ...styles.treeRow, paddingLeft: 8 + depth * 16,
          background: active ? "color-mix(in srgb, var(--accent) 18%, transparent)" : dropHint === "into" ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "transparent",
          borderBottom: dropHint === "after" ? "2px solid var(--accent)" : "2px solid transparent",
        }}
        onClick={() => setSelectedId(node.id)}
      >
        {node.type === "folder" ? (
          <span onClick={(e) => { e.stopPropagation(); setExpanded((ex) => ({ ...ex, [node.id]: !isOpen })); }} style={{ display: "flex" }}>
            {isOpen ? <ChevronDown size={13} color="var(--muted)" /> : <ChevronRight size={13} color="var(--muted)" />}
          </span>
        ) : (<span style={{ width: 13 }} />)}
        <Icon size={14} color={colorForNode(node)} />
        {editing ? (
          <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { setEditing(false); if (draft.trim()) renameNode(node.id, draft.trim()); }}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            style={styles.renameInput} onClick={(e) => e.stopPropagation()} />
        ) : (
          <span style={styles.treeLabel} onDoubleClick={() => setEditing(true)}>{node.name}</span>
        )}
        <span style={{ marginLeft: "auto", opacity: 0.6, cursor: "pointer", padding: "0 4px" }}
          onClick={(e) => { e.stopPropagation(); setMenuOpen((m) => !m); }}>⋮</span>
      </div>
      {menuOpen && (
        <div style={{ ...styles.contextMenu, marginLeft: 8 + depth * 16 + 18 }}>
          {node.type === "folder" && (
            <>
              <div style={styles.contextItem} onClick={() => { addNode("folder", node.id); setMenuOpen(false); }}>+ Subcarpeta</div>
              <div style={styles.contextItem} onClick={() => { addNode("page", node.id); setMenuOpen(false); }}>+ Página</div>
              <div style={styles.contextItem} onClick={() => { addNode("map", node.id); setMenuOpen(false); }}>+ Mapa</div>
              <div style={styles.contextItem} onClick={() => { addNode("timeline", node.id); setMenuOpen(false); }}>+ Línea de tiempo</div>
              <div style={styles.contextItem} onClick={() => { addNode("board", node.id); setMenuOpen(false); }}>+ Pizarra</div>
            </>
          )}
          <div style={styles.contextItem} onClick={() => { setEditing(true); setMenuOpen(false); }}>Renombrar</div>
          <div style={{ ...styles.contextItem, color: "#c45c5c" }} onClick={() => { deleteNode(node.id); setMenuOpen(false); }}>
            <Trash2 size={12} style={{ marginRight: 4, verticalAlign: "middle" }} /> Eliminar
          </div>
        </div>
      )}
      {node.type === "folder" && isOpen &&
        kids.map((c) => (
          <TreeItem key={c.id} node={c} nodes={nodes} depth={depth + 1}
            selectedId={selectedId} setSelectedId={setSelectedId}
            expanded={expanded} setExpanded={setExpanded}
            addNode={addNode} deleteNode={deleteNode} renameNode={renameNode} moveNode={moveNode} />
        ))}
    </div>
  );
}

/* ---------- COVER IMAGE ---------- */
function CoverImage({ node, updateNode, margin }) {
  const [coverSrc, setCoverSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(false);
  const inputRef = useRef(null);
  const coverKey = `cover-image:${node.id}`;
  const fit = node.coverFit || "cover";
  const pos = node.coverPos ?? 50;

  useEffect(() => {
    setLoading(true); setAdjusting(false);
    (async () => {
      const data = node.coverImageKey ? await loadImage(coverKey) : null;
      setCoverSrc(data); setLoading(false);
    })();
  }, [node.id, node.coverImageKey]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const ok = await saveImage(coverKey, reader.result);
      if (ok) { setCoverSrc(reader.result); updateNode(node.id, { coverImageKey: coverKey }); }
    };
    reader.readAsDataURL(file);
  }
  async function handleRemove() {
    await deleteImage(coverKey);
    setCoverSrc(null);
    updateNode(node.id, { coverImageKey: null });
  }

  if (loading) return null;
  if (!coverSrc) {
    return (
      <>
        <button style={{ ...styles.addCoverBtn, margin }} onClick={() => inputRef.current?.click()}>
          <ImageIcon size={14} /> Añadir imagen
        </button>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleUpload} />
      </>
    );
  }
  return (
    <>
      <div style={{ ...styles.coverWrap, margin }}>
        <img src={coverSrc} alt="" style={{ ...styles.coverImg, objectFit: fit, objectPosition: `50% ${pos}%` }} />
        <div style={styles.coverOverlayActions}>
          <button style={styles.pillBtnGhost} onClick={() => setAdjusting((a) => !a)} title="Ajustar imagen">
            <MoveVertical size={12} /> Ajustar
          </button>
          <button style={styles.pillBtnGhost} onClick={() => inputRef.current?.click()}><ImageIcon size={12} /> Cambiar</button>
          <button style={styles.pillBtnGhost} onClick={handleRemove}><Trash2 size={12} /> Quitar</button>
        </div>
        {adjusting && (
          <div style={styles.coverAdjustBar}>
            <button style={{ ...styles.pillBtnGhost, background: fit === "cover" ? "var(--accent)" : "rgba(17,20,29,0.75)", color: fit === "cover" ? "#1a1f2e" : "var(--text)" }}
              onClick={() => updateNode(node.id, { coverFit: "cover" })}>Rellenar</button>
            <button style={{ ...styles.pillBtnGhost, background: fit === "contain" ? "var(--accent)" : "rgba(17,20,29,0.75)", color: fit === "contain" ? "#1a1f2e" : "var(--text)" }}
              onClick={() => updateNode(node.id, { coverFit: "contain" })}>Completa</button>
            {fit === "cover" && (
              <input type="range" min={0} max={100} value={pos}
                onChange={(e) => updateNode(node.id, { coverPos: Number(e.target.value) })}
                style={{ flex: 1, accentColor: "var(--accent)" }} title="Posición vertical" />
            )}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleUpload} />
    </>
  );
}

/* ---------- DUAL CONTENT ---------- */
function DualContent({ node, nodes, updateNodeWithLinks, navigateByName }) {
  const [tab, setTab] = useState("main");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const taRef = useRef(null);
  const field = tab === "main" ? "content" : "content2";
  const value = node[field] || "";

  useEffect(() => { setEditing(false); setTab("main"); }, [node.id]);
  useEffect(() => { setDraft(value); }, [node.id, tab]);

  function commit() {
    updateNodeWithLinks(node.id, { [field]: draft }, draft);
    setEditing(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={styles.tabRow}>
        <button style={{ ...styles.tabBtn, ...(tab === "main" ? styles.tabBtnActive : {}) }}
          onClick={() => { if (editing) commit(); setTab("main"); }}>Contenido</button>
        <button style={{ ...styles.tabBtn, ...(tab === "alt" ? styles.tabBtnActive : {}) }}
          onClick={() => { if (editing) commit(); setTab("alt"); }}>Notas del máster</button>
      </div>
      <div style={styles.linkHint}>
        <Link2 size={12} /> <code>[[Página]]</code> enlaza (si no existe se crea en "{UNASSIGNED_FOLDER}") · <code>**negrita**</code> · <code>//cursiva//</code> · <code>__subrayado__</code>
      </div>
      {editing ? (
        <>
          <FormatToolbar textareaRef={taRef} value={draft} onChange={setDraft} />
          <textarea ref={taRef} autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} style={styles.textarea} />
        </>
      ) : (
        <div style={styles.renderedContent} onClick={() => { setDraft(value); setEditing(true); }}>
          {value.trim()
            ? renderRich(value, nodes, navigateByName, tab)
            : <span style={{ color: "var(--muted)", fontStyle: "italic" }}>
                {tab === "main" ? "Haz clic para escribir el contenido…" : "Haz clic para escribir notas privadas, secretos, datos de trama…"}
              </span>}
        </div>
      )}
    </div>
  );
}

/* ---------- FOLDER VIEW ---------- */
function FolderView({ node, nodes, addNode, setSelectedId, updateNode, updateNodeWithLinks, navigateByName, isMobile }) {
  const kids = childrenOf(nodes, node.id);
  return (
    <div style={styles.folderView}>
      <CoverImage node={node} updateNode={updateNode} margin="20px 16px 0" />
      <h1 style={styles.pageTitle}>{node.name}</h1>
      <div style={styles.folderActions}>
        <button style={styles.pillBtn} onClick={() => addNode("page", node.id)}><Plus size={13} /> Página</button>
        <button style={styles.pillBtn} onClick={() => addNode("folder", node.id)}><Plus size={13} /> Subcarpeta</button>
        <button style={styles.pillBtn} onClick={() => addNode("map", node.id)}><Plus size={13} /> Mapa</button>
        <button style={styles.pillBtn} onClick={() => addNode("timeline", node.id)}><Plus size={13} /> Línea de tiempo</button>
        <button style={styles.pillBtn} onClick={() => addNode("board", node.id)}><Plus size={13} /> Pizarra</button>
      </div>
      <div style={styles.folderGrid}>
        {kids.length === 0 && (
          <div style={{ color: "var(--muted)", fontStyle: "italic", padding: "0 16px" }}>Carpeta vacía.</div>
        )}
        {kids.map((k) => {
          const Icon = iconForNode(k, false);
          const entryType = k.type === "page" ? ENTRY_TYPES[k.category] : null;
          return (
            <div key={k.id} style={styles.folderCard} onClick={() => setSelectedId(k.id)}>
              {k.coverImageKey ? <FolderCardThumb coverKey={`cover-image:${k.id}`} /> : <Icon size={20} color={colorForNode(k)} />}
              <span>{k.name}</span>
              {k.type === "folder" && <span style={styles.subBadge}>carpeta</span>}
              {entryType && <span style={{ ...styles.subBadge, color: entryType.color }}>{entryType.label}</span>}
            </div>
          );
        })}
      </div>
      <div style={{ padding: "0 16px" }}>
        <FreeBlockCanvas node={node} nodes={nodes} updateNodeWithLinks={updateNodeWithLinks} navigateByName={navigateByName} isMobile={isMobile} />
      </div>
    </div>
  );
}

function FolderCardThumb({ coverKey }) {
  const [src, setSrc] = useState(null);
  useEffect(() => { (async () => setSrc(await loadImage(coverKey)))(); }, [coverKey]);
  if (!src) return <div style={{ width: 40, height: 40 }} />;
  return <img src={src} alt="" style={{ width: 40, height: 40, borderRadius: "var(--radius-md, 7px)", objectFit: "cover" }} />;
}

/* ---------- ENTRY TYPE PICKER ---------- */
function EntryTypePicker({ node, updateNode }) {
  return (
    <div style={styles.entryTypeRow}>
      {ENTRY_TYPE_KEYS.map((key) => {
        const t = ENTRY_TYPES[key];
        const Icon = t.icon;
        const active = node.category === key;
        return (
          <button key={key} type="button"
            style={{
              ...styles.pillBtn,
              ...(active ? { background: t.color, borderColor: t.color, color: "#1a1f2e" } : { color: t.color }),
            }}
            onClick={() => updateNode(node.id, { category: active ? null : key })}
          >
            <Icon size={13} /> {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- BLOCK PALETTE (barra de herramientas derecha) ---------- */
function BlockPalette({ onAdd, horizontal, category }) {
  const extra = category && CATEGORY_EXTRA_TOOL[category] ? [CATEGORY_EXTRA_TOOL[category]] : [];
  const tools = [...BLOCK_TOOLS, ...extra];
  return (
    <div style={horizontal ? styles.paletteH : styles.palette}>
      {!horizontal && <div style={styles.paletteTitle}>Herramientas</div>}
      <div style={horizontal ? { display: "flex", gap: 6, flexWrap: "wrap" } : { display: "flex", flexDirection: "column", gap: 6 }}>
        {tools.map((t) => {
          const Icon = t.makeIcon();
          return (
            <div key={t.type} draggable
              onDragStart={(e) => { e.dataTransfer.setData("text/wb-newblock", t.type); e.dataTransfer.effectAllowed = "copy"; }}
              onClick={() => onAdd(t.type)}
              style={styles.paletteItem}
              title={`Arrastra a la página o haz clic para añadir: ${t.label}`}>
              <Icon size={15} color="var(--accent)" /> <span>{t.label}</span>
            </div>
          );
        })}
      </div>
      {!horizontal && <div style={styles.paletteHint}>Arrastra a la página o haz clic para insertar un elemento.</div>}
    </div>
  );
}

/* ---------- BLOCK: TEXTO ---------- */
function TextBlock({ block, nodes, navigateByName, updateBlock }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(block.text || "");
  const taRef = useRef(null);
  useEffect(() => { setDraft(block.text || ""); setEditing(false); }, [block.id]);
  function commit() { updateBlock(block.id, { text: draft }); setEditing(false); }
  if (editing) {
    return (
      <>
        <FormatToolbar textareaRef={taRef} value={draft} onChange={setDraft} />
        <textarea ref={taRef} autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
          style={{ ...styles.textarea, minHeight: 120, textAlign: block.align || "left" }} />
      </>
    );
  }
  return (
    <div style={{ ...styles.renderedContent, minHeight: 36, textAlign: block.align || "left", ...(block.boxed ? styles.textBlockBoxed : {}) }}
      onClick={() => { setDraft(block.text || ""); setEditing(true); }}>
      {(block.text || "").trim()
        ? renderRich(block.text, nodes, navigateByName, block.id)
        : <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Cuadro de texto vacío — haz clic para escribir…</span>}
    </div>
  );
}

/* ---------- BLOCK: TÍTULO ---------- */
function HeadingBlock({ block, updateBlock }) {
  const [val, setVal] = useState(block.text || "");
  useEffect(() => { setVal(block.text || ""); }, [block.id]);
  return (
    <input value={val} onChange={(e) => setVal(e.target.value)} onBlur={() => updateBlock(block.id, { text: val })}
      placeholder="Título de sección" style={styles.headingInput} />
  );
}

/* ---------- BLOCK: IMAGEN ---------- */
function ImageBlock({ block, updateBlock }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);
  const imgKey = `cover-image:blk-${block.id}`;
  useEffect(() => {
    setLoading(true);
    (async () => { const d = block.imageKey ? await loadImage(imgKey) : null; setSrc(d); setLoading(false); })();
  }, [block.id, block.imageKey]);
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const ok = await saveImage(imgKey, reader.result);
      if (ok) { setSrc(reader.result); updateBlock(block.id, { imageKey: imgKey }); }
    };
    reader.readAsDataURL(file);
  }
  if (loading) return <div style={styles.imgPlaceholder}>Cargando imagen…</div>;
  if (!src) {
    return (
      <>
        <button style={styles.imgUploadBtn} onClick={() => inputRef.current?.click()}>
          <ImageIcon size={16} /> Subir imagen
        </button>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleUpload} />
      </>
    );
  }
  return (
    <div>
      <img src={src} alt={block.caption || ""}
        style={{ width: "100%", borderRadius: "var(--radius-md, 8px)", display: "block", objectFit: block.fit === "contain" ? "contain" : "cover", maxHeight: block.fit === "contain" ? 420 : 280, background: "var(--bg)", cursor: "pointer" }}
        onClick={() => inputRef.current?.click()} title="Clic para cambiar la imagen" />
      <input value={block.caption || ""} onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
        placeholder="Pie de imagen (opcional)" style={styles.captionInput} />
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleUpload} />
    </div>
  );
}

/* ---------- BLOCK: ESTADÍSTICAS DE OBJETO ---------- */
// Selector "quién puede usarlo": Cualquiera o un Personaje (protagonista)
// específico. Los NPC/Enemigo/Jefe/etc. no cuentan como protagonistas.
function UsableByPicker({ nodes, value, onChange }) {
  const characters = nodes.filter((n) => n.category === "character").sort((a, b) => a.name.localeCompare(b.name));
  return (
    <select value={value || "any"} onChange={(e) => onChange(e.target.value)} style={styles.statsInput}>
      <option value="any">— Cualquiera —</option>
      {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  );
}

function ItemStatsBlock({ block, nodes, updateBlock }) {
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

/* ---------- LIENZO: item (recuadro movible + redimensionable) ---------- */
function typeLabel(type) {
  return type === "heading" ? "Título" : type === "text" ? "Texto"
    : type === "image" ? "Imagen" : type === "itemStats" ? "Estadísticas de objeto" : "Recuadro";
}
function typeIcon(type) {
  return type === "heading" ? Type : type === "image" ? ImageIcon : type === "itemStats" ? Package : FileText;
}

function CanvasItem({ item, mode, nodes, navigateByName, selected, onSelect, startDrag, onUpdate, onDelete }) {
  const updateBlock = (_id, patch) => onUpdate(item.id, patch);
  const Icon = typeIcon(item.type);
  const canDelete = mode === "template" || !item.isSlot;
  const stop = (e) => e.stopPropagation();

  return (
    <div style={{ ...styles.canvasItem, left: `${item.x}%`, top: item.y, width: `${item.w}%`, height: item.h,
        ...(selected ? { borderColor: "var(--accent)", zIndex: 6 } : {}) }}
      onMouseDown={(e) => { e.stopPropagation(); onSelect(); }}>
      <div style={styles.canvasItemHeader}
        onMouseDown={(e) => { e.stopPropagation(); onSelect(); startDrag("move", e); }}
        onTouchStart={(e) => startDrag("move", e)}
        title="Arrastra para mover">
        <GripVertical size={12} color="var(--muted)" />
        {mode === "template" ? (
          <input value={item.label || ""} onChange={(e) => onUpdate(item.id, { label: e.target.value })}
            onMouseDown={stop} placeholder={typeLabel(item.type)} style={styles.slotLabelInput} />
        ) : (
          <span style={styles.canvasItemTitle}><Icon size={11} /> {item.label || typeLabel(item.type)}</span>
        )}
        {mode === "entry" && item.type === "text" && (
          <>
            <button style={{ ...styles.blockBtn, ...(item.align === "center" ? styles.blockBtnOn : {}) }} title="Alinear"
              onMouseDown={stop} onClick={() => onUpdate(item.id, { align: item.align === "center" ? "left" : "center" })}>
              {item.align === "center" ? <AlignCenter size={12} /> : <AlignLeft size={12} />}
            </button>
            <button style={{ ...styles.blockBtn, ...(item.boxed ? styles.blockBtnOn : {}) }} title="Recuadro destacado"
              onMouseDown={stop} onClick={() => onUpdate(item.id, { boxed: !item.boxed })}><Square size={12} /></button>
          </>
        )}
        {mode === "entry" && item.type === "image" && (
          <button style={{ ...styles.blockBtn, ...(item.fit === "contain" ? styles.blockBtnOn : {}) }} title="Ajuste de imagen"
            onMouseDown={stop} onClick={() => onUpdate(item.id, { fit: item.fit === "contain" ? "cover" : "contain" })}><ImageIcon size={12} /></button>
        )}
        {canDelete && (
          <button style={{ ...styles.blockBtn, color: "#c45c5c", marginLeft: "auto" }} title="Eliminar"
            onMouseDown={stop} onClick={() => onDelete(item.id)}><Trash2 size={12} /></button>
        )}
      </div>
      <div style={styles.canvasItemBody}>
        {mode === "template" ? (
          <div style={styles.slotPreview}><Icon size={16} /> {typeLabel(item.type)}</div>
        ) : item.type === "heading" ? <HeadingBlock block={item} updateBlock={updateBlock} />
          : item.type === "text" ? <TextBlock block={item} nodes={nodes} navigateByName={navigateByName} updateBlock={updateBlock} />
          : item.type === "image" ? <ImageBlock block={item} updateBlock={updateBlock} />
          : item.type === "itemStats" ? <ItemStatsBlock block={item} nodes={nodes} updateBlock={updateBlock} />
          : null}
      </div>
      <div style={styles.resizeHandle} title="Arrastra para redimensionar"
        onMouseDown={(e) => { e.stopPropagation(); startDrag("resize", e); }}
        onTouchStart={(e) => { e.stopPropagation(); startDrag("resize", e); }} />
    </div>
  );
}

/* ---------- LIENZO (mover + redimensionar recuadros) ---------- */
// Cuadrícula de puntos guía: todo el movimiento/redimensionado se ajusta a
// múltiplos de GRID_PX (en píxeles reales del lienzo), y el fondo de puntos
// usa el mismo tamaño, así los recuadros calzan visualmente con las guías.
const GRID_PX = 20;
function snapPx(px) { return Math.round(px / GRID_PX) * GRID_PX; }

function CanvasEditor({ items, mode, nodes, navigateByName, onUpdate, onDelete, onAdd, isMobile, emptyHint }) {
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [dropActive, setDropActive] = useState(false);

  useEffect(() => {
    function move(e) {
      const d = dragRef.current;
      if (!d || !containerRef.current) return;
      const point = e.touches ? e.touches[0] : e;
      const rect = containerRef.current.getBoundingClientRect();
      const dxPx = point.clientX - d.startX;
      const dyPx = point.clientY - d.startY;
      if (d.mode === "move") {
        const xPx = snapPx((d.orig.x / 100) * rect.width + dxPx);
        const y = snapPx(d.orig.y + dyPx);
        onUpdate(d.id, {
          x: Math.max(0, Math.min(100 - d.orig.w, (xPx / rect.width) * 100)),
          y: Math.max(0, y),
        });
      } else {
        const wPx = snapPx((d.orig.w / 100) * rect.width + dxPx);
        const h = snapPx(d.orig.h + dyPx);
        onUpdate(d.id, {
          w: Math.max(12, Math.min(100 - d.orig.x, (wPx / rect.width) * 100)),
          h: Math.max(60, h),
        });
      }
      if (e.cancelable) e.preventDefault();
    }
    function up() { dragRef.current = null; }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [onUpdate]);

  function startDrag(itemId, m, e) {
    const it = items.find((x) => x.id === itemId);
    if (!it) return;
    const p = e.touches ? e.touches[0] : e;
    dragRef.current = { id: itemId, mode: m, startX: p.clientX, startY: p.clientY, orig: { x: it.x, y: it.y, w: it.w, h: it.h } };
  }
  function onCanvasDragOver(e) {
    if (!e.dataTransfer.types.includes("text/wb-newblock")) return;
    e.preventDefault(); setDropActive(true);
  }
  function onCanvasDrop(e) {
    setDropActive(false);
    const type = e.dataTransfer.getData("text/wb-newblock");
    if (!type || !containerRef.current) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const xPx = snapPx(e.clientX - rect.left);
    const x = Math.max(0, Math.min(88, (xPx / rect.width) * 100));
    const y = Math.max(0, snapPx(e.clientY - rect.top));
    onAdd(type, { x, y });
  }

  // En móvil no hay lienzo libre: apilar por 'y' y editar en línea.
  if (isMobile) {
    const ordered = [...items].sort((a, b) => (a.y || 0) - (b.y || 0));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ordered.length === 0 && <div style={styles.canvasEmpty}>{emptyHint || "Vacío."}</div>}
        {ordered.map((it) => (
          <div key={it.id} style={{ ...styles.canvasItem, position: "relative", left: 0, top: 0, width: "100%", height: "auto" }}>
            <CanvasItem item={{ ...it, x: 0, y: 0, w: 100, h: it.h }} mode={mode} nodes={nodes} navigateByName={navigateByName}
              selected={false} onSelect={() => {}} startDrag={() => {}} onUpdate={onUpdate} onDelete={onDelete} />
          </div>
        ))}
      </div>
    );
  }

  const canvasHeight = Math.max(220, bottomOf(items) + 60);
  return (
    <div ref={containerRef}
      style={{ ...styles.canvas, height: canvasHeight, ...(dropActive ? { outline: "2px dashed var(--accent)" } : {}) }}
      onMouseDown={() => setSelected(null)}
      onDragOver={onCanvasDragOver} onDragLeave={() => setDropActive(false)} onDrop={onCanvasDrop}>
      {items.length === 0 && <div style={styles.canvasEmpty}>{emptyHint || "Vacío. Usa la paleta para añadir recuadros."}</div>}
      {items.map((it) => (
        <CanvasItem key={it.id} item={it} mode={mode} nodes={nodes} navigateByName={navigateByName}
          selected={selected === it.id} onSelect={() => setSelected(it.id)}
          startDrag={(m, e) => startDrag(it.id, m, e)}
          onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
}

/* ---------- LIENZO LIBRE (carpetas y páginas sin plantilla) ---------- */
function FreeBlockCanvas({ node, nodes, updateNodeWithLinks, navigateByName, isMobile }) {
  const blocksRef = useRef(getPageBlocks(node));
  useEffect(() => { blocksRef.current = getPageBlocks(node); }, [node]);
  function commit(next) {
    blocksRef.current = next;
    updateNodeWithLinks(node.id, { blocks: next }, scanTextOf(next, null));
  }
  const items = getPageBlocks(node);
  function addBlock(type, pos) {
    const nb = makeBlock(type);
    nb.x = pos?.x ?? 2;
    nb.y = pos?.y ?? bottomOf(items) + 12;
    commit([...blocksRef.current, nb]);
  }
  function onUpdate(id, patch) { commit(blocksRef.current.map((b) => (b.id === id ? { ...b, ...patch } : b))); }
  function onDelete(id) {
    const b = blocksRef.current.find((x) => x.id === id);
    if (b && b.type === "image" && b.imageKey) deleteImage(b.imageKey);
    commit(blocksRef.current.filter((x) => x.id !== id));
  }
  return (
    <div>
      <BlockPalette onAdd={(t) => addBlock(t)} horizontal />
      <div style={{ paddingTop: 10 }}>
        <CanvasEditor items={items} mode="entry" nodes={nodes} navigateByName={navigateByName}
          onUpdate={onUpdate} onDelete={onDelete} onAdd={addBlock} isMobile={isMobile}
          emptyHint="Vacío. Arrastra una herramienta a la página o haz clic para añadir un recuadro." />
      </div>
    </div>
  );
}

/* ---------- PAGE EDITOR ---------- */
// Texto combinado (bloques + contenido de slots) para escanear [[enlaces]].
function scanTextOf(blocks, slotData) {
  const parts = [];
  (blocks || []).forEach((b) => { if (b.type === "text" || b.type === "heading") parts.push(b.text || ""); });
  Object.values(slotData || {}).forEach((v) => { if (v && typeof v.text === "string") parts.push(v.text); });
  return parts.join("\n");
}

function PageEditor({ node, nodes, updateNode, updateNodeWithLinks, navigateByName, isMobile, typeTemplates }) {
  const [title, setTitle] = useState(node.name);
  useEffect(() => { setTitle(node.name); }, [node.id]);

  const template = node.category && typeTemplates ? typeTemplates[node.category] : null;
  const hasTemplate = !!(template && Array.isArray(template.slots) && template.slots.length);

  // refs para que varias mutaciones seguidas se compongan sin pisarse.
  const blocksRef = useRef(getPageBlocks(node));
  const slotDataRef = useRef(node.slotData || {});
  useEffect(() => { blocksRef.current = getPageBlocks(node); slotDataRef.current = node.slotData || {}; }, [node]);

  function commit(patch) {
    if (patch.blocks) blocksRef.current = patch.blocks;
    if (patch.slotData) slotDataRef.current = patch.slotData;
    updateNodeWithLinks(node.id, patch, scanTextOf(blocksRef.current, slotDataRef.current));
  }

  // Items del lienzo: slots de la plantilla (con overrides de esta entrada) + bloques extra libres.
  const slotItems = hasTemplate ? template.slots.map((s) => {
    const ov = (node.slotData && node.slotData[s.slotId]) || {};
    return { ...s, ...ov, id: `slot:${node.id}:${s.slotId}`, slotId: s.slotId, isSlot: true };
  }) : [];
  const extraItems = getPageBlocks(node).map((b) => ({ ...b, isSlot: false }));
  const items = [...slotItems, ...extraItems];

  function addBlock(type, pos) {
    const nb = makeBlock(type);
    nb.x = pos?.x ?? 2;
    nb.y = pos?.y ?? bottomOf(items) + 12;
    commit({ blocks: [...blocksRef.current, nb] });
  }
  function onUpdate(itemId, patch) {
    if (itemId.startsWith("slot:")) {
      const slotId = itemId.split(":")[2];
      const cur = slotDataRef.current;
      commit({ slotData: { ...cur, [slotId]: { ...(cur[slotId] || {}), ...patch } } });
    } else {
      commit({ blocks: blocksRef.current.map((b) => (b.id === itemId ? { ...b, ...patch } : b)) });
    }
  }
  function onDelete(itemId) {
    if (itemId.startsWith("slot:")) return; // los slots se gestionan en la plantilla del tipo
    const b = blocksRef.current.find((x) => x.id === itemId);
    if (b && b.type === "image" && b.imageKey) deleteImage(b.imageKey);
    commit({ blocks: blocksRef.current.filter((x) => x.id !== itemId) });
  }

  const emptyHint = hasTemplate
    ? "Añade contenido a los recuadros del formato, o usa la paleta para bloques extra."
    : "Página vacía. Arrastra una herramienta a la página o haz clic para añadir un recuadro.";

  const canvas = (
    <div style={styles.pageWrap}>
      <CoverImage node={node} updateNode={updateNode} margin="0 0 18px" />
      <input value={title} onChange={(e) => setTitle(e.target.value)}
        onBlur={() => updateNode(node.id, { name: title.trim() || node.name })}
        style={styles.pageTitleInput} />
      <EntryTypePicker node={node} updateNode={updateNode} />
      {hasTemplate && (
        <div style={styles.templateBadge}>
          <LayoutDashboard size={12} /> Formato de {ENTRY_TYPES[node.category]?.label}
        </div>
      )}
      <CanvasEditor items={items} mode="entry" nodes={nodes} navigateByName={navigateByName}
        onUpdate={onUpdate} onDelete={onDelete} onAdd={addBlock} isMobile={isMobile} emptyHint={emptyHint} />
    </div>
  );

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <BlockPalette onAdd={(t) => addBlock(t)} horizontal category={node.category} />
        {canvas}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
      {canvas}
      <BlockPalette onAdd={(t) => addBlock(t)} category={node.category} />
    </div>
  );
}

/* ---------- MAP EDITOR ---------- */
function MapEditor({ node, nodes, updateNode, setSelectedId, isMobile }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [loadingImg, setLoadingImg] = useState(true);
  const [placing, setPlacing] = useState(null);
  const [customIconData, setCustomIconData] = useState(null);
  const [activePin, setActivePin] = useState(null);
  const [hoverPin, setHoverPin] = useState(null);
  const fileInputRef = useRef(null);
  const iconInputRef = useRef(null);
  const mapContainerRef = useRef(null);
  const pinDragRef = useRef(null);
  const imgKey = `map-image:${node.id}`;

  useEffect(() => {
    setLoadingImg(true); setPlacing(null); setActivePin(null);
    (async () => {
      const data = await loadImage(node.mapImageKey ? imgKey : null);
      setImgSrc(data); setLoadingImg(false);
    })();
  }, [node.id]);

  useEffect(() => {
    function move(e) {
      const d = pinDragRef.current;
      if (!d || !mapContainerRef.current) return;
      const point = e.touches ? e.touches[0] : e;
      const rect = mapContainerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((point.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((point.clientY - rect.top) / rect.height) * 100));
      d.moved = true;
      updateNode(node.id, { pins: (node.pins || []).map((p) => (p.id === d.id ? { ...p, x, y } : p)) });
      if (e.cancelable) e.preventDefault();
    }
    function up() {
      const d = pinDragRef.current;
      if (d && !d.moved) setActivePin(d.id);
      pinDragRef.current = null;
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [node.id, node.pins]);

  async function handleUploadMap(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const ok = await saveImage(imgKey, reader.result);
      if (ok) { setImgSrc(reader.result); updateNode(node.id, { mapImageKey: imgKey }); }
    };
    reader.readAsDataURL(file);
  }
  async function handleUploadCustomIcon(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setCustomIconData(reader.result); setPlacing("custom"); };
    reader.readAsDataURL(file);
  }
  function handleMapClick(e) {
    if (!placing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const pin = { id: uid(), x, y, icon: placing === "custom" ? null : placing, customIcon: placing === "custom" ? customIconData : null, label: "Nuevo punto", linkedPageId: null };
    updateNode(node.id, { pins: [...(node.pins || []), pin] });
    setPlacing(null); setCustomIconData(null); setActivePin(pin.id);
  }
  function updatePin(pinId, patch) { updateNode(node.id, { pins: (node.pins || []).map((p) => (p.id === pinId ? { ...p, ...patch } : p)) }); }
  function deletePin(pinId) { updateNode(node.id, { pins: (node.pins || []).filter((p) => p.id !== pinId) }); setActivePin(null); }

  const activePinData = (node.pins || []).find((p) => p.id === activePin);

  return (
    <div style={styles.mapWrap}>
      <div style={styles.mapToolbar}>
        <span style={styles.mapTitleText}>{node.name}</span>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          <button style={styles.pillBtn} onClick={() => fileInputRef.current?.click()}>
            <Upload size={13} /> {imgSrc ? "Cambiar mapa" : "Subir mapa"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleUploadMap} />
          <input ref={iconInputRef} type="file" accept="image/*" hidden onChange={handleUploadCustomIcon} />
          {ICON_KEYS.map((k) => {
            const I = ICONS[k];
            return (
              <button key={k} title={`Colocar icono: ${k}`} onClick={() => setPlacing(placing === k ? null : k)}
                style={{ ...styles.iconBtn, background: placing === k ? "var(--accent)" : "transparent" }}>
                <I size={15} color={placing === k ? "#1a1f2e" : "var(--text)"} />
              </button>
            );
          })}
          <button title="Subir icono personalizado" onClick={() => iconInputRef.current?.click()}
            style={{ ...styles.iconBtn, background: placing === "custom" ? "var(--accent)" : "transparent" }}>
            <Plus size={15} color={placing === "custom" ? "#1a1f2e" : "var(--text)"} />
          </button>
        </div>
      </div>
      {placing && (
        <div style={styles.placingHint}>Haz clic en el mapa para colocar el icono (luego podrás arrastrarlo). <X size={12} style={{ cursor: "pointer" }} onClick={() => setPlacing(null)} /></div>
      )}
      <div style={styles.mapCanvasOuter}>
        {loadingImg ? (
          <div style={styles.mapEmpty}>Cargando mapa…</div>
        ) : imgSrc ? (
          <div ref={mapContainerRef} style={{ position: "relative", display: "inline-block", cursor: placing ? "crosshair" : "default" }} onClick={handleMapClick}>
            <img src={imgSrc} alt={node.name} style={styles.mapImage} draggable={false} />
            {(node.pins || []).map((p) => {
              const PinIcon = p.icon ? ICONS[p.icon] : null;
              return (
                <div key={p.id}
                  onMouseDown={(e) => { e.stopPropagation(); pinDragRef.current = { id: p.id, moved: false }; }}
                  onTouchStart={(e) => { e.stopPropagation(); pinDragRef.current = { id: p.id, moved: false }; }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={() => { if (!pinDragRef.current) setHoverPin(p.id); }}
                  onMouseLeave={() => setHoverPin((h) => (h === p.id ? null : h))}
                  style={{ ...styles.pinMarker, left: `${p.x}%`, top: `${p.y}%`, cursor: "grab" }} title={`${p.label} (arrastra para mover)`}>
                  {p.customIcon ? <img src={p.customIcon} alt="" style={{ width: 20, height: 20, borderRadius: "var(--radius-sm, 4px)" }} /> : <PinIcon size={18} color="#1a1f2e" />}
                </div>
              );
            })}
            {(() => {
              if (!hoverPin) return null;
              const p = (node.pins || []).find((x) => x.id === hoverPin);
              if (!p || p.showCard === false || !p.linkedPageId) return null;
              const linked = findNode(nodes, p.linkedPageId);
              if (!linked) return null;
              const goRight = p.x < 60;
              return (
                <div style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: `translate(${goRight ? "16px" : "calc(-100% - 16px)"}, -50%)`, zIndex: 20, pointerEvents: "none" }}>
                  <NodeCard node={linked} nodes={nodes} floating />
                </div>
              );
            })()}
          </div>
        ) : (
          <div style={styles.mapEmpty}>
            <MapIcon size={42} color="var(--muted)" />
            <p>Sube una imagen para empezar a marcar este mapa.</p>
            <button style={styles.pillBtn} onClick={() => fileInputRef.current?.click()}><Upload size={13} /> Subir mapa</button>
          </div>
        )}
      </div>
      {activePinData && (
        <div style={isMobile ? styles.pinPanelMobile : styles.pinPanel}>
          <div style={styles.pinPanelHeader}>
            <span>Punto de interés</span>
            <X size={14} style={{ cursor: "pointer" }} onClick={() => setActivePin(null)} />
          </div>
          <input value={activePinData.label} onChange={(e) => updatePin(activePinData.id, { label: e.target.value })}
            placeholder="Nombre del punto" style={styles.pinInput} />
          <LinkPicker nodes={nodes} excludeId={node.id}
            value={activePinData.linkedPageId}
            onChange={(v) => updatePin(activePinData.id, { linkedPageId: v })} />
          {activePinData.linkedPageId && (
            <>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)", cursor: "pointer" }}>
                <input type="checkbox" checked={activePinData.showCard !== false}
                  onChange={(e) => updatePin(activePinData.id, { showCard: e.target.checked })} />
                Ver tarjeta flotante al pasar el cursor
              </label>
              <button style={styles.pillBtn} onClick={() => setSelectedId(activePinData.linkedPageId)}>Ir a la página enlazada</button>
            </>
          )}
          <button style={{ ...styles.pillBtn, color: "#c45c5c" }} onClick={() => deletePin(activePinData.id)}>
            <Trash2 size={13} /> Eliminar punto
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- TIMELINE EDITOR ---------- */
function normalizeEvents(events) {
  const withSlot = events.map((e, i) => ({ ...e, slot: e.slot ?? i }));
  const slots = [...new Set(withSlot.map((e) => e.slot))].sort((a, b) => a - b);
  const remap = {};
  slots.forEach((s, i) => { remap[s] = i; });
  return withSlot.map((e) => ({ ...e, slot: remap[e.slot] }));
}

function TimelineEditor({ node, nodes, updateNode, setSelectedId, isMobile }) {
  const events = useMemo(() => normalizeEvents(node.events || []), [node.events]);
  const orientation = node.orientation || "vertical";
  const maxSlot = events.length ? Math.max(...events.map((e) => e.slot)) : -1;

  const groups = useMemo(() => {
    const g = [];
    for (let s = 0; s <= maxSlot; s++) g.push(events.filter((e) => e.slot === s));
    return g.filter((arr) => arr.length);
  }, [events, maxSlot]);

  function commit(evts) { updateNode(node.id, { events: normalizeEvents(evts) }); }
  function addEvent() {
    commit([...events, { id: uid(), date: "", title: "Nuevo acontecimiento", description: "", linkedPageId: null, slot: maxSlot + 1 }]);
  }
  function addParallel(slot) {
    commit([...events, { id: uid(), date: "", title: "Evento paralelo", description: "", linkedPageId: null, slot }]);
  }
  function updateEvent(id, patch) { commit(events.map((e) => (e.id === id ? { ...e, ...patch } : e))); }
  function deleteEvent(id) { commit(events.filter((e) => e.id !== id)); }
  function moveEvent(id, dir) {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    const target = ev.slot + dir;
    if (target < 0) return;
    commit(events.map((e) => (e.id === id ? { ...e, slot: target + (dir > 0 ? 0.5 : -0.5) } : e)));
  }

  const EventCard = ({ ev }) => (
    <div style={{ ...styles.timelineCard, minWidth: orientation === "horizontal" ? 240 : undefined }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
        <input value={ev.date} onChange={(e) => updateEvent(ev.id, { date: e.target.value })} placeholder="Fecha / Era" style={styles.timelineDateInput} />
        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          <button style={styles.miniBtn} onClick={() => moveEvent(ev.id, -1)} title={orientation === "horizontal" ? "Mover a la izquierda" : "Mover antes"}>
            {orientation === "horizontal" ? "←" : "↑"}
          </button>
          <button style={styles.miniBtn} onClick={() => moveEvent(ev.id, 1)} title={orientation === "horizontal" ? "Mover a la derecha" : "Mover después"}>
            {orientation === "horizontal" ? "→" : "↓"}
          </button>
          <button style={{ ...styles.miniBtn, color: "#c45c5c" }} onClick={() => deleteEvent(ev.id)}><Trash2 size={12} /></button>
        </div>
      </div>
      <input value={ev.title} onChange={(e) => updateEvent(ev.id, { title: e.target.value })} placeholder="Título del acontecimiento" style={styles.timelineTitleInput} />
      <textarea value={ev.description} onChange={(e) => updateEvent(ev.id, { description: e.target.value })} placeholder="Describe qué ocurrió…" style={styles.timelineDescInput} />
      <LinkPicker nodes={nodes} excludeId={node.id}
        value={ev.linkedPageId}
        onChange={(v) => updateEvent(ev.id, { linkedPageId: v })} />
      {ev.linkedPageId && (
        <button style={{ ...styles.pillBtn, marginTop: 6, alignSelf: "flex-start" }} onClick={() => setSelectedId(ev.linkedPageId)}>Ir a la página enlazada</button>
      )}
    </div>
  );

  return (
    <div style={styles.timelineWrap}>
      <h1 style={styles.pageTitle}>{node.name}</h1>
      <div style={{ padding: "0 16px 8px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button style={styles.pillBtn} onClick={addEvent}><Plus size={13} /> Acontecimiento</button>
        <button style={styles.pillBtn}
          onClick={() => updateNode(node.id, { orientation: orientation === "vertical" ? "horizontal" : "vertical" })}>
          {orientation === "vertical" ? <ArrowLeftRight size={13} /> : <ArrowUpDown size={13} />}
          {orientation === "vertical" ? "Ver horizontal" : "Ver vertical"}
        </button>
      </div>
      {groups.length === 0 && (
        <div style={{ color: "var(--muted)", fontStyle: "italic", padding: "8px 16px" }}>Sin acontecimientos aún.</div>
      )}

      {orientation === "vertical" ? (
        <div style={styles.timelineTrack}>
          {groups.map((group, gi) => (
            <div key={gi} style={styles.timelineEventRow}>
              <div style={styles.timelineDot} />
              {gi < groups.length - 1 && <div style={styles.timelineLine} />}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                {group.map((ev) => <div key={ev.id} style={{ flex: "1 1 260px", maxWidth: 420 }}><EventCard ev={ev} /></div>)}
              </div>
              <button style={{ ...styles.miniBtn, marginBottom: 14 }} onClick={() => addParallel(group[0].slot)} title="Añadir evento simultáneo">
                <Columns size={11} /> + Paralelo
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.timelineHTrack}>
          <div style={styles.timelineHLine} />
          <div style={{ display: "flex", gap: 18, alignItems: "flex-start", padding: "0 16px" }}>
            {groups.map((group, gi) => (
              <div key={gi} style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", paddingTop: 22 }}>
                <div style={styles.timelineHDot} />
                {group.map((ev) => <EventCard key={ev.id} ev={ev} />)}
                <button style={styles.miniBtn} onClick={() => addParallel(group[0].slot)} title="Añadir evento simultáneo">
                  <Columns size={11} /> + Paralelo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- EDGE HELPERS ---------- */
function edgeDash(style) {
  if (style === "dashed") return "8 5";
  if (style === "dotted") return "2 4";
  return undefined;
}
function EdgeMarkerDefs({ edges }) {
  return (
    <defs>
      {edges.map((e) => {
        const color = e.color || "#8a8298";
        return (
          <marker key={e.id} id={`arr-end-${e.id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>
        );
      })}
    </defs>
  );
}

/* ---------- BOARD EDITOR ---------- */
function BoardEditor({ node, nodes, updateNode, setSelectedId, isMobile }) {
  const boardNodes = node.boardNodes || [];
  const boardEdges = node.boardEdges || [];
  const boardShapes = node.boardShapes || [];
  const [linkMode, setLinkMode] = useState(false);
  const [linkFirst, setLinkFirst] = useState(null);
  const [activeBubble, setActiveBubble] = useState(null);
  const [activeEdge, setActiveEdge] = useState(null);
  const [activeShape, setActiveShape] = useState(null);
  const draggingRef = useRef(null);
  const canvasRef = useRef(null);

  function addBubble(label = "Nueva idea", linkedPageId = null, x = null, y = null) {
    const bubble = {
      id: uid(),
      x: x ?? 45 + Math.random() * 10, y: y ?? 45 + Math.random() * 10,
      label, color: BUBBLE_COLORS[boardNodes.length % BUBBLE_COLORS.length],
      linkedPageId,
    };
    updateNode(node.id, { boardNodes: [...boardNodes, bubble] });
    setActiveBubble(bubble.id);
  }
  function addShape() {
    const shape = { id: uid(), x: 35, y: 30, w: 30, h: 25, kind: "rect", color: SHAPE_COLORS[boardShapes.length % SHAPE_COLORS.length], label: "" };
    updateNode(node.id, { boardShapes: [...boardShapes, shape] });
    setActiveShape(shape.id); setActiveBubble(null); setActiveEdge(null);
  }
  function updateShape(id, patch) { updateNode(node.id, { boardShapes: boardShapes.map((s) => (s.id === id ? { ...s, ...patch } : s)) }); }
  function deleteShape(id) { updateNode(node.id, { boardShapes: boardShapes.filter((s) => s.id !== id) }); setActiveShape(null); }
  function updateBubble(id, patch) { updateNode(node.id, { boardNodes: boardNodes.map((b) => (b.id === id ? { ...b, ...patch } : b)) }); }
  function deleteBubble(id) {
    updateNode(node.id, {
      boardNodes: boardNodes.filter((b) => b.id !== id),
      boardEdges: boardEdges.filter((e) => e.from !== id && e.to !== id),
    });
    setActiveBubble(null);
  }
  function addEdge(fromId, toId) {
    if (fromId === toId) return;
    const exists = boardEdges.some((e) => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId));
    if (exists) return;
    updateNode(node.id, { boardEdges: [...boardEdges, { id: uid(), from: fromId, to: toId, label: "", color: "#8a8298", style: "solid", arrows: "none" }] });
  }
  function deleteEdge(id) { updateNode(node.id, { boardEdges: boardEdges.filter((e) => e.id !== id) }); setActiveEdge(null); }
  function updateEdge(id, patch) { updateNode(node.id, { boardEdges: boardEdges.map((e) => (e.id === id ? { ...e, ...patch } : e)) }); }

  function handleBubbleClick(id) {
    if (linkMode) {
      if (!linkFirst) setLinkFirst(id);
      else { addEdge(linkFirst, id); setLinkFirst(null); }
      return;
    }
    setActiveEdge(null); setActiveShape(null); setActiveBubble(id);
  }
  function startDrag(id, e) {
    if (linkMode) return;
    e.stopPropagation();
    draggingRef.current = id;
  }
  useEffect(() => {
    function move(e) {
      const id = draggingRef.current;
      if (!id || !canvasRef.current) return;
      const point = e.touches ? e.touches[0] : e;
      const rect = canvasRef.current.getBoundingClientRect();
      let x = ((point.clientX - rect.left) / rect.width) * 100;
      let y = ((point.clientY - rect.top) / rect.height) * 100;
      x = Math.max(2, Math.min(98, x));
      y = Math.max(2, Math.min(98, y));
      updateBubble(id, { x, y });
    }
    function up() { draggingRef.current = null; }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [boardNodes]);

  function handleCanvasDrop(e) {
    e.preventDefault();
    const dragId = e.dataTransfer.getData("text/wb-node");
    if (!dragId) return;
    const dragged = findNode(nodes, dragId);
    if (!dragged) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));
    addBubble(dragged.name, dragged.id, x, y);
  }

  const activeBubbleData = boardNodes.find((b) => b.id === activeBubble);
  const activeEdgeData = boardEdges.find((e) => e.id === activeEdge);
  const activeShapeData = boardShapes.find((s) => s.id === activeShape);

  return (
    <div style={styles.boardWrap}>
      <div style={styles.mapToolbar}>
        <span style={styles.mapTitleText}>{node.name}</span>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          <button style={styles.pillBtn} onClick={() => addBubble()}><Plus size={13} /> Idea</button>
          <button style={styles.pillBtn} onClick={addShape}><Square size={13} /> Figura</button>
          <button
            style={{ ...styles.pillBtn, background: linkMode ? "var(--accent)" : "var(--panel2)", color: linkMode ? "#1a1f2e" : "var(--text)" }}
            onClick={() => { setLinkMode((m) => !m); setLinkFirst(null); }}>
            <Share2 size={13} /> {linkMode ? "Vinculando…" : "Vincular"}
          </button>
        </div>
      </div>
      {linkMode && (
        <div style={styles.placingHint}>
          {linkFirst ? "Toca otra idea para crear la relación." : "Toca la primera idea a vincular."}
          <X size={12} style={{ cursor: "pointer" }} onClick={() => { setLinkMode(false); setLinkFirst(null); }} />
        </div>
      )}
      <div ref={canvasRef} style={styles.boardCanvas}
        onClick={() => { setActiveBubble(null); setActiveEdge(null); setActiveShape(null); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleCanvasDrop}
      >
        <ShapesLayer shapes={boardShapes} updateShape={updateShape}
          selectShape={(id) => { setActiveShape(id); setActiveBubble(null); setActiveEdge(null); }}
          selectedId={activeShape} containerRef={canvasRef} />
        <svg style={styles.boardSvg}>
          <EdgeMarkerDefs edges={boardEdges} />
          {boardEdges.map((e) => {
            const a = boardNodes.find((b) => b.id === e.from);
            const b = boardNodes.find((b) => b.id === e.to);
            if (!a || !b) return null;
            const color = e.color || "#8a8298";
            const arrows = e.arrows || "none";
            return (
              <g key={e.id}>
                <line x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`}
                  stroke="transparent" strokeWidth={14}
                  style={{ cursor: "pointer", pointerEvents: "stroke" }}
                  onClick={(ev) => { ev.stopPropagation(); setActiveBubble(null); setActiveShape(null); setActiveEdge(e.id); }} />
                <line x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`}
                  stroke={activeEdge === e.id ? "var(--accent)" : color}
                  strokeWidth={activeEdge === e.id ? 2.5 : 1.8}
                  strokeDasharray={edgeDash(e.style)}
                  markerEnd={arrows === "end" || arrows === "both" ? `url(#arr-end-${e.id})` : undefined}
                  markerStart={arrows === "both" ? `url(#arr-end-${e.id})` : undefined}
                  style={{ pointerEvents: "none" }} />
                {e.label && (
                  <text x={`${(a.x + b.x) / 2}%`} y={`${(a.y + b.y) / 2}%`} dy={-4}
                    fill={color} fontSize="11" textAnchor="middle"
                    style={{ pointerEvents: "none", fontFamily: "'Crimson Text', serif" }}>
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {boardNodes.length === 0 && boardShapes.length === 0 && (
          <div style={styles.boardEmptyHint}>Pulsa "Idea" o arrastra una entrada del panel izquierdo hasta aquí.</div>
        )}
        {boardNodes.map((b) => (
          <div key={b.id}
            onMouseDown={(e) => startDrag(b.id, e)}
            onTouchStart={(e) => startDrag(b.id, e)}
            onClick={(e) => { e.stopPropagation(); handleBubbleClick(b.id); }}
            style={{
              ...styles.bubble, left: `${b.x}%`, top: `${b.y}%`, borderColor: b.color,
              boxShadow: activeBubble === b.id || linkFirst === b.id ? `0 0 0 3px ${b.color}55` : "0 2px 8px rgba(0,0,0,0.4)",
            }}>
            {b.label}
          </div>
        ))}
      </div>

      {activeBubbleData && (
        <div style={isMobile ? styles.pinPanelMobile : styles.pinPanel}>
          <div style={styles.pinPanelHeader}>
            <span>Concepto</span>
            <X size={14} style={{ cursor: "pointer" }} onClick={() => setActiveBubble(null)} />
          </div>
          <input value={activeBubbleData.label} onChange={(e) => updateBubble(activeBubbleData.id, { label: e.target.value })} style={styles.pinInput} />
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {BUBBLE_COLORS.map((c) => (
              <button key={c} onClick={() => updateBubble(activeBubbleData.id, { color: c })}
                style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: activeBubbleData.color === c ? "2px solid var(--text)" : "2px solid transparent", cursor: "pointer" }} />
            ))}
          </div>
          <LinkPicker nodes={nodes} excludeId={node.id}
            value={activeBubbleData.linkedPageId}
            onChange={(v) => updateBubble(activeBubbleData.id, { linkedPageId: v })} />
          {activeBubbleData.linkedPageId && (
            <button style={styles.pillBtn} onClick={() => setSelectedId(activeBubbleData.linkedPageId)}>Ir a la página enlazada</button>
          )}
          <button style={{ ...styles.pillBtn, color: "#c45c5c" }} onClick={() => deleteBubble(activeBubbleData.id)}>
            <Trash2 size={13} /> Eliminar concepto
          </button>
        </div>
      )}

      {activeEdgeData && (
        <div style={isMobile ? styles.pinPanelMobile : styles.pinPanel}>
          <div style={styles.pinPanelHeader}>
            <span>Relación</span>
            <X size={14} style={{ cursor: "pointer" }} onClick={() => setActiveEdge(null)} />
          </div>
          <input value={activeEdgeData.label} onChange={(e) => updateEdge(activeEdgeData.id, { label: e.target.value })}
            placeholder="Describe la relación (ej. aliados…)" style={styles.pinInput} />
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Estilo de línea</div>
          <div style={{ display: "flex", gap: 5 }}>
            {[["solid", "Sólida"], ["dashed", "Segmentada"], ["dotted", "Punteada"]].map(([v, lbl]) => (
              <button key={v} onClick={() => updateEdge(activeEdgeData.id, { style: v })}
                style={{ ...styles.miniBtn, background: (activeEdgeData.style || "solid") === v ? "var(--accent)" : "var(--panel2)", color: (activeEdgeData.style || "solid") === v ? "#1a1f2e" : "var(--text)" }}>
                {lbl}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Flechas</div>
          <div style={{ display: "flex", gap: 5 }}>
            {[["none", "Sin flecha"], ["end", "→"], ["both", "↔"]].map(([v, lbl]) => (
              <button key={v} onClick={() => updateEdge(activeEdgeData.id, { arrows: v })}
                style={{ ...styles.miniBtn, background: (activeEdgeData.arrows || "none") === v ? "var(--accent)" : "var(--panel2)", color: (activeEdgeData.arrows || "none") === v ? "#1a1f2e" : "var(--text)" }}>
                {lbl}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Color de línea</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {EDGE_COLORS.map((c) => (
              <button key={c} onClick={() => updateEdge(activeEdgeData.id, { color: c })}
                style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: (activeEdgeData.color || "#8a8298") === c ? "2px solid var(--text)" : "2px solid transparent", cursor: "pointer" }} />
            ))}
          </div>
          <button style={{ ...styles.pillBtn, color: "#c45c5c" }} onClick={() => deleteEdge(activeEdgeData.id)}>
            <Trash2 size={13} /> Eliminar relación
          </button>
        </div>
      )}

      {activeShapeData && (
        <ShapePanel shape={activeShapeData} updateShape={updateShape} deleteShape={deleteShape}
          onClose={() => setActiveShape(null)} isMobile={isMobile} />
      )}
    </div>
  );
}

/* ---------- BRAIN VIEW (lienzo grande desplazable) ---------- */
const BRAIN_W = 2600;
const BRAIN_H = 1800;

function computeBrainGraph(nodes) {
  const nameIndex = {};
  nodes.forEach((n) => { nameIndex[n.name.toLowerCase()] = n.id; });
  const edgesMap = {};
  function addE(from, to, label, kind) {
    if (!from || !to || from === to) return;
    const key = [from, to].sort().join("|") + "|" + kind;
    if (!edgesMap[key]) edgesMap[key] = { from, to, label, kind };
  }
  nodes.forEach((n) => {
    const scanText = (txt) => {
      if (!txt) return;
      const re = /\[\[([^\]]+)\]\]/g;
      let m;
      while ((m = re.exec(txt))) {
        const tid = nameIndex[m[1].trim().toLowerCase()];
        addE(n.id, tid, "menciona", "wiki");
      }
    };
    scanText(nodeAllText(n));
    (n.pins || []).forEach((p) => addE(n.id, p.linkedPageId, p.label || "punto", "pin"));
    (n.events || []).forEach((ev) => addE(n.id, ev.linkedPageId, ev.title || "evento", "event"));
    const bubbleToPage = {};
    (n.boardNodes || []).forEach((b) => {
      if (b.linkedPageId) { bubbleToPage[b.id] = b.linkedPageId; addE(n.id, b.linkedPageId, "en pizarra", "board"); }
    });
    (n.boardEdges || []).forEach((e) => {
      const pa = bubbleToPage[e.from], pb = bubbleToPage[e.to];
      if (pa && pb) addE(pa, pb, e.label || "relación", "boardlink");
    });
  });
  const edges = Object.values(edgesMap);
  const connected = new Set();
  edges.forEach((e) => { connected.add(e.from); connected.add(e.to); });
  return { edges, connected };
}

const KIND_COLORS = { wiki: "#b8860b", pin: "#3a8a6e", event: "#7a4fb5", board: "#3a6ea5", boardlink: "#b04848" };

/* ---------- NODE CARD (tarjeta reutilizable: panel y pines) ---------- */
function NodeCard({ node, nodes, onOpen, onRemove, floating }) {
  const [cover, setCover] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const c = node.coverImageKey ? await loadImage(`cover-image:${node.id}`) : null;
      if (alive) setCover(c);
    })();
    return () => { alive = false; };
  }, [node.id, node.coverImageKey]);

  const Icon = iconForNode(node, false);
  const color = colorForNode(node);
  const et = node.type === "page" ? ENTRY_TYPES[node.category] : null;
  const snippet = node.type === "folder" ? "Carpeta" : pageSnippet(node, floating ? 150 : 110);

  return (
    <div style={{ ...styles.nodeCard, ...(floating ? styles.nodeCardFloating : {}) }}
      onClick={onOpen ? () => onOpen(node.id) : undefined}
      title={onOpen ? `Abrir ${node.name}` : node.name}>
      {onRemove && (
        <span style={styles.nodeCardRemove} title="Quitar del panel"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}><X size={13} /></span>
      )}
      <div style={{ ...styles.nodeCardImg, borderColor: color }}>
        {cover ? <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <Icon size={28} color={color} />}
      </div>
      <div style={styles.nodeCardBody}>
        <div style={styles.nodeCardTitle}><Icon size={13} color={color} /> <span>{node.name}</span></div>
        {et && <span style={{ fontSize: 10.5, color: et.color, fontWeight: 600 }}>{et.label}</span>}
        {snippet && <div style={styles.nodeCardSnippet}>{snippet}</div>}
      </div>
    </div>
  );
}

/* ---------- DASHBOARD (panel principal) ---------- */
function DashSection({ title, icon, items, empty, nodes, onOpen }) {
  const Icon = icon;
  return (
    <div style={styles.dashSection}>
      <h2 style={styles.dashSectionTitle}>
        <Icon size={15} color="var(--accent)" /> {title} <span style={styles.dashCount}>{items.length}</span>
      </h2>
      {items.length === 0
        ? <div style={styles.dashEmpty}>{empty}</div>
        : <div style={styles.cardGrid}>{items.map((n) => <NodeCard key={n.id} node={n} nodes={nodes} onOpen={onOpen} />)}</div>}
    </div>
  );
}

function DashboardView({ nodes, navigateToId, dashKey, dashBgKey, isMobile }) {
  const [config, setConfig] = useState(null);
  const [bg, setBg] = useState(null);
  const [dropActive, setDropActive] = useState(false);
  const bgInputRef = useRef(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const data = (await storageGetJSON(dashKey)) || {};
      setConfig({ bgImageKey: data.bgImageKey || null, cards: Array.isArray(data.cards) ? data.cards : [] });
    })();
  }, [dashKey]);

  useEffect(() => {
    if (!config) return;
    let alive = true;
    (async () => { const b = config.bgImageKey ? await loadImage(dashBgKey) : null; if (alive) setBg(b); })();
    return () => { alive = false; };
  }, [config?.bgImageKey, dashBgKey]);

  const save = useCallback((next) => {
    setConfig(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => storageSetJSON(dashKey, next), 500);
  }, [dashKey]);

  const orphanConnected = useMemo(() => computeBrainGraph(nodes).connected, [nodes]);

  async function handleBg(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const ok = await saveImage(dashBgKey, reader.result);
      if (ok) { setBg(reader.result); save({ ...config, bgImageKey: dashBgKey }); }
    };
    reader.readAsDataURL(file);
  }
  function removeBg() { deleteImage(dashBgKey); setBg(null); save({ ...config, bgImageKey: null }); }

  function handleDrop(e) {
    const id = e.dataTransfer.getData("text/wb-node");
    setDropActive(false);
    if (!id) return;
    e.preventDefault();
    if (config.cards.some((c) => c.nodeId === id)) return;
    save({ ...config, cards: [...config.cards, { id: uid(), nodeId: id }] });
  }
  function removeCard(cardId) { save({ ...config, cards: config.cards.filter((c) => c.id !== cardId) }); }

  if (!config) return <div style={styles.mapEmpty}>Cargando panel…</div>;

  const pages = nodes.filter((n) => n.type === "page");
  const recent = [...pages].reverse().slice(0, 8);
  const incomplete = pages.filter((n) => !pageHasDescription(n)).slice(0, 8);
  const orphans = pages.filter((n) => !orphanConnected.has(n.id)).slice(0, 8);
  const pinned = config.cards.map((c) => ({ card: c, node: findNode(nodes, c.nodeId) })).filter((x) => x.node);

  return (
    <div style={styles.dashScroll}>
      <div style={{ ...styles.dashBg, backgroundImage: bg ? `linear-gradient(rgba(12,14,20,0.74), rgba(12,14,20,0.9)), url(${bg})` : "none" }}>
        <div style={styles.dashHeaderRow}>
          <h1 style={styles.dashTitle}>Panel del mundo</h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={styles.pillBtn} onClick={() => bgInputRef.current?.click()}><ImageIcon size={13} /> {bg ? "Cambiar fondo" : "Imagen de fondo"}</button>
            {bg && <button style={{ ...styles.pillBtn, color: "#c45c5c" }} onClick={removeBg}><Trash2 size={13} /> Quitar fondo</button>}
            <input ref={bgInputRef} type="file" accept="image/*" hidden onChange={handleBg} />
          </div>
        </div>

        <div style={{ ...styles.dashDrop, ...(dropActive ? { borderColor: "var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)" } : {}) }}
          onDragOver={(e) => { if (e.dataTransfer.types.includes("text/wb-node")) { e.preventDefault(); setDropActive(true); } }}
          onDragLeave={() => setDropActive(false)}
          onDrop={handleDrop}>
          {pinned.length === 0
            ? <div style={styles.dashDropHint}>Arrastra páginas o carpetas desde el panel izquierdo para fijarlas aquí como tarjetas de acceso rápido.</div>
            : <div style={styles.cardGrid}>{pinned.map(({ card, node }) => <NodeCard key={card.id} node={node} nodes={nodes} onOpen={navigateToId} onRemove={() => removeCard(card.id)} />)}</div>}
        </div>

        <DashSection title="Entradas recientes" icon={Clock} items={recent} nodes={nodes} onOpen={navigateToId}
          empty="Aún no hay entradas. Crea tu primera página." />
        <DashSection title="Sin descripción" icon={CircleAlert} items={incomplete} nodes={nodes} onOpen={navigateToId}
          empty="¡Todas las entradas tienen descripción!" />
        <DashSection title="Sin enlaces" icon={Unlink} items={orphans} nodes={nodes} onOpen={navigateToId}
          empty="Todas las entradas están conectadas." />
      </div>
    </div>
  );
}

function BrainView({ nodes, navigateToId, isMobile, brainKey }) {
  const { edges, connected } = useMemo(() => computeBrainGraph(nodes), [nodes]);
  const [state, setState] = useState(null);
  const [showIsolated, setShowIsolated] = useState(false);
  const [activeShape, setActiveShape] = useState(null);
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const dragNodeRef = useRef(null);
  const panRef = useRef(null);
  const saveTimer = useRef(null);

  const visibleNodes = useMemo(
    () => nodes.filter((n) => showIsolated || connected.has(n.id)),
    [nodes, connected, showIsolated]
  );

  useEffect(() => {
    (async () => {
      let data = (await storageGetJSON(brainKey)) || {};
      if (!data.positions && !data.shapes && !data.pan) data = { positions: data, shapes: [], pan: { x: 0, y: 0 } };
      const positions = { ...(data.positions || {}) };
      const missing = nodes.filter((n) => !positions[n.id]);
      missing.forEach((n, i) => {
        const angle = (i / Math.max(missing.length, 1)) * Math.PI * 2;
        const r = 18 + (i % 4) * 8;
        positions[n.id] = { x: 50 + Math.cos(angle) * r, y: 50 + Math.sin(angle) * r * 0.85 };
      });
      setState({ positions, shapes: data.shapes || [], pan: data.pan || { x: 0, y: 0 } });
    })();
  }, [brainKey, nodes.length]);

  const persistState = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => storageSetJSON(brainKey, next), 600);
      return next;
    });
  }, [brainKey]);

  useEffect(() => {
    function move(e) {
      const point = e.touches ? e.touches[0] : e;
      if (dragNodeRef.current && innerRef.current) {
        const rect = innerRef.current.getBoundingClientRect();
        let x = ((point.clientX - rect.left) / rect.width) * 100;
        let y = ((point.clientY - rect.top) / rect.height) * 100;
        x = Math.max(1, Math.min(99, x));
        y = Math.max(1, Math.min(99, y));
        const id = dragNodeRef.current;
        persistState((s) => ({ ...s, positions: { ...s.positions, [id]: { x, y } } }));
        if (e.cancelable) e.preventDefault();
        return;
      }
      if (panRef.current && outerRef.current) {
        const p = panRef.current;
        const outw = outerRef.current.clientWidth;
        const outh = outerRef.current.clientHeight;
        let nx = p.origX + (point.clientX - p.startX);
        let ny = p.origY + (point.clientY - p.startY);
        nx = Math.min(40, Math.max(outw - BRAIN_W - 40, nx));
        ny = Math.min(40, Math.max(outh - BRAIN_H - 40, ny));
        persistState((s) => ({ ...s, pan: { x: nx, y: ny } }));
        if (e.cancelable) e.preventDefault();
      }
    }
    function up() { dragNodeRef.current = null; panRef.current = null; }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [persistState]);

  function startPan(e) {
    const point = e.touches ? e.touches[0] : e;
    panRef.current = { startX: point.clientX, startY: point.clientY, origX: state.pan.x, origY: state.pan.y };
  }

  function addShape() {
    const shape = {
      id: uid(),
      x: Math.min(90, Math.max(0, ((-state.pan.x + 120) / BRAIN_W) * 100)),
      y: Math.min(90, Math.max(0, ((-state.pan.y + 120) / BRAIN_H) * 100)),
      w: 14, h: 14, kind: "rect",
      color: SHAPE_COLORS[(state.shapes.length) % SHAPE_COLORS.length], label: "",
    };
    persistState((s) => ({ ...s, shapes: [...s.shapes, shape] }));
    setActiveShape(shape.id);
  }
  function updateShape(id, patch) {
    persistState((s) => ({ ...s, shapes: s.shapes.map((sh) => (sh.id === id ? { ...sh, ...patch } : sh)) }));
  }
  function deleteShape(id) {
    persistState((s) => ({ ...s, shapes: s.shapes.filter((sh) => sh.id !== id) }));
    setActiveShape(null);
  }

  if (!state) return <div style={{ padding: 30, color: "var(--muted)" }}>Tejiendo el cerebro…</div>;

  const activeShapeData = state.shapes.find((s) => s.id === activeShape);

  return (
    <div style={styles.boardWrap}>
      <div style={styles.mapToolbar}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          Vínculos: {edges.length} · Arrastra el fondo para desplazarte · Doble clic abre la entrada
        </span>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          <button style={styles.pillBtn} onClick={addShape}><Square size={13} /> Figura</button>
          <button style={styles.pillBtn} onClick={() => setShowIsolated((s) => !s)}>
            {showIsolated ? "Ocultar sueltos" : "Mostrar todos"}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, padding: "6px 14px", flexWrap: "wrap", borderBottom: "1px solid var(--border)" }}>
        {[["wiki", "Mención [[..]]"], ["pin", "Pin de mapa"], ["event", "Línea de tiempo"], ["board", "En pizarra"], ["boardlink", "Relación de pizarra"]].map(([k, lbl]) => (
          <span key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--muted)" }}>
            <span style={{ width: 14, height: 2.5, background: KIND_COLORS[k], display: "inline-block", borderRadius: 2 }} /> {lbl}
          </span>
        ))}
      </div>
      <div ref={outerRef} style={styles.brainOuter}
        onMouseDown={startPan} onTouchStart={startPan}
        onClick={() => setActiveShape(null)}
      >
        <div ref={innerRef} style={{ ...styles.brainInner, transform: `translate(${state.pan.x}px, ${state.pan.y}px)` }}>
          <ShapesLayer shapes={state.shapes} updateShape={updateShape}
            selectShape={setActiveShape} selectedId={activeShape} containerRef={innerRef} />
          <svg style={styles.boardSvg} viewBox={`0 0 ${BRAIN_W} ${BRAIN_H}`} preserveAspectRatio="none">
            {edges.map((e, i) => {
              const a = state.positions[e.from], b = state.positions[e.to];
              if (!a || !b) return null;
              if (!visibleNodes.some((n) => n.id === e.from) || !visibleNodes.some((n) => n.id === e.to)) return null;
              return (
                <g key={i}>
                  <line x1={(a.x / 100) * BRAIN_W} y1={(a.y / 100) * BRAIN_H} x2={(b.x / 100) * BRAIN_W} y2={(b.y / 100) * BRAIN_H}
                    stroke={KIND_COLORS[e.kind] || "#8a8298"} strokeWidth={1.4} opacity={0.75} />
                  {e.label && (
                    <text x={((a.x + b.x) / 200) * BRAIN_W} y={((a.y + b.y) / 200) * BRAIN_H} dy={-3}
                      fill="#8a8298" fontSize="10" textAnchor="middle"
                      style={{ pointerEvents: "none", fontFamily: "'Crimson Text', serif" }}>
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          {visibleNodes.map((n) => {
            const p = state.positions[n.id];
            if (!p) return null;
            const Icon = iconForNode(n, false);
            const isConnected = connected.has(n.id);
            return (
              <div key={n.id}
                onMouseDown={(e) => { e.stopPropagation(); dragNodeRef.current = n.id; }}
                onTouchStart={(e) => { e.stopPropagation(); dragNodeRef.current = n.id; }}
                onDoubleClick={() => navigateToId(n.id)}
                title={`${n.name} (doble clic para abrir)`}
                style={{ ...styles.brainNode, left: `${p.x}%`, top: `${p.y}%`, opacity: isConnected ? 1 : 0.45 }}>
                <Icon size={12} color={colorForNode(n)} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.name}</span>
              </div>
            );
          })}
          {visibleNodes.length === 0 && (
            <div style={{ position: "absolute", top: 40, left: 40, color: "var(--muted)", fontSize: 13.5 }}>
              Aún no hay vínculos. Crea enlaces [[así]], pines de mapa o relaciones de pizarra.
            </div>
          )}
        </div>
      </div>
      {activeShapeData && (
        <ShapePanel shape={activeShapeData} updateShape={updateShape} deleteShape={deleteShape}
          onClose={() => setActiveShape(null)} isMobile={isMobile} />
      )}
    </div>
  );
}

/* ---------- STYLES ---------- */
const fontImports = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Crimson+Text:wght@400;600&display=swap');
* { box-sizing: border-box; }
::selection { background: rgba(184,134,11,0.35); }
input, textarea, select { font-family: 'Crimson Text', serif; }
`;

const styles = {
  app: { display: "flex", height: "100vh", width: "100%", background: "var(--app-bg, var(--bg))", color: "var(--text)", fontFamily: "'Crimson Text', serif", overflow: "hidden", position: "relative" },
  loadingShell: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" },
  loadingSeal: { width: 56, height: 56, borderRadius: "50%", border: "2px solid #b8860b", display: "flex", alignItems: "center", justifyContent: "center" },

  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40 },
  sidebar: { width: 290, minWidth: 290, background: "var(--panel)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: 12, overflowY: "auto" },
  sidebarMobile: { position: "fixed", top: 0, left: 0, height: "100vh", width: "85vw", maxWidth: 330, background: "var(--panel)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: 12, overflowY: "auto", zIndex: 50, boxShadow: "4px 0 24px rgba(0,0,0,0.5)" },
  sidebarHeader: { display: "flex", alignItems: "center", gap: 8, padding: "6px 4px 10px" },
  collapseBtn: { background: "transparent", border: "none", cursor: "pointer", display: "flex", padding: 4, borderRadius: "var(--radius-sm, 5px)" },
  expandHandle: { position: "absolute", top: 14, left: 14, zIndex: 20, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 8px)", padding: 8, cursor: "pointer", display: "flex" },
  brandSeal: { width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(145deg,#d9a93f,#8a6310)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  projectRow: { display: "flex", gap: 6, alignItems: "center", marginBottom: 10 },
  brainBtn: { display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--border)", fontSize: 12, padding: "8px 10px", borderRadius: "var(--radius-md, 8px)", cursor: "pointer", marginBottom: 10, width: "100%", justifyContent: "center" },
  searchBox: { display: "flex", alignItems: "center", gap: 6, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 7px)", padding: "6px 8px", marginBottom: 10 },
  searchInput: { background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 13, width: "100%" },
  newRow: { display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" },
  newBtn: { display: "flex", alignItems: "center", gap: 4, background: "var(--panel2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 11, padding: "5px 8px", borderRadius: "var(--radius-sm, 5px)", cursor: "pointer" },
  tree: { flex: 1, overflowY: "auto" },
  treeRow: { display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: "var(--radius-sm, 5px)", cursor: "pointer", fontSize: 13.5 },
  treeLabel: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  renameInput: { background: "var(--bg)", border: "1px solid var(--accent)", color: "var(--text)", fontSize: 13, padding: "2px 4px", borderRadius: "var(--radius-sm, 4px)", width: "100%" },
  contextMenu: { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 7px)", padding: 4, marginBottom: 4, width: 170 },
  contextItem: { padding: "5px 8px", fontSize: 12.5, color: "var(--text)", cursor: "pointer", borderRadius: "var(--radius-sm, 4px)" },

  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--app-bg, var(--bg))", minWidth: 0 },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--border)", gap: 8 },
  emptyState: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 },

  pageWrap: { flex: 1, overflowY: "auto", padding: "24px 20px", maxWidth: 760, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column" },
  pageTitleInput: { background: "transparent", border: "none", outline: "none", fontFamily: "'Cinzel Decorative', serif", fontSize: 24, color: "var(--text)", width: "100%", marginBottom: 6 },
  pageTitle: { fontFamily: "'Cinzel Decorative', serif", fontSize: 22, color: "var(--text)", margin: "20px 16px 0" },
  linkHint: { display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: 11.5, marginBottom: 10, flexWrap: "wrap" },
  textarea: { width: "100%", minHeight: 320, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 8px)", color: "var(--text)", padding: 16, fontSize: 16, lineHeight: 1.7, resize: "vertical", outline: "none" },
  renderedContent: { whiteSpace: "pre-wrap", fontSize: 16, lineHeight: 1.8, color: "var(--text)", cursor: "text", minHeight: 200, padding: 4 },

  tabRow: { display: "flex", gap: 0, marginBottom: 8, borderBottom: "1px solid var(--border)" },
  tabBtn: { background: "transparent", border: "none", borderBottom: "2px solid transparent", color: "var(--muted)", fontSize: 13, padding: "8px 14px", cursor: "pointer", fontFamily: "'Cormorant Garamond', serif" },
  tabBtnActive: { color: "var(--accent)", borderBottom: "2px solid var(--accent)", fontWeight: 600 },

  fmtBar: { display: "flex", gap: 3, alignItems: "center", marginBottom: 6, flexWrap: "wrap", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 7px)", padding: 4 },
  fmtBtn: { display: "flex", alignItems: "center", background: "transparent", border: "none", color: "var(--text)", padding: 6, borderRadius: "var(--radius-sm, 4px)", cursor: "pointer" },

  palette: { width: 176, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "var(--panel)", padding: "16px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 },
  paletteH: { borderBottom: "1px solid var(--border)", background: "var(--panel)", padding: "10px 12px" },
  paletteTitle: { fontFamily: "'Cinzel Decorative', serif", fontSize: 13, color: "var(--accent)", letterSpacing: 0.5 },
  paletteItem: { display: "flex", alignItems: "center", gap: 8, background: "var(--panel2)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 8px)", padding: "9px 11px", fontSize: 12.5, color: "var(--text)", cursor: "grab", userSelect: "none" },
  paletteHint: { fontSize: 10.5, color: "var(--muted)", fontStyle: "italic", lineHeight: 1.5, marginTop: 4 },

  blockCanvas: { display: "flex", flexDirection: "column", gap: 10 },
  blockRow: { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" },
  blockWrap: { position: "relative", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg, 12px)", padding: "8px 12px 12px", boxSizing: "border-box" },
  blockToolbar: { display: "flex", alignItems: "center", gap: 2, marginBottom: 6, opacity: 0.85 },
  blockBtn: { display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", color: "var(--muted)", padding: 4, borderRadius: "var(--radius-sm, 4px)", cursor: "pointer" },
  blockBtnOn: { background: "var(--accent)", color: "#1a1f2e" },
  textBlockBoxed: { background: "var(--panel2)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 8px)", padding: 14 },
  headingInput: { width: "100%", background: "transparent", border: "none", outline: "none", fontFamily: "'Cinzel Decorative', serif", fontSize: 19, color: "var(--accent)" },
  captionInput: { width: "100%", background: "transparent", border: "none", borderBottom: "1px solid var(--border)", outline: "none", color: "var(--muted)", fontSize: 12.5, fontStyle: "italic", padding: "6px 2px", marginTop: 6 },
  imgUploadBtn: { display: "flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "center", background: "var(--panel2)", border: "1px dashed var(--border)", color: "var(--muted)", fontSize: 13, padding: "24px 16px", borderRadius: "var(--radius-md, 8px)", cursor: "pointer" },
  imgPlaceholder: { padding: "24px 16px", textAlign: "center", color: "var(--muted)", fontSize: 12.5, fontStyle: "italic" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  statsGrid6: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8, marginBottom: 4 },
  statsIncidenceTitle2: { fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 12, marginBottom: 6 },
  statsField: { display: "flex", flexDirection: "column", gap: 3 },
  statsLabel: { fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.4 },
  statsInput: { width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 5px)", color: "var(--text)", padding: "6px 8px", fontSize: 14, fontFamily: "'Cormorant Garamond', serif" },
  statsPctInput: { width: 46, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 5px)", color: "var(--accent)", padding: "3px 4px", fontSize: 13, textAlign: "right", fontFamily: "'Cormorant Garamond', serif" },
  statsMiniInput: { width: 54, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 5px)", color: "var(--text)", padding: "3px 4px", fontSize: 13, fontFamily: "'Cormorant Garamond', serif" },
  statsTable: { borderCollapse: "collapse", width: "100%", fontSize: 12.5 },
  statsTh: { textAlign: "left", color: "var(--muted)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.4, padding: "4px 8px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" },
  statsTd: { padding: "4px 8px", color: "var(--text)", borderBottom: "1px solid color-mix(in srgb, var(--border) 60%, transparent)", whiteSpace: "nowrap" },
  statsTdTotal: { padding: "4px 8px", color: "var(--accent)", fontWeight: 700, borderBottom: "1px solid color-mix(in srgb, var(--border) 60%, transparent)", whiteSpace: "nowrap" },
  catalogLink: { color: "var(--accent)", fontWeight: 600, cursor: "pointer", borderBottom: "1px dashed var(--accent)" },
  blockDropEmpty: { border: "2px dashed var(--border)", borderRadius: "var(--radius-lg, 12px)", padding: "40px 24px", textAlign: "center", color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6 },
  blockDropEnd: { border: "2px dashed transparent", borderRadius: "var(--radius-md, 8px)", padding: "12px", textAlign: "center", color: "var(--muted)", fontSize: 11.5, fontStyle: "italic" },

  canvas: { position: "relative", width: "100%", border: "1px dashed var(--border)", borderRadius: "var(--radius-md, 8px)", backgroundColor: "color-mix(in srgb, var(--panel) 25%, transparent)", backgroundImage: "radial-gradient(circle, color-mix(in srgb, var(--muted) 65%, transparent) 1.4px, transparent 1.4px)", backgroundSize: "20px 20px", backgroundPosition: "1px 1px" },
  canvasEmpty: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontStyle: "italic", fontSize: 13, textAlign: "center", padding: "0 24px", pointerEvents: "none" },
  canvasItem: { position: "absolute", boxSizing: "border-box", display: "flex", flexDirection: "column", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg, 12px)", overflow: "hidden" },
  canvasItemHeader: { display: "flex", alignItems: "center", gap: 2, padding: "3px 6px", background: "var(--panel2)", borderBottom: "1px solid var(--border)", cursor: "grab", minHeight: 24 },
  canvasItemTitle: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "auto" },
  canvasItemBody: { flex: 1, overflow: "auto", padding: "8px 10px", minHeight: 0 },
  resizeHandle: { position: "absolute", right: 0, bottom: 0, width: 16, height: 16, cursor: "nwse-resize", background: "linear-gradient(135deg, transparent 50%, var(--accent) 50%)", borderBottomRightRadius: "var(--radius-lg, 12px)" },
  slotLabelInput: { flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 12, marginRight: 6 },
  slotPreview: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, height: "100%", color: "var(--muted)", fontSize: 12, fontStyle: "italic" },
  templateBadge: { display: "inline-flex", alignItems: "center", gap: 5, alignSelf: "flex-start", fontSize: 11, color: "var(--accent)", border: "1px solid var(--border)", borderRadius: "var(--radius-pill, 16px)", padding: "3px 10px", marginBottom: 10 },

  templatesOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  templatesModal: { width: "min(1000px, 96vw)", height: "min(760px, 90vh)", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg, 14px)", padding: 16, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" },
  templatesModalMobile: { position: "fixed", inset: 0, background: "var(--panel)", padding: 12, display: "flex", flexDirection: "column", gap: 10 },
  templatesTypeRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  templatesTabRow: { display: "flex", gap: 6, borderBottom: "1px solid var(--border)", paddingBottom: 10 },


  nodeCard: { position: "relative", display: "flex", flexDirection: "column", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg, 12px)", overflow: "hidden", cursor: "pointer" },
  nodeCardFloating: { width: 230, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", border: "1px solid var(--accent)", cursor: "default" },
  nodeCardRemove: { position: "absolute", top: 6, right: 6, zIndex: 2, display: "flex", background: "rgba(10,12,18,0.75)", color: "var(--text)", borderRadius: "50%", padding: 3, cursor: "pointer" },
  nodeCardImg: { height: 96, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", borderBottom: "1px solid var(--border)", overflow: "hidden" },
  nodeCardBody: { display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px" },
  nodeCardTitle: { display: "flex", alignItems: "center", gap: 6, fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: "var(--text)", fontWeight: 600 },
  nodeCardSnippet: { fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5 },

  dashScroll: { flex: 1, overflowY: "auto" },
  dashBg: { minHeight: "100%", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", padding: "24px 20px 48px" },
  dashHeaderRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18, maxWidth: 1100, marginLeft: "auto", marginRight: "auto" },
  dashTitle: { fontFamily: "'Cinzel Decorative', serif", fontSize: 26, color: "var(--text)", margin: 0 },
  dashDrop: { maxWidth: 1100, margin: "0 auto 26px", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg, 13px)", padding: 16, minHeight: 80, transition: "border-color .2s, background .2s" },
  dashDropHint: { color: "var(--muted)", fontStyle: "italic", textAlign: "center", fontSize: 13, padding: "18px 8px" },
  dashSection: { maxWidth: 1100, margin: "0 auto 26px" },
  dashSectionTitle: { display: "flex", alignItems: "center", gap: 8, fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "var(--text)", margin: "0 0 12px" },
  dashCount: { fontSize: 12, color: "var(--muted)", background: "var(--panel2)", borderRadius: "var(--radius-lg, 12px)", padding: "1px 8px" },
  dashEmpty: { color: "var(--muted)", fontStyle: "italic", fontSize: 13 },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 },

  folderView: { flex: 1, overflowY: "auto", paddingBottom: 32 },
  folderActions: { display: "flex", gap: 8, padding: "16px 16px 0", flexWrap: "wrap" },
  folderGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12, padding: "20px 16px" },
  folderCard: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg, 12px)", padding: "18px 8px", cursor: "pointer", textAlign: "center", fontSize: 13 },
  subBadge: { position: "absolute", top: 6, right: 6, fontSize: 9, color: "var(--muted)", background: "var(--bg)", borderRadius: "var(--radius-sm, 4px)", padding: "1px 5px" },

  pillBtn: { display: "flex", alignItems: "center", gap: 5, background: "var(--panel2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 12, padding: "6px 12px", borderRadius: "var(--radius-pill, 16px)", cursor: "pointer" },
  pillBtnActive: { background: "var(--accent)", borderColor: "var(--accent)", color: "#1a1f2e" },
  entryTypeRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  pillBtnGhost: { display: "flex", alignItems: "center", gap: 4, background: "rgba(17,20,29,0.75)", border: "1px solid rgba(184,134,11,0.5)", color: "#e9dfc0", fontSize: 11.5, padding: "5px 10px", borderRadius: "var(--radius-pill, 16px)", cursor: "pointer" },
  addCoverBtn: { display: "flex", alignItems: "center", gap: 6, background: "var(--panel)", border: "1px dashed var(--border)", color: "var(--muted)", fontSize: 12.5, padding: "10px 16px", borderRadius: "var(--radius-md, 8px)", cursor: "pointer", marginBottom: 18, alignSelf: "flex-start" },
  coverWrap: { position: "relative", marginBottom: 22, borderRadius: "var(--radius-lg, 12px)", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg)" },
  coverImg: { width: "100%", height: 220, display: "block" },
  coverOverlayActions: { position: "absolute", top: 10, right: 10, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" },
  coverAdjustBar: { position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", background: "rgba(10,12,18,0.8)" },

  mapWrap: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" },
  mapToolbar: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" },
  mapTitleText: { fontFamily: "'Cinzel Decorative', serif", fontSize: 15 },
  iconBtn: { border: "1px solid var(--border)", borderRadius: "var(--radius-md, 7px)", padding: 6, cursor: "pointer" },
  placingHint: { display: "flex", alignItems: "center", gap: 8, justifyContent: "center", background: "#3a2e10", color: "#e9c46a", fontSize: 12.5, padding: 6, textAlign: "center" },
  mapCanvasOuter: { flex: 1, overflow: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 14, position: "relative" },
  mapImage: { maxWidth: "100%", display: "block", borderRadius: "var(--radius-md, 7px)", border: "2px solid var(--border)", userSelect: "none" },
  mapEmpty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--muted)", marginTop: 60, textAlign: "center", padding: "0 16px" },
  pinMarker: { position: "absolute", transform: "translate(-50%,-100%)", background: "#e9dfc0", borderRadius: "50% 50% 50% 0", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #1a1f2e", boxShadow: "0 2px 6px rgba(0,0,0,0.5)" },
  pinPanel: { position: "absolute", right: 16, bottom: 16, width: 250, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg, 12px)", padding: 14, display: "flex", flexDirection: "column", gap: 8, zIndex: 30, maxHeight: "72%", overflowY: "auto" },
  pinPanelMobile: { position: "fixed", left: 0, right: 0, bottom: 0, width: "100%", background: "var(--panel)", border: "1px solid var(--border)", borderTopLeftRadius: "var(--radius-lg, 16px)", borderTopRightRadius: "var(--radius-lg, 16px)", padding: 14, display: "flex", flexDirection: "column", gap: 8, zIndex: 45, maxHeight: "60vh", overflowY: "auto" },
  pinPanelHeader: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--accent)", marginBottom: 4 },
  presetGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 },
  presetBtn: { display: "flex", alignItems: "center", gap: 6, background: "var(--panel2)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 8px)", padding: "6px 8px", cursor: "pointer" },
  presetDot: { width: 11, height: 11, borderRadius: "50%", border: "1px solid rgba(0,0,0,0.25)" },
  pinInput: { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "var(--radius-sm, 5px)", padding: "6px 8px", fontSize: 13 },
  pinSelect: { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "var(--radius-sm, 5px)", padding: "6px 8px", fontSize: 13, maxWidth: "100%" },

  timelineWrap: { flex: 1, overflowY: "auto", paddingBottom: 40 },
  timelineTrack: { padding: "8px 16px 0", maxWidth: 900 },
  timelineEventRow: { position: "relative", paddingLeft: 22, marginBottom: 4 },
  timelineDot: { position: "absolute", left: 0, top: 6, width: 10, height: 10, borderRadius: "50%", background: "var(--accent)" },
  timelineLine: { position: "absolute", left: 4, top: 16, bottom: -4, width: 2, background: "var(--border)" },
  timelineCard: { background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 8px)", padding: 12, marginBottom: 14, display: "flex", flexDirection: "column", gap: 6 },
  timelineDateInput: { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--accent)", borderRadius: "var(--radius-sm, 5px)", padding: "5px 8px", fontSize: 12.5, width: 140 },
  timelineTitleInput: { background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 16, fontWeight: 600, padding: "2px 0" },
  timelineDescInput: { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "var(--radius-sm, 5px)", padding: 8, fontSize: 13.5, minHeight: 60, resize: "vertical", lineHeight: 1.5 },
  timelineHTrack: { position: "relative", overflowX: "auto", paddingBottom: 20, paddingTop: 6 },
  timelineHLine: { position: "absolute", top: 32, left: 0, right: 0, height: 2, background: "var(--border)", minWidth: "100%" },
  timelineHDot: { position: "absolute", top: 5, left: "50%", transform: "translateX(-50%)", width: 12, height: 12, borderRadius: "50%", background: "var(--accent)", zIndex: 2 },
  miniBtn: { background: "var(--panel2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 11, padding: "3px 8px", borderRadius: "var(--radius-sm, 4px)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 },

  boardWrap: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" },
  boardCanvas: { flex: 1, position: "relative", overflow: "hidden", background: "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--panel) 80%, var(--bg)) 0%, var(--bg) 100%)", touchAction: "none" },
  boardSvg: { position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" },
  boardEmptyHint: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13.5, textAlign: "center", padding: "0 30px" },
  bubble: { position: "absolute", transform: "translate(-50%,-50%)", background: "var(--panel)", border: "2px solid", borderRadius: "var(--radius-pill, 16px)", padding: "10px 16px", fontSize: 13, color: "var(--text)", cursor: "grab", userSelect: "none", maxWidth: 160, textAlign: "center", lineHeight: 1.3, zIndex: 3 },
  brainOuter: { flex: 1, position: "relative", overflow: "hidden", cursor: "grab", touchAction: "none", background: "var(--bg)" },
  brainInner: { position: "absolute", top: 0, left: 0, width: 2600, height: 1800, background: "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--panel) 75%, var(--bg)) 0%, var(--bg) 100%)", border: "1px solid var(--border)" },
  brainNode: { position: "absolute", transform: "translate(-50%,-50%)", display: "flex", alignItems: "center", gap: 5, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-pill, 20px)", padding: "5px 12px", fontSize: 11.5, color: "var(--text)", cursor: "grab", userSelect: "none", maxWidth: 170, boxShadow: "0 2px 6px rgba(0,0,0,0.35)", zIndex: 3 },
};

/* ---------- ACCESO Y ARRANQUE ---------- */
function Root() {
  const [key, setKey] = useState(getAccessKey());
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function tryKey(e) {
    e.preventDefault();
    setChecking(true); setError("");
    try {
      const res = await fetch(`/api/storage/${TREE_KEY}`, {
        headers: { Authorization: `Bearer ${draft.trim()}` },
      });
      if (res.status === 401) { setError("Clave incorrecta."); setChecking(false); return; }
      if (res.status === 503) { setError("El servidor no tiene ACCESS_KEY configurada. Créala en Settings del Worker."); setChecking(false); return; }
      localStorage.setItem("wb-access-key", draft.trim());
      setKey(draft.trim());
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
    }
    setChecking(false);
  }

  if (!key) {
    return (
      <div style={{ ...styles.loadingShell, background: DEFAULT_THEME.bg, gap: 14 }}>
        <style>{fontImports}</style>
        <div style={styles.loadingSeal}><ScrollText size={28} color="#b8860b" /></div>
        <div style={{ color: "#e9dfc0", fontFamily: "'Cinzel Decorative', serif", fontSize: 18 }}>Mi Worldbuilder</div>
        <form onSubmit={tryKey} style={{ display: "flex", flexDirection: "column", gap: 10, width: 260 }}>
          <input
            type="password" value={draft} onChange={(ev) => setDraft(ev.target.value)}
            placeholder="Clave de acceso" autoFocus
            style={{ background: "#10131c", border: "1px solid #2c3144", color: "#e9dfc0", borderRadius: "var(--radius-md, 8px)", padding: "10px 12px", fontSize: 14, outline: "none" }}
          />
          <button type="submit" disabled={checking}
            style={{ background: "#b8860b", border: "none", color: "#1a1f2e", borderRadius: "var(--radius-md, 8px)", padding: "10px 12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {checking ? "Comprobando…" : "Entrar"}
          </button>
          {error && <div style={{ color: "#c45c5c", fontSize: 12.5, textAlign: "center" }}>{error}</div>}
        </form>
      </div>
    );
  }
  return <WorldBuilder />;
}

createRoot(document.getElementById("root")).render(<Root />);
