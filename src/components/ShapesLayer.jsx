import { useEffect, useRef } from "react";
import { X, Trash2, Square, Circle } from "lucide-react";
import { SHAPE_COLORS } from "../data/theme.js";
import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";

/* ---------- SHAPES (figuras para pizarra y cerebro) ---------- */
export function ShapesLayer({ shapes, updateShape, selectShape, selectedId, containerRef }) {
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
         role="button" tabIndex={0} onKeyDown={keyActivate}>
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

export function ShapePanel({ shape, updateShape, deleteShape, onClose, isMobile }) {
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
          style={{ ...styles.miniBtn, background: shape.kind === "rect" ? "var(--accent)" : "var(--panel2)", color: shape.kind === "rect" ? "var(--bg)" : "var(--text)" }}>
          <Square size={12} /> Rectángulo
        </button>
        <button onClick={() => updateShape(shape.id, { kind: "ellipse" })}
          style={{ ...styles.miniBtn, background: shape.kind === "ellipse" ? "var(--accent)" : "var(--panel2)", color: shape.kind === "ellipse" ? "var(--bg)" : "var(--text)" }}>
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
