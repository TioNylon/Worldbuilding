import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, ImageIcon, X } from "lucide-react";
import { compressImageFile } from "../utils/images.js";
import { loadImage, saveImage, deleteImage } from "../storage.js";
import { uid } from "../utils/misc.js";
import { styles } from "../styles.js";

// Retrato con varias imágenes en el mismo espacio (ej. Normal/Enojada/
// Sorprendida de un personaje), en vez de un único ImageBlock — mismo bloque
// "menuPortrait" de siempre, solo que ahora puede tener además `extraImages`
// (la imagen "principal" sigue en block.imageKey/caption, sin tocar cómo la
// lee el resto de la app — CanvasItem en la página completa del personaje
// sigue mostrando esa sola imagen, ignora extraImages).
export function PortraitCarousel({ block, updateBlock }) {
  const images = [
    { id: "__primary", imageKey: block.imageKey || null, label: block.caption || "" },
    ...(block.extraImages || []),
  ];
  const [index, setIndex] = useState(0);
  useEffect(() => { if (index >= images.length) setIndex(0); }, [images.length]);
  const current = images[Math.min(index, images.length - 1)];

  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);
  const addInputRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    (async () => { const d = current.imageKey ? await loadImage(current.imageKey) : null; setSrc(d); setLoading(false); })();
  }, [current.imageKey]);

  function setExtra(entryId, patch) {
    updateBlock(block.id, { extraImages: (block.extraImages || []).map((e) => (e.id === entryId ? { ...e, ...patch } : e)) });
  }
  async function handleReplace(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const dataUrl = await compressImageFile(file);
    if (!dataUrl) return;
    // La imagen principal usa la misma clave fija que ImageBlock.jsx
    // (cover-image:blk-<id del bloque>, sin sufijo) — CanvasItem.jsx la
    // muestra con ImageBlock tal cual en la página completa del personaje, y
    // esa clave la reconstruye a partir del id del bloque, no la lee de
    // block.imageKey. Las imágenes extra sí llevan un sufijo propio, para no
    // pisar esa clave ni entre ellas.
    const key = current.id === "__primary" ? `cover-image:blk-${block.id}` : (current.imageKey || `cover-image:blk-${block.id}:${uid()}`);
    const ok = await saveImage(key, dataUrl);
    if (!ok) return;
    setSrc(dataUrl);
    if (current.id === "__primary") updateBlock(block.id, { imageKey: key });
    else setExtra(current.id, { imageKey: key });
  }
  async function handleAdd(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const dataUrl = await compressImageFile(file);
    if (!dataUrl) return;
    const id = uid();
    const key = `cover-image:blk-${block.id}:${id}`;
    const ok = await saveImage(key, dataUrl);
    if (!ok) return;
    updateBlock(block.id, { extraImages: [...(block.extraImages || []), { id, imageKey: key, label: "" }] });
    setIndex(images.length);
  }
  function removeCurrent() {
    if (current.id === "__primary") return;
    if (current.imageKey) deleteImage(current.imageKey);
    updateBlock(block.id, { extraImages: (block.extraImages || []).filter((e) => e.id !== current.id) });
    setIndex((i) => Math.max(0, i - 1));
  }
  function setLabel(value) {
    if (current.id === "__primary") updateBlock(block.id, { caption: value });
    else setExtra(current.id, { label: value });
  }

  return (
    <div>
      <div style={{ position: "relative" }}>
        {loading ? (
          <div style={styles.imgPlaceholder}>Cargando imagen…</div>
        ) : !src ? (
          <>
            <button style={styles.imgUploadBtn} onClick={() => inputRef.current?.click()}>
              <ImageIcon size={16} /> Subir imagen
            </button>
            <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleReplace} />
          </>
        ) : (
          <>
            <img src={src} alt={current.label || ""}
              style={{ width: "100%", borderRadius: "var(--radius-md, 8px)", display: "block", objectFit: "cover", maxHeight: 280, background: "var(--bg)", cursor: "pointer" }}
              onClick={() => inputRef.current?.click()} title="Clic para cambiar esta imagen" />
            <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleReplace} />
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
                  title="Imagen anterior"
                  style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", width: 26, height: 26, borderRadius: "50%", border: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg) 60%, transparent)", color: "var(--text)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronLeft size={14} />
                </button>
                <button type="button" onClick={() => setIndex((i) => (i + 1) % images.length)}
                  title="Imagen siguiente"
                  style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 26, height: 26, borderRadius: "50%", border: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg) 60%, transparent)", color: "var(--text)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronRight size={14} />
                </button>
                <span style={{ position: "absolute", left: 6, bottom: 6, fontSize: 10.5, fontFamily: "'Rajdhani', sans-serif", color: "var(--muted)", background: "color-mix(in srgb, var(--bg) 60%, transparent)", padding: "2px 7px", borderRadius: 999 }}>
                  {index + 1} / {images.length}
                </span>
              </>
            )}
            <button type="button" onClick={() => addInputRef.current?.click()} title="Agregar otra imagen"
              style={{ position: "absolute", right: 6, bottom: 6, width: 22, height: 22, borderRadius: "50%", border: "none", background: "var(--accent)", color: "var(--bg)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={13} />
            </button>
            <input ref={addInputRef} type="file" accept="image/*" hidden onChange={handleAdd} />
          </>
        )}
      </div>
      {src && (
        <>
          {images.length > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 7 }}>
              {images.map((img, i) => (
                <span key={img.id} onClick={() => setIndex(i)} role="button" tabIndex={0}
                  style={{ width: 6, height: 6, borderRadius: "50%", cursor: "pointer", background: i === index ? "var(--accent)" : "var(--border)" }} />
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
            <input value={current.label || ""} onChange={(e) => setLabel(e.target.value)}
              placeholder="Nombre (ej. Normal, Enojada…)" style={{ ...styles.captionInput, flex: 1 }} />
            {current.id !== "__primary" && (
              <X size={13} style={{ cursor: "pointer", color: "#b04848", flexShrink: 0 }} onClick={removeCurrent} title="Quitar esta imagen" />
            )}
          </div>
        </>
      )}
    </div>
  );
}
