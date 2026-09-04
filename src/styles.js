/* ---------- STYLES ---------- */
export const fontImports = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Orbitron:wght@500;700;800&family=Rajdhani:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; }
::selection { background: color-mix(in srgb, var(--accent) 30%, transparent); }
input, textarea, select { font-family: 'Manrope', sans-serif; }
.tree-row-menu { opacity: 0; transition: opacity .12s ease; }
.tree-row:hover .tree-row-menu, .tree-row:focus-within .tree-row-menu, .tree-row-menu.is-open { opacity: 0.75; }
.node-card-remove { opacity: 0; transition: opacity .12s ease; }
.node-card:hover .node-card-remove, .node-card:focus-within .node-card-remove { opacity: 1; }
.cover-overlay-actions { opacity: 0; transition: opacity .12s ease; }
.cover-wrap:hover .cover-overlay-actions, .cover-wrap:focus-within .cover-overlay-actions, .cover-overlay-actions.is-active { opacity: 1; }
.node-card, .folder-card { transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
.node-card:hover, .folder-card:hover, .node-card:focus-within, .folder-card:focus-within { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in srgb, var(--accent) 40%, transparent); border-color: var(--accent); }
.catalog-row { transition: background .12s ease; }
.catalog-row:hover { background: color-mix(in srgb, var(--accent) 8%, transparent); }
/* Foco de teclado visible en toda la app — sin esto, un usuario que navega
   con Tab no tiene forma de saber dónde está parado. */
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.login-input:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
/* Scrollbars a tono con la tableta holográfica, en vez del gris de sistema */
* { scrollbar-width: thin; scrollbar-color: var(--accent) var(--panel); }
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: var(--panel); }
::-webkit-scrollbar-thumb { background: linear-gradient(180deg, var(--border), var(--accent)); border-radius: 999px; border: 2px solid var(--panel); }
::-webkit-scrollbar-thumb:hover { background: var(--accent); }
/* Barrido de luz en loop sobre el panel principal, como en el prototipo de
   tableta — sutil (8%) para no tapar el contenido, y desactivado si el
   usuario prefiere menos movimiento en pantalla. */
.app-scan-sweep { position: absolute; left: 0; right: 0; height: 160px; background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--accent) 8%, transparent), transparent); pointer-events: none; animation: appSweep 7s linear infinite; z-index: 0; }
@keyframes appSweep { 0% { top: -160px; } 100% { top: 100%; } }
@media (prefers-reduced-motion: reduce) { .app-scan-sweep { display: none; } }
/* Cinta de mando: medallones ícono-primero en la barra lateral (reemplaza la
   pila vertical de botones de texto en la piel plana; la piel pixel-art
   conserva su lista de botones tal cual, ver isPixel en app.jsx). */
.nav-medal { transition: all .15s ease; }
.nav-medal:hover { color: var(--text); border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
/* Tarjetas de índice (Gran Libro/Bitácora/Herramientas): mismo patrón de
   elevación que node-card/folder-card arriba, con --cc (color de la
   sección) fijado inline por cada tarjeta. */
.section-card { transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
.section-card:hover, .section-card:focus-within {
  transform: translateY(-3px); border-color: var(--cc);
  box-shadow: 0 10px 24px rgba(0,0,0,0.4), 0 0 0 1px color-mix(in srgb, var(--cc) 45%, transparent), 0 0 26px color-mix(in srgb, var(--cc) 20%, transparent);
}
.crumb-link { transition: color .12s ease, background .12s ease; }
.crumb-link:hover { color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, transparent); }

/* Espacio cartográfico: mapa dominante, pendientes contextuales y acceso
   inferior a los libros. La navegación documental permanece en el árbol. */
.workspace-shell {
  --sd-void: #070b10; --sd-bg: #0c131b; --sd-panel: #111b25;
  --sd-raised: #162431; --sd-line: #294252; --sd-text: #e9f2f5;
  --sd-muted: #8ba0aa; --sd-cyan: #5bd6e8; --sd-gold: #d7aa5b;
  --sd-violet: #a879dc; --sd-danger: #e06d74;
  flex: 1; min-height: 0; display: flex; flex-direction: column;
  color: var(--sd-text); background: var(--sd-void);
}
.workspace-commandbar {
  min-height: 46px; display: flex; align-items: center; gap: 12px;
  padding: 6px 12px; background: rgba(7,11,16,.96); border-bottom: 1px solid var(--sd-line);
}
.workspace-heading { min-width: 0; display: flex; align-items: baseline; gap: 10px; }
.workspace-heading span { font: 600 12px 'Orbitron', sans-serif; letter-spacing: .1em; white-space: nowrap; }
.workspace-heading small { color: var(--sd-muted); white-space: nowrap; }
.workspace-command-actions { margin-left: auto; display: flex; align-items: center; gap: 4px; }
.workspace-command-actions button {
  min-height: 32px; display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  padding: 5px 9px; color: var(--sd-muted); background: transparent; border: 1px solid transparent;
  border-radius: 3px; cursor: pointer; transition: color 140ms cubic-bezier(.2,.8,.2,1), background 140ms cubic-bezier(.2,.8,.2,1), border-color 140ms cubic-bezier(.2,.8,.2,1), transform 140ms cubic-bezier(.2,.8,.2,1);
}
.workspace-command-actions button:hover, .workspace-command-actions button:focus-visible {
  color: var(--sd-cyan); background: var(--sd-raised); border-color: var(--sd-line); transform: translateY(-1px);
}
.workspace-command-actions button:active { transform: translateY(0); }
.workspace-layout { flex:1; min-height:0; display:grid; grid-template-columns:minmax(0,1fr) 250px; grid-template-rows:minmax(0,1fr) 76px; background:var(--sd-bg); }
.workspace-map-stage { position:relative; min-width:0; min-height:0; overflow:hidden; background-color:#102028; background-size:cover; background-position:center; box-shadow:inset 0 0 80px rgba(91,214,232,.08); }
.workspace-grid { position:absolute; inset:0; pointer-events:none; opacity:.48; background-image:linear-gradient(rgba(91,214,232,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(91,214,232,.055) 1px,transparent 1px),radial-gradient(circle at 50% 45%,rgba(91,214,232,.09),transparent 46%); background-size:34px 34px,34px 34px,100% 100%; }
.workspace-map-heading { position:absolute; z-index:3; top:20px; left:22px; display:grid; gap:4px; text-shadow:0 2px 10px var(--sd-void); }
.workspace-map-heading span,.workspace-map-picker>span { color:var(--sd-muted); font:500 9px 'JetBrains Mono',monospace; letter-spacing:.14em; }
.workspace-map-heading strong { font:600 18px 'Orbitron',sans-serif; letter-spacing:.08em; }
.workspace-map-picker { position:absolute; z-index:4; top:18px; right:18px; width:min(210px,32%); display:grid; gap:5px; }
.workspace-map-picker select { width:100%; min-height:34px; padding:5px 28px 5px 9px; color:var(--sd-text); background:rgba(7,11,16,.9); border:1px solid var(--sd-line); border-radius:3px; font:500 11px 'JetBrains Mono',monospace; }
.workspace-map-landmass { position:absolute; inset:11% 8% 10%; opacity:.76; filter:drop-shadow(0 0 18px rgba(91,214,232,.14)); }
.workspace-map-landmass svg { width:100%; height:100%; }.workspace-map-landmass path { fill:#23383d; stroke:#507981; stroke-width:1.4; }.workspace-map-landmass .workspace-map-inner { fill:#2b4143; opacity:.72; }
.workspace-map-pin { position:absolute; z-index:5; transform:translate(-50%,-50%); display:flex; align-items:center; gap:4px; padding:7px; color:var(--sd-cyan); background:transparent; border:0; cursor:pointer; filter:drop-shadow(0 0 8px currentColor); transition:transform 140ms cubic-bezier(.2,0,0,1),filter 140ms cubic-bezier(.2,0,0,1); }
.workspace-map-pin>span { position:absolute; left:25px; top:4px; max-width:150px; display:flex; align-items:center; gap:5px; padding:5px 7px; overflow:hidden; color:var(--sd-text); background:rgba(7,11,16,.88); border-left:1px solid currentColor; font-size:10px; white-space:nowrap; text-overflow:ellipsis; filter:none; }
.workspace-map-pin:hover,.workspace-map-pin:focus-visible { transform:translate(-50%,-50%) translateY(-2px); filter:drop-shadow(0 0 14px currentColor); }.workspace-map-pin.pin-tone-2 { color:var(--sd-gold); }.workspace-map-pin.pin-tone-3 { color:var(--sd-violet); }
.workspace-map-status { position:absolute; z-index:3; left:18px; bottom:16px; display:flex; gap:14px; color:var(--sd-muted); font:500 10px 'JetBrains Mono',monospace; }.workspace-map-status span { display:flex; align-items:center; gap:5px; }
.workspace-map-empty { position:absolute; inset:0; display:grid; place-items:center; color:var(--sd-muted); }
.workspace-pending { min-width:0; min-height:0; overflow:hidden; background:#0d1821; border-left:1px solid var(--sd-line); }
.workspace-pending-heading { min-height:48px; display:flex; align-items:center; justify-content:space-between; padding:0 14px; border-bottom:1px solid var(--sd-line); font:500 10px 'JetBrains Mono',monospace; letter-spacing:.1em; }.workspace-pending-heading strong { color:var(--sd-gold); font-size:13px; }
.workspace-pending-list { height:calc(100% - 48px); overflow:auto; padding:0 10px; }
.workspace-pending-list button { width:100%; min-height:64px; display:grid; grid-template-columns:5px minmax(0,1fr) 18px; align-items:center; gap:9px; padding:10px 4px; color:var(--sd-text); text-align:left; background:transparent; border:0; border-bottom:1px solid rgba(91,214,232,.11); cursor:pointer; transition:background 120ms ease-out,color 120ms ease-out; }
.workspace-pending-list button:hover,.workspace-pending-list button:focus-visible { background:rgba(91,214,232,.06); color:var(--sd-cyan); }.workspace-pending-marker { width:2px; height:28px; background:var(--sd-gold); }.workspace-pending-list button>span:nth-child(2) { min-width:0; display:grid; gap:4px; }.workspace-pending-list strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11px; font-weight:600; }.workspace-pending-list small { overflow:hidden; color:var(--sd-muted); font-size:9px; text-overflow:ellipsis; white-space:nowrap; }
.workspace-books { grid-column:1/3; min-width:0; display:flex; align-items:stretch; padding:8px 14px; background:#09121a; border-top:1px solid var(--sd-line); overflow:auto; }
.workspace-books-label { align-self:center; flex:0 0 auto; margin-right:15px; color:var(--sd-muted); font:500 9px 'JetBrains Mono',monospace; letter-spacing:.12em; }
.workspace-books button { flex:0 0 min(170px,23%); min-width:135px; display:flex; align-items:center; gap:10px; padding:7px 13px; color:var(--sd-muted); background:transparent; border:0; border-left:1px solid var(--sd-line); text-align:left; cursor:pointer; transition:color 120ms ease-out,background 120ms ease-out; }.workspace-books button:hover,.workspace-books button:focus-visible { color:var(--sd-text); background:rgba(91,214,232,.055); }.workspace-books button>svg { color:var(--sd-violet); }.workspace-books button>span { display:grid; gap:2px; }.workspace-books small { color:var(--sd-muted); font:500 8px 'JetBrains Mono',monospace; letter-spacing:.1em; }
.workspace-empty { margin:auto; padding:18px; color:var(--sd-muted); font-size:12px; line-height:1.5; text-align:center; }.workspace-loading { margin:auto; color:var(--muted); }
@media (max-width:1023px) { .workspace-layout { grid-template-columns:minmax(0,1fr) 215px; }.workspace-heading small { display:none; }.workspace-books-label { display:none; } }
@media (max-width:767px) { .workspace-commandbar { padding-left:50px; }.workspace-heading span { font-size:10px; }.workspace-command-actions button { min-width:44px; min-height:44px; }.workspace-layout { display:flex; flex-direction:column; overflow:auto; }.workspace-map-stage { flex:0 0 430px; }.workspace-pending { flex:0 0 280px; border-left:0; border-top:1px solid var(--sd-line); }.workspace-books { flex:0 0 76px; order:3; }.workspace-map-picker { top:64px; left:18px; right:auto; width:210px; }.workspace-map-heading { top:16px; }.workspace-map-pin>span { max-width:115px; } }
@media (prefers-reduced-motion: reduce) {
  .workspace-shell *, .workspace-shell *::before, .workspace-shell *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
}
`;

export const styles = {
  app: { display: "flex", height: "100vh", width: "100%", background: "var(--app-bg, var(--bg))", color: "var(--text)", fontFamily: "'Manrope', sans-serif", overflow: "hidden", position: "relative" },
  wikiPreviewCard: {
    position: "absolute", bottom: "130%", left: 0, zIndex: 60, minWidth: 180, maxWidth: 260,
    background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 8px)",
    padding: "8px 10px", boxShadow: "0 10px 26px rgba(0,0,0,0.45)", whiteSpace: "normal",
    fontWeight: 400, fontFamily: "'Manrope', sans-serif", cursor: "default", pointerEvents: "none",
  },
  linkSuggestBox: {
    position: "absolute", top: "100%", left: 0, marginTop: 2, zIndex: 55, minWidth: 200, maxWidth: 320,
    background: "var(--panel)", border: "1px solid var(--accent)", borderRadius: "var(--radius-md, 8px)",
    boxShadow: "0 10px 26px rgba(0,0,0,0.45)", overflow: "hidden", maxHeight: 220, overflowY: "auto",
  },
  linkSuggestItem: {
    display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", fontSize: 13, color: "var(--text)",
    cursor: "pointer", fontFamily: "'Manrope', sans-serif", borderBottom: "1px solid var(--border)",
  },
  dialogueReadyBadge: {
    display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--accent)",
    background: "color-mix(in srgb, var(--accent) 14%, transparent)", borderRadius: 999, padding: "2px 8px", marginBottom: 6,
  },
  dialoguePreviewToggle: {
    display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: "var(--muted)",
    fontSize: 11, cursor: "pointer", padding: "4px 0", fontFamily: "'Manrope', sans-serif",
  },
  dialoguePreviewBox: {
    display: "flex", gap: 10, alignItems: "center", background: "var(--panel2)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-md, 8px)", padding: 10, marginTop: 4,
  },
  dialoguePreviewPortrait: {
    width: 48, height: 48, borderRadius: "50%", background: "var(--panel2)", display: "flex",
    alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, border: "1px solid var(--border)",
  },
  dialoguePreviewName: { fontSize: 12.5, fontWeight: 700, color: "#e9c46a", marginBottom: 3, fontFamily: "'Manrope', sans-serif" },
  dialoguePreviewText: { fontSize: 13.5, color: "var(--text)", lineHeight: 1.5, fontFamily: "'Manrope', sans-serif" },
  tagsRow: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, margin: "2px 0 14px" },
  tagChip: {
    display: "flex", alignItems: "center", gap: 5, background: "var(--panel2)", border: "1px solid var(--border)",
    borderRadius: 999, padding: "3px 8px 3px 10px", fontSize: 12, color: "var(--text)", fontFamily: "'Manrope', sans-serif",
  },
  tagInput: {
    background: "transparent", border: "1px dashed var(--border)", borderRadius: 999, padding: "3px 10px",
    fontSize: 12, color: "var(--text)", minWidth: 110, fontFamily: "'Manrope', sans-serif",
  },
  configPickerToggle: {
    display: "flex", alignItems: "center", gap: 6, width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm, 5px)", padding: "6px 8px", fontSize: 13, cursor: "pointer", fontFamily: "'Manrope', sans-serif",
    margin: "2px 0 14px",
  },
  configPickerDropdown: {
    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20, background: "var(--panel)",
    border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 5px)", padding: 10, boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
  },
  compareWrap: { display: "flex", flex: 1, minHeight: 0, width: "100%" },
  compareSlot: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 },
  compareSlotHeader: {
    display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid var(--border)",
    background: "var(--panel)", flexWrap: "wrap",
  },
  compareSlotBody: { flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column" },
  compareDivider: { width: 1, background: "var(--border)", flexShrink: 0 },
  compareDividerH: { height: 1, background: "var(--border)", flexShrink: 0 },

  // Gran Libro / catálogos: panel de datos holográfico — vidrio oscuro,
  // borde de energía y grilla, reactivo al acento elegido en Apariencia.
  bookOuter: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
    padding: "28px 24px 40px", overflowY: "auto",
    background: "radial-gradient(1200px 700px at 50% -10%, color-mix(in srgb, var(--accent) 9%, var(--panel)) 0%, var(--bg) 62%)",
  },
  bookTopTabs: {
    display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", maxWidth: 900, width: "100%",
    marginBottom: -2, position: "relative", zIndex: 2, padding: "0 20px",
  },
  bookTab: {
    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px 10px", borderRadius: "10px 10px 0 0",
    color: "#05070c", fontSize: 12.5, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", cursor: "pointer",
    boxShadow: "0 -2px 6px rgba(0,0,0,0.35)", opacity: 0.72, transform: "translateY(4px)",
    transition: "transform .12s ease, opacity .12s ease",
  },
  bookTabActive: { opacity: 1, transform: "translateY(0)", boxShadow: "0 -4px 12px rgba(0,0,0,0.45)" },
  bookTabRemove: { cursor: "pointer", opacity: 0.55, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 9, margin: -9, borderRadius: "50%" },
  bookAddTab: {
    display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, alignSelf: "flex-end",
    borderRadius: "10px 10px 0 0", background: "color-mix(in srgb, var(--accent) 12%, transparent)", border: "1px dashed color-mix(in srgb, var(--accent) 45%, transparent)",
    color: "var(--accent)", cursor: "pointer",
  },
  bookFrame: {
    width: "100%", maxWidth: 900, background: "var(--panel)", borderRadius: 14,
    padding: 14, boxShadow: "0 20px 50px rgba(0,0,0,0.55), 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent), inset 0 0 0 1px rgba(255,255,255,0.04)",
    position: "relative", zIndex: 1,
  },
  bookSpread: { display: "flex", gap: 0, minHeight: 420, background: "var(--bg)", borderRadius: 6, overflow: "hidden" },
  bookPage: {
    flex: 1, background: "linear-gradient(160deg, color-mix(in srgb, var(--panel) 92%, white 3%), var(--panel))", padding: "22px 26px", display: "flex",
    flexDirection: "column", minWidth: 0, boxShadow: "inset 0 0 40px rgba(0,0,0,0.25)",
  },
  bookPageTitle: { fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 19, color: "var(--text)", margin: "0 0 12px", textAlign: "center" },
  bookTextarea: {
    flex: 1, background: "transparent", border: "none", resize: "none", color: "var(--text)",
    fontFamily: "'Manrope', sans-serif", fontSize: 15, lineHeight: 1.7, minHeight: 260,
  },
  bookSpine: {
    width: 14, flexShrink: 0, boxShadow: "0 0 14px color-mix(in srgb, var(--accent) 55%, transparent) inset",
    background: "linear-gradient(180deg, transparent, var(--accent) 35%, var(--accent) 65%, transparent)",
    opacity: 0.55,
  },
  bookSectionTitle: {
    fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--accent)", textTransform: "uppercase",
    letterSpacing: 0.8, marginBottom: 10, borderBottom: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)", paddingBottom: 4,
  },
  bookBonusGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  bookBonusField: {
    display: "flex", flexDirection: "column", gap: 2, fontSize: 10.5, color: "var(--muted)",
    fontFamily: "'Manrope', sans-serif", textTransform: "uppercase",
  },
  bookBonusInput: {
    width: "100%", boxSizing: "border-box",
    background: "var(--panel2)", border: "1px solid var(--border)", borderRadius: 5, padding: "4px 6px",
    color: "var(--text)", fontSize: 13, fontFamily: "'Manrope', sans-serif",
  },
  bookBottomHint: { fontSize: 11.5, color: "var(--muted)", fontStyle: "italic", padding: "6px 0", fontFamily: "'Manrope', sans-serif" },
  bookBody: { display: "flex", flexDirection: "row", alignItems: "flex-start", width: "100%", maxWidth: 940, justifyContent: "center" },
  bookLeftRail: { display: "flex", flexDirection: "column", gap: 4, marginRight: -2, position: "relative", zIndex: 2, paddingTop: 36 },
  bookLeftRailMobile: { display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", maxWidth: 900, width: "100%", marginBottom: -2, padding: "0 20px" },
  bookLeftTab: {
    display: "flex", alignItems: "center", gap: 6, padding: "8px 10px 8px 14px", borderRadius: "8px 0 0 8px",
    color: "#05070c", fontSize: 12, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", cursor: "pointer",
    boxShadow: "-2px 0 6px rgba(0,0,0,0.35)", opacity: 0.72, transform: "translateX(4px)", whiteSpace: "nowrap",
    transition: "transform .12s ease, opacity .12s ease",
  },
  bookLeftTabMobile: {
    display: "flex", alignItems: "center", gap: 6, padding: "8px 14px 10px", borderRadius: "10px 10px 0 0",
    color: "#05070c", fontSize: 12, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", cursor: "pointer",
    boxShadow: "0 -2px 6px rgba(0,0,0,0.35)", opacity: 0.72, transform: "translateY(4px)",
    transition: "transform .12s ease, opacity .12s ease",
  },
  bookLeftTabActive: { opacity: 1, transform: "translate(0,0)", boxShadow: "-4px 0 12px rgba(0,0,0,0.45)" },
  bookAddLeftTab: {
    display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, marginRight: -2,
    borderRadius: "8px 0 0 8px", background: "color-mix(in srgb, var(--accent) 12%, transparent)", border: "1px dashed color-mix(in srgb, var(--accent) 45%, transparent)",
    color: "var(--accent)", cursor: "pointer",
  },
  bookAddLeftTabMobile: {
    display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, alignSelf: "flex-end",
    borderRadius: "10px 10px 0 0", background: "color-mix(in srgb, var(--accent) 12%, transparent)", border: "1px dashed color-mix(in srgb, var(--accent) 45%, transparent)",
    color: "var(--accent)", cursor: "pointer",
  },
  bookSubclassHint: { fontSize: 11, color: "var(--muted)", fontStyle: "italic", textAlign: "center", marginTop: -8, marginBottom: 10, fontFamily: "'Manrope', sans-serif" },
  bookPageTurn: {
    position: "absolute", bottom: 10, width: 44, height: 44,
    clipPath: "polygon(20% 0,80% 0,100% 25%,100% 75%,80% 100%,20% 100%,0 75%,0 25%)",
    background: "var(--panel2)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", border: "1px solid var(--accent)", boxShadow: "0 0 14px color-mix(in srgb, var(--accent) 35%, transparent)", zIndex: 3,
  },
  bookSkillRow: {
    display: "flex", alignItems: "center", gap: 8, padding: "7px 14px 7px 10px", cursor: "pointer",
    clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
    background: "color-mix(in srgb, var(--accent) 6%, transparent)", color: "var(--text)", fontFamily: "'Manrope', sans-serif", fontSize: 13,
  },
  bookSkillRowType: { fontSize: 10.5, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" },
  bookFilterRow: { display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", maxWidth: 900, width: "100%", marginBottom: 10, padding: "0 20px" },
  bookFilterChip: {
    display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999,
    background: "var(--panel2)", border: "1px solid var(--border)",
    color: "var(--accent)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Manrope', sans-serif",
  },
  bookFilterChipActive: { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--bg)" },
  generalBookBackRow: {
    padding: "10px 20px 0", display: "flex",
    background: "radial-gradient(1200px 700px at 50% -10%, color-mix(in srgb, var(--accent) 9%, var(--panel)) 0%, var(--bg) 62%)",
  },
  generalBookBackBtn: {
    display: "flex", alignItems: "center", gap: 6, background: "var(--panel2)", border: "1px solid var(--border)",
    borderRadius: 999, padding: "6px 14px", color: "var(--accent)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Manrope', sans-serif",
  },
  generalBookTile: {
    display: "flex", alignItems: "center", gap: 10, padding: "10px 16px 10px 12px", cursor: "pointer",
    clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
    background: "color-mix(in srgb, var(--accent) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)",
  },
  bookEmptyState: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--muted)", textAlign: "center",
    marginTop: 60, fontFamily: "'Manrope', sans-serif", maxWidth: 320,
  },
  bookAddClassBtn: {
    display: "flex", alignItems: "center", gap: 6, background: "var(--accent)", color: "var(--bg)", border: "none",
    borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13,
  },

  loadingShell: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh" },
  loadingSeal: { width: 56, height: 56, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center" },

  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40 },
  sidebar: { width: 290, minWidth: 290, background: "var(--panel)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: 12, overflowY: "auto" },
  sidebarMobile: { position: "fixed", top: 0, left: 0, height: "100vh", width: "85vw", maxWidth: 330, background: "var(--panel)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: 12, overflowY: "auto", zIndex: 50, boxShadow: "4px 0 24px rgba(0,0,0,0.5)" },
  sidebarHeader: { display: "flex", alignItems: "center", gap: 8, padding: "6px 4px 10px" },
  collapseBtn: { background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, flexShrink: 0, padding: 4, borderRadius: "var(--radius-sm, 5px)" },
  expandHandle: { position: "absolute", top: 14, left: 14, zIndex: 20, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 8px)", padding: 8, cursor: "pointer", display: "flex" },
  brandSeal: { width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(145deg,#d9a93f,#8a6310)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  projectRow: { display: "flex", gap: 6, alignItems: "center", marginBottom: 10 },
  brainBtn: { display: "flex", alignItems: "center", gap: 6, border: "1px solid var(--border)", fontSize: 12, padding: "8px 10px", borderRadius: "var(--radius-md, 8px)", cursor: "pointer", marginBottom: 10, width: "100%", justifyContent: "center" },
  // Cinta de mando: fila de medallones ícono-primero, reemplaza la pila de
  // botones de texto de brainBtn en la piel plana (la piel pixel-art sigue
  // usando brainBtn tal cual, ver isPixel en app.jsx).
  navRibbon: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4, justifyContent: "center" },
  navMedalBtn: { background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "flex" },
  navMedal: {
    width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--panel2)", border: "1px solid var(--border)", color: "var(--muted)",
  },
  navMedalActive: {
    background: "color-mix(in srgb, var(--accent) 18%, transparent)", borderColor: "var(--accent)", color: "var(--accent)",
    boxShadow: "0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent), 0 0 14px color-mix(in srgb, var(--accent) 30%, transparent)",
  },
  navActiveLabel: { textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--accent)", letterSpacing: 0.3, marginBottom: 10, fontFamily: "'Rajdhani', sans-serif" },
  // Migas de pan: reemplazan el botón único "Índice de X ←" por un camino
  // clicable en cada nivel, para saltar entre secciones sin volver dos veces.
  breadcrumbRow: { display: "flex", alignItems: "center", gap: 6, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 14, padding: "8px 4px", marginBottom: 8 },
  breadcrumbCrumb: { color: "var(--muted)", cursor: "pointer", padding: "3px 6px", borderRadius: 4 },
  breadcrumbCurrent: { color: "var(--text)", padding: "3px 6px" },
  breadcrumbSep: { color: "var(--border)", fontSize: 12 },
  // Tarjetas de índice (Gran Libro/Bitácora/Herramientas): reemplazan las
  // filas generalBookTile — medallón grande con anillo del color de la
  // sección, glifo de fondo (mismo ícono, trazo fino, muy tenue) y contador
  // real opcional, en vez de un ícono chico + texto.
  sectionCardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 },
  sectionCard: {
    position: "relative", padding: "18px 16px 16px", cursor: "pointer", overflow: "hidden",
    clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
    background: "color-mix(in srgb, var(--cc) 7%, var(--panel))", border: "1px solid color-mix(in srgb, var(--cc) 30%, var(--border))",
  },
  sectionCardIcon: {
    width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
    background: "radial-gradient(circle at 30% 25%, color-mix(in srgb, var(--cc) 30%, transparent), color-mix(in srgb, var(--cc) 12%, transparent))",
    border: "1.5px solid color-mix(in srgb, var(--cc) 55%, transparent)", color: "var(--cc)",
    boxShadow: "0 0 0 4px color-mix(in srgb, var(--cc) 8%, transparent), inset 0 0 10px color-mix(in srgb, var(--cc) 20%, transparent)",
  },
  sectionCardGlyph: { position: "absolute", right: -10, bottom: -18, opacity: 0.05, color: "var(--cc)", pointerEvents: "none" },
  sectionCardTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "var(--text)", letterSpacing: 0.2 },
  sectionCardCount: { fontSize: 11, fontWeight: 700, color: "var(--cc)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 },
  sectionCardDesc: { fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.55 },
  // Accesos fijados: franja compacta en la barra lateral, visible en
  // cualquier pantalla (a diferencia de las tarjetas grandes de "Fijados"
  // del Panel del mundo, que siguen siendo el lugar para arrastrar y
  // soltar — esto es solo un atajo de lectura+salto rápido).
  pinnedStripLabel: { fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--muted)", margin: "2px 0 6px" },
  pinnedStripRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  pinnedChip: {
    display: "flex", alignItems: "center", gap: 5, padding: "5px 8px 5px 8px", borderRadius: 999, fontSize: 11.5,
    background: "var(--panel2)", border: "1px solid var(--border)", color: "var(--text)", cursor: "pointer", maxWidth: 150,
  },
  pinnedChipLabel: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  searchBox: { display: "flex", alignItems: "center", gap: 6, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 7px)", padding: "6px 8px", marginBottom: 10 },
  searchInput: { background: "transparent", border: "none", color: "var(--text)", fontSize: 13, width: "100%" },
  recentBox: { marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--border)" },
  recentTitle: { display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--muted)", marginBottom: 4, padding: "0 2px" },
  recentRow: { display: "flex", alignItems: "center", gap: 6, padding: "4px 6px", borderRadius: "var(--radius-sm, 5px)", cursor: "pointer", fontSize: 12.5, color: "var(--text)" },
  newRow: { display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" },
  newBtn: { display: "flex", alignItems: "center", gap: 4, background: "var(--panel2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 11, padding: "5px 8px", borderRadius: "var(--radius-sm, 5px)", cursor: "pointer" },
  tree: { flex: 1, overflowY: "auto" },
  treeRow: { display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: "var(--radius-sm, 5px)", cursor: "pointer", fontSize: 13.5 },
  treeLabel: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  renameInput: { background: "var(--bg)", border: "1px solid var(--accent)", color: "var(--text)", fontSize: 13, padding: "2px 4px", borderRadius: "var(--radius-sm, 4px)", width: "100%" },
  contextMenu: { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 7px)", padding: 4, marginBottom: 4, width: 170 },
  contextItem: { padding: "5px 8px", fontSize: 12.5, color: "var(--text)", cursor: "pointer", borderRadius: "var(--radius-sm, 4px)" },

  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--app-bg, var(--bg))", minWidth: 0, position: "relative" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--border)", gap: 8 },
  emptyState: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 },

  pageWrap: { flex: 1, overflowY: "auto", padding: "24px 20px", maxWidth: 760, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column" },
  pageTitleInput: { background: "transparent", border: "none", fontFamily: "'Orbitron', sans-serif", fontSize: 24, color: "var(--text)", width: "100%", marginBottom: 6 },
  pageTitle: { fontFamily: "'Orbitron', sans-serif", fontSize: 22, color: "var(--text)", margin: "20px 16px 0" },
  linkHint: { display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: 11.5, marginBottom: 10, flexWrap: "wrap" },
  textarea: { width: "100%", minHeight: 320, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 8px)", color: "var(--text)", padding: 16, fontSize: 16, lineHeight: 1.7, resize: "vertical", fontFamily: "'Manrope', sans-serif" },
  renderedContent: { whiteSpace: "pre-wrap", fontSize: 16, lineHeight: 1.8, color: "var(--text)", cursor: "text", minHeight: 200, padding: 4, fontFamily: "'Manrope', sans-serif" },

  tabRow: { display: "flex", gap: 0, marginBottom: 8, borderBottom: "1px solid var(--border)" },
  tabBtn: { background: "transparent", border: "none", borderBottom: "2px solid transparent", color: "var(--muted)", fontSize: 13, padding: "8px 14px", cursor: "pointer", fontFamily: "'Manrope', sans-serif" },
  tabBtnActive: { color: "var(--accent)", borderBottom: "2px solid var(--accent)", fontWeight: 600 },

  fmtBar: { display: "flex", gap: 3, alignItems: "center", marginBottom: 6, flexWrap: "wrap", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 7px)", padding: 4 },
  fmtBtn: { display: "flex", alignItems: "center", background: "transparent", border: "none", color: "var(--text)", padding: 6, borderRadius: "var(--radius-sm, 4px)", cursor: "pointer" },

  palette: { width: 176, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "var(--panel)", padding: "16px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 },
  paletteH: { borderBottom: "1px solid var(--border)", background: "var(--panel)", padding: "10px 12px" },
  paletteTitle: { fontFamily: "'Orbitron', sans-serif", fontSize: 13, color: "var(--accent)", letterSpacing: 0.5 },
  paletteItem: { display: "flex", alignItems: "center", gap: 8, background: "var(--panel2)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 8px)", padding: "9px 11px", fontSize: 12.5, color: "var(--text)", cursor: "grab", userSelect: "none" },
  paletteHint: { fontSize: 10.5, color: "var(--muted)", fontStyle: "italic", lineHeight: 1.5, marginTop: 4 },

  blockCanvas: { display: "flex", flexDirection: "column", gap: 10 },
  blockRow: { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" },
  blockWrap: { position: "relative", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg, 12px)", padding: "8px 12px 12px", boxSizing: "border-box" },
  blockToolbar: { display: "flex", alignItems: "center", gap: 2, marginBottom: 6, opacity: 0.85 },
  blockBtn: { display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", color: "var(--muted)", padding: 4, borderRadius: "var(--radius-sm, 4px)", cursor: "pointer" },
  blockBtnOn: { background: "var(--accent)", color: "var(--bg)" },
  textBlockBoxed: { background: "var(--panel2)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 8px)", padding: 14 },
  headingInput: { width: "100%", background: "transparent", border: "none", fontFamily: "'Orbitron', sans-serif", fontSize: 19, color: "var(--accent)" },
  captionInput: { width: "100%", background: "transparent", border: "none", borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: 12.5, fontStyle: "italic", padding: "6px 2px", marginTop: 6 },
  imgUploadBtn: { display: "flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "center", background: "var(--panel2)", border: "1px dashed var(--border)", color: "var(--muted)", fontSize: 13, padding: "24px 16px", borderRadius: "var(--radius-md, 8px)", cursor: "pointer" },
  imgPlaceholder: { padding: "24px 16px", textAlign: "center", color: "var(--muted)", fontSize: 12.5, fontStyle: "italic" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  statsGrid6: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8, marginBottom: 4 },
  statsIncidenceTitle2: { fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 12, marginBottom: 6 },
  statsField: { display: "flex", flexDirection: "column", gap: 3 },
  statsLabel: { fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.4 },
  statsInput: { width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 5px)", color: "var(--text)", padding: "6px 8px", fontSize: 14, fontFamily: "'Manrope', sans-serif" },
  statsPctInput: { width: 46, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 5px)", color: "var(--accent)", padding: "3px 4px", fontSize: 13, textAlign: "right", fontFamily: "'Manrope', sans-serif" },
  statsMiniInput: { width: "100%", boxSizing: "border-box", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 5px)", color: "var(--text)", padding: "3px 4px", fontSize: 13, fontFamily: "'Manrope', sans-serif" },
  resistRow: { display: "flex", alignItems: "center", gap: 8, padding: "4px 0" },
  resistSelect: { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 5px)", color: "var(--text)", padding: "3px 6px", fontSize: 12.5, fontFamily: "'Manrope', sans-serif" },
  statsTable: { borderCollapse: "collapse", width: "100%", fontSize: 12.5 },
  statsTh: { textAlign: "left", color: "var(--muted)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.4, padding: "4px 8px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" },
  statsTd: { padding: "4px 8px", color: "var(--text)", borderBottom: "1px solid color-mix(in srgb, var(--border) 60%, transparent)", whiteSpace: "nowrap" },
  statsTdTotal: { padding: "4px 8px", color: "var(--accent)", fontWeight: 700, borderBottom: "1px solid color-mix(in srgb, var(--border) 60%, transparent)", whiteSpace: "nowrap" },
  catalogLink: { color: "var(--accent)", fontWeight: 600, cursor: "pointer", borderBottom: "1px dashed var(--accent)" },
  statPillRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  statPill: { display: "flex", alignItems: "center", gap: 5, background: "var(--panel2)", border: "1px solid var(--border)", borderRadius: "var(--radius-pill, 16px)", padding: "3px 5px 3px 10px" },
  statPillLabel: { fontSize: 10.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.4 },
  statPillInput: { width: 32, boxSizing: "border-box", background: "transparent", border: "none", color: "var(--text)", fontWeight: 700, fontSize: 13, fontFamily: "'Manrope', sans-serif", padding: "2px 0", textAlign: "right" },
  lvlChipRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 },
  xpBarTrack: { flex: 1, minWidth: 60, maxWidth: 160, height: 6, background: "var(--panel2)", borderRadius: 3, overflow: "hidden" },
  xpBarFill: { display: "block", height: "100%", background: "linear-gradient(90deg, var(--border), var(--accent))" },
  headlineStatsRow: { display: "flex", gap: 18, flexWrap: "wrap" },
  headlineStat: { display: "flex", flexDirection: "column", gap: 1 },
  headlineStatNum: { fontSize: 18, fontWeight: 800, color: "var(--accent)" },
  headlineStatLabel: { fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.4 },
  blockDropEmpty: { border: "2px dashed var(--border)", borderRadius: "var(--radius-lg, 12px)", padding: "40px 24px", textAlign: "center", color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6 },
  blockDropEnd: { border: "2px dashed transparent", borderRadius: "var(--radius-md, 8px)", padding: "12px", textAlign: "center", color: "var(--muted)", fontSize: 11.5, fontStyle: "italic" },

  canvas: { position: "relative", width: "100%", border: "1px dashed var(--border)", borderRadius: "var(--radius-md, 8px)", backgroundColor: "color-mix(in srgb, var(--panel) 25%, transparent)", backgroundImage: "radial-gradient(circle, color-mix(in srgb, var(--muted) 65%, transparent) 1.4px, transparent 1.4px)", backgroundSize: "20px 20px", backgroundPosition: "1px 1px" },
  canvasEmpty: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontStyle: "italic", fontSize: 13, textAlign: "center", padding: "0 24px", pointerEvents: "none" },
  canvasItem: { position: "absolute", boxSizing: "border-box", display: "flex", flexDirection: "column", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg, 12px)", overflow: "hidden" },
  canvasItemHeader: { display: "flex", alignItems: "center", gap: 2, padding: "3px 6px", background: "var(--panel2)", borderBottom: "1px solid var(--border)", cursor: "grab", minHeight: 24 },
  canvasItemTitle: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "auto" },
  canvasItemBody: { flex: 1, overflow: "auto", padding: "8px 10px", minHeight: 0 },
  resizeHandle: { position: "absolute", right: 0, bottom: 0, width: 16, height: 16, cursor: "nwse-resize", background: "linear-gradient(135deg, transparent 50%, var(--accent) 50%)", borderBottomRightRadius: "var(--radius-lg, 12px)" },
  slotLabelInput: { flex: 1, background: "transparent", border: "none", color: "var(--text)", fontSize: 12, marginRight: 6 },
  slotPreview: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, height: "100%", color: "var(--muted)", fontSize: 12, fontStyle: "italic" },
  templateBadge: { display: "inline-flex", alignItems: "center", gap: 5, alignSelf: "flex-start", fontSize: 11, color: "var(--accent)", border: "1px solid var(--border)", borderRadius: "var(--radius-pill, 16px)", padding: "3px 10px", marginBottom: 10 },

  templatesOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  templatesModal: { width: "min(1000px, 96vw)", height: "min(760px, 90vh)", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg, 14px)", padding: 16, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" },
  templatesModalMobile: { position: "fixed", inset: 0, background: "var(--panel)", padding: 12, display: "flex", flexDirection: "column", gap: 10 },
  templatesTypeRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  templatesTabRow: { display: "flex", gap: 6, borderBottom: "1px solid var(--border)", paddingBottom: 10 },

  // Modales propios de "confirmar"/"pedir texto" (reemplazan window.confirm y
  // window.prompt) — mismo lenguaje visual que el resto del Gran Libro: panel
  // de vidrio oscuro, acento cian, tipografías Orbitron/Rajdhani/Manrope.
  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 80,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
  },
  modalPanel: {
    width: "min(420px, 94vw)", background: "var(--panel)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg, 14px)", padding: 20, display: "flex", flexDirection: "column", gap: 14,
    boxShadow: "0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent)",
  },
  modalTitle: { fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 15.5, color: "var(--text)", margin: 0 },
  modalMessage: { fontFamily: "'Manrope', sans-serif", fontSize: 13.5, color: "var(--text)", lineHeight: 1.5, margin: 0 },
  modalInput: {
    background: "var(--panel2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 6px)",
    padding: "9px 11px", fontSize: 14, color: "var(--text)", fontFamily: "'Manrope', sans-serif", width: "100%", boxSizing: "border-box",
  },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 },
  modalBtnCancel: {
    background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: "var(--radius-md, 8px)",
    padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Rajdhani', sans-serif", letterSpacing: 0.3,
  },
  modalBtnPrimary: {
    background: "var(--accent)", border: "none", color: "var(--bg)", borderRadius: "var(--radius-md, 8px)",
    padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Rajdhani', sans-serif", letterSpacing: 0.3,
  },
  modalBtnDanger: {
    background: "#c45c5c", border: "none", color: "#fff", borderRadius: "var(--radius-md, 8px)",
    padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Rajdhani', sans-serif", letterSpacing: 0.3,
  },

  nodeCard: { position: "relative", display: "flex", flexDirection: "column", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg, 12px)", overflow: "hidden", cursor: "pointer" },
  nodeCardFloating: { width: 230, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", border: "1px solid var(--accent)", cursor: "default" },
  nodeCardRemove: { position: "absolute", top: 6, right: 6, zIndex: 2, display: "flex", background: "rgba(10,12,18,0.75)", color: "var(--text)", borderRadius: "50%", padding: 3, cursor: "pointer" },
  nodeCardImg: { height: 96, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", borderBottom: "1px solid var(--border)", overflow: "hidden" },
  nodeCardBody: { display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px" },
  nodeCardTitle: { display: "flex", alignItems: "center", gap: 6, fontFamily: "'Manrope', sans-serif", fontSize: 15, color: "var(--text)", fontWeight: 600 },
  nodeCardSnippet: { fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5 },

  dashScroll: { flex: 1, overflowY: "auto" },
  dashBg: { minHeight: "100%", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", padding: "32px 24px 56px" },
  bgSwatchRow: { display: "flex", gap: 5, padding: 3, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-pill, 16px)" },
  bgSwatch: { width: 20, height: 20, borderRadius: "50%", border: "1px solid var(--border)", cursor: "pointer", padding: 0 },
  bgSwatchActive: { border: "2px solid var(--accent)", boxShadow: "0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent)" },
  dashHeaderRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 26, maxWidth: 1100, marginLeft: "auto", marginRight: "auto" },
  dashTitle: { fontFamily: "'Orbitron', sans-serif", fontSize: 26, color: "var(--text)", margin: 0 },
  dashBooksRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 26, maxWidth: 1100, marginLeft: "auto", marginRight: "auto" },
  dashBookBtn: {
    display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10,
    background: "var(--panel)", border: "1px solid var(--border)", color: "var(--text)",
    fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "'Manrope', sans-serif",
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
  },
  dashDropHint: { color: "var(--muted)", fontStyle: "italic", textAlign: "center", fontSize: 13, padding: "18px 8px" },
  dashPanel: {
    maxWidth: 1100, margin: "0 auto 22px", border: "1px solid var(--border)", borderRadius: "var(--radius-lg, 13px)", padding: 18,
    background: "color-mix(in srgb, var(--panel) 62%, transparent)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
    transition: "border-color .2s, background .2s",
  },
  dashTabRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  dashSectionTitle: { display: "flex", alignItems: "center", gap: 8, fontFamily: "'Manrope', sans-serif", fontSize: 18, color: "var(--text)", margin: "0 0 16px" },
  dashCount: { fontSize: 12, color: "var(--muted)", background: "var(--panel2)", borderRadius: "var(--radius-lg, 12px)", padding: "1px 8px" },
  dashEmpty: { color: "var(--muted)", fontStyle: "italic", fontSize: 13 },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 18 },

  folderView: { flex: 1, overflowY: "auto", paddingBottom: 32 },
  folderActions: { display: "flex", gap: 8, padding: "20px 20px 0", flexWrap: "wrap" },
  folderGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 16, padding: "24px 20px" },
  folderCard: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg, 12px)", padding: "18px 8px", cursor: "pointer", textAlign: "center", fontSize: 13 },
  subBadge: { position: "absolute", top: 6, right: 6, fontSize: 9, color: "var(--muted)", background: "var(--bg)", borderRadius: "var(--radius-sm, 4px)", padding: "1px 5px" },

  pillBtn: { display: "flex", alignItems: "center", gap: 5, background: "var(--panel2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 12, padding: "6px 12px", borderRadius: "var(--radius-pill, 16px)", cursor: "pointer" },
  pillBtnActive: { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--bg)" },
  pillBtnGhost: { display: "flex", alignItems: "center", gap: 4, background: "rgba(10,12,18,0.75)", border: "1px solid color-mix(in srgb, var(--accent) 55%, transparent)", color: "var(--text)", fontSize: 11.5, padding: "5px 10px", borderRadius: "var(--radius-pill, 16px)", cursor: "pointer" },
  addCoverBtn: { display: "flex", alignItems: "center", gap: 6, background: "var(--panel)", border: "1px dashed var(--border)", color: "var(--muted)", fontSize: 12.5, padding: "10px 16px", borderRadius: "var(--radius-md, 8px)", cursor: "pointer", marginBottom: 18, alignSelf: "flex-start" },
  coverWrap: { position: "relative", marginBottom: 22, borderRadius: "var(--radius-lg, 12px)", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg)" },
  coverImg: { width: "100%", height: 220, display: "block" },
  coverOverlayActions: { position: "absolute", top: 10, right: 10, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" },
  coverAdjustBar: { position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", background: "rgba(10,12,18,0.8)" },

  mapWrap: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" },
  mapToolbar: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" },
  mapTitleText: { fontFamily: "'Orbitron', sans-serif", fontSize: 15 },
  iconBtn: { border: "1px solid var(--border)", borderRadius: "var(--radius-md, 7px)", padding: 6, cursor: "pointer" },
  placingHint: { display: "flex", alignItems: "center", gap: 8, justifyContent: "center", background: "#3a2e10", color: "#e9c46a", fontSize: 12.5, padding: 6, textAlign: "center" },
  mapCanvasOuter: { flex: 1, overflow: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 14, position: "relative" },
  mapImage: { maxWidth: "100%", display: "block", borderRadius: "var(--radius-md, 7px)", border: "2px solid var(--border)", userSelect: "none" },
  mapEmpty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--muted)", marginTop: 60, textAlign: "center", padding: "0 16px" },
  pinMarker: { position: "absolute", transform: "translate(-50%,-100%)", background: "var(--accent)", borderRadius: "50% 50% 50% 0", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--panel)", boxShadow: "0 2px 6px rgba(0,0,0,0.5)" },
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
  timelineTitleInput: { background: "transparent", border: "none", color: "var(--text)", fontSize: 16, fontWeight: 600, padding: "2px 0" },
  timelineDescInput: { background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "var(--radius-sm, 5px)", padding: 8, fontSize: 13.5, minHeight: 60, resize: "vertical", lineHeight: 1.5 },
  timelineHTrack: { position: "relative", overflowX: "auto", paddingBottom: 20, paddingTop: 6 },
  timelineHLine: { position: "absolute", top: 32, left: 0, right: 0, height: 2, background: "var(--border)", minWidth: "100%" },
  timelineHDot: { position: "absolute", top: 5, left: "50%", transform: "translateX(-50%)", width: 12, height: 12, borderRadius: "50%", background: "var(--accent)", zIndex: 2 },
  // Franja de solo lectura dentro de un hito: lo que ya está marcado en el
  // Mapa elegido como Lugar (pins filtrados por Enemigo/Objeto) — no es un
  // campo para llenar, es una vista derivada de los pins del propio Mapa.
  timelineMapPreview: { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 5px)", padding: "8px 9px", display: "flex", flexDirection: "column", gap: 6 },
  timelineMapPreviewLabel: { fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--muted)" },
  timelineMapPreviewRow: { display: "flex", alignItems: "center", gap: 8 },
  timelineMapPreviewRowLabel: { fontSize: 10.5, color: "var(--muted)", width: 60, flexShrink: 0 },
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
