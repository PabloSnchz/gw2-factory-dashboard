# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) · versionado SemVer.

## [1.0.0] — 2026-10-20

### Added
- Dashboard Factory inicial (FEAT-001, DEC-008): vistas Hoy, Trabajo, Conocimiento, Riesgos, Actividad y Salud.
- Lectura de `ai-memory/` de gw2-factory-dev fijada al SHA del último commit.
- Medición en GitHub: commits de DEV y del panel, protección de `main` de producción, DEV vs PROD.
- Cola única "Necesita tu decisión" y "Qué debería preocuparte".
- Chequeos de salud: archivos obligatorios, codificación, índice, IDs, referencias, frescura de status.md, coherencia estado/backlog, propuestas demoradas, riesgos críticos, protección de PROD, estado de la API.
- Contrato de datos ai-memory v2 (DEC-009) y su especificación.
- 27 tests en node sobre la memoria real, incluido el modo sin API.
