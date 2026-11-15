# P18 — Planificador nativo de tareas

**Estado: implementación real propuesta en PR pendiente de CI y aceptación; no declarar finalizado sin validar.**

La pestaña Tareas incorpora un planificador local, independiente de la lectura anterior de Google Sheets, con materias y prioridades 1–5, duración estimada, tareas, bloques horarios por día, fecha límite opcional, edición de prioridad/duración/fecha, marcado completado/reapertura/borrado, felicitaciones y comandos explícitos de voz. La lista se ordena por fechas vencidas, hoy, mañana, próximos días y prioridades personales/materias; una tarea vencida permanece «ATRASADA — Superprioridad» hasta completarse. Si no se coloca fecha, se conserva la prioridad habitual y no se inventa un vencimiento semanal. La persistencia utiliza solo almacenamiento local. La importación desde Sheets se realiza exclusivamente mediante clic y copia, no reemplaza la hoja antigua.

**Pruebas:** `npm run test:p18` y `npm run test:p18:browser` integrados en la CI.

**Límites de aceptación:** no se ha recuperado la versión concreta de la hoja original ni comparado cada fórmula contra su último algoritmo; se emplea una política explícita y determinista aproximada. Faltan pruebas reales de móvil, permisos de almacenamiento, sincronización multi-dispositivo, revisión de accesibilidad e internacionalización integral de la interfaz. El recordatorio funciona solo con la app activa, sin notificaciones de fondo.
