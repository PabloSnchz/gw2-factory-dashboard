# REQ-002 — Publicar la versión de prueba en Vercel y apagar GitHub Pages en DEV

- Estado: ABIERTA
- Tipo: acción
- Fecha: 2026-10-20
- Prioridad: ALTO
- Relacionado: DEC-005, BL-003, BL-011, RSK-002

## Qué pasó

Elegiste publicar la versión de prueba en Vercel (DEC-005). Hoy sigue publicada con GitHub Pages en `pablosnchz.github.io/gw2-factory-dev`, el mismo dominio que la app real.

## Por qué importa

Mientras compartan dominio, la versión de prueba y la real comparten el almacenamiento del navegador: API keys, cuentas y ajustes. Crear el proyecto requiere tu cuenta de Vercel; la Factory no puede hacerlo.

## Cómo hacerlo

1. En vercel.com → Add New → Project → importá `PabloSnchz/gw2-factory-dev`.
2. Framework: Other. Rama: `main`. Carpeta raíz. Sin comando de build. Deploy.
3. Abrí la dirección que te da Vercel y comprobá que la app carga.
4. En gw2-factory-dev → Settings → Pages → apagá GitHub Pages.
5. Respondé "Hecha" a este pedido (podés pegar la dirección de Vercel en el comentario).

## Recomendación

Hacelo antes de que la Factory empiece a cambiar código de la app: hasta entonces, usá la versión de prueba solo en una ventana de incógnito.
