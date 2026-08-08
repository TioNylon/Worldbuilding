import { useState, useEffect, useRef } from "react";
import { Plus, X, ImageIcon } from "lucide-react";
import { compressImageFile } from "../utils/images.js";
import { uid } from "../utils/misc.js";
import { deleteImage, loadImage, saveImage } from "../storage.js";
import { styles } from "../styles.js";

// Miniatura de imagen para una fila de lista (sprite, animación), a
// diferencia de ImageBlock que es para el recuadro grande de una página.
// La clave de guardado la arma el llamador (no el propio id del bloque,
// como en ImageBlock) porque acá cada fila de la lista necesita la suya.
export function SpriteImageUploader({ imgKey, hasImage, onUploaded }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(hasImage);
  const inputRef = useRef(null);
  useEffect(() => {
    if (!hasImage) { setSrc(null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => { const d = await loadImage(imgKey); if (!cancelled) { setSrc(d); setLoading(false); } })();
    return () => { cancelled = true; };
  }, [imgKey, hasImage]);
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImageFile(file);
    if (!dataUrl) return;
    const ok = await saveImage(imgKey, dataUrl);
    if (ok) { setSrc(dataUrl); onUploaded(); }
  }
  if (loading) return <div style={{ width: 56, height: 56, borderRadius: 6, background: "var(--panel2)", flexShrink: 0 }} />;
  if (!src) {
    return (
      <>
        <button type="button" style={{ ...styles.imgUploadBtn, padding: "5px 8px", fontSize: 11, flexShrink: 0 }} onClick={() => inputRef.current?.click()}>
          <ImageIcon size={12} /> Subir
        </button>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleUpload} />
      </>
    );
  }
  return (
    <>
      <img src={src} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, cursor: "pointer", display: "block", flexShrink: 0 }}
        onClick={() => inputRef.current?.click()} title="Clic para cambiar" />
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleUpload} />
    </>
  );
}

// Lista de sprites con nombre + imagen, reutilizada por Expresiones,
// Exploración y Combate — solo cambia el prefijo de clave de guardado y las
// etiquetas, porque las tres son "variantes de imagen con nombre" del mismo
// personaje.
export function SpriteListEditor({ block, keyPrefix, title, placeholder, addLabel, updateBlock }) {
  const list = block.sprites || [];
  function add() { updateBlock(block.id, { sprites: [...list, { id: uid(), label: "", imageKey: null }] }); }
  function update(id, patch) { updateBlock(block.id, { sprites: list.map((s) => (s.id === id ? { ...s, ...patch } : s)) }); }
  function remove(id) {
    const row = list.find((s) => s.id === id);
    if (row?.imageKey) deleteImage(row.imageKey);
    updateBlock(block.id, { sprites: list.filter((s) => s.id !== id) });
  }
  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>{title}</div>
      {list.length === 0 && <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 6 }}>Ninguno todavía.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map((s) => {
          const imgKey = `cover-image:${keyPrefix}-${s.id}`;
          return (
            <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <SpriteImageUploader imgKey={imgKey} hasImage={!!s.imageKey} onUploaded={() => update(s.id, { imageKey: imgKey })} />
              <input value={s.label} onChange={(e) => update(s.id, { label: e.target.value })}
                placeholder={placeholder} style={{ ...styles.statsInput, flex: 1 }} />
              <X size={14} style={{ cursor: "pointer", color: "#c45c5c", flexShrink: 0 }} onClick={() => remove(s.id)} />
            </div>
          );
        })}
      </div>
      <button type="button" style={{ ...styles.pillBtn, alignSelf: "flex-start", marginTop: 8 }} onClick={add}>
        <Plus size={12} /> {addLabel}
      </button>
    </div>
  );
}
