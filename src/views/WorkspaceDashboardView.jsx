import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, BookOpen, Brain, ChevronDown, Clock3, Expand, ImageIcon, ListTodo, Map as MapIcon, MapPin, Maximize2, Minimize2, Network, ScrollText, Settings2, Sparkles, Trash2, Wrench, X } from "lucide-react";
import { BG_PRESETS } from "../data/theme.js";
import { computeBrainGraph } from "../utils/graph.js";
import { compressImageFile } from "../utils/images.js";
import { uid } from "../utils/misc.js";
import { pageHasDescription } from "../utils/text.js";
import { deleteImage, loadImage, saveImage } from "../storage.js";
import { EntryIcon } from "../components/EntryIcon.jsx";

const GRAPH_POSITIONS = [{ x: 19, y: 34 }, { x: 48, y: 24 }, { x: 77, y: 39 }, { x: 31, y: 72 }, { x: 63, y: 70 }, { x: 83, y: 76 }, { x: 51, y: 49 }];

export function WorkspaceDashboardView({ nodes, navigateToId, updateNode, config, saveConfig: save, dashBgKey, openGeneralBook, openStoryBook, openHandbook, openTools }) {
  const [background, setBackground] = useState(null);
  const [mapImage, setMapImage] = useState(null);
  const [activeMapId, setActiveMapId] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPinId, setSelectedPinId] = useState(null);
  const [focus, setFocus] = useState(null);
  const [mobileSpace, setMobileSpace] = useState("map");
  const [dragOver, setDragOver] = useState(false);
  const backgroundInput = useRef(null);
  const mapStage = useRef(null);
  const pinDrag = useRef(null);
  const pages = useMemo(() => nodes.filter((node) => node.type === "page"), [nodes]);
  const maps = useMemo(() => {
    const candidates = nodes.filter((node) => node.type === "map" || node.category === "map");
    return candidates.length ? candidates : pages.filter((node) => /mapa|regi[oó]n|mundo|continente/i.test(node.name));
  }, [nodes, pages]);
  const activeMap = maps.find((node) => node.id === activeMapId) || maps[0] || null;
  const graph = useMemo(() => computeBrainGraph(nodes), [nodes]);
  const incomplete = useMemo(() => pages.filter((node) => !pageHasDescription(node)), [pages]);
  const orphanCount = useMemo(() => pages.filter((node) => !graph.connected.has(node.id)).length, [pages, graph.connected]);
  const timelines = useMemo(() => nodes.filter((node) => node.type === "timeline"), [nodes]);
  const timeline = useMemo(() => {
    const preferredId = activeMap ? config?.timelineByMap?.[activeMap.id] : null;
    const preferred = timelines.find((node) => node.id === preferredId);
    if (preferred || !activeMap) return preferred || timelines[0] || null;
    const relevantIds = new Set([activeMap.id, ...(activeMap.pins || []).map((pin) => pin.linkedPageId)].filter(Boolean));
    const score = (item) => (item.events || []).reduce((total, event) => total + Number(
      relevantIds.has(event.linkedPageId) || relevantIds.has(event.placeId) ||
      (event.characterIds || []).some((id) => relevantIds.has(id))
    ), 0);
    return [...timelines].sort((a, b) => score(b) - score(a) || (b.events || []).length - (a.events || []).length)[0] || null;
  }, [activeMap, config?.timelineByMap, timelines]);
  const timelineEvents = useMemo(
    () => [...(timeline?.events || [])].sort((a, b) => String(a.date || "").localeCompare(String(b.date || ""))),
    [timeline]
  );
  const mapItems = useMemo(() => (activeMap?.pins || []).map((pin) => ({ pin, node: nodes.find((node) => node.id === pin.linkedPageId) || null })), [activeMap, nodes]);
  const mapRelevantIds = useMemo(() => new Set([activeMap?.id, ...mapItems.map(({ node }) => node?.id)].filter(Boolean)), [activeMap?.id, mapItems]);
  const relatedEventIds = useMemo(() => new Set(timelineEvents.filter((event) => (
    mapRelevantIds.has(event.linkedPageId) || mapRelevantIds.has(event.placeId) ||
    (event.characterIds || []).some((id) => mapRelevantIds.has(id))
  )).map((event) => event.id)), [mapRelevantIds, timelineEvents]);
  const graphNodes = useMemo(() => {
    const preferred = mapItems.map(({ node }) => node).filter(Boolean);
    const ids = new Set(preferred.map((node) => node.id));
    const connected = [];
    graph.edges.forEach((edge) => {
      if (ids.has(edge.from)) connected.push(nodes.find((node) => node.id === edge.to));
      if (ids.has(edge.to)) connected.push(nodes.find((node) => node.id === edge.from));
    });
    const merged = [...preferred, ...connected.filter(Boolean), ...pages];
    return merged.filter((node, index) => node && merged.findIndex((item) => item?.id === node.id) === index).slice(0, 7);
  }, [graph.edges, mapItems, nodes, pages]);
  const graphPositions = useMemo(() => Object.fromEntries(graphNodes.map((node, index) => [node.id, GRAPH_POSITIONS[index]])), [graphNodes]);
  const visibleEdges = useMemo(() => graph.edges.filter((edge) => graphPositions[edge.from] && graphPositions[edge.to]), [graph.edges, graphPositions]);
  const selectedNode = selectedId ? nodes.find((node) => node.id === selectedId) : null;
  const selectedPin = selectedPinId ? activeMap?.pins?.find((pin) => pin.id === selectedPinId) : null;

  useEffect(() => {
    if (!config) return;
    let alive = true;
    (async () => { const image = config.bgImageKey ? await loadImage(dashBgKey) : null; if (alive) setBackground(image); })();
    return () => { alive = false; };
  }, [config?.bgImageKey, dashBgKey]);
  useEffect(() => {
    let alive = true; setMapImage(null);
    (async () => { if (!activeMap?.mapImageKey) return; const image = await loadImage(`map-image:${activeMap.id}`); if (alive) setMapImage(image); })();
    return () => { alive = false; };
  }, [activeMap?.id, activeMap?.mapImageKey]);
  useEffect(() => {
    function move(event) {
      const drag = pinDrag.current;
      if (!drag || !mapStage.current || !activeMap) return;
      const point = event.touches?.[0] || event;
      const rect = mapStage.current.getBoundingClientRect();
      const x = Math.max(1, Math.min(99, ((point.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(2, Math.min(98, ((point.clientY - rect.top) / rect.height) * 100));
      drag.moved = true;
      updateNode(activeMap.id, { pins: (activeMap.pins || []).map((pin) => pin.id === drag.id ? { ...pin, x, y } : pin) });
      if (event.cancelable) event.preventDefault();
    }
    function release() { const drag = pinDrag.current; if (drag && !drag.moved) selectPin(drag.id); pinDrag.current = null; }
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", release);
    window.addEventListener("touchmove", move, { passive: false }); window.addEventListener("touchend", release);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", release); window.removeEventListener("touchmove", move); window.removeEventListener("touchend", release); };
  }, [activeMap, updateNode]);

  if (!config) return <div className="workspace-loading">Cargando espacio de trabajo…</div>;
  const preset = !background && config.bgPreset ? BG_PRESETS.find((item) => item.key === config.bgPreset)?.style : null;
  const backgroundStyle = mapImage ? { backgroundImage: `linear-gradient(rgba(3,10,16,.12),rgba(3,10,16,.42)),url(${mapImage})` } : background ? { backgroundImage: `linear-gradient(rgba(3,10,16,.24),rgba(3,10,16,.66)),url(${background})` } : preset || {};
  function selectEntity(id) { setSelectedId(id || null); setSelectedPinId(null); }
  function selectPin(id) { const pin = activeMap?.pins?.find((item) => item.id === id); setSelectedPinId(id); setSelectedId(pin?.linkedPageId || null); }
  function closeContext() { setSelectedId(null); setSelectedPinId(null); }
  function chooseTimeline(nextTimelineId) {
    if (!activeMap) return;
    save({ ...config, timelineByMap: { ...(config.timelineByMap || {}), [activeMap.id]: nextTimelineId } });
    closeContext();
  }
  async function handleBackground(event) {
    const file = event.target.files?.[0]; if (!file) return;
    const dataUrl = await compressImageFile(file);
    if (dataUrl && await saveImage(dashBgKey, dataUrl)) { setBackground(dataUrl); save({ ...config, bgImageKey: dashBgKey, bgPreset: null }); }
  }
  function removeBackground() { deleteImage(dashBgKey); setBackground(null); save({ ...config, bgImageKey: null, bgPreset: null }); }
  function handleMapDrop(event) {
    event.preventDefault(); setDragOver(false);
    if (!activeMap || !mapStage.current) return;
    const nodeId = event.dataTransfer.getData("text/wb-node"); const node = nodes.find((item) => item.id === nodeId); if (!node) return;
    const rect = mapStage.current.getBoundingClientRect();
    const x = Math.max(2, Math.min(98, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(3, Math.min(97, ((event.clientY - rect.top) / rect.height) * 100));
    updateNode(activeMap.id, { pins: [...(activeMap.pins || []), { id: uid(), x, y, icon: "pin", label: node.name, linkedPageId: node.id }] }); selectEntity(node.id);
  }
  return <div className={`synoptic-shell ${focus ? `focus-${focus}` : ""}`}>
    <header className="synoptic-commandbar">
      <div className="synoptic-identity"><span className="synoptic-mark">A</span><span><strong>ATLAS SYNOPTIC</strong><small>{activeMap?.name || "ESPACIO CARTOGRÁFICO"}</small></span></div>
      <label className="synoptic-map-select"><MapIcon size={14} /><span className="sr-only">Mapa activo</span><select value={activeMap?.id || ""} onChange={(event) => { setActiveMapId(event.target.value); closeContext(); }} disabled={!maps.length}>{maps.length ? maps.map((map) => <option key={map.id} value={map.id}>{map.name}</option>) : <option>Sin mapas</option>}</select><ChevronDown size={13} /></label>
      <div className="synoptic-telemetry"><span>● SINCRONIZADO</span><span>{graph.edges.length} ENLACES</span></div>
      <div className="synoptic-command-actions"><button type="button" onClick={() => backgroundInput.current?.click()}><ImageIcon size={14} /><span>Fondo</span></button>{(background || config.bgPreset) && <button type="button" onClick={removeBackground} aria-label="Quitar fondo"><Trash2 size={14} /></button>}<input ref={backgroundInput} type="file" accept="image/*" hidden onChange={handleBackground} /></div>
    </header>
    <div className="synoptic-mobile-tabs" role="tablist" aria-label="Espacio activo">{[{ key: "map", label: "Mapa", Icon: MapIcon }, { key: "graph", label: "Relaciones", Icon: Network }, { key: "timeline", label: "Tiempo", Icon: Clock3 }].map(({ key, label, Icon }) => <button key={key} type="button" className={mobileSpace === key ? "active" : ""} onClick={() => setMobileSpace(key)}><Icon size={15} />{label}</button>)}</div>
    <div className="synoptic-layout">
      <section className={`synoptic-panel synoptic-map ${mobileSpace === "map" ? "mobile-active" : ""}`}><PanelHeader icon={MapIcon} title="Mapa cartográfico" meta={`${String(mapItems.length).padStart(2, "0")} PUNTOS`} focused={focus === "map"} onFocus={() => setFocus(focus === "map" ? null : "map")} />
        <div ref={mapStage} className={`synoptic-map-stage ${dragOver ? "drop-active" : ""}`} style={backgroundStyle} onClick={(event) => { if (!event.target.closest(".synoptic-pin-wrap")) closeContext(); }} onDragOver={(event) => { if (event.dataTransfer.types.includes("text/wb-node")) { event.preventDefault(); setDragOver(true); } }} onDragLeave={() => setDragOver(false)} onDrop={handleMapDrop}>
          {!mapImage && <div className="synoptic-map-decor"><div className="synoptic-landmass" /><div className="synoptic-contour contour-a" /><div className="synoptic-contour contour-b" /></div>}<div className="synoptic-map-watermark">{activeMap?.name || "ATLAS"}</div>
          {(activeMap?.pins || []).map((pin, index) => { const linked = nodes.find((node) => node.id === pin.linkedPageId); const isSelected = pin.id === selectedPinId || linked?.id === selectedId; return <div key={pin.id} className="synoptic-pin-wrap" style={{ left: `${pin.x}%`, top: `${pin.y}%` }}><button type="button" className={`synoptic-pin tone-${(index % 3) + 1} ${isSelected ? "selected" : ""}`} aria-label={pin.label || linked?.name || "Punto"} onClick={() => selectPin(pin.id)} onMouseDown={(event) => { event.stopPropagation(); pinDrag.current = { id: pin.id, moved: false }; }} onTouchStart={(event) => { event.stopPropagation(); pinDrag.current = { id: pin.id, moved: false }; }}><MapPin size={16} /></button><span>{pin.label || linked?.name || "Punto"}</span></div>; })}
          {!activeMap && <div className="synoptic-empty"><MapIcon size={32} /><span>Crea un mapa para iniciar el espacio sinóptico.</span></div>}{activeMap && !(activeMap.pins || []).length && <div className="synoptic-drop-hint">Arrastra una entrada desde el árbol para colocarla en el mapa</div>}<div className="synoptic-coordinates">LAT 43.07 · LONG 18.42 · CAPA 03</div>
        </div>
      </section>
      <section className={`synoptic-panel synoptic-graph ${mobileSpace === "graph" ? "mobile-active" : ""}`}><PanelHeader icon={Network} title="Red de relaciones" meta={`${String(visibleEdges.length).padStart(2, "0")} ENLACES`} focused={focus === "graph"} onFocus={() => setFocus(focus === "graph" ? null : "graph")} /><div className="synoptic-graph-stage" onClick={(event) => { if (event.target === event.currentTarget) closeContext(); }}><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{visibleEdges.map((edge, index) => <line key={`${edge.from}-${edge.to}-${index}`} x1={graphPositions[edge.from].x} y1={graphPositions[edge.from].y} x2={graphPositions[edge.to].x} y2={graphPositions[edge.to].y} />)}</svg>{graphNodes.map((node) => <button type="button" key={node.id} className={`synoptic-node ${selectedId === node.id ? "selected" : ""}`} style={{ left: `${graphPositions[node.id].x}%`, top: `${graphPositions[node.id].y}%` }} onClick={() => selectEntity(node.id)}><EntryIcon node={node} size={14} /><span>{node.name}</span></button>)}{!graphNodes.length && <div className="synoptic-empty"><Network size={30} /><span>Las relaciones aparecerán aquí.</span></div>}</div></section>
      <section className={`synoptic-panel synoptic-timeline ${mobileSpace === "timeline" ? "mobile-active" : ""}`}>
        <PanelHeader icon={Clock3} title="Línea temporal" meta={`${String(relatedEventIds.size).padStart(2, "0")} RELACIONADOS`} focused={focus === "timeline"} onFocus={() => setFocus(focus === "timeline" ? null : "timeline")} />
        <div className="synoptic-time-stage" onClick={(event) => { if (event.target === event.currentTarget) closeContext(); }}>
          <label className="synoptic-timeline-picker"><span>CRONOLOGÍA</span><select value={timeline?.id || ""} onChange={(event) => chooseTimeline(event.target.value)} disabled={!timelines.length}>{timelines.length ? timelines.map((item) => <option key={item.id} value={item.id}>{item.name}</option>) : <option value="">Sin líneas de tiempo</option>}</select><ChevronDown size={12} /></label>
          <div className="synoptic-time-line" />
          {timelineEvents.map((event, index) => {
            const linkedId = event.linkedPageId || event.placeId || event.characterIds?.[0];
            const left = timelineEvents.length === 1 ? 50 : 8 + index * (84 / Math.max(1, timelineEvents.length - 1));
            const related = relatedEventIds.has(event.id);
            return <button type="button" key={event.id} className={`synoptic-event ${related ? "map-related" : ""} ${linkedId && selectedId === linkedId ? "selected" : ""}`} style={{ left: `${left}%` }} onClick={() => linkedId && selectEntity(linkedId)} aria-label={`${event.title || "Evento"}${related ? ", relacionado con el mapa" : ""}`}><span>{event.date || `HITO ${index + 1}`}</span><i /><strong>{event.title || "Evento sin título"}</strong></button>;
          })}
          {!timelineEvents.length && <div className="synoptic-empty compact"><Clock3 size={24} /><span>Esta línea temporal todavía no tiene eventos.</span></div>}
        </div>
      </section>
      <aside className="synoptic-present"><div className="synoptic-present-head"><span>EN ESTE MAPA</span><strong>{String(mapItems.length).padStart(2, "0")}</strong></div><div className="synoptic-present-list">{mapItems.map(({ pin, node }) => <button type="button" key={pin.id} className={(pin.id === selectedPinId || node?.id === selectedId) ? "selected" : ""} onClick={() => selectPin(pin.id)}><span className="synoptic-item-signal" /><span><strong>{pin.label || node?.name || "Punto sin nombre"}</strong><small>{node?.category || "Punto de interés"}</small></span>{node ? <EntryIcon node={node} size={15} /> : <MapPin size={15} />}</button>)}</div>{!mapItems.length && <p className="synoptic-empty-copy">Este mapa todavía no contiene elementos vinculados.</p>}<div className="synoptic-health"><span><AlertCircle size={12} />{incomplete.length} incompletos</span><span><Sparkles size={12} />{orphanCount} aislados</span></div></aside>
    </div>
    <nav className="synoptic-dock"><button type="button" onClick={openGeneralBook}><BookOpen size={18} /><span><small>ARCHIVO</small>Gran Libro</span></button><button type="button" onClick={openStoryBook}><ScrollText size={18} /><span><small>SECUENCIA</small>Historia</span></button><button type="button" onClick={openHandbook}><Brain size={18} /><span><small>RED</small>Relaciones</span></button><button type="button" onClick={() => incomplete[0] && selectEntity(incomplete[0].id)}><ListTodo size={18} /><span><small>{incomplete.length} ABIERTAS</small>Pendientes</span></button><span className="synoptic-dock-spacer" /><button type="button" onClick={openTools}><Wrench size={18} /><span><small>SISTEMA</small>Herramientas</span></button><button type="button" onClick={() => backgroundInput.current?.click()}><Settings2 size={18} /><span><small>ESPACIO</small>Configurar</span></button></nav>
    {(selectedNode || selectedPin) && <aside className="synoptic-inspector"><header><span><small>{selectedNode?.category || "PUNTO DE INTERÉS"}</small><strong>{selectedNode?.name || selectedPin?.label || "Sin nombre"}</strong></span><button type="button" onClick={closeContext} aria-label="Cerrar inspector"><X size={17} /></button></header><div className="synoptic-inspector-body"><div className="synoptic-facts"><span><small>MAPA</small><strong>{activeMap?.name || "—"}</strong></span><span><small>ENLACES</small><strong>{selectedNode ? graph.edges.filter((edge) => edge.from === selectedNode.id || edge.to === selectedNode.id).length : 0}</strong></span><span><small>ESTADO</small><strong>{selectedNode && pageHasDescription(selectedNode) ? "LISTO" : "PENDIENTE"}</strong></span></div><h3>REGISTRO</h3><p>{selectedNode?.content || selectedNode?.content2 || "Esta entidad aún no tiene un resumen. Ábrela para completar su información."}</p>{selectedNode && <button type="button" className="synoptic-primary" onClick={() => navigateToId(selectedNode.id)}><Expand size={15} />Abrir ficha completa</button>}</div></aside>}
  </div>;
}

function PanelHeader({ icon: Icon, title, meta, focused, onFocus }) { return <header className="synoptic-panel-head"><Icon size={14} /><strong>{title}</strong><span>{meta}</span><button type="button" onClick={onFocus} aria-label={focused ? `Restaurar ${title}` : `Maximizar ${title}`}>{focused ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</button></header>; }
