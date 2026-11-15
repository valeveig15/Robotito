# P22 — Vídeos y materiales de estudio

**Estado: incremento funcional en PR; falta CI del último HEAD y pruebas físicas.**

Se conservan la importación de subtítulos/transcripciones y la captura de pestaña con autorización previa. El índice local `video-evidence.js` guarda evidencias diferenciadas: `provided-caption` = subtítulo pegado (nunca se presenta como escuchado), `heard` = transcripción automática del audio compartido, `seen` = predicción visual repetida con puntuación suficiente (no confirmación humana), `inferred` = conjetura etiquetada. Incluye video de origen, tema, materia, sesión, timestamp cuando está disponible, certeza y fecha. La URL y la materia se fijan cuando empieza la captura para que cambiar campos no atribuya el audio a otro vídeo. No descarga vídeos ni elude permisos.

Se añadió búsqueda desde la pestaña Clase, sin fallback a otras materias/temas. Persistencia local solo tras consentimiento de captura o importación; relectura, borrado por fuente y error al exceder límite. Los resultados se presentan por texto seguro y con enlaces de fuente validada.

**Pruebas:** `npm run test:p22` y `npm run test:p22:browser`, integradas en CI.

**Pendientes de aceptación total:** grabaciones largas reales, interrupciones/permiso retirado, navegador móvil, precisión de ASR y detección visual con iluminación adversa, saturación de almacenamiento, subtítulos parciales y fuentes cambiantes, validación por usuario de observaciones, búsqueda por transcripción completa en gran escala. No garantizar audiovisual perfecto ni etiquetar las predicciones de objetos como hechos.
