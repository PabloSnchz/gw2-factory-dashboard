# RIESGOS

Registro de riesgos de la Factory. Formato: ver DEC-009.
Severidad: CRÍTICO · ALTO · MEDIO · BAJO — Estado: ABIERTO · MITIGADO · CERRADO.
Los riesgos no se borran: se cambian de estado.

| ID | Severidad | Estado | Riesgo | Mitigación | Responsable | Ref |
|---|---|---|---|---|---|---|
| RSK-001 | ALTO | ABIERTO | La rama `main` de producción (`gw2-wallet-ligero`) no tiene protección: cualquier push con permisos de escritura llega a producción sin revisión. | Activar branch protection (exigir PR). El dashboard lo verifica en vivo en cada lectura. | Pablo | BL-010 |
| RSK-002 | ALTO | ABIERTO | DEV publicado en `pablosnchz.github.io` compartiría `localStorage` con producción (API keys, cuentas, settings). Ya ocurre con `gw2-wallet-agents` publicado. | Hosting con origen propio para DEV. | Pablo | DEC-005, BL-011 |
| RSK-003 | MEDIO | ABIERTO | GA4 de producción recibiría tráfico de DEV si se publica sin desacople. | Cargar GA solo en el host de producción + guard de repo en el workflow. | Factory | DEC-006, BL-002 |
| RSK-004 | MEDIO | MITIGADO | El panel de observación dependía de scripts locales en la PC de Pablo; dejaron de correr el 2026-10-09 y el panel mostraba datos viejos. | Dashboard Factory sin scripts locales: lee GitHub desde el navegador. | Factory | DEC-008, LES-011 |
| RSK-005 | MEDIO | MITIGADO | La cuota anónima de la API de GitHub (60 req/h por IP) puede dejar paneles incompletos. | 5 llamadas por lectura, caché de 10 min, contenido vía raw sin cuota, aviso explícito si falta un dato. | Factory | DEC-008 |
| RSK-006 | MEDIO | MITIGADO | Un cambio de formato en ai-memory puede romper el dashboard en silencio. | Contrato de datos (DEC-009), tests del parser y chequeo de salud que reporta líneas fuera de formato. | Factory | DEC-009 |
| RSK-007 | MEDIO | ABIERTO | La memoria declarada puede desincronizarse de la realidad (status.md sin actualizar mientras hay commits). | Chequeos medidos en el dashboard: antigüedad de status.md y commits posteriores a su última actualización. | Factory | LES-010 |
