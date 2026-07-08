import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import {
  Castle, Skull, Sword, TreePine, Mountain, Anchor, Flame, Gem, Tent,
  Crown, MapPin, Ghost, Building2, Waves, Plus, Folder, FolderOpen,
  FileText, Map as MapIcon, ChevronRight, ChevronDown, Search, X,
  Upload, Trash2, Link2, Save, ScrollText, PanelLeftClose,
  PanelLeftOpen, ImageIcon, Clock, Share2, Brain, Settings,
  Bold, Italic, Underline, Palette, MoveVertical
} from "lucide-react";

/* ---------- ICON LIBRARY ---------- */
const ICONS = {
  castle: Castle, skull: Skull, sword: Sword, tree: TreePine, mountain: Mountain,
  anchor: Anchor, flame: Flame, gem: Gem, tent: Tent, crown: Crown,
  pin: MapPin, ghost: Ghost, building: Building2, waves: Waves,
};
const ICON_KEYS = Object.keys(ICONS);

const BUBBLE_COLORS = ["#b8860b", "#7a4fb5", "#3a8a6e", "#b04848", "#3a6ea5", "#a55d2e"];
const EDGE_COLORS = ["#8a8298", "#b8860b", "#7a4fb5", "#3a8a6e", "#b04848", "#3a6ea5", "#c9bfa0"];
const TEXT_COLORS = ["#e9c46a", "#e07a5f", "#81b29a", "#7aa5d6", "#c583d6", "#d6d67a"];

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
function nextOrder(nodes, parentId) {
  const kids = nodes.filter((n) => n.parentId === parentId);
  return kids.length ? Math.max(...kids.map((k) => k.order ?? 0)) + 1 : 0;
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
};

/* ---------- SEED DATA ---------- */
const seedNodes = () => {
  const worldId = uid(); const folderId = uid(); const subFolderId = uid(); const pageId = uid();
  return [
    { id: worldId, parentId: null, order: 0, type: "map", name: "Aldenmere — Mapa del Mundo", content: "", content2: "", mapImageKey: null, pins: [] },
    { id: folderId, parentId: null, order: 1, type: "folder", name: "Personajes", content: "", content2: "" },
    { id: subFolderId, parentId: folderId, order: 0, type: "folder", name: "Casa Real", content: "", content2: "" },
    {
      id: pageId, parentId: subFolderId, order: 0, type: "page", name: "Reina Ysolde",
      content: "La gobernante de [[Aldenmere — Mapa del Mundo]] desde la caída del último dragón.\n\nPuedes usar **negritas**, //cursivas//, __subrayado__ y {#e07a5f|texto con color}.",
      content2: "",
    },
  ];
};

/* ---------- STORAGE (API remota: Cloudflare D1 + KV) ---------- */
const TREE_KEY = "world-tree";
const THEME_KEY = "world-theme";
const BRAIN_POS_KEY = "brain-positions";

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
/* Soporta: [[enlaces]], **negrita**, //cursiva//, __subrayado__, {#hex|texto} */
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

/* ---------- MAIN APP ---------- */
export default function WorldBuilder() {
  const [nodes, setNodes] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState("node"); // "node" | "brain"
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [themeOpen, setThemeOpen] = useState(false);
  const isMobile = useIsMobile();
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const stored = await storageGetJSON(TREE_KEY);
      const initial = stored && stored.length ? stored : seedNodes();
      setNodes(initial);
      setSelectedId(initial[0]?.id ?? null);
      setExpanded({ [initial[0]?.id]: true });
      const th = await storageGetJSON(THEME_KEY);
      if (th) setTheme({ ...DEFAULT_THEME, ...th });
    })();
  }, []);

  useEffect(() => { if (isMobile) setSidebarCollapsed(true); }, [isMobile]);

  const persist = useCallback((next) => {
    setNodes(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await storageSetJSON(TREE_KEY, next);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    }, 400);
  }, []);

  function updateTheme(patch) {
    const next = { ...theme, ...patch };
    setTheme(next);
    storageSetJSON(THEME_KEY, next);
  }

  if (!nodes) {
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
    if (type === "board") { node.boardNodes = []; node.boardEdges = []; }
    persist([...nodes, node]);
    setSelectedId(node.id); setView("node");
    if (parentId) setExpanded((e) => ({ ...e, [parentId]: true }));
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

  /* Mover nodo por drag & drop.
     mode "into": lo mete al final de targetId (carpeta).
     mode "after": lo coloca como hermano justo después de targetId. */
  function moveNode(dragId, targetId, mode) {
    if (dragId === targetId) return;
    const desc = new Set(descendantIds(nodes, dragId));
    if (desc.has(targetId)) return; // no meterse dentro de sí mismo
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

  const themeVars = {
    "--bg": theme.bg, "--panel": theme.panel, "--panel2": theme.panel2,
    "--border": theme.border, "--accent": theme.accent, "--text": theme.text, "--muted": theme.muted,
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
          openBrain={() => { setView("brain"); if (isMobile) setSidebarCollapsed(true); }}
          brainActive={view === "brain"}
          openTheme={() => setThemeOpen(true)}
        />
      )}
      {sidebarCollapsed && (
        <button style={styles.expandHandle} onClick={() => setSidebarCollapsed(false)} title="Mostrar atlas">
          <PanelLeftOpen size={16} color="var(--text)" />
        </button>
      )}
      <main style={styles.main}>
        <TopBar selected={view === "brain" ? null : selected} brainMode={view === "brain"} nodes={nodes} savedFlash={savedFlash} isMobile={isMobile} />
        {view === "brain" ? (
          <BrainView nodes={nodes} navigateToId={navigateToId} isMobile={isMobile} />
        ) : !selected ? (
          <div style={styles.emptyState}>
            <ScrollText size={48} color="var(--muted)" />
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--muted)", textAlign: "center", padding: "0 20px" }}>
              Selecciona o crea una página, carpeta, mapa, línea de tiempo o pizarra para comenzar.
            </p>
          </div>
        ) : selected.type === "page" ? (
          <PageEditor node={selected} nodes={nodes} updateNode={updateNode} navigateByName={navigateByName} />
        ) : selected.type === "map" ? (
          <MapEditor node={selected} nodes={nodes} updateNode={updateNode} setSelectedId={navigateToId} isMobile={isMobile} />
        ) : selected.type === "folder" ? (
          <FolderView node={selected} nodes={nodes} addNode={addNode} setSelectedId={navigateToId} updateNode={updateNode} navigateByName={navigateByName} />
        ) : selected.type === "timeline" ? (
          <TimelineEditor node={selected} nodes={nodes} updateNode={updateNode} setSelectedId={navigateToId} />
        ) : selected.type === "board" ? (
          <BoardEditor node={selected} nodes={nodes} updateNode={updateNode} setSelectedId={navigateToId} isMobile={isMobile} />
        ) : null}
      </main>

      {themeOpen && (
        <ThemePanel theme={theme} updateTheme={updateTheme} onClose={() => setThemeOpen(false)} isMobile={isMobile} />
      )}
    </div>
  );
}

/* ---------- THEME PANEL ---------- */
function ThemePanel({ theme, updateTheme, onClose, isMobile }) {
  const fields = [
    ["accent", "Color de acento"], ["bg", "Fondo"], ["panel", "Paneles"],
    ["panel2", "Botones"], ["border", "Bordes"], ["text", "Texto"], ["muted", "Texto tenue"],
  ];
  return (
    <div style={isMobile ? styles.pinPanelMobile : { ...styles.pinPanel, top: 60, bottom: "auto" }}>
      <div style={styles.pinPanelHeader}>
        <span><Palette size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Personalizar colores</span>
        <X size={14} style={{ cursor: "pointer" }} onClick={onClose} />
      </div>
      {fields.map(([key, label]) => (
        <label key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5, color: "var(--text)" }}>
          {label}
          <input type="color" value={theme[key]} onChange={(e) => updateTheme({ [key]: e.target.value })}
            style={{ width: 36, height: 24, border: "none", background: "transparent", cursor: "pointer" }} />
        </label>
      ))}
      <button style={styles.pillBtn} onClick={() => updateTheme(DEFAULT_THEME)}>Restaurar por defecto</button>
    </div>
  );
}

/* ---------- TOP BAR ---------- */
function TopBar({ selected, brainMode, nodes, savedFlash, isMobile }) {
  const crumbs = selected ? pathTo(nodes, selected.id) : [];
  return (
    <div style={styles.topbar}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", whiteSpace: "nowrap", flex: 1, paddingLeft: isMobile ? 40 : 0 }}>
        {brainMode ? (
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
function Sidebar({ nodes, selectedId, setSelectedId, expanded, setExpanded, search, setSearch, addNode, deleteNode, renameNode, moveNode, moveToRoot, onCollapse, isMobile, openBrain, brainActive, openTheme }) {
  const roots = childrenOf(nodes, null);
  const filtered = search.trim()
    ? nodes.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <aside style={isMobile ? styles.sidebarMobile : styles.sidebar}>
      <div style={styles.sidebarHeader}>
        <div style={styles.brandSeal}><Crown size={16} color="#1a1f2e" /></div>
        <span style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 15, color: "var(--text)", letterSpacing: 0.5 }}>
          Atlas de Mundos
        </span>
        <button onClick={openTheme} style={styles.collapseBtn} title="Personalizar colores">
          <Settings size={15} color="var(--muted)" />
        </button>
        <button onClick={onCollapse} style={{ ...styles.collapseBtn, marginLeft: 0 }} title="Contraer panel">
          <PanelLeftClose size={16} color="var(--muted)" />
        </button>
      </div>

      <button onClick={openBrain} style={{ ...styles.brainBtn, background: brainActive ? "var(--accent)" : "var(--panel2)", color: brainActive ? "#1a1f2e" : "var(--text)" }}>
        <Brain size={14} /> Cerebro — mapa global de vínculos
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
            Tu atlas está vacío. Crea tu primera entrada.
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
  const Icon = iconForType(node.type, false);
  return (
    <div onClick={onClick} style={{ ...styles.treeRow, background: active ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "transparent" }}>
      <Icon size={14} color="var(--accent)" />
      <span style={styles.treeLabel}>{node.name}</span>
    </div>
  );
}

function TreeItem({ node, nodes, depth, selectedId, setSelectedId, expanded, setExpanded, addNode, deleteNode, renameNode, moveNode }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropHint, setDropHint] = useState(null); // "into" | "after" | null
  const kids = node.type === "folder" ? childrenOf(nodes, node.id) : [];
  const isOpen = !!expanded[node.id];
  const Icon = iconForType(node.type, isOpen);
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
        <Icon size={14} color="var(--accent)" />
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

/* ---------- COVER IMAGE (con ajuste) ---------- */
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

/* ---------- DUAL CONTENT (dos cuadros de texto con formato) ---------- */
function DualContent({ node, nodes, updateNode, navigateByName }) {
  const [tab, setTab] = useState("main"); // main | alt
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const taRef = useRef(null);
  const field = tab === "main" ? "content" : "content2";
  const value = node[field] || "";

  useEffect(() => { setEditing(false); setTab("main"); }, [node.id]);
  useEffect(() => { setDraft(value); }, [node.id, tab]);

  function commit() { updateNode(node.id, { [field]: draft }); setEditing(false); }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={styles.tabRow}>
        <button style={{ ...styles.tabBtn, ...(tab === "main" ? styles.tabBtnActive : {}) }}
          onClick={() => { if (editing) commit(); setTab("main"); }}>Contenido</button>
        <button style={{ ...styles.tabBtn, ...(tab === "alt" ? styles.tabBtnActive : {}) }}
          onClick={() => { if (editing) commit(); setTab("alt"); }}>Notas del máster</button>
      </div>
      <div style={styles.linkHint}>
        <Link2 size={12} /> <code>[[Página]]</code> enlaza · <code>**negrita**</code> · <code>//cursiva//</code> · <code>__subrayado__</code>
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
function FolderView({ node, nodes, addNode, setSelectedId, updateNode, navigateByName }) {
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
          const Icon = iconForType(k.type, false);
          return (
            <div key={k.id} style={styles.folderCard} onClick={() => setSelectedId(k.id)}>
              {k.coverImageKey ? <FolderCardThumb coverKey={`cover-image:${k.id}`} /> : <Icon size={20} color="var(--accent)" />}
              <span>{k.name}</span>
              {k.type === "folder" && <span style={styles.subBadge}>carpeta</span>}
            </div>
          );
        })}
      </div>
      <div style={{ padding: "0 16px", maxWidth: 760 }}>
        <DualContent node={node} nodes={nodes} updateNode={updateNode} navigateByName={navigateByName} />
      </div>
    </div>
  );
}

function FolderCardThumb({ coverKey }) {
  const [src, setSrc] = useState(null);
  useEffect(() => { (async () => setSrc(await loadImage(coverKey)))(); }, [coverKey]);
  if (!src) return <div style={{ width: 40, height: 40 }} />;
  return <img src={src} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />;
}

/* ---------- PAGE EDITOR ---------- */
function PageEditor({ node, nodes, updateNode, navigateByName }) {
  const [title, setTitle] = useState(node.name);
  useEffect(() => { setTitle(node.name); }, [node.id]);

  return (
    <div style={styles.pageWrap}>
      <CoverImage node={node} updateNode={updateNode} margin="0 0 18px" />
      <input value={title} onChange={(e) => setTitle(e.target.value)}
        onBlur={() => updateNode(node.id, { name: title.trim() || node.name })}
        style={styles.pageTitleInput} />
      <DualContent node={node} nodes={nodes} updateNode={updateNode} navigateByName={navigateByName} />
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
  const fileInputRef = useRef(null);
  const iconInputRef = useRef(null);
  const imgKey = `map-image:${node.id}`;

  useEffect(() => {
    setLoadingImg(true); setPlacing(null); setActivePin(null);
    (async () => {
      const data = await loadImage(node.mapImageKey ? imgKey : null);
      setImgSrc(data); setLoadingImg(false);
    })();
  }, [node.id]);

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

  const pageOptions = nodes.filter((n) => n.id !== node.id);
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
        <div style={styles.placingHint}>Haz clic en el mapa para colocar el icono. <X size={12} style={{ cursor: "pointer" }} onClick={() => setPlacing(null)} /></div>
      )}
      <div style={styles.mapCanvasOuter}>
        {loadingImg ? (
          <div style={styles.mapEmpty}>Cargando mapa…</div>
        ) : imgSrc ? (
          <div style={{ position: "relative", display: "inline-block", cursor: placing ? "crosshair" : "default" }} onClick={handleMapClick}>
            <img src={imgSrc} alt={node.name} style={styles.mapImage} draggable={false} />
            {(node.pins || []).map((p) => {
              const PinIcon = p.icon ? ICONS[p.icon] : null;
              return (
                <div key={p.id} onClick={(e) => { e.stopPropagation(); setActivePin(p.id); }}
                  style={{ ...styles.pinMarker, left: `${p.x}%`, top: `${p.y}%` }} title={p.label}>
                  {p.customIcon ? <img src={p.customIcon} alt="" style={{ width: 20, height: 20, borderRadius: 4 }} /> : <PinIcon size={18} color="#1a1f2e" />}
                </div>
              );
            })}
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
          <select value={activePinData.linkedPageId || ""} onChange={(e) => updatePin(activePinData.id, { linkedPageId: e.target.value || null })} style={styles.pinSelect}>
            <option value="">— Sin enlace —</option>
            {pageOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {activePinData.linkedPageId && (
            <button style={styles.pillBtn} onClick={() => setSelectedId(activePinData.linkedPageId)}>Ir a la página enlazada</button>
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
function TimelineEditor({ node, nodes, updateNode, setSelectedId }) {
  const events = node.events || [];
  const pageOptions = nodes.filter((n) => n.id !== node.id);

  function addEvent() {
    updateNode(node.id, { events: [...events, { id: uid(), date: "", title: "Nuevo acontecimiento", description: "", linkedPageId: null }] });
  }
  function updateEvent(id, patch) { updateNode(node.id, { events: events.map((e) => (e.id === id ? { ...e, ...patch } : e)) }); }
  function deleteEvent(id) { updateNode(node.id, { events: events.filter((e) => e.id !== id) }); }
  function moveEvent(id, dir) {
    const idx = events.findIndex((e) => e.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= events.length) return;
    const next = [...events];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    updateNode(node.id, { events: next });
  }

  return (
    <div style={styles.timelineWrap}>
      <h1 style={styles.pageTitle}>{node.name}</h1>
      <div style={{ padding: "0 16px 8px" }}>
        <button style={styles.pillBtn} onClick={addEvent}><Plus size={13} /> Acontecimiento</button>
      </div>
      <div style={styles.timelineTrack}>
        {events.length === 0 && (
          <div style={{ color: "var(--muted)", fontStyle: "italic", padding: "8px 16px" }}>Sin acontecimientos aún.</div>
        )}
        {events.map((ev, i) => (
          <div key={ev.id} style={styles.timelineEventRow}>
            <div style={styles.timelineDot} />
            {i < events.length - 1 && <div style={styles.timelineLine} />}
            <div style={styles.timelineCard}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                <input value={ev.date} onChange={(e) => updateEvent(ev.id, { date: e.target.value })} placeholder="Fecha / Era" style={styles.timelineDateInput} />
                <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                  <button style={styles.miniBtn} onClick={() => moveEvent(ev.id, -1)}>↑</button>
                  <button style={styles.miniBtn} onClick={() => moveEvent(ev.id, 1)}>↓</button>
                  <button style={{ ...styles.miniBtn, color: "#c45c5c" }} onClick={() => deleteEvent(ev.id)}><Trash2 size={12} /></button>
                </div>
              </div>
              <input value={ev.title} onChange={(e) => updateEvent(ev.id, { title: e.target.value })} placeholder="Título del acontecimiento" style={styles.timelineTitleInput} />
              <textarea value={ev.description} onChange={(e) => updateEvent(ev.id, { description: e.target.value })} placeholder="Describe qué ocurrió…" style={styles.timelineDescInput} />
              <select value={ev.linkedPageId || ""} onChange={(e) => updateEvent(ev.id, { linkedPageId: e.target.value || null })} style={styles.pinSelect}>
                <option value="">— Sin enlace —</option>
                {pageOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {ev.linkedPageId && (
                <button style={{ ...styles.pillBtn, marginTop: 6, alignSelf: "flex-start" }} onClick={() => setSelectedId(ev.linkedPageId)}>Ir a la página enlazada</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- EDGE RENDER HELPERS ---------- */
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
          <React.Fragment key={e.id}>
            <marker id={`arr-end-${e.id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
            </marker>
          </React.Fragment>
        );
      })}
    </defs>
  );
}

/* ---------- BOARD EDITOR (mind map) ---------- */
function BoardEditor({ node, nodes, updateNode, setSelectedId, isMobile }) {
  const boardNodes = node.boardNodes || [];
  const boardEdges = node.boardEdges || [];
  const [linkMode, setLinkMode] = useState(false);
  const [linkFirst, setLinkFirst] = useState(null);
  const [activeBubble, setActiveBubble] = useState(null);
  const [activeEdge, setActiveEdge] = useState(null);
  const draggingRef = useRef(null);
  const canvasRef = useRef(null);
  const pageOptions = nodes.filter((n) => n.id !== node.id);

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
    setActiveEdge(null); setActiveBubble(id);
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

  /* Soltar entradas del árbol en la pizarra */
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

  return (
    <div style={styles.boardWrap}>
      <div style={styles.mapToolbar}>
        <span style={styles.mapTitleText}>{node.name}</span>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          <button style={styles.pillBtn} onClick={() => addBubble()}><Plus size={13} /> Idea</button>
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
        onClick={() => { setActiveBubble(null); setActiveEdge(null); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleCanvasDrop}
      >
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
                  onClick={(ev) => { ev.stopPropagation(); setActiveBubble(null); setActiveEdge(e.id); }} />
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
        {boardNodes.length === 0 && (
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
          <select value={activeBubbleData.linkedPageId || ""} onChange={(e) => updateBubble(activeBubbleData.id, { linkedPageId: e.target.value || null })} style={styles.pinSelect}>
            <option value="">— Sin enlace —</option>
            {pageOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
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
    </div>
  );
}

/* ---------- BRAIN VIEW (mapa global de vínculos) ---------- */
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
    scanText(n.content); scanText(n.content2);
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

function BrainView({ nodes, navigateToId, isMobile }) {
  const { edges, connected } = useMemo(() => computeBrainGraph(nodes), [nodes]);
  const [positions, setPositions] = useState(null);
  const [showIsolated, setShowIsolated] = useState(false);
  const canvasRef = useRef(null);
  const draggingRef = useRef(null);
  const posTimer = useRef(null);

  const visibleNodes = useMemo(
    () => nodes.filter((n) => showIsolated || connected.has(n.id)),
    [nodes, connected, showIsolated]
  );

  useEffect(() => {
    (async () => {
      const saved = (await storageGetJSON(BRAIN_POS_KEY)) || {};
      const pos = { ...saved };
      const missing = nodes.filter((n) => !pos[n.id]);
      missing.forEach((n, i) => {
        const angle = (i / Math.max(missing.length, 1)) * Math.PI * 2;
        const r = 30 + (i % 3) * 12;
        pos[n.id] = { x: 50 + Math.cos(angle) * r * 0.9, y: 50 + Math.sin(angle) * r * 0.8 };
      });
      setPositions(pos);
    })();
  }, [nodes.length]);

  const persistPositions = useCallback((next) => {
    setPositions(next);
    clearTimeout(posTimer.current);
    posTimer.current = setTimeout(() => storageSetJSON(BRAIN_POS_KEY, next), 500);
  }, []);

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
      setPositions((p) => {
        const next = { ...p, [id]: { x, y } };
        clearTimeout(posTimer.current);
        posTimer.current = setTimeout(() => storageSetJSON(BRAIN_POS_KEY, next), 500);
        return next;
      });
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
  }, []);

  if (!positions) return <div style={{ padding: 30, color: "var(--muted)" }}>Tejiendo el cerebro…</div>;

  return (
    <div style={styles.boardWrap}>
      <div style={styles.mapToolbar}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          Vínculos detectados: {edges.length} · Toca dos veces un nodo para abrirlo
        </span>
        <button style={{ ...styles.pillBtn, marginLeft: "auto" }} onClick={() => setShowIsolated((s) => !s)}>
          {showIsolated ? "Ocultar sueltos" : "Mostrar todos"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 12, padding: "6px 14px", flexWrap: "wrap", borderBottom: "1px solid var(--border)" }}>
        {[["wiki", "Mención [[..]]"], ["pin", "Pin de mapa"], ["event", "Línea de tiempo"], ["board", "En pizarra"], ["boardlink", "Relación de pizarra"]].map(([k, lbl]) => (
          <span key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--muted)" }}>
            <span style={{ width: 14, height: 2.5, background: KIND_COLORS[k], display: "inline-block", borderRadius: 2 }} /> {lbl}
          </span>
        ))}
      </div>
      <div ref={canvasRef} style={styles.boardCanvas}>
        <svg style={styles.boardSvg}>
          {edges.map((e, i) => {
            const a = positions[e.from], b = positions[e.to];
            if (!a || !b) return null;
            if (!visibleNodes.some((n) => n.id === e.from) || !visibleNodes.some((n) => n.id === e.to)) return null;
            return (
              <g key={i}>
                <line x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`}
                  stroke={KIND_COLORS[e.kind] || "#8a8298"} strokeWidth={1.4} opacity={0.75} />
                {e.label && (
                  <text x={`${(a.x + b.x) / 2}%`} y={`${(a.y + b.y) / 2}%`} dy={-3}
                    fill="var(--muted)" fontSize="9.5" textAnchor="middle"
                    style={{ pointerEvents: "none", fontFamily: "'Crimson Text', serif" }}>
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {visibleNodes.length === 0 && (
          <div style={styles.boardEmptyHint}>
            Aún no hay vínculos. Crea enlaces [[así]], pines de mapa o relaciones de pizarra y aparecerán aquí.
          </div>
        )}
        {visibleNodes.map((n) => {
          const p = positions[n.id];
          if (!p) return null;
          const Icon = iconForType(n.type, false);
          const isConnected = connected.has(n.id);
          return (
            <div key={n.id}
              onMouseDown={(e) => { e.stopPropagation(); draggingRef.current = n.id; }}
              onTouchStart={(e) => { e.stopPropagation(); draggingRef.current = n.id; }}
              onDoubleClick={() => navigateToId(n.id)}
              title={`${n.name} (doble clic/toque para abrir)`}
              style={{
                ...styles.brainNode, left: `${p.x}%`, top: `${p.y}%`,
                opacity: isConnected ? 1 : 0.45,
              }}>
              <Icon size={12} color="var(--accent)" />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.name}</span>
            </div>
          );
        })}
      </div>
      {isMobile && (
        <div style={{ fontSize: 10.5, color: "var(--muted)", textAlign: "center", padding: 6, fontStyle: "italic" }}>
          Arrastra los nodos para acomodarlos · doble toque abre la entrada
        </div>
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
  app: { display: "flex", height: "100vh", width: "100%", background: "var(--bg)", color: "var(--text)", fontFamily: "'Crimson Text', serif", overflow: "hidden", position: "relative" },
  loadingShell: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" },
  loadingSeal: { width: 56, height: 56, borderRadius: "50%", border: "2px solid #b8860b", display: "flex", alignItems: "center", justifyContent: "center" },

  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40 },
  sidebar: { width: 280, minWidth: 280, background: "var(--panel)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: 12, overflowY: "auto" },
  sidebarMobile: { position: "fixed", top: 0, left: 0, height: "100vh", width: "85vw", maxWidth: 320, background: "var(--panel)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: 12, overflowY: "auto", zIndex: 50, boxShadow: "4px 0 24px rgba(0,0,0,0.5)" },
  sidebarHeader: { display: "flex", alignItems: "center", gap: 8, padding: "6px 4px 12px" },
  collapseBtn: { marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer", display: "flex", padding: 4, borderRadius: 5 },
  expandHandle: { position: "absolute", top: 14, left: 14, zIndex: 20, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" },
  brandSeal: { width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(145deg,#d9a93f,#8a6310)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  brainBtn: { display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--border)", fontSize: 12, padding: "8px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 10, width: "100%", justifyContent: "center" },
  searchBox: { display: "flex", alignItems: "center", gap: 6, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", marginBottom: 10 },
  searchInput: { background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 13, width: "100%" },
  newRow: { display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" },
  newBtn: { display: "flex", alignItems: "center", gap: 4, background: "var(--panel2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 11, padding: "5px 8px", borderRadius: 5, cursor: "pointer" },
  tree: { flex: 1, overflowY: "auto" },
  treeRow: { display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 5, cursor: "pointer", fontSize: 13.5 },
  treeLabel: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  renameInput: { background: "var(--bg)", border: "1px solid var(--accent)", color: "var(--text)", fontSize: 13, padding: "2px 4px", borderRadius: 3, width: "100%" },
  contextMenu: { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: 4, marginBottom: 4, width: 170 },
  contextItem: { padding: "5px 8px", fontSize: 12.5, color: "var(--text)", cursor: "pointer", borderRadius: 4 },

  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg)", minWidth: 0 },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--border)", gap: 8 },
  emptyState: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 },

  pageWrap: { flex: 1, overflowY: "auto", padding: "24px 20px", maxWidth: 760, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column" },
  pageTitleInput: { background: "transparent", border: "none", outline: "none", fontFamily: "'Cinzel Decorative', serif", fontSize: 24, color: "var(--text)", width: "100%", marginBottom: 6 },
  pageTitle: { fontFamily: "'Cinzel Decorative', serif", fontSize: 22, color: "var(--text)", margin: "20px 16px 0" },
  linkHint: { display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: 11.5, marginBottom: 10, flexWrap: "wrap" },
  textarea: { width: "100%", minHeight: 320, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", padding: 16, fontSize: 16, lineHeight: 1.7, resize: "vertical", outline: "none" },
  renderedContent: { whiteSpace: "pre-wrap", fontSize: 16, lineHeight: 1.8, color: "var(--text)", cursor: "text", minHeight: 200, padding: 4 },

  tabRow: { display: "flex", gap: 0, marginBottom: 8, borderBottom: "1px solid var(--border)" },
  tabBtn: { background: "transparent", border: "none", borderBottom: "2px solid transparent", color: "var(--muted)", fontSize: 13, padding: "8px 14px", cursor: "pointer", fontFamily: "'Cormorant Garamond', serif" },
  tabBtnActive: { color: "var(--accent)", borderBottom: "2px solid var(--accent)", fontWeight: 600 },

  fmtBar: { display: "flex", gap: 3, alignItems: "center", marginBottom: 6, flexWrap: "wrap", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 6, padding: 4 },
  fmtBtn: { display: "flex", alignItems: "center", background: "transparent", border: "none", color: "var(--text)", padding: 6, borderRadius: 4, cursor: "pointer" },

  folderView: { flex: 1, overflowY: "auto", paddingBottom: 32 },
  folderActions: { display: "flex", gap: 8, padding: "16px 16px 0", flexWrap: "wrap" },
  folderGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12, padding: "20px 16px" },
  folderCard: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 8px", cursor: "pointer", textAlign: "center", fontSize: 13 },
  subBadge: { position: "absolute", top: 6, right: 6, fontSize: 9, color: "var(--muted)", background: "var(--bg)", borderRadius: 4, padding: "1px 5px" },

  pillBtn: { display: "flex", alignItems: "center", gap: 5, background: "var(--panel2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 12, padding: "6px 12px", borderRadius: 16, cursor: "pointer" },
  pillBtnGhost: { display: "flex", alignItems: "center", gap: 4, background: "rgba(17,20,29,0.75)", border: "1px solid rgba(184,134,11,0.5)", color: "#e9dfc0", fontSize: 11.5, padding: "5px 10px", borderRadius: 14, cursor: "pointer" },
  addCoverBtn: { display: "flex", alignItems: "center", gap: 6, background: "var(--panel)", border: "1px dashed var(--border)", color: "var(--muted)", fontSize: 12.5, padding: "10px 16px", borderRadius: 8, cursor: "pointer", marginBottom: 18, alignSelf: "flex-start" },
  coverWrap: { position: "relative", marginBottom: 22, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg)" },
  coverImg: { width: "100%", height: 220, display: "block" },
  coverOverlayActions: { position: "absolute", top: 10, right: 10, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" },
  coverAdjustBar: { position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", background: "rgba(10,12,18,0.8)" },

  mapWrap: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" },
  mapToolbar: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" },
  mapTitleText: { fontFamily: "'Cinzel Decorative', serif", fontSize: 15 },
  iconBtn: { border: "1px solid var(--border)", borderRadius: 6, padding: 6, cursor: "pointer" },
  placingHint: { display: "flex", alignItems: "center", gap: 8, justifyContent: "center", background: "#3a2e10", color: "#e9c46a", fontSize: 12.5, padding: 6, textAlign: "center" },
  mapCanvasOuter: { flex: 1, overflow: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 14, position: "relative" },
  mapImage: { maxWidth: "100%", display: "block", borderRadius: 6, border: "2px solid var(--border)", userSelect: "none" },
  mapEmpty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--muted)", marginTop: 60, textAlign: "center", padding: "0 16px" },
  pinMarker: { position: "absolute", transform: "translate(-50%,-100%)", background: "#e9dfc0", borderRadius: "50% 50% 50% 0", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #1a1f2e", boxShadow: "0 2px 6px rgba(0,0,0,0.5)", cursor: "pointer" },
  pinPanel: { position: "absolute", right: 16, bottom: 16, width: 240, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 8, zIndex: 30, maxHeight: "70%", overflowY: "auto" },
  pinPanelMobile: { position: "fixed", left: 0, right: 0, bottom: 0, width: "100%", background: "var(--panel)", border: "1px solid var(--border)", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 8, zIndex: 45, maxHeight: "60vh", overflowY: "auto" },
  pinPanelHeader: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--accent)", marginBottom: 4 },
  pinInput: { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 5, padding: "6px 8px", fontSize: 13 },
  pinSelect: { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 5, padding: "6px 8px", fontSize: 13 },

  timelineWrap: { flex: 1, overflowY: "auto", paddingBottom: 40 },
  timelineTrack: { padding: "8px 16px 0", maxWidth: 640 },
  timelineEventRow: { position: "relative", paddingLeft: 22, marginBottom: 4 },
  timelineDot: { position: "absolute", left: 0, top: 6, width: 10, height: 10, borderRadius: "50%", background: "var(--accent)" },
  timelineLine: { position: "absolute", left: 4, top: 16, bottom: -4, width: 2, background: "var(--border)" },
  timelineCard: { background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, padding: 12, marginBottom: 18, display: "flex", flexDirection: "column", gap: 6 },
  timelineDateInput: { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--accent)", borderRadius: 5, padding: "5px 8px", fontSize: 12.5, width: 140 },
  timelineTitleInput: { background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 16, fontWeight: 600, padding: "2px 0" },
  timelineDescInput: { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 5, padding: 8, fontSize: 13.5, minHeight: 60, resize: "vertical", lineHeight: 1.5 },
  miniBtn: { background: "var(--panel2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 11, padding: "3px 8px", borderRadius: 4, cursor: "pointer" },

  boardWrap: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" },
  boardCanvas: { flex: 1, position: "relative", overflow: "hidden", background: "radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--panel) 80%, var(--bg)) 0%, var(--bg) 100%)", touchAction: "none" },
  boardSvg: { position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" },
  boardEmptyHint: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13.5, textAlign: "center", padding: "0 30px" },
  bubble: { position: "absolute", transform: "translate(-50%,-50%)", background: "var(--panel)", border: "2px solid", borderRadius: 14, padding: "10px 16px", fontSize: 13, color: "var(--text)", cursor: "grab", userSelect: "none", maxWidth: 160, textAlign: "center", lineHeight: 1.3 },
  brainNode: { position: "absolute", transform: "translate(-50%,-50%)", display: "flex", alignItems: "center", gap: 5, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 20, padding: "5px 12px", fontSize: 11.5, color: "var(--text)", cursor: "grab", userSelect: "none", maxWidth: 150, boxShadow: "0 2px 6px rgba(0,0,0,0.35)" },
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
        <div style={{ color: "#e9dfc0", fontFamily: "'Cinzel Decorative', serif", fontSize: 18 }}>Atlas de Mundos</div>
        <form onSubmit={tryKey} style={{ display: "flex", flexDirection: "column", gap: 10, width: 260 }}>
          <input
            type="password" value={draft} onChange={(ev) => setDraft(ev.target.value)}
            placeholder="Clave de acceso" autoFocus
            style={{ background: "#10131c", border: "1px solid #2c3144", color: "#e9dfc0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none" }}
          />
          <button type="submit" disabled={checking}
            style={{ background: "#b8860b", border: "none", color: "#1a1f2e", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
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
