import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { UPGRADE_GRAPH_COLW, UPGRADE_GRAPH_PAD, UPGRADE_GRAPH_ROWH, UPGRADE_NODE_H, UPGRADE_NODE_W } from "../data/layoutConstants.js";
import { ATTR_FIELDS, COMBAT_STAT_FIELDS } from "../data/statFields.js";
import { upgradeGraphPos, upgradeNodeColor } from "../utils/graph.js";
import { itemSlotIcon, keyActivate } from "../utils/misc.js";
import { recipeCostLabel } from "../utils/stats.js";
import { styles } from "../styles.js";
import { activeWeaponTypes } from "../state/globals.js";

// Grafo del Árbol de mejoras: nodos por objeto, posicionados por profundidad
// (columna) y carril de rama (fila), con líneas SVG entre orígenes y
// resultados — a diferencia del listado indentado, acá dos ramas distintas
// pueden efectivamente cruzarse y fundirse en un mismo nodo.
// `onAddBranch(sourceId, name, copyStats)` es opcional: si se pasa, cada nodo
// muestra un "+" que abre un popover para crear la siguiente mejora ahí
// mismo, sin salir del grafo a la pestaña "Ficha y forja".
export function UpgradeTreeGraph({ graph, selectedId, onSelect, onAddBranch }) {
  const { nodesById, edges, laneCount } = graph;
  const maxDepth = Math.max(0, ...Array.from(nodesById.values()).map((n) => n.depth));
  const width = UPGRADE_GRAPH_PAD * 2 + (maxDepth + 1) * UPGRADE_GRAPH_COLW + (onAddBranch ? 210 : 0);
  const height = UPGRADE_GRAPH_PAD * 2 + Math.max(1, laneCount) * UPGRADE_GRAPH_ROWH;
  const [addFor, setAddFor] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [copyStats, setCopyStats] = useState(true);
  const popRef = useRef(null);

  useEffect(() => {
    if (!addFor) return;
    function onDocMouseDown(e) { if (popRef.current && !popRef.current.contains(e.target)) setAddFor(null); }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [addFor]);

  function openAdd(nodeId, e) {
    e.stopPropagation();
    setAddFor(nodeId); setDraftName(""); setCopyStats(true);
  }
  function submitAdd() {
    const name = draftName.trim();
    if (name && addFor) onAddBranch(addFor, name, copyStats);
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
              style={{ stroke: upgradeNodeColor(a.block) }} strokeWidth={2} opacity={0.75} />
          );
        })}
      </svg>
      {Array.from(nodesById.values()).map((n) => {
        const { cx, cy } = upgradeGraphPos(n.depth, n.lane);
        const Icon = itemSlotIcon(n.block?.itemSlot);
        const color = upgradeNodeColor(n.block);
        const selected = n.id === selectedId;
        return (
          <div key={n.id} role="button" tabIndex={0} title={n.item.name}
            onClick={() => onSelect(n.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(n.id); } }}
            style={{
              position: "absolute", left: cx - UPGRADE_NODE_W / 2, top: cy - UPGRADE_NODE_H / 2, width: UPGRADE_NODE_W, height: UPGRADE_NODE_H,
              display: "flex", alignItems: "center", gap: 6, padding: "0 10px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${color}`, background: "var(--panel2)", color: "var(--text)", fontSize: 12, overflow: "hidden",
              boxShadow: selected ? `0 0 0 2px ${color}, 0 0 14px color-mix(in srgb, ${color === "var(--accent)" ? "var(--accent)" : color} 55%, transparent)` : "none",
              transform: selected ? "scale(1.05)" : "scale(1)", transition: "transform .12s ease, box-shadow .12s ease", zIndex: selected ? 2 : 1,
            }}>
            <Icon size={13} style={{ flexShrink: 0, color }} />
            <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.item.name}</span>
            <span style={{ fontSize: 9.5, opacity: 0.7, flexShrink: 0 }}>+{n.depth}</span>
            {onAddBranch && (
              <button type="button" title={`Agregar mejora de ${n.item.name}`} onClick={(e) => openAdd(n.id, e)}
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
              Mejora de {addForNode.item.name}
            </div>
            <input autoFocus value={draftName} onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitAdd(); } if (e.key === "Escape") setAddFor(null); }}
              placeholder="Nombre…" style={{ ...styles.statsInput, marginBottom: 8 }} />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)", marginBottom: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={copyStats} onChange={(e) => setCopyStats(e.target.checked)} />
              Copiar stats de {addForNode.item.name}
            </label>
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

// Panel lateral del nodo seleccionado en el grafo: bonificadores no nulos,
// receta(s) para obtenerlo (puede haber más de una si es un nodo de fusión)
// y la habilidad que enseña, si tiene una configurada.
export function UpgradeNodeDetail({ node, edges, allItems, onOpenFull }) {
  const { item, block, depth } = node;
  const incoming = edges.filter((e) => e.to === item.id);
  const wt = activeWeaponTypes.find((t) => t.key === block?.weaponType);
  const statFields = [...ATTR_FIELDS, ...COMBAT_STAT_FIELDS]
    .map(([k, label]) => [label, block?.[`bonus_${k}`] || 0])
    .filter(([, v]) => v !== 0);
  const teachesSkill = block?.teachesSkillId ? allItems.find((n) => n.id === block.teachesSkillId) : null;
  return (
    <>
      <h2 style={{ ...styles.bookPageTitle, margin: "0 0 4px", textAlign: "left" }}>{item.name} <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.6 }}>+{depth}</span></h2>
      {wt && <span style={{ ...styles.bookFilterChip, width: "fit-content", color: wt.color, borderColor: wt.color, marginBottom: 10 }}>{wt.label}</span>}
      <div style={styles.bookSectionTitle}>Bonificadores</div>
      {statFields.length === 0
        ? <span style={styles.bookBottomHint}>Sin bonificadores configurados.</span>
        : statFields.map(([label, v]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
            <span style={{ color: "var(--muted)" }}>{label}</span><span>{v > 0 ? `+${v}` : v}</span>
          </div>
        ))}
      <div style={{ ...styles.bookSectionTitle, marginTop: 14 }}>Cómo se obtiene</div>
      {incoming.length === 0
        ? <span style={styles.bookBottomHint}>Arma base — no requiere receta.</span>
        : incoming.map((e, i) => {
          const src = allItems.find((n) => n.id === e.from);
          return <div key={i} style={{ fontSize: 12, marginBottom: 4 }}>↳ {src?.name || "?"} — {recipeCostLabel(e.recipe, allItems)}</div>;
        })}
      {teachesSkill && (
        <>
          <div style={{ ...styles.bookSectionTitle, marginTop: 14 }}>Enseña</div>
          <div style={{ fontSize: 12 }}>{teachesSkill.name}</div>
        </>
      )}
      <span style={{ ...styles.catalogLink, display: "inline-block", marginTop: 16 }} onClick={onOpenFull} role="button" tabIndex={0} onKeyDown={keyActivate}>
        Abrir ficha completa →
      </span>
    </>
  );
}
