# Intercambio de decisiones — contrato v3

Decisión: DEC-011 (`gw2-factory-dev/ai-memory`). Código: `js/decisions.js`. Tests: `tests/decisions.test.mjs`.

```
Factory trabaja  → escribe un PEDIDO      ai-memory/requests/REQ-XXX-<slug>.md
Panel propone    → lo muestra en "Necesita tu decisión", con su recomendación
Pablo responde   → queda una RESPUESTA    ai-memory/responses/RESP-XXX.md
Factory continúa → procesa la respuesta, la marca PROCESADA y cierra el pedido
```

Todo vive en archivos de `ai-memory/`: si la conversación se pierde, el estado de cada decisión sigue en el repositorio.

## Pedido (`requests/REQ-XXX-<slug>.md`)

```markdown
# REQ-003 — <la pregunta, en lenguaje de Pablo>

- Estado: ABIERTA | CERRADA
- Tipo: decisión | acción
- Fecha: AAAA-MM-DD
- Prioridad: CRÍTICO | ALTO | MEDIO | BAJO
- Relacionado: DEC-005, BL-003, RSK-002
- Verificación: prod_protegida            (opcional, solo acciones medibles)
- Cerrado: AAAA-MM-DD · RESP-004           (lo agrega la Factory al cerrar)

## Qué pasó
## Por qué importa
## Opciones            (decisión con alternativas: "- A — texto", 2 o más; sin opciones = aprobar o rechazar)
## Cómo hacerlo        (obligatorio en acciones: pasos concretos)
## Recomendación       ("B — por qué" si hay opciones)
```

Reglas:

- **Lenguaje**: el título es la pregunta. "Qué pasó / Por qué importa / Recomendación" se escriben para Pablo, sin depender de IDs internos. Los IDs van en `Relacionado`.
- **Relacionado** dice qué cubre el pedido: mientras el pedido no esté cerrado, esos ítems (DEC PROPUESTA, backlog bloqueado, líneas de "Esperando a Pablo") no aparecen sueltos en la cola del panel.
- **Contrato v3**: toda DEC en estado PROPUESTA debe estar cubierta por un pedido no cerrado. Si no, el panel lo marca en Salud.
- **Verificación**: si una acción se puede medir, el panel la da por hecha sin que Pablo responda. Verificaciones disponibles:

| Clave | Se cumple cuando |
|---|---|
| `prod_protegida` | La rama `main` de gw2-wallet-ligero tiene protección (medido en GitHub en cada lectura) |

## Respuesta (`responses/RESP-XXX.md`)

```markdown
# RESP-004 — Respuesta a REQ-003

- Estado: PENDIENTE | PROCESADA
- Fecha: AAAA-MM-DDTHH:MMZ
- Solicitud: REQ-003
- Respuesta: APPROVED | REJECTED | POSTPONED | DONE
- Opción: B | —
- Hasta: AAAA-MM-DD                (solo POSTPONED)
- Issue: <url>                     (cuando llega por el canal automático, MC-4)
- Autor: <usuario>

## Comentario
## Efecto              (lo agrega la Factory al procesarla)
```

- Códigos canónicos en inglés (los pidió Pablo); se aceptan también `APROBADA`, `RECHAZADA`, `POSPUESTA`, `HECHA`.
- `APPROVED` sin opción en un pedido con opciones = aprobar la recomendación.
- La respuesta vigente es la de fecha más reciente. Una respuesta mal formada no cuenta (el panel la muestra en Salud).
- `responses/README.md` explica cómo responder a mano. No se interpreta como respuesta: solo cuentan archivos `RESP-XXX*.md`.

Generar una respuesta desde código: `buildResponseMarkdown({ id, solicitud, respuesta, opcion, hasta, fecha, comentario, issue, autor })`. Los metadatos se limpian de saltos de línea (no se puede inyectar `Estado: PROCESADA`).

## Ciclo de vida

| Estado del pedido | Cuándo | Turno de | En la cola de Pablo |
|---|---|---|---|
| `open` — Esperando tu respuesta | ABIERTA, sin respuesta válida (o pospuesta y vencida) | Pablo | Sí |
| `postponed` — Pospuesto | Última respuesta POSTPONED con `Hasta` futuro | Nadie hasta la fecha | No (tampoco lo que cubre) |
| `answered` — Respondido | Última respuesta APPROVED / REJECTED / DONE | Factory | No |
| `measured` — Hecho (verificado) | Acción con verificación cumplida | Factory (cerrar) | No |
| `closed` — Cerrado | `Estado: CERRADA` | — | No |

## Protocolo de la Factory ("Factory continúa")

Al iniciar cada sesión, después de leer `status.md`, `backlog.md` y `memory-index.md`:

1. Listar `responses/` con `Estado: PENDIENTE`.
2. Por cada una, en orden de fecha:
   - **APPROVED**: ejecutar la opción elegida (o la recomendada). Actualizar la DEC relacionada a ACEPTADA y el backlog.
   - **REJECTED**: no ejecutar. Registrar el rechazo en la DEC/backlog; si hace falta, abrir un pedido nuevo con otra propuesta.
   - **DONE**: verificar lo que se pueda verificar y cerrar los ítems relacionados.
   - **POSTPONED**: no hacer nada hasta `Hasta`; el pedido vuelve solo a la cola cuando vence.
3. Marcar la respuesta `Estado: PROCESADA` y agregar `## Efecto` (qué se hizo y dónde quedó registrado).
4. Cerrar el pedido (`Estado: CERRADA`, `- Cerrado: fecha · RESP-XXX`), salvo POSTPONED.
5. Pedidos en estado `measured`: cerrarlos citando la verificación.
6. Commit: `docs(ai-memory): procesar RESP-XXX`.

## Chequeos de salud

| Chequeo | Nivel | Significa |
|---|---|---|
| `req:invalid` / `resp:invalid` | Atención | Archivo fuera de formato (se explica cada problema) |
| `req:waiting` | Atención | Pedido abierto hace más de 7 días |
| `resp:unprocessed` | Atención | Respuesta de Pablo sin procesar hace más de 48 h |
| `req:notclosed` | Atención | Respuesta procesada pero el pedido sigue ABIERTO |
| `resp:orphan` / `resp:option` | Atención | Responde a un pedido u opción que no existe |
| `dec:noreq` | Atención | DEC PROPUESTA sin pedido (solo cuando ya hay pedidos) |
| `req:due` | Info | Venció un plazo pospuesto: vuelve a la cola |
| `req:measured` | Info | Acción verificada: la Factory debe cerrar el pedido |
| `decisions:v3` | Info | Todavía no hay pedidos (memoria en contrato v2) |

Umbrales en `js/config.js` (`requestWaitDays`, `responseUnprocessedHours`).

## Costo

Cero llamadas extra a la API de GitHub: el loader ya lee todos los `.md` de `ai-memory/` desde el árbol del commit. Limitación conocida: sin API (cuota agotada) el loader solo sigue los links del índice, así que los pedidos no se leen hasta la próxima lectura con API; el panel ya avisa que la lectura es parcial (`api:errors`).
