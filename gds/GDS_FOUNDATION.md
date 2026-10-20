# Gato Design System (GDS) — Fundamentos

- Versión: 1.0.1 (2026-10-20)
- Estado: EN USO — aplicado al Dashboard Factory desde FACTORY-001B MC-5.
- Decisión: DEC-010 (gw2-factory-dev/ai-memory)
- Primera aplicación: Dashboard Factory (FACTORY-001B, micro-ciclo MC-5). Después: la webapp Bóveda del Gato Negro.

El GDS es el sistema visual oficial del ecosistema Gato Negro. No es el estilo de una pantalla: es el contrato entre diseño y código para todos los productos. El dashboard es solo su primer consumidor.

## Contenido

| Archivo | Qué es |
|---|---|
| `gds/tokens.css` | Tokens en tres niveles: primitivos, semánticos y de componente |
| `gds/components.css` | Componentes base (`.gds-*`), construidos solo con tokens semánticos |
| `gds/icons.js` | Íconos de trazo y marca del gato, sin dependencias |
| `gds/contrast.mjs` | Cálculo de contraste WCAG de todos los pares de uso |
| `gds/GDS_FOUNDATION.md` | Este documento: reglas y razones |
| `tests/gds.test.mjs` | Verifica en CI cada regla verificable de este documento |

Uso mínimo:

```html
<link rel="stylesheet" href="gds/tokens.css">
<link rel="stylesheet" href="gds/components.css">
<body class="gds"> … </body>
```

---

## 1. Principios

1. **Calma antes que alarma.** La bóveda es oscura y silenciosa. El color intenso se reserva para lo que exige atención; si todo brilla, nada importa. Un panel en estado normal se ve tranquilo.
2. **Lo que hay que decidir va primero.** La jerarquía visual sigue a la importancia para quien mira: decisión pendiente > problema > trabajo en curso > historia. El tamaño y el acento se ganan, no se reparten.
3. **Nunca solo color.** Todo estado combina ícono + texto (+ color). Una persona daltónica, un lector de pantalla o una captura en blanco y negro reciben la misma información.
4. **Semántica antes que valor.** Los componentes piden "texto secundario" o "borde de control", nunca `#C9D0DA`. Cambiar la paleta no toca componentes.
5. **Medido, no supuesto.** El contraste se calcula y se prueba en CI. La propuesta de paleta inicial falló AA en 7 pares que parecían correctos a simple vista (§3.3, LES-013).
6. **Lenguaje humano, IDs como metadato.** La interfaz dice qué pasó, por qué importa y qué decisión hace falta. Los identificadores internos (DEC, LES, RSK, BL) se muestran pequeños y secundarios (`.gds-ref`), nunca como contenido principal.
7. **Pocas piezas, bien hechas.** Se agrega un componente cuando dos pantallas lo necesitan, no antes.

## 2. Identidad: La Bóveda del Gato Negro

| Concepto | Traducción visual |
|---|---|
| Misterio, calma | Fondo Obsidian casi negro con matiz azul; superficies que se aclaran poco a poco al subir de nivel; sin degradados estridentes |
| Conocimiento, inteligencia | Arcane Violet como color de acción e identidad: lo que se puede tocar y lo que es "actual" |
| Observabilidad, precisión | Tipografía sobria, cifras y horas en monoespaciada, bordes finos, alineación estricta a la escala de 4 px |
| Exploración | Acento violeta con un halo tenue (`--gds-glow-arcane`) solo en el elemento que pide atención |
| El gato | Marca: silueta negra con ojos ámbar dentro de un marco violeta. El ámbar de los ojos es exclusivo de la marca (`--gds-color-brand-eyes`) |

Se evita: el azul corporativo, los grises de planilla, los paneles industriales con decenas de luces y la estética bancaria de tarjetas blancas con sombras.

---

## 3. Tokens

### 3.1 Tres niveles

| Nivel | Prefijo | Ejemplo | Quién lo usa |
|---|---|---|---|
| 1. Primitivo | `--gds-p-*` | `--gds-p-arcane-700` | Solo `tokens.css`, para definir semánticos |
| 2. Semántico | `--gds-color-*`, `--gds-space-*`, `--gds-font-*`, `--gds-radius-*`, … | `--gds-color-fill-primary` | Componentes y aplicaciones |
| 3. Componente | `--gds-<componente>-*` | `--gds-button-height` | Solo cuando un semántico no alcanza |

Reglas (verificadas por `tests/gds.test.mjs`):

- Todo token se declara dentro de `:root` (el sistema histórico tuvo tokens declarados fuera de `:root` que nunca se aplicaban).
- Un semántico de color nunca contiene hex: referencia un primitivo (o `rgba()` en tintes y overlays).
- `components.css` no contiene hex, `rgb()`, `hsl()`, primitivos ni medidas sueltas. Única excepción: `1px` dentro de `.gds-visually-hidden`.
- Toda referencia `var(--gds-*)` existe; no hay ciclos ni duplicados.

Nomenclatura: `--gds-<categoría>-<rol>-<variante>-<estado>`, de lo general a lo particular. Ejemplo: `--gds-color-fill-primary-hover`.

### 3.2 Color

#### Primitivos

| Familia | Token | Valor | Rol |
|---|---|---|---|
| Obsidian | `--gds-p-obsidian-950` | `#0F1117` | Fondo |
| | `--gds-p-obsidian-900` | `#1A1F2B` | Superficie 1 |
| | `--gds-p-obsidian-800` | `#232A3A` | Superficie 2 |
| | `--gds-p-obsidian-700` | `#2E3649` | Superficie 3, divisores |
| | `--gds-p-obsidian-600` | `#3B4560` | Borde por defecto |
| | `--gds-p-obsidian-400` | `#6B7690` | Borde de control |
| Mist | `--gds-p-mist-50` | `#F4F6FA` | Texto principal |
| | `--gds-p-mist-200` | `#C9D0DA` | Texto secundario |
| | `--gds-p-mist-400` | `#8E96A3` | Texto atenuado |
| Arcane | `--gds-p-arcane-300` | `#A896FF` | Texto de acento, enlaces, foco |
| | `--gds-p-arcane-500` | `#7B5CFF` | Borde de acento, marca |
| | `--gds-p-arcane-600` | `#6A4AF0` | Relleno principal (hover) |
| | `--gds-p-arcane-700` | `#5A3DDB` | Relleno principal |
| | `--gds-p-arcane-800` | `#4A30C0` | Relleno principal (presionado) |
| Jade | `--gds-p-jade-400` | `#3CC48A` | Texto de éxito |
| | `--gds-p-jade-500` | `#2FB67C` | Relleno, borde e ícono de éxito |
| Amber | `--gds-p-amber-500` | `#F2B94B` | Advertencia; ojos del gato |
| Crimson | `--gds-p-crimson-300` | `#F47C7C` | Texto de peligro |
| | `--gds-p-crimson-400` | `#F06A6A` | Ícono de peligro |
| | `--gds-p-crimson-500` | `#D94A4A` | Borde de peligro |
| | `--gds-p-crimson-600` | `#B83A3A` | Relleno de peligro |
| Astral | `--gds-p-astral-400` | `#6EA3FF` | Texto e ícono informativos |
| | `--gds-p-astral-500` | `#4D8DFF` | Relleno y borde informativos |

#### Semánticos por rol

| Rol | Tokens | Regla |
|---|---|---|
| **Background** | `bg` | Lo que está detrás de todo. Uno solo por pantalla. |
| **Surface** | `surface-1` (tarjeta), `surface-2` (dentro de tarjeta), `surface-3` (hover/realce), `surface-overlay` (detrás de diálogos) | Cada nivel de anidamiento sube uno. No más de tres niveles. |
| **Fill** | `fill-primary(-hover/-pressed)`, `fill-neutral(-hover)`, `fill-danger`, `fill-success`, `fill-warning`, `fill-info` | Áreas sólidas de acción o estado. El texto encima usa su `text-on-*`. |
| **Tint** | `tint-primary`, `tint-success`, `tint-warning`, `tint-danger`, `tint-info` | Fondos suaves translúcidos de badges y selección. Siempre con ícono + texto. |
| **Border** | `border-subtle` (divisor, decorativo), `border-default` (contorno de tarjeta), `border-control` (inputs y botones secundarios, ≥ 3:1), `border-accent` (selección), `border-success/warning/danger/info`, `focus` | Un control interactivo se reconoce por su borde: usa `border-control`, no `border-default`. |
| **Text** | `text-primary`, `text-secondary`, `text-muted`, `text-accent`, `text-link`, `text-success/warning/danger/info`, `text-on-primary`, `text-on-danger`, `text-on-light` | `text-muted` nunca sobre `surface-3` (4.05:1). Sobre rellenos claros (jade, ámbar, astral) el texto es `text-on-light`. |
| **Icon** | `icon-primary`, `icon-secondary`, `icon-muted`, `icon-accent`, `icon-success/warning/danger/info` | Un ícono hereda `currentColor`; estos tokens se usan cuando el ícono lleva el estado. |
| **Brand** | `brand-frame`, `brand-eyes` | Solo para la marca. Nunca para comunicar estado. |

### 3.3 Evolución de la paleta propuesta

La paleta base de la misión se conservó como identidad. Se midió cada uso y se ajustó donde no cumplía WCAG 2.1 AA:

| Uso | Propuesta | Medido | GDS 1.0 | Medido |
|---|---|---|---|---|
| Texto de acento / enlace | `#7B5CFF` | 3.29 sobre surface-2 | `#A896FF` (arcane-300) | 5.79 |
| Texto blanco sobre botón principal | relleno `#7B5CFF` | 4.36 | relleno `#5A3DDB` (arcane-700) | 6.72 |
| Texto de peligro | `#D94A4A` | 3.44 sobre surface-2 | `#F47C7C` (crimson-300) | 5.48 |
| Texto blanco sobre botón destructivo | relleno `#D94A4A` | 4.18 | relleno `#B83A3A` (crimson-600) | 5.67 |
| Texto informativo | `#4D8DFF` | 4.49 sobre surface-2 | `#6EA3FF` (astral-400) | 5.70 |
| Badge de éxito | texto `#2FB67C` sobre su tinte | 4.41 sobre surface-2 | texto `#3CC48A` (jade-400) | 5.14 |
| Badge de peligro | texto `#D94A4A` sobre su tinte | 2.97 sobre surface-2 | texto `#F47C7C` (crimson-300) | 4.74 |

Se agregaron, además, `surface-3` (`#2E3649`), dos bordes (`#3B4560` decorativo y `#6B7690` de control, que alcanza 3:1) y las variantes hover/presionado del violeta. `#7B5CFF` se mantiene como color de identidad en bordes de acento y marca, donde el mínimo es 3:1.

## 4. Contraste

Mínimos WCAG 2.1 AA: **4.5:1** texto normal (1.4.3) · **3:1** texto grande ≥ 24 px y componentes no textuales (1.4.11). El GDS aplica 4.5:1 a todo texto, incluidos los títulos.

Esta tabla la genera `gds/contrast.mjs` y el test falla si deja de coincidir con el cálculo. Los fondos translúcidos se componen sobre la superficie indicada.

| Primer plano | Fondo | Ratio | Mínimo | Resultado | Uso |
|---|---|---|---|---|---|
| `text-primary` | `bg` | 17.44 | 4.5 | Cumple | Texto principal |
| `text-secondary` | `bg` | 12.15 | 4.5 | Cumple | Texto secundario |
| `text-primary` | `surface-1` | 15.23 | 4.5 | Cumple | Texto principal |
| `text-secondary` | `surface-1` | 10.60 | 4.5 | Cumple | Texto secundario |
| `text-primary` | `surface-2` | 13.26 | 4.5 | Cumple | Texto principal |
| `text-secondary` | `surface-2` | 9.24 | 4.5 | Cumple | Texto secundario |
| `text-primary` | `surface-3` | 11.15 | 4.5 | Cumple | Texto principal |
| `text-secondary` | `surface-3` | 7.77 | 4.5 | Cumple | Texto secundario |
| `text-muted` | `bg` | 6.33 | 4.5 | Cumple | Metadato, ayuda |
| `text-muted` | `surface-1` | 5.52 | 4.5 | Cumple | Metadato, ayuda |
| `text-muted` | `surface-2` | 4.81 | 4.5 | Cumple | Metadato, ayuda |
| `text-link` | `bg` | 7.61 | 4.5 | Cumple | Enlace, acento |
| `text-link` | `surface-1` | 6.65 | 4.5 | Cumple | Enlace, acento |
| `text-link` | `surface-2` | 5.79 | 4.5 | Cumple | Enlace, acento |
| `text-link` | `surface-3` | 4.87 | 4.5 | Cumple | Enlace, acento |
| `text-success` | `bg` | 8.50 | 4.5 | Cumple | Texto de estado (success) |
| `text-success` | `surface-1` | 7.42 | 4.5 | Cumple | Texto de estado (success) |
| `text-success` | `surface-2` | 6.46 | 4.5 | Cumple | Texto de estado (success) |
| `text-warning` | `bg` | 10.62 | 4.5 | Cumple | Texto de estado (warning) |
| `text-warning` | `surface-1` | 9.27 | 4.5 | Cumple | Texto de estado (warning) |
| `text-warning` | `surface-2` | 8.07 | 4.5 | Cumple | Texto de estado (warning) |
| `text-danger` | `bg` | 7.21 | 4.5 | Cumple | Texto de estado (danger) |
| `text-danger` | `surface-1` | 6.29 | 4.5 | Cumple | Texto de estado (danger) |
| `text-danger` | `surface-2` | 5.48 | 4.5 | Cumple | Texto de estado (danger) |
| `text-info` | `bg` | 7.50 | 4.5 | Cumple | Texto de estado (info) |
| `text-info` | `surface-1` | 6.55 | 4.5 | Cumple | Texto de estado (info) |
| `text-info` | `surface-2` | 5.70 | 4.5 | Cumple | Texto de estado (info) |
| `text-success` | `tint-success` sobre `surface-1` | 5.91 | 4.5 | Cumple | Badge de estado (success) |
| `text-success` | `tint-success` sobre `surface-2` | 5.14 | 4.5 | Cumple | Badge de estado (success) |
| `text-warning` | `tint-warning` sobre `surface-1` | 6.90 | 4.5 | Cumple | Badge de estado (warning) |
| `text-warning` | `tint-warning` sobre `surface-2` | 5.99 | 4.5 | Cumple | Badge de estado (warning) |
| `text-danger` | `tint-danger` sobre `surface-1` | 5.38 | 4.5 | Cumple | Badge de estado (danger) |
| `text-danger` | `tint-danger` sobre `surface-2` | 4.74 | 4.5 | Cumple | Badge de estado (danger) |
| `text-info` | `tint-info` sobre `surface-1` | 5.36 | 4.5 | Cumple | Badge de estado (info) |
| `text-info` | `tint-info` sobre `surface-2` | 4.66 | 4.5 | Cumple | Badge de estado (info) |
| `text-accent` | `tint-primary` sobre `surface-1` | 5.72 | 4.5 | Cumple | Badge de acento |
| `text-accent` | `tint-primary` sobre `surface-2` | 5.00 | 4.5 | Cumple | Badge de acento |
| `text-primary` | `tint-primary` sobre `surface-1` | 13.10 | 4.5 | Cumple | Opción elegida, paso actual |
| `text-primary` | `tint-primary` sobre `surface-2` | 11.45 | 4.5 | Cumple | Opción elegida, paso actual |
| `text-on-primary` | `fill-primary` | 6.72 | 4.5 | Cumple | Botón principal |
| `text-on-primary` | `fill-primary-hover` | 5.45 | 4.5 | Cumple | Botón principal (hover) |
| `text-on-primary` | `fill-primary-pressed` | 8.48 | 4.5 | Cumple | Botón principal (presionado) |
| `text-on-danger` | `fill-danger` | 5.67 | 4.5 | Cumple | Botón destructivo |
| `text-primary` | `fill-neutral` | 13.26 | 4.5 | Cumple | Botón secundario |
| `text-primary` | `fill-neutral-hover` | 11.15 | 4.5 | Cumple | Botón secundario (hover) |
| `text-on-light` | `fill-success` | 7.28 | 4.5 | Cumple | Texto sobre relleno success |
| `text-on-light` | `fill-warning` | 10.62 | 4.5 | Cumple | Texto sobre relleno warning |
| `text-on-light` | `fill-info` | 5.90 | 4.5 | Cumple | Texto sobre relleno info |
| `focus` | `bg` | 7.61 | 3 | Cumple | Anillo de foco |
| `focus` | `surface-1` | 6.65 | 3 | Cumple | Anillo de foco |
| `focus` | `surface-2` | 5.79 | 3 | Cumple | Anillo de foco |
| `focus` | `surface-3` | 4.87 | 3 | Cumple | Anillo de foco |
| `border-control` | `bg` | 4.15 | 3 | Cumple | Borde de control |
| `border-control` | `surface-1` | 3.62 | 3 | Cumple | Borde de control |
| `border-control` | `surface-2` | 3.16 | 3 | Cumple | Borde de control |
| `border-accent` | `surface-1` | 3.78 | 3 | Cumple | Indicador de selección |
| `border-accent` | `surface-2` | 3.29 | 3 | Cumple | Indicador de selección |

Pares **no permitidos** (no figuran en la tabla porque no cumplen): `text-muted` sobre `surface-3` (4.05); cualquier texto sobre `border-*`; `text-on-primary` sobre rellenos claros.

---

## 5. Tipografía

Familia: `Inter` si está instalada, si no `system-ui`. El GDS no descarga fuentes: cero dependencias externas y carga instantánea. Cifras, horas, SHAs e IDs usan la familia monoespaciada.

| Rol | Token | Clase | Tamaño / interlineado | Peso | Uso |
|---|---|---|---|---|---|
| Headline 1 | `--gds-font-headline-1` | `.gds-headline-1` | 32 / 40 | 700 | Una por pantalla: la frase que resume el estado |
| Headline 2 | `--gds-font-headline-2` | `.gds-headline-2` | 24 / 32 | 650 | Pregunta de una decisión, título de página |
| Title 1 | `--gds-font-title-1` | `.gds-title-1` | 18 / 26 | 600 | Título de sección |
| Title 2 | `--gds-font-title-2` | `.gds-title-2` | 16 / 24 | 600 | Título de tarjeta, de aviso |
| Body 1 | `--gds-font-body-1` | `.gds-body-1` | 16 / 24 | 400 | Texto corrido (por defecto) |
| Body 2 | `--gds-font-body-2` | `.gds-body-2` | 14 / 22 | 400 | Texto denso: listas, tablas, detalle |
| Label 1 | `--gds-font-label-1` | `.gds-label-1` | 14 / 20 | 500 | Botones, pestañas, etiquetas de campo |
| Label 2 | `--gds-font-label-2` | `.gds-label-2` | 12 / 16, mayúsculas | 600 | Badges y encabezados de tabla. Máximo 3 palabras |
| Caption | `--gds-font-caption` | `.gds-caption` | 12 / 16 | 400 | Metadatos, horas, referencias |
| Code | `--gds-font-code` | `code` | 13 / 20 | 400 | Código, rutas, SHAs |

Reglas:

- Tamaños en `rem`: respetan el zoom y el tamaño de letra del usuario (WCAG 1.4.4).
- Nada por debajo de 12 px.
- Un solo `headline-1` por pantalla. Los niveles no se saltean (h1 → h2 → h3).
- El texto corrido no supera `--gds-measure` (72 caracteres).
- Las mayúsculas solo en `label-2`; nunca en párrafos.

## 6. Espaciado

Escala única (el test la verifica valor por valor):

| Token | Valor | Uso típico |
|---|---|---|
| `--gds-space-1` | 4 px | Ícono ↔ texto en badges |
| `--gds-space-2` | 8 px | Ícono ↔ texto en botones; entre ítems de lista |
| `--gds-space-3` | 12 px | Padding interno de ítems; separación entre controles |
| `--gds-space-4` | 16 px | Padding de botones y tarjetas internas; separación entre bloques relacionados |
| `--gds-space-5` | 24 px | Padding de tarjeta; separación entre secciones de una tarjeta |
| `--gds-space-6` | 32 px | Separación entre secciones de página |
| `--gds-space-7` | 48 px | Separación entre zonas mayores |
| `--gds-space-8` | 64 px | Márgenes de página amplios |

Reglas:

- Ningún componente usa un valor fuera de la escala.
- Excepción documentada: `--gds-space-optical` (2 px) **solo** para alinear ópticamente un ícono con texto o el padding vertical de un badge. No separa bloques.
- Proximidad = relación: lo relacionado se separa menos que lo no relacionado. Si dos bloques usan el mismo espacio, se leen como pares.

## 7. Forma, elevación y movimiento

| Categoría | Tokens | Regla |
|---|---|---|
| Radio | `sm` 4 · `md` 8 · `lg` 12 · `xl` 16 · `full` | Controles `md`, tarjetas `lg`, diálogos `xl`, badges `full` |
| Borde | `border-width` 1 · `border-width-strong` 2 · `border-width-thick` 3 | Contornos 1; pestaña actual 2; barra lateral de avisos y columnas 3 |
| Foco | `focus-width` 2 · `focus-offset` 2 | Igual en todos los componentes |
| Elevación | `elevation-1..3`, `glow-arcane` | En la oscuridad la elevación se comunica con superficie más clara, no con sombra. Sombra solo en diálogos; halo violeta solo en el elemento que pide una decisión |
| Movimiento | `motion-fast` 120 ms · `base` 200 ms · `slow` 320 ms | Solo transiciones de color y borde. Con `prefers-reduced-motion` todo pasa a 0 ms y el skeleton se detiene |
| Objetivo | `target-min` 40 px | Altura mínima de botones, pestañas y campos (WCAG 2.2 pide 24 px; el GDS da margen) |

---

## 8. Componentes

Todos se construyen solo con tokens semánticos. Clases con prefijo `gds-`, modificadores `--variante`, partes `__parte` (BEM).

| Componente | Clase | Variantes / partes | Estados | Regla de uso |
|---|---|---|---|---|
| Base | `.gds` (en `body`) | — | — | Activa fondo, texto, enlaces y foco del sistema |
| Oculto accesible | `.gds-visually-hidden` | — | — | Texto solo para lectores de pantalla |
| Saltar al contenido | `.gds-skip` | — | visible al recibir foco | Primer elemento enfocable de toda página |
| Tipografía | `.gds-headline-1` … `.gds-caption`, `.gds-text-secondary`, `.gds-text-muted`, `.gds-measure` | — | — | Ver §5 |
| Ícono | `.gds-icon` | — | hereda color | Decorativo (`aria-hidden`); el significado va en texto al lado |
| Botón | `.gds-button` | `--primary`, `--secondary`, `--ghost`, `--danger`, `--sm` | hover, presionado, foco, deshabilitado | Un solo `--primary` por zona de decisión. Texto con verbo: "Aprobar", no "OK" |
| Estado (badge) | `.gds-status` | `--success`, `--warning`, `--danger`, `--info`, `--accent` | — | Siempre ícono + texto. Máximo 3 palabras |
| Referencia | `.gds-ref` | `--missing` | hover | ID interno como metadato secundario; tachado si no existe |
| Tarjeta | `.gds-card` | `--inset`, `--accent`; `__header` | hover si es enlace | `--accent` solo para lo que necesita una decisión |
| Aviso | `.gds-callout` | `--success`, `--warning`, `--danger`, `--info`, `--accent`; `__title`, `__body` | — | Ícono + título que dice qué pasó + cuerpo que dice qué hacer |
| Pasos | `.gds-stepper` | `__step[data-state=done/current]` | hecho, actual, pendiente | Etapas del workflow; el actual con `aria-current="step"` |
| Métrica | `.gds-metric` | `__value`, `__label` | hover si es enlace | Un número y qué significa; nunca un número solo |
| Pestañas | `.gds-tabs`, `.gds-tab` | — | actual (`aria-current`/`aria-selected`), hover | Navegación entre vistas hermanas |
| Contador | `.gds-count` | — | — | Cantidad junto a un título o pestaña |
| Lista | `.gds-list` | `__item` | — | Ítems con ícono + texto |
| Línea de tiempo | `.gds-timeline` | `__item`, `__time` | — | Actividad ordenada por hora (monoespaciada) |
| Tabla | `.gds-table`, `.gds-table-wrap` | — | — | Datos tabulares; `th` con `scope`. El wrap permite scroll horizontal |
| Opción | `.gds-choice` | `__option` | elegida, foco, hover | Radios como tarjetas para elegir entre opciones de una decisión. Dentro de `fieldset` con `legend` |
| Campo | `.gds-field`, `.gds-input`, `.gds-select`, `.gds-textarea` | `__label`, `__hint` | foco | Toda entrada con `label` visible asociado |
| Diálogo | `.gds-dialog` | `__header`, `__body`, `__footer` | abierto | `<dialog>` nativo con `showModal()`: atrapa el foco y cierra con Esc. Confirma acciones con efecto |
| Vacío | `.gds-empty`, `.gds-na` | — | — | Decir qué falta y por qué ("sin dato: cuota de API agotada"), nunca un guion solo |
| Carga | `.gds-skeleton` | — | animado / quieto con movimiento reducido | Mientras llegan datos |
| Disposición | `.gds-stack` (`--sm`, `--lg`), `.gds-cluster`, `.gds-grid` | — | — | Composición vertical, en línea y en grilla, con la escala de espaciado |

Íconos disponibles (`gds/icons.js`): `check`, `x`, `clock`, `alert`, `info`, `octagon`, `eye`, `compass`, `book`, `layers`, `pulse`, `shield`, `refresh`, `arrow`, `external`, `hand`, `sparkle`, `send`. Trazo de 2 px en grilla de 24 px. Un nombre desconocido devuelve `info` (nunca rompe la interfaz).

Estado ↔ ícono (fijo en todo el ecosistema): éxito `check` · advertencia `alert` · peligro `octagon` · información `info` · necesita decisión `hand` · en espera `clock`.

## 9. Accesibilidad (WCAG 2.1 AA como mínimo)

| Criterio | Regla GDS | Cómo se garantiza |
|---|---|---|
| 1.4.3 Contraste mínimo | 4.5:1 todo texto | `gds/contrast.mjs` + test (§4) |
| 1.4.11 Contraste no textual | 3:1 bordes de control, foco, selección | Ídem |
| 1.4.1 Uso del color | Estado = ícono + texto + color | Componentes `.gds-status` y `.gds-callout` exigen ícono y texto |
| 1.4.4 Cambio de tamaño | Tipografía en `rem`; layout fluido | Tokens tipográficos (test) |
| 1.4.10 Reflow | Sin scroll horizontal a 320 px, salvo tablas (`.gds-table-wrap`) | Grillas con `minmax(min(100%, …))` |
| 2.1.1 Teclado | Todo lo interactivo es un `button`, `a` o control nativo | Revisión de cada vista |
| 2.4.1 Saltar bloques | `.gds-skip` primero en cada página | Revisión |
| 2.4.3 Orden del foco | Orden del DOM = orden visual; el diálogo devuelve el foco al cerrar | Revisión |
| 2.4.7 Foco visible | Anillo `focus` 2 px + offset 2 px, ≥ 4.87:1 en toda superficie | CSS base + test |
| 2.3.3 / preferencias | Movimiento reducido = 0 ms | Tokens de movimiento (test) |
| 3.3.2 Etiquetas | Todo campo con `label` visible | Componente `.gds-field` |
| 4.1.2 Nombre, rol, valor | Íconos `aria-hidden`; estado actual con `aria-current`; cambios anunciados en región `aria-live` | `icons.js` (test) + revisión |
| 4.1.3 Mensajes de estado | Confirmaciones en `role="status"` | Revisión |

Lo que no puede verificar un test (orden del foco, textos descriptivos, lectura con lector de pantalla) se revisa a mano en cada micro-ciclo que cambia una interfaz.

## 10. Lenguaje

El GDS también define cómo se habla:

- Títulos que dicen qué pasó ("La versión de prueba comparte almacenamiento con producción"), no categorías ("Riesgo RSK-002").
- Toda decisión responde: **qué pasó · por qué importa · qué decisión hace falta**.
- Botones con verbo y objeto: "Aprobar opción B", "Posponer 7 días".
- Vacíos y errores dicen la causa y qué hacer.
- Fechas relativas para lo reciente ("hace 12 min") con la fecha exacta disponible (`title` o `time datetime`).

---

## 11. Gobernanza

- **Versionado semántico.** MAJOR: se elimina o renombra un token o clase. MINOR: se agrega un token, una variante o un componente. PATCH: cambia un valor sin cambiar su significado.
- **Cambiar un color** = cambiar un primitivo o el primitivo al que apunta un semántico, correr `node --test tests/*.test.mjs` y actualizar §3 y §4 (la tabla se regenera con `gds/contrast.mjs`). Si el test de contraste falla, el cambio no entra.
- **Agregar un componente**: solo con tokens semánticos; documentarlo en §8 (el test verifica que toda clase base figure en este documento).
- **Decisiones**: todo cambio MAJOR o de identidad se registra como DEC en `gw2-factory-dev/ai-memory`.
- **Dónde vive**: en `gw2-factory-dashboard/gds/` mientras tenga un solo consumidor. Cuando la webapp lo adopte, se extrae a un repositorio o paquete propio, y ambos productos lo consumen por versión.

### Historial de versiones

- **1.0.1** (2026-10-20, PATCH) — Botones y métricas usados como enlace (`<a class="gds-button…">`, `<a class="gds-metric">`) conservan el color de su variante: antes la regla `.gds a` (color de enlace) les ganaba por especificidad. Detectado al aplicar el GDS al panel (MC-5). Sin tokens nuevos ni pares de contraste nuevos.
- **1.0.0** (2026-10-20) — Fundamentos: tokens en tres niveles, componentes, íconos, contraste calculado (DEC-010).

### Adopción en la webapp (futuro, no forma parte de MC-2)

La webapp tiene su propia arquitectura CSS de tres capas (DEC-004). La adopción será incremental y sin choques:

1. Cargar `tokens.css` (solo define variables `--gds-*`: no cambia nada visible).
2. Mapear las variables propias de la webapp a tokens GDS, una capa a la vez.
3. Adoptar componentes `.gds-*` pantalla por pantalla. El prefijo `gds-` evita colisiones con las clases existentes.
4. Validar el contraste de los pares nuevos con `gds/contrast.mjs`.

---

## 12. Origen: qué se conservó, qué se eliminó, qué se rediseñó

Fuentes analizadas el 2026-10-20:

- **Andreani Design System.** La documentación pública no se encontró en la web. Se usó como referencia metodológica la adaptación que el dashboard histórico declara como "Andreani Cartesian Design System v1 adaptado" (`gw2-agents-dashboard/css/tokens.css`). Se tomaron solo principios y organización; ningún color ni elemento de marca.
- **Dashboard histórico** (`gw2-agents-dashboard`, solo lectura).
- **Dashboard Factory actual** (`gw2-factory-dashboard/css/app.css` v1.0.0).

| Origen | Conservar | Eliminar | Rediseñar |
|---|---|---|---|
| Metodología Andreani (vía histórico) | Separación Background / Surface / Fill / Text / Border / Icon; roles tipográficos headline/title/body/label/caption; escala de espaciado; tokens de estado (fondo/borde/texto/ícono) | Paleta (en el histórico, una paleta genérica tipo Tailwind sin identidad); escalas 50–900 completas que nadie usa | Tres niveles explícitos (primitivo → semántico → componente) con reglas verificadas por test |
| Dashboard histórico | Badges de estado con fondo tintado; tablas densas legibles | Colores por agente (modelo multiagente); alias heredados que duplicaban tokens; tokens declarados fuera de `:root` | Estados ligados al trabajo y a las decisiones, no a los agentes |
| Dashboard Factory v1 | Tema oscuro; stepper del workflow; tarjetas; skip link y foco visible; respeto a movimiento reducido | Colores fijos dentro de reglas (por ejemplo `#1a1406`, `#fff`, `#c3c8d4`, `#d7c79f` y tintes `rgba` sueltos); tamaños sueltos (`.72rem`, `.82rem`, `.86rem`…); el dorado como acento (se reserva el ámbar para la marca y la advertencia) | Jerarquía (hoy todo pesa parecido); contraste: medido con `gds/contrast.mjs`, el badge "crítico" da 3.70:1, el texto de estado crítico sobre su tinte 4.08:1 y el borde de botones 1.29:1, los tres por debajo de AA |
