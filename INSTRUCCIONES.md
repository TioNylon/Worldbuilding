# Atlas de Mundos — Guía de despliegue

Tu app de worldbuilding como página web, con datos guardados en Cloudflare (D1 + KV).
Ya está creada la infraestructura en tu cuenta de Cloudflare:

| Recurso | Nombre | ID |
|---|---|---|
| Base de datos D1 | `worldbuilder-db` | `08a525b3-da0f-4408-9919-66fa564d4459` |
| Namespace KV (imágenes) | `worldbuilder-images` | `b9d930eb2f274dbb832927b4dfa9a82d` |

## Paso 1 — Subir estos archivos a tu repositorio de GitHub

Sube TODO el contenido de esta carpeta al repositorio, manteniendo la estructura:

```
index.html
app.js
functions/api/storage/[key].js
INSTRUCCIONES.md   (opcional)
src/app.jsx        (opcional, es el código fuente por si se edita después)
```

Desde github.com: entra a tu repositorio → botón **Add file → Upload files** →
arrastra los archivos y carpetas → **Commit changes**.

> Importante: la carpeta `functions/api/storage/` debe conservar esa ruta exacta,
> y el archivo debe llamarse literalmente `[key].js` (con corchetes).
> Si subes un ZIP, GitHub NO lo descomprime: sube los archivos sueltos.

## Paso 2 — Conectar el repositorio a Cloudflare Pages

1. Entra a https://dash.cloudflare.com → **Workers & Pages** → **Create** → pestaña **Pages** → **Connect to Git**.
2. Autoriza tu cuenta de GitHub cuando lo pida y elige tu repositorio.
3. En configuración de build:
   - **Framework preset**: None
   - **Build command**: (vacío)
   - **Build output directory**: `/` (la raíz)
4. Pulsa **Save and Deploy**.

## Paso 3 — Configurar los bindings (conexión con la base de datos)

En tu proyecto de Pages → **Settings** → **Bindings** (o "Functions" según versión del panel):

1. **Add binding → D1 database**
   - Variable name: `DB`
   - Database: `worldbuilder-db`
2. **Add binding → KV namespace**
   - Variable name: `IMAGES`
   - Namespace: `worldbuilder-images`
3. **Add binding → Environment variable** (tipo *Secret* si te da la opción)
   - Variable name: `ACCESS_KEY`
   - Value: inventa aquí tu clave de acceso personal (la que usarás para entrar a la app)

Después de añadir los bindings, ve a **Deployments** y pulsa **Retry deployment**
(o sube cualquier cambio al repo) para que se apliquen.

## Paso 4 — Entrar

Abre la URL que te da Cloudflare (algo como `https://tu-proyecto.pages.dev`).
Te pedirá la clave de acceso: es la que definiste en `ACCESS_KEY`.
Funciona desde cualquier dispositivo: computador, tablet y teléfono, siempre con los mismos datos.

## Notas

- **Los datos ya no viven en el navegador**: todo se guarda en D1/KV, así que puedes
  borrar caché o cambiar de dispositivo sin perder nada.
- **Límites del plan gratuito de Cloudflare**: 100.000 lecturas/día de D1, 1.000 escrituras/día
  de KV (las imágenes solo escriben al subirlas, así que sobra), 5 GB de almacenamiento D1.
  Para uso personal es más que suficiente.
- **Imágenes**: mantén los mapas por debajo de ~8 MB cada uno.
- **Actualizaciones de la app**: pide los cambios en Claude, descarga los archivos nuevos
  y súbelos al repo reemplazando los anteriores. Cloudflare redespliega solo.
