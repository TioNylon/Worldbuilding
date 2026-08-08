export function extractWikiNames(text) {
  if (!text) return [];
  const out = [];
  const re = /\[\[([^\]]+)\]\]/g;
  let m;
  while ((m = re.exec(text))) out.push(m[1].trim());
  return out;
}

export function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// Reescribe [[oldName]] -> [[newName]] dentro de un texto suelto. El enlace
// se resuelve por nombre exacto (ver WikiLinkSpan), así que al renombrar una
// página cualquier [[nombre viejo]] que ya estaba escrito en otro lado queda
// huérfano si no se actualiza acá también.
export function replaceWikiLink(text, oldName, newName) {
  if (!text) return text;
  const re = new RegExp(`\\[\\[\\s*${escapeRegExp(oldName)}\\s*\\]\\]`, "gi");
  return text.replace(re, `[[${newName}]]`);
}

// Recorre los campos de texto libre conocidos de cada tipo de bloque (el
// mismo universo que ya cubre blockSearchText) y les aplica replaceWikiLink.
// Devuelve el mismo objeto si no hubo nada que tocar, para no generar
// re-renders de más.
export function renameLinksInBlock(b, oldName, newName) {
  const r = (t) => replaceWikiLink(t, oldName, newName);
  switch (b.type) {
    case "text": case "heading":
      return r(b.text) === b.text ? b : { ...b, text: r(b.text) };
    case "rumor":
      return r(b.text) === b.text ? b : { ...b, text: r(b.text) };
    case "storyState":
      return r(b.text) === b.text ? b : { ...b, text: r(b.text) };
    case "sceneBeats":
      return { ...b, beats: (b.beats || []).map((x) => ({ ...x, text: r(x.text) })) };
    case "missionBranches":
      return { ...b, entries: (b.entries || []).map((x) => ({ ...x, label: r(x.label) })) };
    case "dialogue":
      return { ...b, lines: (b.lines || []).map((x) => ({ ...x, text: r(x.text) })) };
    case "beatInfo":
      return { ...b, description: r(b.description), flags: (b.flags || []).map((x) => ({ ...x, text: r(x.text) })) };
    case "sceneInfo":
      return {
        ...b,
        entryCondition: r(b.entryCondition),
        lines: (b.lines || []).map((x) => ({ ...x, text: r(x.text) })),
        effects: (b.effects || []).map((x) => ({ ...x, text: r(x.text) })),
      };
    default:
      return b;
  }
}

// Aplica el renombrado de [[links]] a todos los nodos del atlas (bloques
// nuevos y content/content2 de páginas viejas). Se llama una sola vez, desde
// renameNode, con el nombre anterior y el nuevo.
export function renameLinksEverywhere(allNodes, oldName, newName) {
  if (!oldName || !oldName.trim() || oldName.trim().toLowerCase() === newName.trim().toLowerCase()) return allNodes;
  return allNodes.map((n) => {
    const newContent = replaceWikiLink(n.content, oldName, newName);
    const newContent2 = replaceWikiLink(n.content2, oldName, newName);
    const newBlocks = Array.isArray(n.blocks) ? n.blocks.map((b) => renameLinksInBlock(b, oldName, newName)) : n.blocks;
    if (newContent === n.content && newContent2 === n.content2 && newBlocks === n.blocks) return n;
    return { ...n, content: newContent, content2: newContent2, blocks: newBlocks };
  });
}
