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

## Pedido 01 — COMPLETADO para los criterios de aceptación comprobables

**Base documental:** el pedido 01 de `Robotito_82_pedidos_completos-1.docx` pide un planificador central integrado en `semantic-planner.js`, `intent-engine.js` y `script.js` que diferencie preguntas, órdenes, emociones, negaciones, referencias y seguimiento en los seis idiomas, sin confundir conocimiento general con clases. La aceptación pide probar paráfrasis, ambigüedades, contradicciones y aclaraciones.

**Implementación integrada en `main`, en incrementos independientes y verificados:**
- [PR #19](https://github.com/valeveig15/Robotito/pull/19): negaciones dirigidas frente a citas/definiciones y autorización de fuentes. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40552815193).
- [PR #21](https://github.com/valeveig15/Robotito/pull/21): citas de terceros inertes, instrucciones secuenciadas, referencias horarias y foco que sobrevive a afirmaciones incidentales. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40586326340).
- [PR #22](https://github.com/valeveig15/Robotito/pull/22): cortesía, vocativos, familias morfológicas y 360 paráfrasis de definición; corrección de la ambigüedad entre «che» rioplatense e italiano. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40586939547).
- [PR #24](https://github.com/valeveig15/Robotito/pull/24): seguimientos reales por perfil («más breve», «más en profundidad», «¿Y en portugués?», «como para un examen», «¿y con un ejemplo?»), salida y control de fuentes sin compartir estado entre personas. La traducción puntual de una respuesta anterior usa exclusivamente un modelo **local**; sin ese modelo se explica la limitación, nunca se declara una traducción ficticia. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40592284565).
- [PR #25](https://github.com/valeveig15/Robotito/pull/25): «no hagas X, hacé Y» separa acciones positivas y negativas, resuelve números explícitos y pide precisión si falta el objeto; amplía nombres de idiomas. Añade 900 variantes reproducibles de seis idiomas y pruebas de navegador que impiden que una prohibición de leer apuntes termine consultando clases. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40593586665).

**Evidencia en el HEAD del PR #25:** 5.766 comprobaciones del planificador (incluidas 900 variantes de superficie de seis idiomas, 50 por combinación de idioma/intención y las 360 paráfrasis semánticas previas); 3.192 comprobaciones de composición; 555/555 regresiones de navegador y 4 tamaños responsive; escenarios de 108 estados de UI × 3 semillas y el resto de la CI de núcleo, audio, memoria, pruebas generativas y adversariales, sin fallos.

**Criterios de aceptación de P01:** implementados y probados con cobertura positiva y negativa para intenciones generales, fuentes, emoción conversacional existente, negaciones, variaciones textuales, referencias, continuaciones, correcciones y ambigüedades. Los casos no resueltos piden aclaración o exponen una limitación; los ejemplos son semilla para generar más casos, no una lista fija de frases.

**Alcance y límites explícitos:** la cifra de 999.999 preguntas y 50 variantes cada una es un objetivo arquitectónico de generalización, **no** un volumen de consultas arbitrarias probado ni una promesa de comprensión perfecta. La precisión del habla ASR/voz, los modelos locales disponibles, la validación en micrófonos/cámaras físicos y la ampliación continua del corpus pertenecen a los siguientes pedidos y a pruebas de campo. Los 900 casos son variaciones metamórficas; no se presentan engañosamente como 900 paráfrasis semánticas independientes. Cada nueva falla real debe añadirse a la regresión del núcleo sin reabrir el trabajo ya verificado de forma ficticia.

**Secuencia:** se puede auditar el pedido 02 a partir de este cierre de P01. El pedido 02 y los demás aún no están certificados ni han sido modificados por este cierre. «Chocar los cinco» permanece obligatorio según la decisión posterior de la creadora.

## Los 82 puntos en orden
- [x] **01.** Cerebro semántico y generalización de formulaciones — COMPLETADO según los criterios de aceptación comprobables; ver límites y evidencia anteriores
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
