import { useState, useEffect, useRef } from "react";
import { ImageIcon } from "lucide-react";
import { compressImageFile } from "../utils/images.js";
import { loadImage, saveImage } from "../storage.js";
import { styles } from "../styles.js";

/* ---------- BLOCK: IMAGEN ---------- */
export function ImageBlock({ block, updateBlock }) {
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
    const dataUrl = await compressImageFile(file);
    if (!dataUrl) return;
    const ok = await saveImage(imgKey, dataUrl);
    if (ok) { setSrc(dataUrl); updateBlock(block.id, { imageKey: imgKey }); }
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
