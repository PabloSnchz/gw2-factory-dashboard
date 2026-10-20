# DEC-008 — Dashboard Factory: un panel nuevo, no una adaptación

- Estado: ACEPTADA
- Fecha: 2026-10-20
- Ámbito: Observabilidad
- Reemplaza: DEC-007
- Origen: misión FACTORY-001 (instrucción de Pablo, 2026-10-20)

## Contexto

`gw2-agents-dashboard` fue construido para un ecosistema de 5 agentes (Arquitecto, Principal, Reviewer, PO, Documentador) y responde "¿qué están haciendo los agentes?". La Factory es un único agente con capacidades internas, memoria persistente y un workflow unificado. Relevamiento del histórico (2026-10-20, código en `main`):

- 13 pestañas, ~26 módulos JS (`parser.js` 107 KB, `renderer.js` 73 KB) y 10 archivos `data/*.json`.
- Todo dato **medido** (`salud.json`, `git.json`, `ramas.json`, `comms.json`, …) lo generan scripts locales `_eco\*.py` en la PC de Pablo. Último dato: 2026-10-09 09:29 UTC.
- Lee archivos de log en la raíz de `gw2-wallet-agents` (`TEAM_STATUS.md` 329 KB, `ALERTS_LOG.md` 564 KB, …), no `ai-memory/`.

## Análisis

### Conserva valor (se reimplementa, no se copia)

| Del histórico | En el Dashboard Factory |
|---|---|
| "Un dato no leído aparece como — con el motivo, nunca como 0" | Regla de toda la UI (`na(motivo)`) |
| Distinción medido vs. declarado (`prod-medido.json`) | Cada chequeo de salud indica su fuente |
| Frescura de los archivos de estado | Antigüedad de `status.md` vs. commits reales |
| Frontera de producción (`production-guard.js`) | Protección de `main` de PROD medida en vivo + DEV vs PROD |
| Rango temporal del historial (1h/8h/24h/7d) | Actividad 24h / 7d / 30d |
| Cache-bust del CDN de raw (TTL > 5 min medido 2026-10-04) | Lectura por SHA: snapshot inmutable |
| Backlog, decisiones | Trabajo y Conocimiento, leídos de ai-memory |
| "Consultas" (preguntas a Pablo) y "Promociones" (esperando tu decisión) | "Necesita tu decisión": cola única |
| "Lo que arreglé" | Lecciones (LES) |

### Existía solo por el modelo multiagente (desaparece)

Equipo, estado en vivo por agente, canal/comunicaciones entre agentes, disciplina de bandeja, heartbeats y crons, consumo de tokens por agente, worktrees, ramas de rescate, pre-backlog del PO, filtro de consultas del Arquitecto, mapa organizacional (`ORG_MAP.md`), sprints asignados por el Arquitecto, "modo automático".

### Faltaba (se crea)

- Tarea actual con **por qué**, etapa del workflow y **tiempo en ejecución**.
- Cola de **decisión humana** unificada (DEC PROPUESTA + backlog bloqueado por Pablo + `status.md`).
- Registro de **riesgos** abiertos / mitigados / críticos (`risks.md`, DEC-009).
- Resumen **hoy / esta semana**.
- **Inconsistencias** entre memoria y realidad: índice vs. archivos, IDs inexistentes o duplicados, estado vs. backlog, status desactualizado frente a commits, codificación corrupta.
- Lectura directa de `features/`, `decisions/`, `lessons/` con referencias cruzadas ("citado por").

## Decisión

Nuevo repositorio `gw2-factory-dashboard`. El histórico no se modifica: queda como referencia.

- **Arquitectura**: SPA estática, vanilla JS (módulos ES), sin build ni dependencias externas. GitHub Pages.
- **Fuentes**: `ai-memory/` de gw2-factory-dev vía `raw.githubusercontent.com` fijado al SHA del último commit; API pública de GitHub (5 llamadas por lectura, caché de 10 min) para commits, árbol, protección de PROD y comparación DEV/PROD.
- **Sin scripts locales ni backend**: todo se calcula en el navegador en cada lectura.
- **Capas**: `config` → `github` (red + caché) → `loader` (orquesta) → `parse` (puro) → `model` (puro, chequeos) → `views` (puro, HTML) → `app` (router). Parse, model y views se testean en node.
- **Navegación**: Hoy · Trabajo · Conocimiento · Riesgos · Actividad · Salud. "Hoy" responde las 8 preguntas de la misión en una sola pantalla.

## Consecuencias

- El formato de ai-memory pasa a ser un contrato (DEC-009).
- El panel no puede mostrar lo que la Factory no escribe: si una decisión no está en ai-memory, no existe para el panel (coherente con la regla fundacional).
- La cuota anónima de la API limita a ~12 lecturas sin caché por hora por IP (RSK-005, mitigado).
