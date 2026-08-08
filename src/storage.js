// La credencial vive solo en memoria (no en localStorage): así el login se
// pide siempre que se abre o recarga la app, en vez de quedar guardado.
export let sessionToken = "";

export function getAccessKey() { return sessionToken; }

export function setAccessKey(token) { sessionToken = token; }

export async function apiFetch(key, options = {}) {
  const res = await fetch(`/api/storage/${encodeURIComponent(key)}`, {
    ...options,
    headers: { Authorization: `Bearer ${getAccessKey()}`, ...(options.headers || {}) },
  });
  if (res.status === 401) {
    setAccessKey("");
    window.location.reload();
    throw new Error("No autorizado");
  }
  return res;
}

export async function storageGetJSON(key) {
  try {
    const res = await apiFetch(key);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (e) { return null; }
}

// Único observador del estado de guardado: sin esto, un guardado fallido
// (red caída, error del servidor) pasaba en silencio total — el usuario
// seguía editando sin saber que nada se estaba persistiendo.
export let saveErrorHandler = null;

export function setSaveErrorHandler(fn) { saveErrorHandler = fn; }

export async function storageSetJSON(key, obj) {
  try {
    const res = await apiFetch(key, { method: "PUT", body: JSON.stringify(obj) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (saveErrorHandler) saveErrorHandler(null);
    return true;
  } catch (e) {
    console.error(e);
    if (saveErrorHandler) saveErrorHandler({ message: e.message, retry: () => storageSetJSON(key, obj) });
    return false;
  }
}

export async function loadImage(key) {
  if (!key) return null;
  try {
    const res = await apiFetch(key);
    if (!res.ok) return null;
    const text = await res.text();
    return text || null;
  } catch (e) { return null; }
}

export async function saveImage(key, dataUrl) {
  try {
    const res = await apiFetch(key, { method: "PUT", body: dataUrl });
    return res.ok;
  } catch (e) { console.error(e); return false; }
}

export async function deleteImage(key) {
  if (!key) return;
  try { await apiFetch(key, { method: "DELETE" }); } catch (e) {}
}
