import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Square, RefreshCw } from "lucide-react";
import { RELATION_TYPES } from "../data/entryTypes.js";
import { BRAIN_H, BRAIN_W } from "../data/layoutConstants.js";
import { KIND_COLORS, SHAPE_COLORS } from "../data/theme.js";
import { computeBrainGraph } from "../utils/graph.js";
import { uid } from "../utils/misc.js";
import { storageGetJSON, storageSetJSON } from "../storage.js";
import { styles } from "../styles.js";
import { EntryIcon } from "../components/EntryIcon.jsx";
import { ShapePanel, ShapesLayer } from "../components/ShapesLayer.jsx";

export function BrainView({ nodes, navigateToId, isMobile, brainKey, onlyRelations }) {
  const { edges: allEdges, connected: allConnected } = useMemo(() => computeBrainGraph(nodes), [nodes]);
  const edges = useMemo(() => (onlyRelations ? allEdges.filter((e) => e.kind === "relation") : allEdges), [allEdges, onlyRelations]);
  const connected = useMemo(() => {
    if (!onlyRelations) return allConnected;
    const s = new Set();
    edges.forEach((e) => { s.add(e.from); s.add(e.to); });
    return s;
  }, [edges, onlyRelations, allConnected]);
  const baseNodes = useMemo(() => (onlyRelations ? nodes.filter((n) => n.category === "character") : nodes), [nodes, onlyRelations]);
  const [state, setState] = useState(null);
  const [showIsolated, setShowIsolated] = useState(false);
  const [activeShape, setActiveShape] = useState(null);
  const [simWake, setSimWake] = useState(0);
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const dragNodeRef = useRef(null);
  const panRef = useRef(null);
  const saveTimer = useRef(null);
  const velocitiesRef = useRef({});

  const visibleNodes = useMemo(
    () => baseNodes.filter((n) => showIsolated || connected.has(n.id)),
    [baseNodes, connected, showIsolated]
  );

  useEffect(() => {
    (async () => {
      let data = (await storageGetJSON(brainKey)) || {};
      if (!data.positions && !data.shapes && !data.pan) data = { positions: data, shapes: [], pan: { x: 0, y: 0 } };
      const positions = { ...(data.positions || {}) };
      const missing = baseNodes.filter((n) => !positions[n.id]);
      missing.forEach((n, i) => {
        const angle = (i / Math.max(missing.length, 1)) * Math.PI * 2;
        const r = 18 + (i % 4) * 8;
        positions[n.id] = { x: 50 + Math.cos(angle) * r, y: 50 + Math.sin(angle) * r * 0.85 };
      });
      setState({ positions, shapes: data.shapes || [], pan: data.pan || { x: 0, y: 0 } });
    })();
  }, [brainKey, baseNodes.length]);

  const persistState = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => storageSetJSON(brainKey, next), 600);
      return next;
    });
  }, [brainKey]);

  useEffect(() => {
    function move(e) {
      const point = e.touches ? e.touches[0] : e;
      if (dragNodeRef.current && innerRef.current) {
        const rect = innerRef.current.getBoundingClientRect();
        let x = ((point.clientX - rect.left) / rect.width) * 100;
        let y = ((point.clientY - rect.top) / rect.height) * 100;
        x = Math.max(1, Math.min(99, x));
        y = Math.max(1, Math.min(99, y));
        const id = dragNodeRef.current;
        persistState((s) => ({ ...s, positions: { ...s.positions, [id]: { x, y } } }));
        if (e.cancelable) e.preventDefault();
        return;
      }
      if (panRef.current && outerRef.current) {
        const p = panRef.current;
        const outw = outerRef.current.clientWidth;
        const outh = outerRef.current.clientHeight;
        let nx = p.origX + (point.clientX - p.startX);
        let ny = p.origY + (point.clientY - p.startY);
        nx = Math.min(40, Math.max(outw - BRAIN_W - 40, nx));
        ny = Math.min(40, Math.max(outh - BRAIN_H - 40, ny));
        persistState((s) => ({ ...s, pan: { x: nx, y: ny } }));
        if (e.cancelable) e.preventDefault();
      }
    }
    function up() { dragNodeRef.current = null; panRef.current = null; }
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
  }, [persistState]);

  // Grafo con física, al estilo Obsidian: los nodos se repelen entre sí, las
  // aristas los atraen como resortes y una fuerza suave los mantiene
  // centrados. Corre en requestAnimationFrame hasta que se asienta (energía
  // cinética baja) y se detiene sola para no gastar batería; arrastrar un
  // nodo la despierta de nuevo, así los vecinos reaccionan en vivo.
  useEffect(() => {
    if (!state || visibleNodes.length < 2) return;
    let raf = null;
    let stopped = false;
    const REPULSION = 950000, SPRING_K = 0.028, IDEAL_LEN = 230, CENTER_K = 0.0007, DAMPING = 0.85, SETTLE = 0.04;
    const ids = visibleNodes.map((n) => n.id);
    ids.forEach((id) => { if (!velocitiesRef.current[id]) velocitiesRef.current[id] = { vx: 0, vy: 0 }; });

    function tick() {
      if (stopped) return;
      let kinetic = 0;
      setState((prev) => {
        if (!prev) return prev;
        const pos = { ...prev.positions };
        const forces = {};
        ids.forEach((id) => { forces[id] = { fx: 0, fy: 0 }; });
        for (let i = 0; i < ids.length; i++) {
          const a = pos[ids[i]];
          if (!a) continue;
          const ax = (a.x / 100) * BRAIN_W, ay = (a.y / 100) * BRAIN_H;
          for (let j = i + 1; j < ids.length; j++) {
            const b = pos[ids[j]];
            if (!b) continue;
            const bx = (b.x / 100) * BRAIN_W, by = (b.y / 100) * BRAIN_H;
            let dx = ax - bx, dy = ay - by;
            let distSq = Math.max(dx * dx + dy * dy, 100);
            const dist = Math.sqrt(distSq);
            const force = REPULSION / distSq;
            const fx = (dx / dist) * force, fy = (dy / dist) * force;
            forces[ids[i]].fx += fx; forces[ids[i]].fy += fy;
            forces[ids[j]].fx -= fx; forces[ids[j]].fy -= fy;
          }
        }
        edges.forEach((e) => {
          const a = pos[e.from], b = pos[e.to];
          if (!a || !b || !forces[e.from] || !forces[e.to]) return;
          const ax = (a.x / 100) * BRAIN_W, ay = (a.y / 100) * BRAIN_H;
          const bx = (b.x / 100) * BRAIN_W, by = (b.y / 100) * BRAIN_H;
          const dx = bx - ax, dy = by - ay;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - IDEAL_LEN) * SPRING_K;
          const fx = (dx / dist) * force, fy = (dy / dist) * force;
          forces[e.from].fx += fx; forces[e.from].fy += fy;
          forces[e.to].fx -= fx; forces[e.to].fy -= fy;
        });
        ids.forEach((id) => {
          const p = pos[id];
          if (!p || !forces[id]) return;
          const px = (p.x / 100) * BRAIN_W, py = (p.y / 100) * BRAIN_H;
          forces[id].fx += (BRAIN_W / 2 - px) * CENTER_K;
          forces[id].fy += (BRAIN_H / 2 - py) * CENTER_K;
        });
        ids.forEach((id) => {
          if (id === dragNodeRef.current) { velocitiesRef.current[id] = { vx: 0, vy: 0 }; return; }
          const p = pos[id];
          if (!p || !forces[id]) return;
          const v = velocitiesRef.current[id] || { vx: 0, vy: 0 };
          v.vx = (v.vx + forces[id].fx) * DAMPING;
          v.vy = (v.vy + forces[id].fy) * DAMPING;
          velocitiesRef.current[id] = v;
          let px = (p.x / 100) * BRAIN_W + v.vx;
          let py = (p.y / 100) * BRAIN_H + v.vy;
          px = Math.max(20, Math.min(BRAIN_W - 20, px));
          py = Math.max(20, Math.min(BRAIN_H - 20, py));
          pos[id] = { x: (px / BRAIN_W) * 100, y: (py / BRAIN_H) * 100 };
          kinetic += v.vx * v.vx + v.vy * v.vy;
        });
        return { ...prev, positions: pos };
      });
      if (kinetic > SETTLE) {
        raf = requestAnimationFrame(tick);
      } else {
        stopped = true;
        persistState((s) => s);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; if (raf) cancelAnimationFrame(raf); };
  }, [visibleNodes, edges, simWake]);

  function startDrag(id) {
    dragNodeRef.current = id;
    setSimWake((w) => w + 1);
  }

  function startPan(e) {
    const point = e.touches ? e.touches[0] : e;
    panRef.current = { startX: point.clientX, startY: point.clientY, origX: state.pan.x, origY: state.pan.y };
  }

  function addShape() {
    const shape = {
      id: uid(),
      x: Math.min(90, Math.max(0, ((-state.pan.x + 120) / BRAIN_W) * 100)),
      y: Math.min(90, Math.max(0, ((-state.pan.y + 120) / BRAIN_H) * 100)),
      w: 14, h: 14, kind: "rect",
      color: SHAPE_COLORS[(state.shapes.length) % SHAPE_COLORS.length], label: "",
    };
    persistState((s) => ({ ...s, shapes: [...s.shapes, shape] }));
    setActiveShape(shape.id);
  }
  function updateShape(id, patch) {
    persistState((s) => ({ ...s, shapes: s.shapes.map((sh) => (sh.id === id ? { ...sh, ...patch } : sh)) }));
  }
  function deleteShape(id) {
    persistState((s) => ({ ...s, shapes: s.shapes.filter((sh) => sh.id !== id) }));
    setActiveShape(null);
  }
  function reorganize() {
    persistState((s) => {
      const positions = { ...s.positions };
      visibleNodes.forEach((n) => {
        const p = positions[n.id];
        if (!p) return;
        positions[n.id] = {
          x: Math.min(95, Math.max(5, p.x + (Math.random() - 0.5) * 30)),
          y: Math.min(95, Math.max(5, p.y + (Math.random() - 0.5) * 30)),
        };
      });
      return { ...s, positions };
    });
    velocitiesRef.current = {};
    setSimWake((w) => w + 1);
  }

  if (!state) return <div style={{ padding: 30, color: "var(--muted)" }}>Tejiendo el cerebro…</div>;

  const activeShapeData = state.shapes.find((s) => s.id === activeShape);

  return (
    <div style={styles.boardWrap}>
      <div style={styles.mapToolbar}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          {onlyRelations ? "Relaciones" : "Vínculos"}: {edges.length} · Arrastra el fondo para desplazarte · Doble clic abre la entrada
        </span>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          <button style={styles.pillBtn} onClick={reorganize} title="Sacude el grafo y deja que la física lo reacomode"><RefreshCw size={13} /> Reorganizar</button>
          <button style={styles.pillBtn} onClick={addShape}><Square size={13} /> Figura</button>
          <button style={styles.pillBtn} onClick={() => setShowIsolated((s) => !s)}>
            {showIsolated ? "Ocultar sueltos" : "Mostrar todos"}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, padding: "6px 14px", flexWrap: "wrap", borderBottom: "1px solid var(--border)" }}>
        {onlyRelations
          ? RELATION_TYPES.map((rt) => (
              <span key={rt.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--muted)" }}>
                <span style={{ width: 14, height: 2.5, background: rt.color, display: "inline-block", borderRadius: 2 }} /> {rt.label}
              </span>
            ))
          : [["wiki", "Mención [[..]]"], ["pin", "Pin de mapa"], ["event", "Línea de tiempo"], ["board", "En pizarra"], ["boardlink", "Relación de pizarra"]].map(([k, lbl]) => (
              <span key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--muted)" }}>
                <span style={{ width: 14, height: 2.5, background: KIND_COLORS[k], display: "inline-block", borderRadius: 2 }} /> {lbl}
              </span>
            ))}
      </div>
      <div ref={outerRef} style={styles.brainOuter}
        onMouseDown={startPan} onTouchStart={startPan}
        onClick={() => setActiveShape(null)}
      >
        <div ref={innerRef} style={{ ...styles.brainInner, transform: `translate(${state.pan.x}px, ${state.pan.y}px)` }}>
          <ShapesLayer shapes={state.shapes} updateShape={updateShape}
            selectShape={setActiveShape} selectedId={activeShape} containerRef={innerRef} />
          <svg style={styles.boardSvg} viewBox={`0 0 ${BRAIN_W} ${BRAIN_H}`} preserveAspectRatio="none">
            {edges.map((e, i) => {
              const a = state.positions[e.from], b = state.positions[e.to];
              if (!a || !b) return null;
              if (!visibleNodes.some((n) => n.id === e.from) || !visibleNodes.some((n) => n.id === e.to)) return null;
              return (
                <g key={i}>
                  <line x1={(a.x / 100) * BRAIN_W} y1={(a.y / 100) * BRAIN_H} x2={(b.x / 100) * BRAIN_W} y2={(b.y / 100) * BRAIN_H}
                    stroke={e.color || KIND_COLORS[e.kind] || "#8a8298"} strokeWidth={1.4} opacity={0.75} />
                  {e.label && (
                    <text x={((a.x + b.x) / 200) * BRAIN_W} y={((a.y + b.y) / 200) * BRAIN_H} dy={-3}
                      fill="#8a8298" fontSize="10" textAnchor="middle"
                      style={{ pointerEvents: "none", fontFamily: "'Rajdhani', sans-serif" }}>
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          {visibleNodes.map((n) => {
            const p = state.positions[n.id];
            if (!p) return null;
            const isConnected = connected.has(n.id);
            return (
              <div key={n.id}
                onMouseDown={(e) => { e.stopPropagation(); startDrag(n.id); }}
                onTouchStart={(e) => { e.stopPropagation(); startDrag(n.id); }}
                onDoubleClick={() => navigateToId(n.id)}
                title={`${n.name} (doble clic para abrir)`}
                style={{ ...styles.brainNode, left: `${p.x}%`, top: `${p.y}%`, opacity: isConnected ? 1 : 0.45 }}>
                <EntryIcon node={n} size={12} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.name}</span>
              </div>
            );
          })}
          {visibleNodes.length === 0 && (
            <div style={{ position: "absolute", top: 40, left: 40, color: "var(--muted)", fontSize: 13.5 }}>
              {onlyRelations
                ? "Aún no hay relaciones. Agrega un bloque \"Relaciones\" en una página de Personaje."
                : "Aún no hay vínculos. Crea enlaces [[así]], pines de mapa o relaciones de pizarra."}
            </div>
          )}
        </div>
      </div>
      {activeShapeData && (
        <ShapePanel shape={activeShapeData} updateShape={updateShape} deleteShape={deleteShape}
          onClose={() => setActiveShape(null)} isMobile={isMobile} />
      )}
    </div>
  );
}
