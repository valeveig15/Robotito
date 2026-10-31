# Robotito — Punto 3: implementación y evidencia pendiente

Actualización: 31 de octubre de 2026. Requisito: punto 03 de `Robotito_82_pedidos_completos-1.docx`.

## Comportamiento implementado

- Detector de silencio, actividad vocal, música, ruido, impactos y candidatos de aplauso mediante características temporales y espectrales. Un golpe aislado no basta para aplaudir; bailar exige música sostenida y se detiene al perderla.
- Clasificación opcional YAMNet ejecutada localmente tras consentimiento. Risa, llanto, tos y estornudo se presentan como candidatos tentativos; no se deducen de intensidad ni de texto transcrito.
- Detección separada de las acciones del avatar; umbrales, competencia entre clases, enfriamiento, supresión por voz propia, Modo Clase, sueño, pestaña oculta y micrófono no disponible.
- Herramientas locales para grabaciones consentidas, anotaciones, separación de fuentes, hashes, confusión, latencia y diagnóstico de micrófono. Los informes no autoaprueban el modelo ni certifican hardware.
- «Chocar los cinco» permanece en voz, texto, botones y animaciones.

## Correcciones de esta revisión

1. Una inferencia inválida, rechazada o fuera de contrato corta el conjunto parcial de confirmaciones. Dos predicciones anteriores a un fallo ya no se suman a una sola posterior para autorizar un estornudo.
2. Una observación almacenada sigue impidiendo reacciones heurísticas incompatibles, pero no cuenta como otra confirmación. Se distingue la espera normal entre ventanas YAMNet de observaciones nuevas atrasadas, repetidas o mal etiquetadas.
3. Probabilidades, identificadores y marcas temporales se validan sin convertir cadenas o booleanos en confianza. Un retroceso del reloj no rejuvenece una predicción.
4. La carga del modelo vence a los 30 segundos y la inferencia a los 2,5 segundos, incluso si deja de llegar PCM. Se termina el Worker, se libera la evidencia, se informa el error y puede reintentarse mediante el control existente. Cancelación y desactivación limpian los temporizadores.
5. Las acciones descartan eventos con marcas inválidas, futuras o de más de un segundo. El baile conserva confirmaciones independientes aunque la interfaz consulte a intervalos menores de 35 ms.
6. Se eliminó el atajo de texto/ASR que decía «¡Salud!» por palabras como “achís” o “achoo”. La reacción queda exclusivamente detrás de la política acústica y su autorización; el texto sigue disponible para conversación normal.

## Verificación y reproducción

- `tests/audio-continuity-regression.js`: 40 comprobaciones nuevas de fallos, continuidad, observaciones almacenadas, tiempos, recuperación y limpieza. Forma parte de `test:audio`, ejecutado con semillas 17, 42 y 99.
- Se conservan cadencia (31), eventos acústicos (500 por semilla), adaptador/remuestreo (66) y todas las regresiones de corpus, privacidad, ventanas y evaluación.
- `npm run test:audio:reactions:browser` reproduce la aplicación en Chromium con micrófono sintético. Comprueba texto sin evidencia acústica, estado localizado de carga fallida, reintento, inferencia bloqueada, desactivación, aplauso atrasado, aplauso válido, supresión y estornudo no aprobado. La prueba nueva reprodujo el «¡Salud!» falso antes de corregirlo y pasó después.
- `npm run test:ci` pasó localmente el 31/10/2026: conserva la regresión completa de los puntos anteriores, incluidos 555 controles de navegador, cuatro tamaños y las matrices de tres semillas. GitHub Actions también ejecuta las matrices de Firefox/WebKit y una tarea separada con YAMNet/MediaPipe genuinos, PCM sintético, evaluación continua, grabación privada y diagnóstico. Consultar el resultado del HEAD de cada PR; configurar una prueba no equivale a haberla aprobado.

Las pruebas de lógica y el micrófono sintético no miden exactitud en sonidos humanos. La integración con YAMNet genuino comprueba su carga y procesamiento, no la corrección de etiquetas sobre personas reales.

## Qué impide declarar el punto completamente validado

`humanModelReactionsApproved` permanece desactivado en la aplicación. El inventario conserva `p03VerifiedComplete:false` y `automaticHumanReactionsApproved:false`. No existe en esta revisión evidencia independiente suficiente para aprobar sonrisas por risa, consuelo por llanto, reacciones a tos o «¡Salud!» automáticos.

Falta completar con evidencia auténtica:

1. Corpus autorizado con positivos, negativos y superposiciones; etiquetas revisadas independientemente, fuentes separadas de desarrollo/validación/prueba y diversidad de entornos/dispositivos.
2. Ejecutar `validate:audio`, `evaluate:audio` y `audit:audio:p03` sobre ese corpus y medir precisión, recuperación, confusiones, falsos avisos por hora y latencia. Cero errores en datos sintéticos no reemplaza esta medición.
3. Ensayos con micrófonos físicos representativos: permisos y revocación, silencio, voz propia, desconexión, suspensión y recuperación; usar `tools/audio-device-check.html` y el ensayo del avatar.
4. Revisar los resultados y documentar una aprobación de umbrales antes de activar reacciones humanas. No convertir etiquetas automáticas ni declaraciones de una herramienta en revisión humana.

Los seis bloques históricos se conservan en [PENDIENTES-PERMANENTES.md](PENDIENTES-PERMANENTES.md). La ingeniería comprobada y la validación externa pendiente se informan por separado.
