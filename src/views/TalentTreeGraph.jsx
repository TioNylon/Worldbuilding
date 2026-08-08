import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { UPGRADE_GRAPH_COLW, UPGRADE_GRAPH_PAD, UPGRADE_GRAPH_ROWH, UPGRADE_NODE_H, UPGRADE_NODE_W } from "../data/layoutConstants.js";
import { upgradeGraphPos } from "../utils/graph.js";
import { keyActivate, skillTypeIcon } from "../utils/misc.js";
import { targetSummary } from "../utils/stats.js";
import { styles } from "../styles.js";

// Grafo del Árbol de talentos de una clase/subclase: mismo lenguaje visual y
// mismo algoritmo de carriles que UpgradeTreeGraph (Árbol de mejoras de
// Objetos) — acá los "orígenes" son prerrequisitos en vez de recetas, y el
// "+" de cada nodo crea la siguiente habilidad ya encadenada como
// prerrequisito, en vez de forzar a editar el select "Requiere" a mano.
export function TalentTreeGraph({ graph, selectedId, onSelect, onAddChild }) {
  const { nodesById, edges, laneCount } = graph;
  const maxDepth = Math.max(0, ...Array.from(nodesById.values()).map((n) => n.depth));
  const width = UPGRADE_GRAPH_PAD * 2 + (maxDepth + 1) * UPGRADE_GRAPH_COLW + (onAddChild ? 210 : 0);
  const height = UPGRADE_GRAPH_PAD * 2 + Math.max(1, laneCount) * UPGRADE_GRAPH_ROWH;
  const [addFor, setAddFor] = useState(null);
  const [draftName, setDraftName] = useState("");
  const popRef = useRef(null);

  useEffect(() => {
    if (!addFor) return;
    function onDocMouseDown(e) { if (popRef.current && !popRef.current.contains(e.target)) setAddFor(null); }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [addFor]);

  function openAdd(nodeId, e) {
    e.stopPropagation();
    setAddFor(nodeId); setDraftName("");
  }
  function submitAdd() {
    const name = draftName.trim();
    if (name && addFor) onAddChild(addFor, name);
    setAddFor(null); setDraftName("");
  }

  const addForNode = addFor ? nodesById.get(addFor) : null;

  return (
    <div style={{ position: "relative", width, height }}>
      <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
        {edges.map((e, i) => {
          const a = nodesById.get(e.from), b = nodesById.get(e.to);
          if (!a || !b) return null;
          const pa = upgradeGraphPos(a.depth, a.lane), pb = upgradeGraphPos(b.depth, b.lane);
          return (
            <line key={i} x1={pa.cx + UPGRADE_NODE_W / 2} y1={pa.cy} x2={pb.cx - UPGRADE_NODE_W / 2} y2={pb.cy}
              style={{ stroke: "var(--accent)" }} strokeWidth={2} opacity={0.6} />
          );
        })}
      </svg>
      {Array.from(nodesById.values()).map((n) => {
        const { cx, cy } = upgradeGraphPos(n.depth, n.lane);
        const Icon = skillTypeIcon(n.block?.skillType);
        const selected = n.id === selectedId;
        return (
          <div key={n.id} role="button" tabIndex={0} title={n.item.name}
            onClick={() => onSelect(n.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(n.id); } }}
            style={{
              position: "absolute", left: cx - UPGRADE_NODE_W / 2, top: cy - UPGRADE_NODE_H / 2, width: UPGRADE_NODE_W, height: UPGRADE_NODE_H,
              display: "flex", alignItems: "center", gap: 6, padding: "0 10px", borderRadius: 999, cursor: "pointer",
              border: "1px solid var(--accent)", background: "var(--panel2)", color: "var(--text)", fontSize: 12, overflow: "hidden",
              boxShadow: selected ? "0 0 0 2px var(--accent), 0 0 14px color-mix(in srgb, var(--accent) 55%, transparent)" : "none",
              transform: selected ? "scale(1.05)" : "scale(1)", transition: "transform .12s ease, box-shadow .12s ease", zIndex: selected ? 2 : 1,
            }}>
            <Icon size={13} style={{ flexShrink: 0, color: "var(--accent)" }} />
            <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.item.name}</span>
            <span style={{ fontSize: 9.5, opacity: 0.7, flexShrink: 0 }}>{n.block?.pointCost ?? 1}pt</span>
            {onAddChild && (
              <button type="button" title={`Agregar habilidad tras ${n.item.name}`} onClick={(e) => openAdd(n.id, e)}
                style={{
                  position: "absolute", right: -11, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%",
                  background: "var(--accent)", color: "var(--bg)", border: "1px solid var(--panel)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3,
                  opacity: addFor === n.id ? 1 : 0.55, transition: "opacity .12s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
                onMouseLeave={(e) => { if (addFor !== n.id) e.currentTarget.style.opacity = 0.55; }}>
                <Plus size={13} />
              </button>
            )}
          </div>
        );
      })}
      {addForNode && (() => {
        const { cx, cy } = upgradeGraphPos(addForNode.depth, addForNode.lane);
        return (
          <div ref={popRef} onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute", left: cx + UPGRADE_NODE_W / 2 + 18, top: Math.max(0, cy - 14), width: 190, zIndex: 10,
              background: "var(--panel3, var(--panel2))", border: "1px solid var(--accent)", borderRadius: "var(--radius-sm, 6px)",
              padding: 12, boxShadow: "0 14px 30px rgba(0,0,0,0.5)",
            }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--accent)", marginBottom: 8 }}>
              Habilidad tras {addForNode.item.name}
            </div>
            <input autoFocus value={draftName} onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitAdd(); } if (e.key === "Escape") setAddFor(null); }}
              placeholder="Nombre…" style={{ ...styles.statsInput, marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" onClick={() => setAddFor(null)} style={{ ...styles.pillBtn, flex: 1, justifyContent: "center", fontSize: 11.5 }}>Cancelar</button>
              <button type="button" onClick={submitAdd} style={{ ...styles.pillBtn, ...styles.pillBtnActive, flex: 1, justifyContent: "center", fontSize: 11.5 }}>Crear</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Panel lateral del nodo seleccionado: tipo, objetivo, costo, prerrequisito y
// quién puede usarla — mismo rol que UpgradeNodeDetail para Objetos.
export function TalentNodeDetail({ node, edges, allSkills, onOpenFull }) {
  const { item, block } = node;
  const incoming = edges.find((e) => e.to === item.id);
  const prereq = incoming ? allSkills.find((n) => n.id === incoming.from) : null;
  return (
    <>
      <h2 style={{ ...styles.bookPageTitle, margin: "0 0 4px", textAlign: "left" }}>{item.name}</h2>
      <span style={{ ...styles.bookFilterChip, width: "fit-content", marginBottom: 10 }}>{block?.skillType || "Física"}</span>
      <div style={styles.bookSectionTitle}>Objetivo</div>
      <div style={{ fontSize: 12, marginBottom: 10 }}>{targetSummary(block)}</div>
      <div style={styles.bookSectionTitle}>Costo</div>
      <div style={{ fontSize: 12, marginBottom: 10 }}>{block?.pointCost ?? 1} pt{(block?.pointCost ?? 1) === 1 ? "" : "s"}</div>
      <div style={styles.bookSectionTitle}>Requiere</div>
      {prereq
        ? <div style={{ fontSize: 12, marginBottom: 4 }}>↳ {prereq.name}</div>
        : <span style={styles.bookBottomHint}>Raíz del árbol — sin prerrequisito.</span>}
      <span style={{ ...styles.catalogLink, display: "inline-block", marginTop: 16 }} onClick={onOpenFull} role="button" tabIndex={0} onKeyDown={keyActivate}>
        Abrir ficha completa →
      </span>
    </>
  );
}
