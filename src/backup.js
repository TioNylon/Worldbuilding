import { ENTRY_TYPES } from "./data/entryTypes.js";
import { brainKeyFor, dashKeyFor, relBrainKeyFor } from "./data/storageKeys.js";
import { nodeAllText, stripMarkup } from "./utils/text.js";
import { childrenOf } from "./utils/tree.js";
import { loadImage, storageGetJSON } from "./storage.js";

/* ---------- RESPALDO / EXPORTACIÓN DEL MUNDO ---------- */
// Recorre cualquier estructura (árbol de nodos, config del dashboard, etc.)
// buscando propiedades cuyo nombre termina en "ImageKey" (imageKey,
// coverImageKey, mapImageKey, bgImageKey...) para saber qué imágenes hay que
// incluir en el respaldo. Genérico a propósito: así no hay que acordarse de
// tocar el export cada vez que se agrega un tipo de bloque con imagen nueva.
export function collectImageKeysDeep(value, out) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) { value.forEach((v) => collectImageKeysDeep(v, out)); return; }
  for (const [k, v] of Object.entries(value)) {
    if (/ImageKey$/.test(k) && typeof v === "string" && v) out.add(v);
    else if (v && typeof v === "object") collectImageKeysDeep(v, out);
  }
}

// Arma el objeto completo de respaldo de un proyecto: árbol de nodos +
// listas configurables (elementos, roles, tipos...) + panel del mundo/cerebro
// + todas las imágenes referenciadas, en base64, para que el archivo sea un
// respaldo real (restaurarlo no debería dejar portadas/retratos rotos).
export async function buildWorldBackup(pid, projectMeta, nodes, extras) {
  const [dashboard, brainPositions, relationsPositions] = await Promise.all([
    storageGetJSON(dashKeyFor(pid)),
    storageGetJSON(brainKeyFor(pid)),
    storageGetJSON(relBrainKeyFor(pid)),
  ]);
  const imageKeys = new Set();
  collectImageKeysDeep(nodes, imageKeys);
  collectImageKeysDeep(dashboard, imageKeys);
  const images = {};
  await Promise.all([...imageKeys].map(async (key) => {
    const data = await loadImage(key);
    if (data) images[key] = data;
  }));
  return {
    formatVersion: 1,
    app: "Atlas de Mundos",
    exportedAt: new Date().toISOString(),
    project: { id: projectMeta?.id ?? pid, name: projectMeta?.name ?? "Mundo" },
    tree: nodes,
    templates: extras.templates || {},
    skin: extras.skin || null,
    elements: extras.elements || [],
    roles: extras.roles || [],
    weaponTypes: extras.weaponTypes || [],
    armorTypes: extras.armorTypes || [],
    statusEffects: extras.statusEffects || [],
    dashboard: dashboard || null,
    brainPositions: brainPositions || null,
    relationsPositions: relationsPositions || null,
    images,
  };
}

// Nombre de archivo seguro a partir del nombre del proyecto.
export function slugify(name) {
  return (name || "mundo").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "mundo";
}

export function downloadTextFile(filename, text, mime) {
  const blob = new Blob([text], { type: mime || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// Exportación legible en Markdown: recorre el árbol en orden jerárquico y
// vuelca cada página como una sección, con su texto ya combinado (mismo
// helper que usa el buscador). Es el formato secundario — la fidelidad
// completa la da el JSON de respaldo, esto es para leer el mundo fuera de la app.
export function buildWorldMarkdown(projectName, nodes) {
  const lines = [`# ${projectName}`, "", `_Exportado el ${new Date().toLocaleDateString("es-AR")}_`, ""];
  function walk(parentId, depth) {
    childrenOf(nodes, parentId).forEach((node) => {
      const hLevel = Math.min(6, depth + 2);
      const hashes = "#".repeat(hLevel);
      const label = node.type === "page" && ENTRY_TYPES[node.category] ? ` (${ENTRY_TYPES[node.category].label})` : "";
      lines.push(`${hashes} ${node.name}${label}`);
      const text = stripMarkup(nodeAllText(node));
      if (text) { lines.push("", text); }
      lines.push("");
      walk(node.id, depth + 1);
    });
  }
  walk(null, 0);
  return lines.join("\n");
}
