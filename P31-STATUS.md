# P31 — Ojos, parpadeo, despertar y sueño

**Auditoría:** había pestañeo natural y ojos cerrados al dormir, pero una animación pendiente podía dispararse tras cambiar de estado, y un mensaje «buenas noches» diferido podía volver a dormir a Robotito después de «hola».

**Incremento:** cada parpadeo lleva una generación; al dormir, ocultar la página o activar ojos de corazón se cancelan las animaciones pendientes. Los temporizadores diferidos de noche llevan una revisión revocable por un nuevo despertar; la transición visual incluye `sleep-entering` y `waking`. En los cinco SVG aprobados, el método `blink` rechaza el sueño y nunca borra el parpadeo del avatar siguiente por un temporizador del anterior. Respeta `prefers-reduced-motion`.

**Regresión:** `npm run test:p30-p32:browser` y las pruebas anteriores P28, P04 y de captura; falta revisión visual en pantallas físicas con distintas tasas de refresco y un lector de pantalla.
