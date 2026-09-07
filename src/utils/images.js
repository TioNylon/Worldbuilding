import { deleteImage } from "../storage.js";

/* ---------- LIMPIEZA DE IMÁGENES AL BORRAR UN BLOQUE ---------- */
// isSingleImageBlockType cubre el caso de una imagen por bloque (b.imageKey).
// menuPortrait es la única excepción: desde el carrusel de retrato del Libro
// de Personajes puede tener además varias imágenes en b.extraImages — hay que
// borrar esas también o quedan huérfanas en KV para siempre.
export function cleanupBlockImages(block) {
  if (!block) return;
  if (block.imageKey) deleteImage(block.imageKey);
  if (block.type === "menuPortrait" && Array.isArray(block.extraImages)) {
    block.extraImages.forEach((img) => { if (img.imageKey) deleteImage(img.imageKey); });
  }
}

// Un PNG declara canal alfa con solo con que UN píxel no sea 100% opaco (p.
// ej. un borde suavizado). La inmensa mayoría de portadas/retratos/mapas
// exportados como PNG no tienen ninguna transparencia real: son arte o
// fotos rectangulares completamente opacas. Sin este chequeo, cualquier PNG
// se queda en PNG (sin pérdida, pesado) aunque no la necesite. Muestrea el
// canvas ya redimensionado -no el archivo original- así el costo es
// proporcional a maxDim, nunca a la resolución de la foto de origen.
function hasRealTransparency(ctx, width, height) {
  const { data } = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true;
  }
  return false;
}

/* ---------- COMPRESIÓN DE IMÁGENES ANTES DE SUBIR ---------- */
// Lee un archivo de imagen elegido por el usuario, lo redimensiona (si hace
// falta) para que su lado más largo no supere maxDim, y lo reencoda a un
// data URL más liviano vía <canvas>. Se usa en TODOS los puntos de subida de
// imagen (portadas, retratos, iconos, sprites, fondos, mapas) para no seguir
// guardando fotos de cámara/capturas sin comprimir.
// Reglas de formato: SVG y GIF se dejan pasar intactos (rasterizarlos en
// canvas los empeora o les rompe la animación). PNG solo se conserva como
// PNG si de verdad usa transparencia (ver hasRealTransparency) -íconos y
// sprites sobre fondo transparente, por ejemplo-; si el PNG es opaco (el
// caso común de portadas, retratos y fondos de mapa exportados como PNG sin
// necesitarlo) se reencoda como JPEG, mucho más liviano para ese contenido.
// Cualquier otro formato (JPEG, WEBP, fotos de cámara) también se reencoda
// como JPEG. Ante cualquier error, cae de nuevo al data URL original sin
// comprimir para que la subida nunca quede rota por un fallo de compresión.
export function compressImageFile(file, { maxDim = 1600, quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    if (!file || !file.type || file.type === "image/svg+xml" || file.type === "image/gif") {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          const scale = Math.min(1, maxDim / Math.max(width, height));
          width = Math.max(1, Math.round(width * scale));
          height = Math.max(1, Math.round(height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const keepPng = file.type === "image/png" && hasRealTransparency(ctx, width, height);
          resolve(canvas.toDataURL(keepPng ? "image/png" : "image/jpeg", quality));
        } catch (e) {
          resolve(reader.result);
        }
      };
      img.onerror = () => resolve(reader.result);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
