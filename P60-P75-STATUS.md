# P60–P75 · Estudio autónomo, organización, repaso y lectura

## Implementación de software
- **60. Cronómetro y temporizador:** pantalla HH:MM:SS, iniciar/reanudar, pausar, reiniciar y progreso; sin solicitar permisos. Al ocultar página se pausa para evitar atribuir tiempo no observado.
- **61. Estimación adaptativa (incremento del 19/11):** registra minutos activos, pausas, unidades terminadas, tipo y dificultad; calcula **minutos activos totales / unidades totales**, sin promediar promedios de sesión. Distingue materias, muestra cantidad de registros y rango descriptivo cuando hay al menos dos observaciones; sin historial compatible usa un valor manual. El ejemplo 180 min / 3 ejercicios = 60 min por ejercicio queda probado. Todavía falta conexión plena con prioridades, calendario y ajustes por subconjuntos; el punto no tiene cierre formal.
- **62. Escenarios y ajustes manuales:** el usuario ingresa su propia duración prevista y puede comparar con la estimación histórica. No se finge un plan predictivo basado en IA.
- **63. Agenda de estudio:** sesiones con materia, fecha y duración; próximas sesiones y cancelación, guardadas en el ámbito del perfil.
- **64. Avisos escalonados:** al faltar 60 minutos, 15 minutos y al comenzar, mostrados **solo en la pestaña abierta y visible**, nunca se promete un aviso con el navegador cerrado. Se omiten durante concentración.
- **65–66. Planificador y lista tachables:** permanece el sistema nativo existente, separado de herramientas nuevas para no romper prioridades ni vencimientos.
- **67. Tarjetas de memoria:** creación y eliminación, mostrar respuestas, autoevaluación y repaso local espaciado a 1/3/7/14/30/60 días. **No mide retención clínica ni garantiza aprendizaje.**
- **68. Concentración:** silencia recordatorios espontáneos de tareas y rutina sin bloquear preguntas y respuestas solicitadas. No modifica notificaciones del sistema operativo ni restringe el navegador.
- **69. Resumen semanal:** siete barras con minutos diarios registrados, total semanal, resumen por materia y progreso de meta, sin inventar horas no registradas.
- **70. Metas y seguimiento:** meta semanal configurable; si no hay registro de avance por tres horas, un aviso discreto en el panel, sin interrupciones compulsivas.
- **72. Tipografía accesible:** fuente legible y tamaños relativos 90–150 % dentro del lector. Conserva el texto original y lector de pantalla.
- **73. Inicio de palabras resaltado:** renderiza solo con nodos de texto y `<strong>`, sin `innerHTML` de materiales externos; preservar íntegramente texto y puntuación es prueba de regresión.
- **74. Colores y guía de lectura:** tema claro, verde, azul y oscuro; guía visual lineal, sin alterar fotografías ni las opciones de otros módulos.
- **75. Esquema de apuntes:** convierte el primer renglón en tema y hasta ocho líneas siguientes en ramas. Es una estructura literal del material introducido, **no un mapa semántico generado por IA**.

Las sesiones, agenda, tarjetas, preferencias y borrador de lectura se almacenan en IndexedDB utilizando la clave por propietario de `ROBOTITO_MEMORY`; el modo visitante temporal respeta la semántica efímera existente.

## Verificaciones
- `npm run test:p60-p75`: cálculo de tiempo, validación de fechas y duraciones, semana, estimación manual/observada, tarjetas, renderización fiel de texto y estructura de apuntes.
- `npm run test:p60-p75:browser`: navegador real (Chromium en CI) con cronómetro, progreso, tarjetas, modo concentración, lectura y agenda.
- Ambos agregados a `test:ci`. Se mantienen las regresiones del resto de Robotito y «Chocar los cinco».

## Límites para aceptación final
- No hay avisos fiables al cerrar la pestaña ni sincronización remota: requerirían permisos, service workers/PWA y arquitectura adicional.
- Los datos locales pueden perderse al limpiar el navegador; los respaldos deben probarse.
- Estimaciones basadas en pocas sesiones pueden estar sesgadas; no deberían sustituir horarios elegidos por el usuario.
- Faltan pruebas físicas Android/iPhone, pruebas de accesibilidad de teclado y lector de pantalla, locales de seis idiomas, suspensión/reanudación y multicuentas.
- Los puntos 71, 76–82 y otras funciones de la hoja de ruta **no** se declaran completados por este módulo.
