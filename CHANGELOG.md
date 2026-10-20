# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) · versionado SemVer.

## [2.0.0] — 2026-10-20

El panel pasa de centro de observación a **Centro de Decisiones** (misión FACTORY-001B). Es MAJOR porque cambia el propósito y la estructura de la vista principal, el contrato de datos (v3) y el presupuesto de API.

### Added
- **Gato Design System 1.0.1** (`gds/`): tokens en tres niveles, 23 componentes, íconos, contraste WCAG 2.1 AA calculado para 57 pares y `GDS_FOUNDATION.md` (DEC-010).
- **Pedidos y respuestas** (contrato v3, DEC-011): lectura de `ai-memory/requests/` y `ai-memory/responses/`, ciclo de vida (abierto, pospuesto, respondido, verificado, cerrado) y chequeos de salud propios.
- **Responder desde el panel** (DEC-012): botones por pedido que abren un issue prellenado en gw2-factory-dev; el workflow `decision-response` guarda la respuesta. Lista "Ya respondiste".
- **Errores del canal visibles** (DEC-013): las respuestas sin registrar se muestran como "Registrando" o "no se pudo registrar", con enlace al motivo, en Hoy, en la tarjeta del pedido y en Salud.
- Al volver de GitHub después de responder, el panel relee sin caché.
- Accesibilidad: el foco pasa al contenido al cambiar de vista y vuelve a Refrescar; las lecturas se anuncian en una región `aria-live`; el paso actual lleva `aria-current="step"`; los contadores tienen texto para lector de pantalla.
- Tests: 74 en total, más 20 mutaciones detectadas. Incluyen reglas del GDS en la aplicación, jerarquía de títulos de todas las vistas, textos dorados compartidos con el workflow y modo sin API.

### Changed
- **Vista Hoy ordenada por decisión**: frase de resumen → respuestas sin registrar → tarjetas de decisión (por qué importa, recomendación, botones; la recomendada es el único botón principal) → "Ya respondiste" → qué hace la Factory → preocupaciones → actividad → números → entornos.
- **Lenguaje**: los títulos se muestran sin IDs delante y los IDs pasan a ser referencias secundarias; los estados y las etapas se dicen en palabras ("Trabajando", "Esperando tu validación", "Arquitectura"); la procedencia de las alertas se indica como "Medido en GitHub" o "Declarado en la memoria".
- **Cola**: un pendiente propio de `status.md` ya no queda escondido dentro de otro ítem que solo lo cita.
- `css/app.css` reescrito: solo disposición y solo tokens del GDS (lo verifica un test).
- Títulos del markdown de la memoria: `##` se muestra como h2 bajo el h1 de la página (antes h3: salteaba un nivel).
- API de GitHub: 6 llamadas por lectura (antes 5); la nueva lee los issues abiertos del canal.

### Fixed
- Contraste que no cumplía AA en la v1: badge "crítico" (3.70:1), texto crítico sobre su tinte (4.08:1) y borde de botones (1.29:1).
- Botones y métricas que son enlaces tomaban el color de enlace (GDS 1.0.1).

### Known
- Todavía no hubo una revisión visual en un navegador real (RSK-015). La revisión fue estructural: tests, contraste calculado y simulación sobre la memoria real.

## [1.0.0] — 2026-10-20

### Added
- Dashboard Factory inicial (FEAT-001, DEC-008): vistas Hoy, Trabajo, Conocimiento, Riesgos, Actividad y Salud.
- Lectura de `ai-memory/` de gw2-factory-dev fijada al SHA del último commit.
- Medición en GitHub: commits de DEV y del panel, protección de `main` de producción, DEV vs PROD.
- Cola única "Necesita tu decisión" y "Qué debería preocuparte".
- Chequeos de salud: archivos obligatorios, codificación, índice, IDs, referencias, frescura de status.md, coherencia estado/backlog, propuestas demoradas, riesgos críticos, protección de PROD, estado de la API.
- Contrato de datos ai-memory v2 (DEC-009) y su especificación.
- 27 tests en node sobre la memoria real, incluido el modo sin API.
