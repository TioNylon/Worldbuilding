import { blockSearchText } from "./blocks.js";

// Texto plano combinado de una entrada (bloques nuevos, content/content2
// antiguos, y el contenido de los recuadros de una plantilla por tipo).
export function nodeAllText(node) {
  const parts = Array.isArray(node.blocks)
    ? node.blocks.map(blockSearchText)
    : [node.content || "", node.content2 || ""];
  if (node.slotData) {
    Object.values(node.slotData).forEach((v) => { if (v && typeof v.text === "string") parts.push(v.text); });
  }
  if (Array.isArray(node.tags) && node.tags.length) parts.push(node.tags.join(" "));
  return parts.filter(Boolean).join("\n");
}

// Fragmento de texto alrededor de la primera coincidencia (para mostrar por qué
// una entrada apareció en la búsqueda cuando el título no la contiene).
export function findSnippetAround(text, query, radius = 40) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return null;
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
}

// Quita el marcado enriquecido para previsualizaciones.
export function stripMarkup(txt) {
  return (txt || "")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\/\/([^/]+)\/\//g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\{#[0-9a-fA-F]{3,8}\|([^}]*)\}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function pageSnippet(node, max = 120) {
  const txt = stripMarkup(nodeAllText(node));
  return txt.length > max ? txt.slice(0, max).trimEnd() + "…" : txt;
}

export function pageHasDescription(node) { return stripMarkup(nodeAllText(node)).length > 0; }
