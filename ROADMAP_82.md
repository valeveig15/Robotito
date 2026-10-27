# Robotito — ejecución secuencial de los 82 pedidos

Fuente: `Robotito_82_pedidos_completos-1.docx`, versión del 27/10/2026. Este registro es operativo, no reemplaza el documento de aceptación.

## Condiciones obligatorias
- Seguir orden 01 → 82. **No pasar al siguiente mientras el actual no esté completamente comprobado**; no confundir un incremento integrado con un pedido completo.
- Para cada punto: inspeccionar lo existente, identificar faltantes, implementar incrementos en la aplicación principal, añadir pruebas positivas/negativas, verificar integración de módulos y datos, abrir PR y correr CI en el HEAD; fusionar solo en verde.
- Probar navegador y dispositivos cuando sea posible; las pruebas sintéticas y emulación no garantizan funcionamiento perfecto en cámaras, micrófonos o móviles físicos. Dejar explícito qué no pudo validarse.
- Preservar archivos, registros locales, avatares, idiomas, permisos y funcionalidades verificadas. Evitar duplicar motores.
- Estado **POR AUDITAR** no significa que la funcionalidad no existe. Solo declara que aún no se verificó su cumplimiento completo en esta secuencia.

## Prioridad correctiva de la creadora
La orden posterior de la creadora prevalece sobre el texto antiguo del punto 30: **«Chocar los cinco» NO debe eliminarse**; se conserva el control, la animación en cada avatar y el comando conversacional. «Abrazar» sí sigue retirado como acción especial. Referencia: [PR #18](https://github.com/valeveig15/Robotito/pull/18).

## Pedido activo 01 — EN PROGRESO
**Incrementos integrados y verificados** (no implican comprensión ilimitada):
- [PR #19](https://github.com/valeveig15/Robotito/pull/19): alcance de las negaciones de órdenes, citas y restricción explícita de apuntes. [CI completa aprobada](https://github.com/valeveig15/Robotito/actions/runs/40552815193).
- [PR #21](https://github.com/valeveig15/Robotito/pull/21): órdenes y preguntas citadas sin ejecución accidental, secuencias con negación y autocorrección, foco contextual protegido de comentarios incidentales y horarios de seguimiento. [CI completa aprobada](https://github.com/valeveig15/Robotito/actions/runs/40586326340).
- [PR #22](https://github.com/valeveig15/Robotito/pull/22): generalización del vocativo/cortesía, condicionales y **matriz permanente de 360 paráfrasis** sobre tres conceptos; preserva el italiano «Che cos'è...». [CI completa aprobada](https://github.com/valeveig15/Robotito/actions/runs/40586939547).

**Estado: EN PROGRESO — NO CERRADO.** La batería automática de Node, pruebas generativas y Chromium pasó para estos tres incrementos, pero no demuestra comprensión de millones de solicitudes ni ausencia de errores en todos los idiomas, micrófonos o dispositivos. No afirmar "a la perfección" basándose solo en CI.

**Faltantes observables para cerrar el pedido 01:** resolver solicitudes elípticas como «Explicalo más breve» y «¿Y en portugués?» en la **ruta real de respuestas**, no solo clasificarlas; completar niveles de profundidad/examen, ambigüedad, referencias temporales y de personas, negaciones contrapuestas en solicitudes combinadas y validación de que la fuente consultada/las respuestas sean correctas. Ampliar las pruebas adversariales a seis idiomas, con retroalimentación de errores de usuario reales; medir tasas de acierto por categoría y verificar que ninguna mejora active memoria, clase, cámara, voz o gestos indebidamente. Revisar el comportamiento con hardware y permisos reales. No iniciar el pedido 02 hasta cubrir y validar esos faltantes.

Otros avances anteriores ya integrados, sin cerrar la auditoría secuencial: audio [PR #15](https://github.com/valeveig15/Robotito/pull/15) y restauración de gestos [PR #18](https://github.com/valeveig15/Robotito/pull/18).

## Los 82 puntos en orden
- [ ] **01.** Cerebro semántico y millones de formulaciones posibles — EN PROGRESO
- [ ] **02.** Pruebas automáticas generativas, combinatorias y de navegador — POR AUDITAR
- [ ] **03.** Clasificación de sonidos y reacciones naturales — POR AUDITAR
- [ ] **04.** Escucha, voz y rostro: captación de calidad — POR AUDITAR
- [ ] **05.** Internacionalización completa de interfaz y conversación — POR AUDITAR
- [ ] **06.** Voces nuevas, estilos y eliminación de «Gravedad» — POR AUDITAR
- [ ] **07.** Memoria contextual, fechas y datos durables — POR AUDITAR
- [ ] **08.** Identificación rigurosa de personas registradas — POR AUDITAR
- [ ] **09.** Memoria persistente y relación afectiva con visitantes aún no registrados — POR AUDITAR
- [ ] **10.** Órdenes temporales, reproducción y repetición — POR AUDITAR
- [ ] **11.** Reglas personalizadas de tipo «si/cuando X, hacé Y» — POR AUDITAR
- [ ] **12.** Modo Clase: audio completo, silencio y reproducción — POR AUDITAR
- [ ] **13.** Diferenciación de hablantes y correcciones de transcripción — POR AUDITAR
- [ ] **14.** Apuntes propios prioritarios y respuestas de clases justificadas — POR AUDITAR
- [ ] **15.** Resúmenes por clase, tema y materia completa — POR AUDITAR
- [ ] **16.** Compartir selectivamente memorias de clases — POR AUDITAR
- [ ] **17.** Grupos de estudio con chat y entregas conjuntas — POR AUDITAR
- [ ] **18.** Lista de prioridades y tareas propia de Robotito — POR AUDITAR
- [ ] **19.** Matemáticas y ecuaciones expresadas oralmente — POR AUDITAR
- [ ] **20.** Nomenclatura química como tutor — POR AUDITAR
- [ ] **21.** Países, capitales, autoridades e historia contextualizada — POR AUDITAR
- [ ] **22.** Vídeos y materiales de estudio — POR AUDITAR
- [ ] **23.** Visión de objetos y seguimiento visual — POR AUDITAR
- [ ] **24.** Mostrar objetos mediante una pequeña escena, no un cartel — POR AUDITAR
- [ ] **25.** Interfaz móvil sin superposiciones y chat escrito visible — POR AUDITAR
- [ ] **26.** Redimensionamiento horizontal y desplazamiento del panel derecho — POR AUDITAR
- [ ] **27.** Selección de avatar al inicio y catálogo de especies — POR AUDITAR
- [ ] **28.** Integración visual de los cinco avatares nuevos como referencia prioritaria — POR AUDITAR
- [ ] **29.** Especie, alimentación, camaleón y preguntas sobre sí mismo — POR AUDITAR
- [ ] **30.** Gestos, acciones y eliminación de abrazar/chocar los cinco — POR AUDITAR
- [ ] **31.** Ojos, parpadeo, despertar y transición al sueño — POR AUDITAR
- [ ] **32.** Emociones visuales coherentes y vínculo personal — POR AUDITAR
- [ ] **33.** Batería real, avisos e inactividad — POR AUDITAR
- [ ] **34.** Cumpleaños con tres franjas, música, torta y regalo — POR AUDITAR
- [ ] **35.** Libros sin Goodreads y metadatos verificables — POR AUDITAR
- [ ] **36.** Simulación de al menos 50 perfiles lectores — POR AUDITAR
- [ ] **37.** Lectura y traducción de descripciones de libros — POR AUDITAR
- [ ] **38.** Biblioteca personal con estanterías decoradas y escaneo — POR AUDITAR
- [ ] **39.** Clubes de lectura y valoraciones por aspectos — POR AUDITAR
- [ ] **40.** Sorteo de próxima lectura y broma de «libro abandonado» — POR AUDITAR
- [ ] **41.** Reproducción de música por tema, artista, banda o género — POR AUDITAR
- [ ] **42.** Escenario de clima adaptado a las condiciones — POR AUDITAR
- [ ] **43.** Panel de preguntas, feedback y contador honesto — POR AUDITAR
- [ ] **44.** Modo foto/captura de pantalla con reacción simpática — POR AUDITAR
- [ ] **45.** Analítica y reportes con consentimiento explícito — POR AUDITAR
- [ ] **46.** Integración final, rendimiento, privacidad y regresión — POR AUDITAR
- [ ] **47.** Origen uruguayo, creadora y biografía adaptable según la especie — POR AUDITAR
- [ ] **48.** Personalidad musical: rock and roll de Uruguay y Argentina — POR AUDITAR
- [ ] **49.** Acceso web confiable y aprendizaje verificable de información pública — POR AUDITAR
- [ ] **50.** Noticias del día: país del usuario, mundo y deduplicación semántica — POR AUDITAR
- [ ] **51.** Reloj visual exacto, hora hablada y cuenta regresiva hasta otra hora — POR AUDITAR
- [ ] **52.** Pruebas, cuestionarios y exámenes a partir de material cargado — POR AUDITAR
- [ ] **53.** Migración incremental de los cinco avatares HTML aprobados — POR AUDITAR
- [ ] **54.** Apuntes y punteos editables por clase, con historial — POR AUDITAR
- [ ] **55.** Relaciones razonadas entre clases y temas de una materia — POR AUDITAR
- [ ] **56.** Esquemas, gráficos y visualizaciones académicas pertinentes — POR AUDITAR
- [ ] **57.** Editor gráfico universal y uso didáctico del color — POR AUDITAR
- [ ] **58.** Tomar fotografías y leer el contenido en voz alta — POR AUDITAR
- [ ] **59.** Fotografía y limpieza de pizarrón/libro vinculada al instante de clase — POR AUDITAR
- [ ] **60.** Cronómetro, temporizador y progreso temporal visual — POR AUDITAR
- [ ] **61.** Estimación adaptativa del tiempo de estudio por rendimiento real — POR AUDITAR
- [ ] **62.** Ajustes manuales de tiempos previstos y escenarios de estudio — POR AUDITAR
- [ ] **63.** Agenda de sesiones de estudio con avisos a la hora elegida — POR AUDITAR
- [ ] **64.** Avisos escalonados antes de pruebas y entregas — POR AUDITAR
- [ ] **65.** Planificador nativo de materias, horarios y prioridades — POR AUDITAR
- [ ] **66.** Lista de pendientes tachable con satisfacción de progreso — POR AUDITAR
- [ ] **67.** Tarjetas de memoria editables y repaso organizado — POR AUDITAR
- [ ] **68.** Modo concentración que silencia notificaciones de Robotito — POR AUDITAR
- [ ] **69.** Gráficos semanales y seguimiento del tiempo por materia — POR AUDITAR
- [ ] **70.** Metas de estudio y recordatorios tras tres horas sin avanzar — POR AUDITAR
- [ ] **71.** Ejemplos adaptados a teoría y práctica — POR AUDITAR
- [ ] **72.** Tipografías accesibles y ajustes de lectura — POR AUDITAR
- [ ] **73.** Modo de lectura con inicio de palabras destacado — POR AUDITAR
- [ ] **74.** Temas de fondo suaves, modo oscuro y guía de lectura por línea — POR AUDITAR
- [ ] **75.** Mapas mentales automáticos de apuntes extensos — POR AUDITAR
- [ ] **76.** Activación de Modo Clase muy visible y accesible — POR AUDITAR
- [ ] **77.** Marcadores de colores durante clases grabadas — POR AUDITAR
- [ ] **78.** Sincronización bidireccional entre audio y transcripción — POR AUDITAR
- [ ] **79.** Minijuegos educativos interactivos basados en clases — POR AUDITAR
- [ ] **80.** Progreso visual por integrantes en equipos y grupos de estudio — POR AUDITAR
- [ ] **81.** Exámenes adaptativos por tema y carpeta de materia — POR AUDITAR
- [ ] **82.** Trajes y ambientaciones para festividades — POR AUDITAR

> Marcar un casillero solo al cerrar todas las obligaciones y pruebas documentadas de ese punto. Registrar los PR de los incrementos dentro de su sección y no cambiar un estado sin evidencia.
