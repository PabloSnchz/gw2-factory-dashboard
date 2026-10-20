# 🐈‍⬛ Gato Negro Factory — Dashboard

Centro de observación de la Factory: en menos de 60 segundos responde **qué está haciendo, por qué, qué hizo hoy y esta semana, qué está bloqueado y qué necesita una decisión humana**.

**Panel:** https://pablosnchz.github.io/gw2-factory-dashboard/

## Qué muestra

| Vista | Pregunta que responde |
|---|---|
| **Hoy** | ¿Qué está haciendo la Factory y por qué? ¿En qué etapa, hace cuánto, qué sigue? ¿Qué necesita mi decisión? ¿Qué debería preocuparme? ¿Qué pasó hoy y esta semana? ¿Cómo están DEV y PROD? |
| **Trabajo** | Roadmap por fases y backlog READY / IN_PROGRESS / BLOCKED / DONE |
| **Conocimiento** | Decisiones, lecciones y funcionalidades, con detalle y "citado por" |
| **Riesgos** | Críticos, altos, otros abiertos y mitigados |
| **Actividad** | Commits y registros de memoria por día (24h / 7d / 30d) |
| **Salud** | Inconsistencias entre memoria y realidad, datos desactualizados, fuentes |

## Cómo funciona

- Página estática, JavaScript sin dependencias ni build.
- Lee `ai-memory/` de [gw2-factory-dev](https://github.com/PabloSnchz/gw2-factory-dev/tree/main/ai-memory) **fijado al SHA del último commit** (snapshot consistente).
- Mide en GitHub: commits, protección de producción y diferencia DEV/PROD. 5 llamadas a la API por lectura, con caché de 10 minutos.
- **Sin backend y sin scripts locales**: todo se calcula en el navegador.
- Un dato que no se pudo leer aparece como **—** con el motivo, nunca como 0.

## Documentación

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — capas, fuentes, presupuesto de API, decisiones de diseño.
- [docs/DATA-CONTRACT.md](docs/DATA-CONTRACT.md) — formato de ai-memory que el panel consume.
- [docs/ANALISIS-HISTORICO.md](docs/ANALISIS-HISTORICO.md) — qué se conservó, qué se eliminó y qué se creó respecto de `gw2-agents-dashboard`.
- [CHANGELOG.md](CHANGELOG.md)

Decisiones oficiales en la memoria de la Factory: DEC-008 (dashboard nuevo) y DEC-009 (contrato de datos).

## Desarrollo

```bash
node --test tests/*.test.mjs     # Node 20+; sin npm install
```

Los tests usan la memoria real (`tests/fixtures/ai-memory/`) y simulan GitHub, incluido el caso de cuota de API agotada.

Para probar localmente: servir la carpeta con cualquier servidor estático (`python3 -m http.server`) y abrir `http://localhost:8000`.

## Publicación

GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `/ (root)`.
