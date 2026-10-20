# LES-009 — Relevar el sistema existente antes de proponer una funcionalidad

- Fecha de registro: 2026-10-19
- Origen: preparación del entorno DEV (DEC-007)

## Qué pasó

La propuesta inicial de FEAT-001 ("Salud del Ecosistema") se armó solo con la descripción del repo del dashboard. Al leer el código se encontró que ya existe una pestaña "Salud" (`js/eco-health.js` + `data/salud.json`) con parte de esa funcionalidad.

## Lección

Antes de proponer una funcionalidad, relevar el código real del destino. Una propuesta hecha sobre la descripción de un repo puede duplicar algo que ya existe (LES-001 aplicado a PRODUCT, no solo a DEVELOPMENT).

## Cómo aplicar

PRODUCT/ARCHITECTURE: listar módulos y datos existentes del destino como primer paso; preferir extender antes que crear.
