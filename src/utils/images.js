/* ---------- COMPRESIÓN DE IMÁGENES ANTES DE SUBIR ---------- */
// Lee un archivo de imagen elegido por el usuario, lo redimensiona (si hace
// falta) para que su lado más largo no supere maxDim, y lo reencoda a un
// data URL más liviano vía <canvas>. Se usa en TODOS los puntos de subida de
// imagen (portadas, retratos, iconos, sprites, fondos, mapas) para no seguir
// guardando fotos de cámara/capturas sin comprimir.
// Reglas de formato: SVG y GIF se dejan pasar intactos (rasterizarlos en
// canvas los empeora o les rompe la animación). PNG se reencoda como PNG
// (conserva transparencia — importante para íconos con fondo transparente).
// Cualquier otro formato (JPEG, WEBP, fotos de cámara) se reencoda como JPEG,
// que es el formato con mejor soporte universal para fotos comprimidas.
// Ante cualquier error, cae de nuevo al data URL original sin comprimir para
// que la subida nunca quede rota por un fallo de compresión.
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
          const outMime = file.type === "image/png" ? "image/png" : "image/jpeg";
          resolve(canvas.toDataURL(outMime, quality));
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
