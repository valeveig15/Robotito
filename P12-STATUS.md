# P12 — Modo Clase: grabación íntegra, silencio y reproducción

**Estado: EN PROGRESO.** Existe un grabador local por fragmentos en IndexedDB, controles de reproducción/descarga, compatibilidad de lectura de archivos anteriores y un Modo Clase que intenta silenciar la voz propia durante la escucha.

## Corrección de integridad
Los errores de escritura de fragmentos no pueden confundirse con una grabación completa: la sesión registra fallos y la finalización no publica el audio como correctamente guardado. Los fragmentos residuales de una sesión fallida siguen sujetos a recuperación/limpieza y a cuotas del navegador.

## Prueba automatizada
`npm run test:p12-p14` reproduce una escritura fallida aun cuando otros fragmentos están disponibles y comprueba que no se guarde un audio truncado como completo. Se integra en `npm test` y `npm run test:ci`.

## Pendientes de aceptación
Pruebas físicas continuas en Android/iPhone/escritorio (micrófono, Bluetooth, video compartido, almacenamiento lleno, interrupciones, pérdida de permisos, cierre abrupto y codecs), recuperación o purga segura de fragmentos huérfanos, monitoreo de pérdida real de muestras, sincronización con transcripciones, silencio TTS en todas las rutas, políticas de reproducción y sesiones muy largas. No inferir cobertura de estas situaciones a partir de mocks.
