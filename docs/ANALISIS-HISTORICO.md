# Análisis de gw2-agents-dashboard (referencia funcional)

Relevado el 2026-10-20 sobre `main`. El histórico **no se modifica**. Conclusiones registradas en DEC-008, LES-010 y LES-011.

## Inventario del histórico

13 pestañas: Resumen (pulso), Pre-backlog, Backlog, Desarrollo, Promociones, Sprints, Consultas, Salud, Estructura, Equipo, Historial, Lo que arreglé, Alertas & Comms.
~26 módulos JS (`parser.js` 107 KB, `renderer.js` 73 KB) y 10 archivos `data/*.json` generados por scripts locales `_eco\*.py` (último: 2026-10-09 09:29 UTC).

## Pestaña por pestaña

| Pestaña histórica | Veredicto | En el Dashboard Factory |
|---|---|---|
| Resumen / pulso | Conserva valor (idea), datos de scripts locales | **Hoy**, calculado en el navegador |
| Pre-backlog (ideas del PO) | Multiagente | Desaparece: PRODUCT es una capacidad interna |
| Backlog | Conserva valor | **Trabajo** (backlog de ai-memory) |
| Desarrollo (clones, ramas, worktrees) | Mayormente multiagente | **Entornos** en Hoy (commits, DEV vs PROD) |
| Promociones | Conserva valor parcial | La decisión es de Pablo: aparece como "Necesita tu decisión" y "DEV adelante de PROD", nunca como propuesta |
| Sprints (asignados por el Arquitecto) | Multiagente | **Roadmap** por fases |
| Consultas (filtradas por el Arquitecto) | Valor, filtro multiagente | **Necesita tu decisión** (cola única) |
| Salud (archivos, ramas, crons, tokens) | Idea con valor, métricas multiagente | **Salud**: coherencia memoria/realidad, frescura, fuentes |
| Estructura / ORG_MAP / frontera de producción | Frontera: valor; organigrama: multiagente | Protección de PROD medida en vivo |
| Equipo (comms, estado por agente) | Multiagente | Desaparece |
| Historial (timeline, filtro por agente) | Timeline: valor; filtro: multiagente | **Actividad** 24h/7d/30d |
| Lo que arreglé | Conserva valor | **Lecciones** (LES) |
| Alertas & Comms | Alertas: valor; comms: multiagente | **Riesgos** + **Salud** |

## Principios rescatados

- "Un dato que no se pudo leer aparece como — con el motivo, nunca como 0."
- Separar lo **medido** de lo **declarado**.
- Un panel desplegado y vacío es indistinguible de uno sin datos: los errores se muestran.
- El CDN de raw puede servir versiones viejas por rama → el panel lee por SHA.

## Lo que no existía

Tarea actual con motivo, etapa del workflow, tiempo en ejecución, cola única de decisión humana, registro de riesgos, resumen hoy/semana, detección de inconsistencias de la memoria, referencias cruzadas entre entradas.
