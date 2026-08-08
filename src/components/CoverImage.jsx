import { useState, useEffect, useRef } from "react";
import { Trash2, ImageIcon, MoveVertical } from "lucide-react";
import { compressImageFile } from "../utils/images.js";
import { deleteImage, loadImage, saveImage } from "../storage.js";
import { styles } from "../styles.js";

/* ---------- COVER IMAGE ---------- */
export function CoverImage({ node, updateNode, margin }) {
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
    const dataUrl = await compressImageFile(file);
    if (!dataUrl) return;
    const ok = await saveImage(coverKey, dataUrl);
    if (ok) { setCoverSrc(dataUrl); updateNode(node.id, { coverImageKey: coverKey }); }
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
      <div className="cover-wrap" style={{ ...styles.coverWrap, margin }}>
        <img src={coverSrc} alt="" style={{ ...styles.coverImg, objectFit: fit, objectPosition: `50% ${pos}%` }} />
        <div className={`cover-overlay-actions${adjusting ? " is-active" : ""}`} style={styles.coverOverlayActions}>
          <button style={styles.pillBtnGhost} onClick={() => setAdjusting((a) => !a)} title="Ajustar imagen">
            <MoveVertical size={12} /> Ajustar
          </button>
          <button style={styles.pillBtnGhost} onClick={() => inputRef.current?.click()}><ImageIcon size={12} /> Cambiar</button>
          <button style={styles.pillBtnGhost} onClick={handleRemove}><Trash2 size={12} /> Quitar</button>
        </div>
        {adjusting && (
          <div style={styles.coverAdjustBar}>
            <button style={{ ...styles.pillBtnGhost, background: fit === "cover" ? "var(--accent)" : "var(--panel2)", color: fit === "cover" ? "var(--bg)" : "var(--text)" }}
              onClick={() => updateNode(node.id, { coverFit: "cover" })}>Rellenar</button>
            <button style={{ ...styles.pillBtnGhost, background: fit === "contain" ? "var(--accent)" : "var(--panel2)", color: fit === "contain" ? "var(--bg)" : "var(--text)" }}
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
