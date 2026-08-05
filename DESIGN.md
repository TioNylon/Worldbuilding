---
name: Atlas de Mundos
description: Wiki de worldbuilding con dos lenguajes visuales deliberados — la consola de la app y la página de libro antiguo
colors:
  bg: "#0c1016"
  panel: "#131822"
  panel2: "#171d29"
  border: "#232b3a"
  accent: "#45d3a3"
  text: "#e8edf6"
  muted: "#7c8aa3"
  book-ink-dark: "#2a1d14"
  book-ink: "#3a2a18"
  book-ink-muted: "#8a6a3f"
  book-gold: "#c9a25a"
  book-parchment-text: "#e8d3a0"
  danger: "#b04848"
typography:
  display:
    fontFamily: "'Cinzel Decorative', serif"
  body:
    fontFamily: "'Manrope', sans-serif"
  book:
    fontFamily: "'Crimson Text', serif"
rounded:
  sm: "5px"
  md: "8px"
  lg: "16px"
  pill: "20px"
---

# Design System: Atlas de Mundos

## Overview

**Creative North Star: "El escritorio del narrador y el libro que escribe"**

Atlas de Mundos tiene dos lenguajes visuales, y eso es intencional, no un descuido: la **consola de la app** (sidebar, dashboard, herramientas) usa un sistema de tokens de tema que el usuario elige y personaliza (7 paletas predefinidas, desde "Consola del narrador" en verde esmeralda casi negro hasta paletas pastel); las **vistas "libro"** (Bestiario, Libro de personajes, Libro de historia, y toda la familia de vistas tipo "página doble") usan una paleta fija de pergamino y tinta que NO cambia con el tema de la app, para que siempre se sientan como un libro físico sin importar qué tema haya elegido el usuario.

Esta separación no estaba documentada hasta ahora — el audit de Impeccable la señaló como un hallazgo (99 colores hex fijos conviviendo con solo 12 variables de tema), y este documento fija por escrito que es una decisión de diseño, no drift.

**Key Characteristics:**
- Dos paletas coexistentes con un propósito claro cada una, nunca mezcladas dentro del mismo componente.
- Tipografía como señal de contexto: `Cinzel Decorative` marca "esto es la marca/título", `Crimson Text` marca "esto es contenido de libro", `Manrope` es el resto de la interfaz.
- Densidad de interfaz orientada a herramienta de trabajo (edición), no a mostrar/vender — controles compactos, mucha información por pantalla.

## Colors

Dos paletas, cada una con su rol y su territorio. No se mezclan dentro de un mismo componente.

### Primary (paleta de la app — tema del usuario, tokens dinámicos)
- **Verde consola** (`{colors.accent}`, `#45d3a3`): acento por defecto ("Consola del narrador"). Es uno de 7 presets que el usuario puede elegir y personalizar libremente — ver `THEME_PRESETS` en el código. El resto de esta sección describe el preset por defecto; los otros presets mantienen los mismos roles con otros valores.

### Neutral (paleta de la app)
- **Fondo** (`{colors.bg}`, `#0c1016`): fondo general de la consola.
- **Panel** (`{colors.panel}`, `#131822`) / **Panel secundario** (`{colors.panel2}`, `#171d29`): superficies elevadas (sidebar, tarjetas).
- **Borde** (`{colors.border}`, `#232b3a`): divisores y contornos sutiles.
- **Texto** (`{colors.text}`, `#e8edf6`) / **Texto apagado** (`{colors.muted}`, `#7c8aa3`): jerarquía de texto sobre fondo oscuro.

### Book palette (vistas "libro" — fija, no reacciona al tema)
- **Tinta oscura** (`#2a1d14`, `#3a2a18`): texto principal sobre pergamino.
- **Tinta apagada** (`#8a6a3f`): etiquetas secundarias, texto de apoyo ("NIVEL", "TIPO", metadatos).
- **Dorado de libro** (`#c9a25a`): acentos y bordes dentro de las vistas libro — no confundir con `{colors.accent}` de la app, son intencionalmente distintos.
- **Crema de pergamino** (`#e8d3a0`): texto sobre superficies oscuras dentro del libro (ej. flechas de pasar página).

### Semantic (compartido por toda la app)
- **Peligro** (`#b04848`, `#c45c5c`): eliminar, errores, acciones destructivas — el único color que sí cruza ambas paletas sin cambiar, porque su significado (peligro) debe ser reconocible en cualquier contexto.

### Named Rules
**La Regla de las Dos Paletas.** Un componente vive en la consola de la app (usa `var(--bg)`, `var(--accent)`, etc.) o vive en el libro (usa los hex fijos de tinta/pergamino/dorado) — nunca ambas a la vez. Si un componente nuevo necesita mostrarse en los dos contextos, se decide explícitamente a cuál pertenece antes de escribir el color.

## Typography

**Display Font:** 'Cinzel Decorative', serif
**Body Font:** 'Manrope', sans-serif
**Book Font:** 'Crimson Text', serif

**Character:** Cinzel Decorative marca autoridad/título (nombre del mundo, pantalla de login); Manrope es neutral y funcional para toda la interfaz de edición; Crimson Text es la voz de "esto es prosa dentro de un libro" — aparece en el contenido narrativo de las páginas y en las vistas "libro".

### Hierarchy
- **Display** (Cinzel Decorative): título del mundo, pantalla de acceso. Uso deliberadamente escaso — marca los momentos "esto es el producto", no títulos de sección.
- **Body** (Manrope): toda la interfaz de edición — sidebar, formularios, botones, paneles.
- **Book** (Crimson Text): contenido narrativo dentro de páginas y todas las vistas "libro" (Bestiario, Libro de personajes, etc.).

### Named Rules
**La Regla de la Fuente como Señal.** La tipografía no es solo estética: indica en qué "modo" está el usuario. Ver Crimson Text significa "estoy leyendo/escribiendo contenido del mundo"; ver Manrope significa "estoy operando la herramienta".

## Layout

Densidad alta, orientada a trabajo de edición: paneles compactos, mucha información visible a la vez, sin grandes espacios decorativos. Un solo breakpoint responsive (768px, móvil/escritorio) — sin variante intermedia para tablet (ver hallazgo de audit relacionado, categoría Responsive Design).

Las vistas "libro" usan un patrón de doble página fijo (`bookSpread`/`bookPage`/`bookSpine`) que simula un libro físico abierto, con navegación por pestañas arriba y flechas de pasar página a los costados.

## Elevation & Depth

Sin sombras (`box-shadow`) como sistema — la profundidad se transmite por color de superficie (panel vs panel2 vs bg) y por borde, no por elevación simulada. Excepción puntual: las flechas de pasar página (`bookPageTurn`) llevan un fondo semitransparente oscuro sobre la ilustración de fondo, no una sombra real.

## Shapes

Radios de esquina consistentes por escala (`--radius-sm` ~4-5px para controles chicos, `--radius-md` ~7-8px para tarjetas/inputs, `--radius-lg` ~12-16px para paneles grandes, `--radius-pill` ~16-20px para elementos tipo píldora/tag). El valor exacto de fallback varía levemente entre usos (12/13/14/16 para `--radius-lg` en distintos lugares) — no es una decisión deliberada, es una inconsistencia menor que se puede unificar en una futura pasada de `/impeccable polish`.

## Components

### Buttons
- **Shape:** `--radius-sm` a `--radius-md` según tamaño.
- **Primary (consola):** fondo `var(--panel2)`, borde `var(--border)`, texto `var(--text)`.
- **Primary (libro):** fondo dorado (`#c9a25a`/`#b8860b`) con texto oscuro (`#1a1f2e`) — alto contraste, siempre legible sobre pergamino.
- **Destructivo:** texto/ícono en `#c45c5c` o `#b04848`, sin relleno — el color solo, sin fondo, es suficiente señal dentro de esta paleta.
- **Ícono chico:** hit-area mínima 32×32px tras la pasada de `/impeccable adapt` de este audit (antes eran ~24px).

### Page-turn arrows (Signature Component)
Círculo semitransparente con flecha (`bookPageTurn`), 44×44px, posicionado a los costados de una vista "libro" para navegar entre páginas. Es el control de navegación más repetido de la app (~18 instancias) — cualquier vista libro nueva debería reutilizar este mismo componente en vez de inventar una variante.

### Cards / Tiles
- **Corner Style:** `--radius-md` (8px).
- **Background:** `var(--panel)`/`var(--panel2)` en consola; `rgba(107,68,35,0.08)` (marrón muy tenue) en libro.
- **Border:** 1px `var(--border)` en consola; `rgba(107,68,35,0.15)` en libro.

### Navigation
Sidebar fija con árbol de páginas (drag & drop para reordenar), fila de navegación superior por íconos hacia las vistas principales (Gran Libro, Libro de historia, Bitácora, Herramientas). En móvil, el sidebar colapsa a overlay.

## Do's and Don'ts

### Do:
- **Do** usar `var(--...)` para cualquier componente que viva en la consola de la app (sidebar, dashboard, herramientas), para que respete el tema elegido por el usuario.
- **Do** usar la paleta fija de tinta/pergamino/dorado para cualquier componente que viva dentro de una vista "libro", para mantener la identidad de "libro físico" sin importar el tema.
- **Do** reutilizar `bookPageTurn` para cualquier navegación de página nueva dentro de una vista libro, en vez de crear una flecha nueva.

### Don't:
- **Don't** mezclar `var(--accent)` de la app con los colores dorados del libro (`#c9a25a`/`#b8860b`) dentro del mismo componente — son acentos de sistemas distintos.
- **Don't** crear un botón de ícono nuevo con hit-area menor a 32×32px; usar el patrón de `collapseBtn`/`bookTabRemove` (padding + margen negativo si el ícono visual debe quedar chico).
- **Don't** asumir que `--radius-lg` siempre vale 16px — los fallbacks varían (12/13/14/16px) entre usos existentes; si es importante que coincidan, especificar el valor exacto en vez de confiar en el fallback.
