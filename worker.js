// Atlas de Mundos — Worker
// Sirve la web estática y la API de almacenamiento:
//  - Claves de imagen (map-image:*, cover-image:*) -> KV (binding IMAGES)
//  - Resto (world-tree, world-theme, brain-positions) -> D1 (binding DB)
// Protegida con usuario+clave (secretos ACCESS_KEY para admin, GUEST_ACCESS_KEY para visita).
// El perfil "visita" usa el mismo modelo de datos pero con todas sus claves
// prefijadas por "guest:", así que su mundo es independiente y nunca toca
// ni puede leer los datos reales del admin.

function isImageKey(key) {
  return key.startsWith("map-image:") || key.startsWith("cover-image:");
}

// El token viaja como "usuario:contraseña" en el header Authorization.
function resolveProfile(env, token) {
  const sep = token.indexOf(":");
  if (sep === -1) return null;
  const user = token.slice(0, sep).trim();
  const pass = token.slice(sep + 1);
  if (env.ACCESS_KEY && user === "admin" && pass === String(env.ACCESS_KEY).trim()) {
    return { scope: "" };
  }
  if (env.GUEST_ACCESS_KEY && user === "visita" && pass === String(env.GUEST_ACCESS_KEY).trim()) {
    return { scope: "guest:" };
  }
  return null;
}

async function handleStorage(request, env, key) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!env.ACCESS_KEY) {
    return new Response("ACCESS_KEY no configurada en el servidor", { status: 503 });
  }
  const profile = resolveProfile(env, token);
  if (!profile) {
    return new Response("No autorizado", { status: 401 });
  }
  if (!key || key.length > 300) {
    return new Response("Clave inválida", { status: 400 });
  }
  // La clave real usada en KV/D1 vive en el namespace del perfil; el tipo de
  // backend (KV para imágenes, D1 para el resto) se decide sobre la clave sin prefijo.
  const storageKey = profile.scope + key;
  const useKV = isImageKey(key);

  try {
    if (request.method === "GET") {
      let value;
      if (useKV) {
        value = await env.IMAGES.get(storageKey);
      } else {
        const row = await env.DB.prepare("SELECT value FROM kv_store WHERE key = ?").bind(storageKey).first();
        value = row ? row.value : null;
      }
      if (value === null || value === undefined) return new Response("", { status: 404 });
      return new Response(value, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    if (request.method === "PUT") {
      const body = await request.text();
      if (body.length > 8 * 1024 * 1024) {
        return new Response("Contenido demasiado grande (máx 8 MB)", { status: 413 });
      }
      if (useKV) {
        await env.IMAGES.put(storageKey, body);
      } else {
        await env.DB.prepare(
          "INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, datetime('now')) " +
          "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')"
        ).bind(storageKey, body).run();
      }
      return new Response("OK", { status: 200 });
    }

    if (request.method === "DELETE") {
      if (useKV) await env.IMAGES.delete(storageKey);
      else await env.DB.prepare("DELETE FROM kv_store WHERE key = ?").bind(storageKey).run();
      return new Response("OK", { status: 200 });
    }

    return new Response("Método no permitido", { status: 405 });
  } catch (err) {
    return new Response("Error del servidor: " + err.message, { status: 500 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/api\/storage\/(.+)$/);
    if (match) {
      return handleStorage(request, env, decodeURIComponent(match[1]));
    }
    // Todo lo demás: archivos estáticos de /public
    return env.ASSETS.fetch(request);
  },
};
