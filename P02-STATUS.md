# Punto 02 — pruebas reproducibles e integración continua

Revisión: 30/10/2026. Requisito: punto 02 de `Robotito_82_pedidos_completos-1.docx`.

Se conservan las regresiones históricas, Playwright, los generadores, las semillas 17/42/99 y las pruebas después de cada incremento. El criterio es ejecutar escenarios positivos, negativos, fallos, persistencia, interrupciones, entornos adversos y tamaños de pantalla; no afirmar ausencia universal de errores.

## Integridad de las pruebas generativas

- Una propiedad mal escrita en `ROBOTITO_REPLAY_PROPERTY` ya no devuelve éxito con cero casos ejecutados. También se rechazan índices vacíos, fraccionarios o sin propiedad.
- Un resultado `false`, un error del generador y una excepción del reductor conservan el fallo original y sus datos de reproducción. El reductor consume como máximo 64 candidatos.
- Las matrices rechazan filas inválidas, valores no reproducibles y límites de generación inválidos. Distinguen ejecuciones, filas distintas y duplicados.
- Los informes JSON de propiedades guardan semilla, escala, revisión, resultado, cobertura efectivamente ejecutada y contraejemplo. GitHub Actions los conserva durante 14 días también si falla una prueba.
- `npm run test:p02` verifica 47 contratos de integridad, incluida la ejecución del comando real con una propiedad inexistente. Las tres semillas de propiedades pasan: 4.300 casos generados por semilla. No se suman como formulaciones únicas.

## Matriz real de aplicación y fallos

- `test:browser:matrix` selecciona Chromium, Firefox o WebKit con `ROBOTITO_BROWSER_ENGINE` y mantiene las tres semillas 17/42/99. Cruza seis tamaños, seis idiomas, avatares, emociones, modos de audio, desconexión y suspensión.
- La matriz de voz ahora aplica el idioma y el viewport y llama al manejador real `speakResponse`; el motor de síntesis es simulado. Los informes distinguen esa simulación de la ejecución real del navegador.
- El ejecutor guarda JSON con revisión, motor, semilla, fase, fila fallida y cobertura verificada. Ante fallos guarda también captura y traza cuando el navegador responde. Usa un puerto local libre, espera explícita y un límite de duración; un navegador bloqueado no puede dejar un resultado verde.
- El mismo ejecutor prueba diálogo P01, interfaz P05 y respaldo/restauración P07 en los tres motores. La CI conserva los artefactos 14 días y ejecuta la matriz también diariamente.
- Se separó la integración de modelos externos de la regresión determinista para que una caída de CDN no impida ejecutarla.

## Fallo real descubierto y corregido

Una excepción síncrona `DataCloneError` al guardar metadatos podía confirmar un blob ya preparado. `putRecordWithBlob` ahora aborta toda la transacción y espera su finalización antes de devolver el error. La regresión comprueba inserción, actualización, conservación de bytes anteriores, borrado y recuperación de la cola tras una operación fallida (15 comprobaciones).

## Evidencia local y límites

La batería completa `npm run test:ci` pasó en Chromium. Las pruebas nuevas verificaron:

- 47 contratos de integridad del generador y reproducción (incluido el mismo resultado con semilla predeterminada o explícita).
- Por semilla: 108 estados de UI y 441 objetivos de pares/triples; fallos concurrentes con 61 objetivos; voz con 135 objetivos. Son matrices finitas, no todas las combinaciones posibles.
- Dos pestañas con 240 escrituras simultáneas, tres propietarios y nueve comprobaciones de aislamiento/borrado.
- 3.600 turnos con contexto máximo de 20 entradas y 2.500 recuerdos reales de IndexedDB que sobreviven a recarga y se eliminan correctamente.
- Nueve muestras de preparación de la aplicación en tres tamaños; p50/p95/máximo se conservan en JSON como tiempos de CI, sin extrapolarlos a teléfonos físicos.
- El propio ejecutor fue probado con un fallo intencional y un plazo vencido; ambos conservan estado de error y cierran el servidor.

**Las doce horas son tiempo simulado en una prueba acelerada**, no doce horas de navegador abierto. La red, la visibilidad y parte de las capacidades de voz/permisos se simulan. No hay micrófonos, cámaras, personas reales ni certificación de precisión acústica en estas cifras. Firefox/WebKit requieren aprobación de la CI del HEAD antes de integrar esta ampliación.

Las seis áreas de pendientes permanentes permanecen en `PENDIENTES-PERMANENTES.md`; «Chocar los cinco» se conserva y forma parte de las regresiones.
