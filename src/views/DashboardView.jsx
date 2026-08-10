import { useState, useEffect, useRef, useMemo } from "react";
import { MapPin, Trash2, ImageIcon, Clock, Brain, Unlink, CircleAlert, Compass, BookOpen } from "lucide-react";
import { BG_PRESETS } from "../data/theme.js";
import { computeBrainGraph } from "../utils/graph.js";
import { compressImageFile } from "../utils/images.js";
import { uid } from "../utils/misc.js";
import { pageHasDescription } from "../utils/text.js";
import { findNode } from "../utils/tree.js";
import { deleteImage, loadImage, saveImage } from "../storage.js";
import { styles } from "../styles.js";
import { NodeCard } from "../components/NodeCard.jsx";

/* ---------- DASHBOARD (panel principal) ---------- */
// `config`/`saveConfig` (fondo + tarjetas fijadas) vienen de app.jsx en vez
// de cargarse acá — así los accesos fijados se pueden mostrar también en la
// franja de la barra lateral, visible en cualquier pantalla, sin que dos
// lugares distintos carguen y guarden la misma clave por separado.
export function DashboardView({ nodes, navigateToId, config, saveConfig: save, dashBgKey, isMobile, skin, openGeneralBook, openStoryBook, openHandbook }) {
  const [bg, setBg] = useState(null);
  const [dropActive, setDropActive] = useState(false);
  const [activeTab, setActiveTab] = useState("recent");
  const bgInputRef = useRef(null);

  useEffect(() => {
    if (!config) return;
    let alive = true;
    (async () => { const b = config.bgImageKey ? await loadImage(dashBgKey) : null; if (alive) setBg(b); })();
    return () => { alive = false; };
  }, [config?.bgImageKey, dashBgKey]);

  const orphanConnected = useMemo(() => computeBrainGraph(nodes).connected, [nodes]);

  async function handleBg(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImageFile(file);
    if (!dataUrl) return;
    const ok = await saveImage(dashBgKey, dataUrl);
    if (ok) { setBg(dataUrl); save({ ...config, bgImageKey: dashBgKey, bgPreset: null }); }
  }
  function removeBg() { deleteImage(dashBgKey); setBg(null); save({ ...config, bgImageKey: null, bgPreset: null }); }
  function selectPreset(key) {
    if (config.bgImageKey) deleteImage(dashBgKey);
    setBg(null);
    save({ ...config, bgImageKey: null, bgPreset: config.bgPreset === key ? null : key });
  }

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
  const presetStyle = !bg && config.bgPreset ? BG_PRESETS.find((p) => p.key === config.bgPreset)?.style : null;
  const dashTabs = [
    { key: "recent", label: "Recientes", icon: Clock, items: recent, empty: "Aún no hay entradas. Crea tu primera página." },
    { key: "incomplete", label: "Sin descripción", icon: CircleAlert, items: incomplete, empty: "¡Todas las entradas tienen descripción!" },
    { key: "orphans", label: "Sin enlaces", icon: Unlink, items: orphans, empty: "Todas las entradas están conectadas." },
  ];
  const activeDashTab = dashTabs.find((t) => t.key === activeTab) || dashTabs[0];

  return (
    <div style={styles.dashScroll}>
      <div style={{
        ...styles.dashBg,
        ...(presetStyle || {}),
        backgroundImage: bg ? `linear-gradient(rgba(5,7,12,0.4), rgba(5,7,12,0.68)), url(${bg})` : (presetStyle ? presetStyle.backgroundImage : "none"),
      }}>
        <div style={styles.dashHeaderRow}>
          <h1 style={styles.dashTitle}>Panel del mundo</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={styles.bgSwatchRow} title="Fondos predefinidos">
              {BG_PRESETS.map((p) => (
                <button key={p.key} title={p.label} onClick={() => selectPreset(p.key)}
                  style={{ ...styles.bgSwatch, ...p.style, ...(config.bgPreset === p.key && !bg ? styles.bgSwatchActive : {}) }} />
              ))}
            </div>
            <button style={styles.pillBtn} onClick={() => bgInputRef.current?.click()}><ImageIcon size={13} /> {bg ? "Cambiar imagen" : "Subir imagen"}</button>
            {(bg || config.bgPreset) && <button style={{ ...styles.pillBtn, color: "#c45c5c" }} onClick={removeBg}><Trash2 size={13} /> Quitar fondo</button>}
            <input ref={bgInputRef} type="file" accept="image/*" hidden onChange={handleBg} />
          </div>
        </div>

        <div style={styles.dashBooksRow}>
          <button style={styles.dashBookBtn} onClick={openGeneralBook}>
            <BookOpen size={16} color="var(--accent)" /> Gran Libro
          </button>
          <button style={styles.dashBookBtn} onClick={openStoryBook}>
            <Compass size={16} color="#81b29a" /> Libro de historia
          </button>
          <button style={styles.dashBookBtn} onClick={openHandbook}>
            <Brain size={16} color="#c583d6" /> Bitácora
          </button>
        </div>

        <div style={{ ...styles.dashPanel, ...(dropActive ? { borderColor: "var(--accent)", background: "color-mix(in srgb, var(--accent) 14%, transparent)" } : {}) }}
          onDragOver={(e) => { if (e.dataTransfer.types.includes("text/wb-node")) { e.preventDefault(); setDropActive(true); } }}
          onDragLeave={() => setDropActive(false)}
          onDrop={handleDrop}>
          <h2 style={styles.dashSectionTitle}><MapPin size={15} color="var(--accent)" /> Fijados</h2>
          {pinned.length === 0
            ? <div style={styles.dashDropHint}>Arrastra páginas o carpetas desde el panel izquierdo para fijarlas aquí como tarjetas de acceso rápido.</div>
            : <div style={styles.cardGrid}>{pinned.map(({ card, node }) => <NodeCard key={card.id} node={node} nodes={nodes} onOpen={navigateToId} onRemove={() => removeCard(card.id)} skin={skin} />)}</div>}
        </div>

        <div style={styles.dashPanel}>
          <div style={styles.dashTabRow}>
            {dashTabs.map((t) => {
              const TIcon = t.icon;
              const active = t.key === activeDashTab.key;
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ ...styles.pillBtn, ...(active ? styles.pillBtnActive : {}) }}>
                  <TIcon size={13} /> {t.label}
                  <span style={{ ...styles.dashCount, ...(active ? { background: "rgba(0,0,0,0.18)", color: "var(--bg)" } : {}) }}>{t.items.length}</span>
                </button>
              );
            })}
          </div>
          {activeDashTab.items.length === 0
            ? <div style={styles.dashEmpty}>{activeDashTab.empty}</div>
            : <div style={styles.cardGrid}>{activeDashTab.items.map((n) => <NodeCard key={n.id} node={n} nodes={nodes} onOpen={navigateToId} skin={skin} />)}</div>}
        </div>
      </div>
    </div>
  );
}
