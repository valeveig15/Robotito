# P10 — Órdenes temporales, reproducción y repetición

Revisión: 23/11/2026, [PR #176](https://github.com/valeveig15/Robotito/pull/176). **Software implementado en el alcance descrito; aceptación física pendiente.** Ver [P01-P12-AUDIT.md](P01-P12-AUDIT.md).

## Comportamiento comprobable

- El planificador central reconoce órdenes de reproducción de clases en español, inglés, portugués, francés, italiano y alemán. Conserva negaciones, citas, solicitud literal y autorización de fuentes; una mención incidental de una clase no reproduce audio.
- `class-playback.js` consulta únicamente grabaciones del historial activo, filtra fecha con `nlu-temporal.js` y materia/tema, y comprueba que exista un archivo. Una fecha imposible, un archivo ausente o varias coincidencias producen información o una solicitud de precisión.
- Una coincidencia inequívoca llama al reproductor real. El bloqueo de autoplay se informa; la confirmación depende de `audio.play()`. Durante la reproducción se suspenden reconocimiento y reacciones al propio audio; se reanudan solo si sigue vigente la sesión de captura.
- Se conservan repetición literal de respuestas, recuperación temporal de libros y seguimiento por propietario. Cambiar de historial detiene y retira el audio anterior. Modo Clase y pestaña oculta impiden la reproducción conversacional.
- Recordatorios relativos entre 1 segundo y 24 horas y repeticiones finitas de 2 a 12 veces. Las órdenes conversacionales son temporales en RAM; solo el guardado explícito en **Horarios** persiste por propietario.
- Avisos con Robotito visible y disponible, con margen de dos minutos antes de descartar avisos vencidos. Hasta tres avisos simultáneos se agrupan en una emisión; los demás esperan otro ciclo, sin consumirlos durante Modo Clase.
- Descripciones, estados y cancelación en seis idiomas, preservando literalmente nombres y mensajes del usuario.

## Evidencia y límites

- `npm run test:p10-p11`: reglas históricas, 29 comprobaciones de autorización/reproducción y 52 de administración, prioridad, ciclos y condiciones.
- `npm run test:p10-p11:browser`: panel, ámbito temporal/persistente, reproducción de un WAV generado, fecha, ambigüedad, falta de archivo, negación, bloqueo de autoplay, propietario, dos pestañas y silencio de clase.
- P04 conserva las regresiones de cancelación y aislamiento de captura/reproducción.

No hay alarmas del sistema ni ejecución con pestaña cerrada, proceso suspendido o dispositivo apagado. La coordinación de pestañas usa revisiones locales; no es sincronización entre dispositivos ni garantía de entrega exactamente una vez tras un fallo de energía. La gramática es acotada y las formulaciones ambiguas requieren precisión. Faltan órdenes habladas, cambios de hora/huso y reproducción en teléfonos y altavoces físicos. Las muestras generadas no demuestran precisión de ASR ni calidad acústica.
