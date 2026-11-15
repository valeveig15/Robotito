# P21 — Países, capitales y autoridades dinámicas

**Estado: incremento verificable; aceptación total pendiente.**

Se integra `country-knowledge.js` al router del diálogo. Preguntas de capitales en ES/EN/PT/FR/IT/DE consultan REST Countries en tiempo de ejecución (caché de 24 horas), validan coincidencia exacta por nombres/traducciones, registran fecha y fuente y se abstienen si hay ambigüedad, no hay capital o el servicio no responde.

`presidents.js` ya consultaba Wikidata. Esta revisión elimina la afirmación categórica de presidencia vigente cuando solo existe una fuente colaborativa no corroborada, y evita recuperar por error el primer mandato histórico como presidente actual. Devuelve la procedencia y aclara la ausencia de confirmación oficial.

**Verificación:** `npm run test:p21` y `npm run test:p21:browser` incluyen idioma, ambigüedad, caída de fuentes, caché, etiquetas de procedencia y rutas del router. Integradas en CI; no publicar como terminado antes de verificar su ejecución.

**Falta para cierre total:** fuentes oficiales + secundarias independientes para jefatura de Estado y de Gobierno, reyes/primeros ministros, validación de mandatos y sus límites históricos, contextos políticos disputados, gobierno e historia con trazabilidad por periodo, cobertura de muchos países/territorios y dispositivos reales. La función actual NO certifica autoridades vigentes.
