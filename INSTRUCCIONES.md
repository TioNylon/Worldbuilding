# Atlas de Mundos — Despliegue (formato Workers)

Tu proyecto de Cloudflare se llama `worldbuildingnylon` (tipo Worker conectado a Git).
Estos archivos están adaptados a ese formato: los bindings de la base de datos
se configuran SOLOS gracias al archivo `wrangler.jsonc`. Solo queda un secreto manual.

## Paso 1 — Reemplazar los archivos del repositorio ✅ (completado)

El repositorio ya tiene esta estructura, así que este paso no hace falta repetirlo:

```
wrangler.jsonc
worker.js
public/index.html
public/app.js
src/app.jsx          (opcional, código fuente)
INSTRUCCIONES.md     (opcional)
```

Cada cambio en el repo dispara un despliegue automático del Worker.

## Paso 2 — Crear el secreto ACCESS_KEY (una sola vez)

1. En https://dash.cloudflare.com → **Workers & Pages** → haz clic en `worldbuildingnylon`.
2. Pestaña **Settings** → sección **Variables and Secrets**.
3. Botón **Add** → Type: **Secret** → Name: `ACCESS_KEY` → Value: tu clave personal inventada → **Deploy**.

## Paso 3 — Habilitar la URL

El mensaje "No URL enabled" significa que la dirección pública está apagada:

1. En la página principal del Worker, busca la sección **Domains & Routes**
   (en Settings o en la vista general).
2. En la fila **workers.dev**, pulsa **Enable** (o el interruptor).
3. Tu URL quedará como `https://worldbuildingnylon.<tu-subdominio>.workers.dev`.

## Paso 4 — Probar

1. Ve a la pestaña **Deployments** y verifica que el último despliegue (tras subir
   los archivos nuevos) esté en verde / Success.
2. Abre la URL → pantalla "Atlas de Mundos" → escribe tu ACCESS_KEY → Entrar.

## Problemas comunes

- **El despliegue falla**: revisa que `wrangler.jsonc` esté en la RAÍZ del repo
  y que exista la carpeta `public` con `index.html` y `app.js` dentro.
- **Error 401 al entrar**: el secreto ACCESS_KEY no está creado o escribiste otra clave.
- **Página en blanco**: abre la consola del navegador (F12) y mándame el error.
