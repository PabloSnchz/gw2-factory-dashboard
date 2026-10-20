# LES-010 — Un panel debe observar el trabajo, no a los trabajadores

- Fecha de registro: 2026-10-20
- Origen: análisis de gw2-agents-dashboard (DEC-008)

## Qué pasó

El dashboard histórico dedicaba la mayor parte de su superficie a la coordinación entre agentes: comunicaciones, bandejas, heartbeats, tokens por agente, worktrees y ramas de rescate. Cuando el modelo cambió a un único agente, casi todo eso dejó de tener significado. Lo que conservó valor fue lo que describía el **trabajo**: qué se hace, qué se decidió, qué está bloqueado, qué espera a Pablo y qué tan confiable es el dato.

## Lección

Las vistas atadas a la forma de la organización caducan cuando la organización cambia; las vistas atadas al trabajo y sus decisiones sobreviven. Un panel también debe confrontar lo **declarado** con lo **medido**: un estado escrito a mano que nadie contrasta termina mintiendo (el histórico decía "0 en producción" con la Armería ya promovida).

## Cómo aplicar

- Toda vista nueva del panel tiene que responder una pregunta de Pablo sobre el trabajo, no sobre el proceso interno.
- Cada dato declarado relevante debería tener un chequeo medido que lo contraste (RSK-007).
