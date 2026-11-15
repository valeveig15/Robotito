# P12 — Modo Clase: audio completo, silencio y reproducción

**Estado: auditoría iniciada; pendiente CI de la revisión y pruebas físicas.**

El Modo Clase existente inicia transcripción, utiliza `MediaRecorder` con fragmentos persistidos en IndexedDB, permite reproducir las grabaciones desde el panel y detener la captura. El silencio de salida se aplica al ingresar en Modo Clase.

## Integridad de esta revisión

- Una escritura de fragmento que falla queda registrada y bloquea la publicación de una grabación parcial como exitosa.
- Se exige secuencia completa y continua de los fragmentos antes de ensamblar el Blob final.
- Si falla el almacenamiento, los fragmentos recuperables no se borran intencionalmente; se indica que no pudo guardarse el audio.
- Regresión vinculada a `npm run test:p12-p14` y a CI.

## Pendientes para cierre completo

- Prueba de horas de grabación real en Android/iOS/escritorio; suspensión, batería, espacio agotado, permiso revocado, cierre del navegador, interrupciones y recuperación.
- Pruebas de reproducción móvil y códecs (AAC/Opus), sincronización temporal y silencio en todos los caminos de audio.
- Validar integridad de migraciones y eliminación definitiva de datos, y definir una recuperación visible de fragmentos después de un fallo.
- La interfaz puede interrumpirse al cerrarse el navegador. No se declara grabación con la aplicación cerrada.
