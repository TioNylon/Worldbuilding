# Sistema visual — Atlas Synoptic

## Tesis

Consola cartográfica cinematográfica para construir mundos: el contenido vive como entidades sincronizadas entre mapa, relaciones y cronología. El acabado usa cristal azul profundo, luz cian controlada, tipografía técnica de alto contraste y capas atmosféricas; debe sentirse como una interfaz pulida de videojuego, no como un panel administrativo.

La interacción es espacial y precisa. Seleccionar una entidad la destaca en todas sus representaciones. Los paneles se expanden entre 200 y 300 ms con `cubic-bezier(.2,.8,.2,1)`. Hover y presión duran entre 100 y 150 ms. No hay rebotes, parallax, glitches constantes, scanlines ni resplandores decorativos permanentes.

## Modelo de interfaz

- El espacio sinóptico es la pantalla principal.
- El mapa tiene prioridad visual.
- Relaciones y cronología son espacios completos, no widgets informativos.
- Solo un espacio toma el foco a la vez; los otros quedan visibles en forma compacta.
- Una entidad mantiene la misma identidad y selección en mapa, relaciones, cronología, árbol e inspector.
- El árbol izquierdo es la biblioteca del mundo.
- La columna derecha enumera únicamente los elementos presentes en el mapa activo.
- Las fichas se abren en un inspector lateral expandible y pueden pasar a página completa.
- La barra inferior contiene libros y herramientas globales.

## Color

### Superficies

- `void`: `#030a10` — profundidad exterior.
- `background`: `#071722` — lienzo principal.
- `panel`: `#0a1b27` — navegación y paneles.
- `panel-raised`: `#102c3a` — selección, inspector y popovers.
- `line`: `#234858` — estructura y conexiones neutrales.

### Contenido

- `text`: `#e4f3f8` — texto principal.
- `muted`: `#73909c` — texto secundario; no usar para información esencial pequeña.
- `cyan`: `#62d9f2` — navegación, selección y tecnología.
- `gold`: `#ddb86b` — hitos narrativos y lugares principales.
- `violet`: `#a88ce8` — fenómenos, secretos y elementos psiónicos.

### Semánticos

- `success`: `#69c99a`.
- `warning`: `#e2b15f`.
- `danger`: `#e6747b`.
- `info`: `#6dc1e5`.

El color nunca será la única señal: debe acompañarse con texto, icono, forma o posición.

## Tipografía

- Identidad, títulos de espacios y nombres principales: `Orbitron`, pesos 600–700.
- Interfaz y lectura: `Manrope`, pesos 400–600.
- Coordenadas, estados y metadatos: `JetBrains Mono`, pesos 400–500.
- Prosa narrativa: `Crimson Text`, únicamente en lectura extensa.
- Escala: 9, 10, 12, 14, 16, 20, 26 y 34 px.
- En móvil, campos editables y prosa nunca bajan de 16 px.

## Geometría y profundidad

- Unidad base: 4 px; escala: 4, 8, 12, 16, 24, 32 y 48 px.
- Radios: 2, 4, 8 y 12 px. Los cortes angulares se reservan para paneles, acciones primarias y nodos.
- Controles de escritorio: mínimo 32 px; objetivos táctiles: mínimo 44 × 44 px.
- Las líneas estructurales usan baja opacidad. Nunca se apilan bordes, sombras y brillo sin necesidad.
- Elevación 1: `0 8px 22px rgba(0,0,0,.24)`.
- Elevación 2: `0 24px 60px rgba(0,0,0,.46)`.
- Foco: `0 0 28px rgba(98,217,242,.18)` solo en selección o interacción.

## Movimiento

- `instant`: 80 ms.
- `fast`: 140 ms — hover, foco y presión.
- `normal`: 240 ms — inspector y selección.
- `slow`: 360 ms — cambio de espacio o enfoque.
- Curva principal: `cubic-bezier(.2,.8,.2,1)`.
- Salidas más breves y discretas que entradas.
- Animar transformaciones y opacidad; nunca posición, dimensiones o propiedades de layout.
- `prefers-reduced-motion` convierte todo en cambios prácticamente instantáneos.

## Responsive

- 1440 px: mapa, relaciones, cronología y columna contextual simultáneos.
- 1024 px: misma estructura con paneles más densos.
- 768 px o menos: un solo espacio activo y conmutador Mapa/Relaciones/Tiempo.
- 375 px: inspector como hoja lateral casi completa y barra inferior centrada en iconos.
- En táctil, arrastre directo y selección por toque; ninguna función depende del hover.

## Reglas

- No copiar la apariencia de Alkemion; tomar su modelo de tablero, nodos y editor contextual.
- No imitar literalmente Cyberpunk 2077; usarlo como referencia de densidad, jerarquía y acabado.
- No usar emojis como iconos; usar Lucide o recursos propios coherentes.
- No mostrar métricas decorativas o datos ficticios en la aplicación real.
- Todo estado interactivo necesita default, hover, focus-visible, active y disabled cuando corresponda.
- El mapa, la red y la cronología deben provenir siempre de los datos reales del mundo.

## Fichas RPG

- Cada tipo de página declara un formato propio mediante un código corto y bloques recomendados.
- La información se agrupa en Núcleo, Sistema de juego y Archivo visual; cada grupo aparece sólo cuando tiene contenido.
- Las tarjetas usan altura automática, pueden plegarse y ocupan media fila o una fila completa según su densidad.
- La ficha de personaje muestra una única clase principal mediante desplegable; el detalle de progresión vive en el catálogo de clases.
- Nivel de amenaza y ramificaciones de misión no forman parte de los formatos nuevos ni de las vistas de libro.

## Orden narrativo de los libros

- Navegación principal: Panel → Libro de historia → Gran Libro → Bitácora → Cerebro → Herramientas.
- El Libro de historia abre siempre en Guion; capítulos y secuencias siguen su orden narrativo explícito.
- La hoja Elementos del capítulo deriva lugares, naves y reparto desde las secuencias y escenas, en orden de primera aparición.
- El Libro de personajes ordena sus pestañas por primera aparición en el guion; lo todavía no citado queda al final.
- El Gran Libro separa contenido presente en el guion de sistemas por desarrollar. Una sección vacía nunca se presenta como canon confirmado.

## Regla de los libros

- Los libros son vistas de presentación y navegación de información ya registrada en las páginas.
- Abrir un libro nunca crea bloques, completa estadísticas ni modifica una entrada.
- La edición estructural se realiza desde la página completa; el libro sólo puede cambiar selección, filtros o secciones plegadas localmente.
- Las secciones sin contenido se omiten en vez de simular datos o mostrar formularios vacíos.
