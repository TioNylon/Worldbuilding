// API de almacenamiento del Worldbuilder
// - Claves de imagen (map-image:*, cover-image:*) -> KV (binding IMAGES)
// - Resto (world-tree, world-theme, brain-positions) -> D1 (binding DB)
// Protegida con una clave simple (variable de entorno ACCESS_KEY)

function unauthorized() {
  return new Response("No autorizado", { status: 401 });
}

function isImageKey(key) {
  return key.startsWith("map-image:") || key.startsWith("cover-image:");
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const key = decodeURIComponent(params.key || "");

  // Autenticación
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!env.ACCESS_KEY || token !== env.ACCESS_KEY) return unauthorized();

  if (!key || key.length > 300) {
    return new Response("Clave inválida", { status: 400 });
  }

  const method = request.method;

  try {
    if (method === "GET") {
      let value;
      if (isImageKey(key)) {
        value = await env.IMAGES.get(key);
      } else {
        const row = await env.DB.prepare("SELECT value FROM kv_store WHERE key = ?")
          .bind(key).first();
        value = row ? row.value : null;
      }
      if (value === null || value === undefined) {
        return new Response("", { status: 404 });
      }
      return new Response(value, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    if (method === "PUT") {
      const body = await request.text();
      if (body.length > 8 * 1024 * 1024) {
        return new Response("Contenido demasiado grande (máx 8 MB)", { status: 413 });
      }
      if (isImageKey(key)) {
        await env.IMAGES.put(key, body);
      } else {
        await env.DB.prepare(
          "INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, datetime('now')) " +
          "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')"
        ).bind(key, body).run();
      }
      return new Response("OK", { status: 200 });
    }

    if (method === "DELETE") {
      if (isImageKey(key)) {
        await env.IMAGES.delete(key);
      } else {
        await env.DB.prepare("DELETE FROM kv_store WHERE key = ?").bind(key).run();
      }
      return new Response("OK", { status: 200 });
    }

    return new Response("Método no permitido", { status: 405 });
  } catch (err) {
    return new Response("Error del servidor: " + err.message, { status: 500 });
  }
}
