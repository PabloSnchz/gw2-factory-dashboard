# 🐈‍⬛ Gato Negro Factory — Centro de Decisiones

El lugar donde Pablo y la Factory trabajan juntos. En menos de 60 segundos responde **qué necesita tu decisión, qué está haciendo la Factory y por qué, qué hizo hoy y esta semana, y qué está bloqueado**. Y permite responder desde el mismo lugar.

**Panel:** https://pablosnchz.github.io/gw2-factory-dashboard/

```
Factory trabaja → el panel propone → Pablo responde → la Factory continúa
```

## Qué muestra

| Vista | Pregunta que responde |
|---|---|
| **Hoy** | ¿Tengo que hacer algo? Una frase de resumen, una tarjeta por pendiente (por qué importa, qué recomienda Shiruvana, botones para responder), lo que ya respondiste, qué hace la Factory y por qué, la última sesión y lo que decidió la Factory, qué debería preocuparme, qué pasó hoy y esta semana, cómo están DEV y PROD |
| **Trabajo** | Etapas del plan y tareas: en curso, bloqueadas, listas, hechas |
| **Conocimiento** | Decisiones, lecciones y funcionalidades, con detalle y "citado por" |
| **Riesgos** | Críticos, altos, otros abiertos y mitigados |
| **Actividad** | Commits y registros de memoria por día (24 h / 7 d / 30 d) |
| **Salud** | Diferencias entre lo que la memoria dice y lo que se mide en GitHub, datos desactualizados, fuentes |

**Marca y voz (DEC-024).** La marca es Gato Negro Factory: el gato de la cabecera no cambia. Cuando Shiruvana, la operadora de la Factory, recomienda, advierte, decide o resume, el mensaje lleva su avatar y el rótulo "Shiruvana …". Los datos del sistema nunca lo llevan, y hay un solo avatar por sección.

## Responder una decisión

1. En **Hoy**, cada pedido tiene sus botones: *Aprobar (recomendada)*, *Rechazar*, *Posponer 7 días*, *Ya lo hice*…
2. El botón abre GitHub con la respuesta lista. Podés agregar un comentario y tocás **Submit new issue**.
3. Un workflow de `gw2-factory-dev` la guarda en `ai-memory/responses/`, comenta y cierra el issue. Al volver al panel, el pedido pasa a **Ya respondiste**.
4. Si algo falla, el panel lo dice ("no se pudo registrar") y enlaza el motivo.

Sin tokens ni secretos en el navegador: GitHub te identifica a vos. Detalle en [docs/DECISIONS.md](docs/DECISIONS.md).

## Cómo funciona

- Página estática, JavaScript sin dependencias ni build.
- Lee `ai-memory/` de [gw2-factory-dev](https://github.com/PabloSnchz/gw2-factory-dev/tree/main/ai-memory) **fijado al SHA del último commit** (snapshot consistente).
- Mide en GitHub: commits, protección de producción, diferencia DEV/PROD y respuestas del canal sin registrar. **6 llamadas a la API por lectura**, con caché de 10 minutos.
- **Sin backend y sin scripts locales**: todo se calcula en el navegador.
- Un dato que no se pudo leer aparece como **—** con el motivo, nunca como 0.
- Visual: [Gato Design System](gds/GDS_FOUNDATION.md) 1.1.0. Contraste WCAG 2.1 AA calculado, estados con ícono y texto, navegación por teclado.

## Documentación

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — capas, fuentes, presupuesto de API, accesibilidad.
- [docs/DECISIONS.md](docs/DECISIONS.md) — pedidos, respuestas y canal de respuesta (contrato v3).
- [docs/DATA-CONTRACT.md](docs/DATA-CONTRACT.md) — formato de ai-memory que el panel consume.
- [gds/GDS_FOUNDATION.md](gds/GDS_FOUNDATION.md) — el sistema de diseño.
- [docs/ANALISIS-HISTORICO.md](docs/ANALISIS-HISTORICO.md) — qué se conservó, qué se eliminó y qué se creó respecto de `gw2-agents-dashboard`.
- [CHANGELOG.md](CHANGELOG.md)

Decisiones oficiales en la memoria de la Factory: DEC-008 (panel nuevo), DEC-009 (contrato de datos), DEC-010 (GDS), DEC-011 (pedidos y respuestas), DEC-012 (canal), DEC-013 (Centro de Decisiones), DEC-024 (marca y voz de Shiruvana).

## Desarrollo

```bash
node --test tests/*.test.mjs     # Node 20+; sin npm install
```

Los tests usan la memoria real (`tests/fixtures/ai-memory/`) y simulan GitHub: cuota agotada, canal con errores, contraste, reglas del GDS, accesibilidad y textos dorados compartidos con el workflow de respuestas.

Para probar localmente: servir la carpeta con cualquier servidor estático (`python3 -m http.server`) y abrir `http://localhost:8000`.

## Publicación

GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `/ (root)`.

Si un cambio no entra en un solo commit, publicarlo en orden de dependencias (GDS y estilos → modelo → vistas → `app.js` / `index.html`) para que cada commit deje el sitio funcionando (LES-017).
