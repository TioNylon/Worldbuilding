/* ---------- STORAGE (API remota: Cloudflare D1 + KV) ---------- */
export const PROJECTS_KEY = "world-projects";

export const THEME_KEY = "world-theme";

export const TREE_KEY = "world-tree";

export function treeKeyFor(pid) { return pid === "default" ? "world-tree" : `p:${pid}:world-tree`; }

// Un solo nivel de respaldo (la versión N-1 del árbol), para "Restaurar
// última versión guardada". No es un historial: cada guardado nuevo pisa esta
// clave con lo que había justo antes de ese guardado.
export function treeVersionKeyFor(pid) { return treeKeyFor(pid) + ":prev"; }

export function brainKeyFor(pid) { return pid === "default" ? "brain-positions" : `p:${pid}:brain-positions`; }

export function relBrainKeyFor(pid) { return pid === "default" ? "relations-positions" : `p:${pid}:relations-positions`; }

export function dashKeyFor(pid) { return pid === "default" ? "world-dashboard" : `p:${pid}:world-dashboard`; }

export function dashBgKeyFor(pid) { return `cover-image:dash-${pid}`; }

export function templatesKeyFor(pid) { return pid === "default" ? "world-templates" : `p:${pid}:world-templates`; }

export function skinKeyFor(pid) { return pid === "default" ? "world-skin" : `p:${pid}:world-skin`; }

export function elementsKeyFor(pid) { return pid === "default" ? "world-elements" : `p:${pid}:world-elements`; }

export function rolesKeyFor(pid) { return pid === "default" ? "world-roles" : `p:${pid}:world-roles`; }

export function weaponTypesKeyFor(pid) { return pid === "default" ? "world-weapon-types" : `p:${pid}:world-weapon-types`; }

export function armorTypesKeyFor(pid) { return pid === "default" ? "world-armor-types" : `p:${pid}:world-armor-types`; }

export function statusEffectsKeyFor(pid) { return pid === "default" ? "world-status-effects" : `p:${pid}:world-status-effects`; }
