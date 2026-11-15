# P15 — Resúmenes por clase, tema y materia completa

**Estado: implementación incremental propuesta en PR #131; CI y aceptación real en curso.**

## Implementación
- Se conserva el resumen existente por sesión en `class-organizer.js`.
- El nuevo motor `class-summary-aggregate.js` reagrupa fragmentos de transcripciones y materiales por materia o por tema, con opciones breve/intermedia/detallada.
- La interfaz del panel Clases guardadas presenta ideas, conceptos recurrentes, dudas, ejercicios y referencias a la sesión o archivo de origen.
- Cada consulta vuelve a leer `state.classLines`, `state.academicMaterials` y sesiones para incorporar material recién subido o corregido; no se persiste una síntesis potencialmente obsoleta.
- No mezcla materias y evita afirmar que una cita académica sea automáticamente verdadera. No manda contenidos a servicios remotos ni altera la función «Chocar los cinco».
- Traducciones de interfaz para es/en/pt/fr/it/de añadidas al catálogo.

## Pruebas
`npm run test:p15` cubre varias sesiones, materia/tema, material recién agregado, referencias, ausencia de resultados y longitud; integrada en `npm test` y `npm run test:ci`.

## Alcance no certificado
Este motor es **extractivo**: selecciona evidencias, no sintetiza relaciones causales complejas ni comprueba la exactitud del material. Un resumen genuinamente generativo requiere un modelo local compatible y una evaluación humana de fidelidad, privacidad y contraste de fuentes. Faltan validación de navegador y aceptación manual en clases reales; el PR no debe fusionarse sin CI verde en el último HEAD.
