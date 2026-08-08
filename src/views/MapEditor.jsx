import { useState, useEffect, useRef } from "react";
import { Plus, Map as MapIcon, X, Upload, Trash2 } from "lucide-react";
import { ICONS, ICON_KEYS } from "../data/icons.js";
import { compressImageFile } from "../utils/images.js";
import { keyActivate, uid } from "../utils/misc.js";
import { findNode } from "../utils/tree.js";
import { loadImage, saveImage } from "../storage.js";
import { styles } from "../styles.js";
import { LinkPicker } from "../components/LinkPicker.jsx";
import { NodeCard } from "../components/NodeCard.jsx";

/* ---------- MAP EDITOR ---------- */
export function MapEditor({ node, nodes, updateNode, setSelectedId, isMobile }) {
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
    const dataUrl = await compressImageFile(file);
    if (!dataUrl) return;
    const ok = await saveImage(imgKey, dataUrl);
    if (ok) { setImgSrc(dataUrl); updateNode(node.id, { mapImageKey: imgKey }); }
  }
  async function handleUploadCustomIcon(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Este ícono va inline en el JSON del pin (no a storage de imagen aparte),
    // así que se comprime bastante más chico para no inflar el árbol guardado.
    const dataUrl = await compressImageFile(file, { maxDim: 256 });
    if (!dataUrl) return;
    setCustomIconData(dataUrl); setPlacing("custom");
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
                <I size={15} color={placing === k ? "var(--bg)" : "var(--text)"} />
              </button>
            );
          })}
          <button title="Subir icono personalizado" onClick={() => iconInputRef.current?.click()}
            style={{ ...styles.iconBtn, background: placing === "custom" ? "var(--accent)" : "transparent" }}>
            <Plus size={15} color={placing === "custom" ? "var(--bg)" : "var(--text)"} />
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
                  style={{ ...styles.pinMarker, left: `${p.x}%`, top: `${p.y}%`, cursor: "grab" }} title={`${p.label} (arrastra para mover)`} role="button" tabIndex={0} onKeyDown={keyActivate}>
                  {p.customIcon ? <img src={p.customIcon} alt="" style={{ width: 20, height: 20, borderRadius: "var(--radius-sm, 4px)" }} /> : <PinIcon size={18} color="var(--bg)" />}
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
