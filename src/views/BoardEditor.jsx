import { useState, useEffect, useRef } from "react";
import { Plus, X, Trash2, Share2, Square } from "lucide-react";
import { BUBBLE_COLORS, EDGE_COLORS, SHAPE_COLORS } from "../data/theme.js";
import { edgeDash, keyActivate, uid } from "../utils/misc.js";
import { findNode } from "../utils/tree.js";
import { styles } from "../styles.js";
import { LinkPicker } from "../components/LinkPicker.jsx";
import { ShapePanel, ShapesLayer } from "../components/ShapesLayer.jsx";

export function EdgeMarkerDefs({ edges }) {
  return (
    <defs>
      {edges.map((e) => {
        const color = e.color || "#8a8298";
        return (
          <marker key={e.id} id={`arr-end-${e.id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
          </marker>
        );
      })}
    </defs>
  );
}

/* ---------- BOARD EDITOR ---------- */
export function BoardEditor({ node, nodes, updateNode, setSelectedId, isMobile }) {
  const boardNodes = node.boardNodes || [];
  const boardEdges = node.boardEdges || [];
  const boardShapes = node.boardShapes || [];
  const [linkMode, setLinkMode] = useState(false);
  const [linkFirst, setLinkFirst] = useState(null);
  const [activeBubble, setActiveBubble] = useState(null);
  const [activeEdge, setActiveEdge] = useState(null);
  const [activeShape, setActiveShape] = useState(null);
  const draggingRef = useRef(null);
  const canvasRef = useRef(null);

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
  function addShape() {
    const shape = { id: uid(), x: 35, y: 30, w: 30, h: 25, kind: "rect", color: SHAPE_COLORS[boardShapes.length % SHAPE_COLORS.length], label: "" };
    updateNode(node.id, { boardShapes: [...boardShapes, shape] });
    setActiveShape(shape.id); setActiveBubble(null); setActiveEdge(null);
  }
  function updateShape(id, patch) { updateNode(node.id, { boardShapes: boardShapes.map((s) => (s.id === id ? { ...s, ...patch } : s)) }); }
  function deleteShape(id) { updateNode(node.id, { boardShapes: boardShapes.filter((s) => s.id !== id) }); setActiveShape(null); }
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
    setActiveEdge(null); setActiveShape(null); setActiveBubble(id);
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
  const activeShapeData = boardShapes.find((s) => s.id === activeShape);

  return (
    <div style={styles.boardWrap}>
      <div style={styles.mapToolbar}>
        <span style={styles.mapTitleText}>{node.name}</span>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          <button style={styles.pillBtn} onClick={() => addBubble()}><Plus size={13} /> Idea</button>
          <button style={styles.pillBtn} onClick={addShape}><Square size={13} /> Figura</button>
          <button
            style={{ ...styles.pillBtn, background: linkMode ? "var(--accent)" : "var(--panel2)", color: linkMode ? "var(--bg)" : "var(--text)" }}
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
        onClick={() => { setActiveBubble(null); setActiveEdge(null); setActiveShape(null); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleCanvasDrop}
      >
        <ShapesLayer shapes={boardShapes} updateShape={updateShape}
          selectShape={(id) => { setActiveShape(id); setActiveBubble(null); setActiveEdge(null); }}
          selectedId={activeShape} containerRef={canvasRef} />
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
                  onClick={(ev) => { ev.stopPropagation(); setActiveBubble(null); setActiveShape(null); setActiveEdge(e.id); }} />
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
                    style={{ pointerEvents: "none", fontFamily: "'Rajdhani', sans-serif" }}>
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {boardNodes.length === 0 && boardShapes.length === 0 && (
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
            }} role="button" tabIndex={0} onKeyDown={keyActivate}>
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
          <LinkPicker nodes={nodes} excludeId={node.id}
            value={activeBubbleData.linkedPageId}
            onChange={(v) => updateBubble(activeBubbleData.id, { linkedPageId: v })} />
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
                style={{ ...styles.miniBtn, background: (activeEdgeData.style || "solid") === v ? "var(--accent)" : "var(--panel2)", color: (activeEdgeData.style || "solid") === v ? "var(--bg)" : "var(--text)" }}>
                {lbl}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Flechas</div>
          <div style={{ display: "flex", gap: 5 }}>
            {[["none", "Sin flecha"], ["end", "→"], ["both", "↔"]].map(([v, lbl]) => (
              <button key={v} onClick={() => updateEdge(activeEdgeData.id, { arrows: v })}
                style={{ ...styles.miniBtn, background: (activeEdgeData.arrows || "none") === v ? "var(--accent)" : "var(--panel2)", color: (activeEdgeData.arrows || "none") === v ? "var(--bg)" : "var(--text)" }}>
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

      {activeShapeData && (
        <ShapePanel shape={activeShapeData} updateShape={updateShape} deleteShape={deleteShape}
          onClose={() => setActiveShape(null)} isMobile={isMobile} />
      )}
    </div>
  );
}
