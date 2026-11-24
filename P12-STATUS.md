# P12 — Modo Clase: grabación, silencio y recuperación

Revisión: 23/11/2026, [PR #176](https://github.com/valeveig15/Robotito/pull/176). **Recorrido de software implementado y comprobado; duración prolongada y hardware físico pendientes.** Ver [P01-P12-AUDIT.md](P01-P12-AUDIT.md).

## Funcionalidad y correcciones

- Se conservan transcripción y organización materia → tema → sesión, fechas, reproducción y descarga. Modo Clase suspende respuestas, reacciones, reglas y reproducción conversacional; una transcripción no ejecuta órdenes.
- `class-audio-journal.js` guarda manifiesto de sesión y fragmentos en la misma base IndexedDB que memoria y respaldos. Comprueba propietario, sesión, secuencia y tamaños. Los fragmentos internos no se mezclan con el listado de recuerdos.
- Fragmento y avance de manifiesto se escriben atómicamente. El cierre espera el último evento del grabador y las escrituras pendientes, sin presuponer que 80 ms basten. Archivo final y eliminación de fragmentos forman una sola transacción: si falla, quedan los fragmentos confirmados para recuperación.
- El panel ofrece **Recuperar audio parcial**, **Descartar fragmentos** y actualización si otra pestaña sigue grabando. Una reserva renovable impide reclamar una grabación activa; propietario, token y versión evitan mezclar escritores o historiales.
- Corte de pista, error del grabador, cuota insuficiente o exceso de cola detienen la grabación y liberan inmediatamente sus pistas clonadas. Finalizar solo el grabador no cierra el micrófono compartido. Eventos tardíos no reintroducen fragmentos.
- Corrección del 24/11: la solicitud opcional de almacenamiento persistente no bloquea el comienzo de la grabación ni la cancelación mientras Firefox espera una respuesta al permiso. La protección frente a desalojo sigue dependiendo de la concesión del navegador; no se afirma que esté concedida.
- Los errores no se presentan como audio completo. Un archivo parcial conserva únicamente bytes confirmados y su fecha final corresponde al último fragmento guardado. Si falla la finalización, se informa que deben revisarse las grabaciones interrumpidas.
- Cambiar de historial retira reproductores/URLs inmediatamente. Borrado, restauración y respaldo incluyen manifiestos y fragmentos persistentes; recuperar no resucita un historial eliminado. Restauración bloqueada mientras grabador o recuperación estén ocupados.
- Grabaciones antiguas completas conservan bytes. Fragmentos antiguos sin manifiesto se preservan sin atribuir, con fecha original desconocida y estado parcial; nunca se asignan a la persona actual. Si exceden el límite, se conservan en origen para revisión posterior.

## Evidencia automatizada

`npm run test:p12:browser` ejecuta dos suites, incluidas en `test:ci` y `test:browser:extended`:

| Suite | Evidencia |
| --- | --- |
| `tests/p12-class-recovery-browser.js` | 20 comprobaciones: secuencia, propietario, recarga, reserva entre pestañas, fallo transaccional, respaldo, anonimato, eliminación y migración. |
| `tests/p12-class-capture-browser.js` | 11 comprobaciones: MediaRecorder real con señal generada, escritura sin conexión, recarga/reproducción, cuota fallida, prefijo parcial, eventos tardíos y liberación de pistas. |
| P04, P07, P10/P11 y P05 | Cancelación, privacidad de audios, backup/migración, silencio de clase, reproducción y seis idiomas. |

La señal proviene de AudioContext, sin micrófono físico ni voz humana. Los fallos de cuota son provocados; no equivalen a un corte eléctrico. Un motor de navegador no certifica el sistema operativo móvil correspondiente.

La migración de fragmentos antiguos con Blob se prueba en un perfil normal descartable, separado de cualquier perfil personal. Las grabaciones nuevas guardan ArrayBuffer en IndexedDB. El recorrido real de captura incluye una interacción de usuario antes de iniciar audio y volver a reproducirlo.

## Límites explícitos

- Máximo de 128 MiB por grabación y 8 MiB de fragmentos pendientes de escritura. Alcanzar un límite detiene y conserva la parte confirmada. No se promete grabación ilimitada ni horas independientes de códec, cuota, RAM y dispositivo.
- Solo se recuperan fragmentos confirmados; cerrar el proceso puede perder el fragmento sin escribir. Cerrar la página no mantiene captura. Ensayos de horas, bloqueo de pantalla y pérdida de energía requieren dispositivos físicos.
- Persistencia según P07: perfil confirmado o historial de visitante consentido; sesiones anónimas en RAM, descartadas al recargar. No se guarda en secreto una conversación anónima.
- Audio local sin red mientras la aplicación está cargada. La transcripción depende del motor ASR: si necesita red puede detenerse aunque continúe el archivo local. No se inventa texto faltante.
- Ensamblar requiere RAM y espacio adicional. El navegador puede desalojar almacenamiento; solicitar persistencia no garantiza su concesión. Una copia descargada protege ante pérdida del dispositivo.
