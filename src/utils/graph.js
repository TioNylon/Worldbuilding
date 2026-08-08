import { RELATION_TYPES } from "../data/entryTypes.js";
import { UPGRADE_GRAPH_COLW, UPGRADE_GRAPH_PAD, UPGRADE_GRAPH_ROWH, UPGRADE_NODE_H, UPGRADE_NODE_W } from "../data/layoutConstants.js";
import { getPageBlocks } from "./blocks.js";
import { nodeAllText } from "./text.js";
import { activeWeaponTypes } from "../state/globals.js";

// Construye el grafo del Árbol de mejoras a partir de las recetas existentes
// (misma fuente de datos que antes: cada objeto guarda sus propias recetas
// hacia adelante, con resultItemId). La diferencia con el listado indentado
// anterior es que acá se recolectan TODAS las recetas que apuntan a un mismo
// resultItemId — si dos objetos distintos tienen una receta con el mismo
// resultado, ese resultado aparece una sola vez en el grafo pero con dos
// líneas de entrada (una por cada origen), que es justo lo que arma una rama
// híbrida donde dos ramas se cruzan y se funden.
export function buildUpgradeGraph(weaponRoots, allItems) {
  const blockOf = (n) => getPageBlocks(n).find((b) => b.type === "itemStats");
  const byId = new Map(allItems.map((n) => [n.id, n]));
  const outgoing = new Map();
  allItems.forEach((n) => {
    const b = blockOf(n);
    (b?.recipes || []).forEach((r) => {
      if (!r.resultItemId || !byId.has(r.resultItemId)) return;
      if (!outgoing.has(n.id)) outgoing.set(n.id, []);
      outgoing.get(n.id).push(r);
    });
  });

  const nodesById = new Map();
  const edges = [];
  let laneCounter = 0;
  const queue = [];
  weaponRoots.forEach((root) => {
    if (nodesById.has(root.id)) return;
    nodesById.set(root.id, { id: root.id, item: root, block: blockOf(root), depth: 0, lane: laneCounter });
    queue.push(root.id);
    laneCounter++;
  });
  let qi = 0;
  while (qi < queue.length) {
    const curId = queue[qi++];
    const cur = nodesById.get(curId);
    const outs = outgoing.get(curId) || [];
    let branchedYet = false;
    outs.forEach((recipe) => {
      const targetId = recipe.resultItemId;
      const targetItem = byId.get(targetId);
      if (!targetItem) return;
      if (!nodesById.has(targetId)) {
        const lane = branchedYet ? laneCounter++ : cur.lane;
        branchedYet = true;
        nodesById.set(targetId, { id: targetId, item: targetItem, block: blockOf(targetItem), depth: cur.depth + 1, lane });
        queue.push(targetId);
      }
      edges.push({ from: curId, to: targetId, recipe });
    });
  }
  return { nodesById, edges, laneCount: laneCounter };
}

export function upgradeGraphPos(depth, lane) {
  return {
    cx: UPGRADE_GRAPH_PAD + depth * UPGRADE_GRAPH_COLW + UPGRADE_NODE_W / 2,
    cy: UPGRADE_GRAPH_PAD + lane * UPGRADE_GRAPH_ROWH + UPGRADE_NODE_H / 2,
  };
}

export function upgradeNodeColor(block) {
  const wt = activeWeaponTypes.find((t) => t.key === block?.weaponType);
  return wt?.color || "var(--accent)";
}

export function computeBrainGraph(nodes) {
  const nameIndex = {};
  nodes.forEach((n) => { nameIndex[n.name.toLowerCase()] = n.id; });
  const edgesMap = {};
  function addE(from, to, label, kind, color) {
    if (!from || !to || from === to) return;
    const key = [from, to].sort().join("|") + "|" + kind;
    if (!edgesMap[key]) edgesMap[key] = { from, to, label, kind, color };
  }
  nodes.forEach((n) => {
    const scanText = (txt) => {
      if (!txt) return;
      const re = /\[\[([^\]]+)\]\]/g;
      let m;
      while ((m = re.exec(txt))) {
        const tid = nameIndex[m[1].trim().toLowerCase()];
        addE(n.id, tid, "menciona", "wiki");
      }
    };
    scanText(nodeAllText(n));
    (n.pins || []).forEach((p) => addE(n.id, p.linkedPageId, p.label || "punto", "pin"));
    (n.events || []).forEach((ev) => addE(n.id, ev.linkedPageId, ev.title || "evento", "event"));
    const bubbleToPage = {};
    (n.boardNodes || []).forEach((b) => {
      if (b.linkedPageId) { bubbleToPage[b.id] = b.linkedPageId; addE(n.id, b.linkedPageId, "en pizarra", "board"); }
    });
    (n.boardEdges || []).forEach((e) => {
      const pa = bubbleToPage[e.from], pb = bubbleToPage[e.to];
      if (pa && pb) addE(pa, pb, e.label || "relación", "boardlink");
    });
    if (n.category === "character") {
      getPageBlocks(n).filter((b) => b.type === "relations").forEach((b) => {
        (b.entries || []).forEach((e) => {
          const rt = RELATION_TYPES.find((r) => r.key === e.relType);
          addE(n.id, e.targetId, rt?.label || e.relType, "relation", rt?.color);
        });
      });
    }
  });
  const edges = Object.values(edgesMap);
  const connected = new Set();
  edges.forEach((e) => { connected.add(e.from); connected.add(e.to); });
  return { edges, connected };
}
