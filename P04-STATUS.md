# Punto 04 — Escucha, voz y rostro: captación de calidad

Revisión: 5 de noviembre de 2026. Requisito: punto 04 de `Robotito_82_pedidos_completos-1.docx`.

El punto 4 corresponde a **captación y calidad de voz/rostro**. La internacionalización completa corresponde al punto 5 y los estilos de voz al 6. El nombre histórico `test:p04` incluye pruebas compartidas de esas áreas; no modifica la numeración original. El balance anterior se conserva en [P04-LANGUAGE-VOICE-HISTORY.md](P04-LANGUAGE-VOICE-HISTORY.md).

## Cambios de comportamiento

- Los resultados finales nativos se deduplican por índice de la sesión, no por el contenido de sus palabras. Una retransmisión vieja no repite una acción; dos fragmentos independientes conservan repeticiones legítimas como «I had had enough». «Em» en portugués no se elimina como ruido.
- El ASR local conserva las repeticiones entre palabras y entre segmentos de audio distintos. Los cambios de idioma, pausa y detención invalidan inferencias pendientes. Un error al cargar ambos modelos permite reintentar; al detener se desconectan fuente, procesador y ganancia y se cierra su contexto de audio.
- El botón **Detener cámara y micrófono** invalida la sesión, cancela transcripciones pendientes, cierra pistas y análisis, cancela muestras voluntarias y descarta identidades de voz/rostro. Un permiso concedido tarde se cierra sin afectar a una sesión posterior.
- La pestaña oculta o una pista silenciada/deshabilitada pausa el procesamiento y borra evidencia previa. Una pista terminada cierra la captación y permite comenzar de nuevo. `pagehide` cierra los sentidos. Los temporizadores pendientes no pueden ejecutar órdenes ni reactivar una sesión nueva.
- La grabación de clase también se detiene al pausar/cerrar los sentidos. Sus pistas clonadas se cierran antes de esperar al guardado; se conservan los bytes ya grabados. Al regresar se puede seguir transcribiendo, pero iniciar otra grabación de audio de clase exige volver a activar Modo Clase.
- El reconocimiento facial necesita descriptores válidos, confianza de detección y consenso temporal de la misma persona. Rostros alternados, resultados inciertos, errores y muestras demasiado próximas no acumulan una identidad. Una cámara congelada no cuenta como un fotograma nuevo.
- Una inferencia lenta retira la identidad a los 2,5 segundos y su resultado ya no autoriza identidad; a los 10 segundos sin terminar se detienen los sentidos para permitir un reintento explícito. Los resultados de sesiones/intervalos anteriores y los gestos de manos anteriores se descartan.
- El registro de rostro/voz comprueba continuamente la sesión y el consentimiento, incluso si se revoca y vuelve a marcar. No guarda muestras de una sesión reemplazada, de cámara congelada o de descriptor inválido. Una interrupción descarta lo no guardado.
- Los avisos nuevos están en los seis idiomas. «Chocar los cinco» permanece en controles, órdenes y animaciones.

Los umbrales de confianza y tiempo son **límites de ingeniería provisionales**, no una calibración biométrica ni una garantía de identificación correcta en equipos lentos.

## Evidencia reproducible

| Comando o prueba | Qué comprueba | Alcance |
| --- | --- | --- |
| `npm run test:p04` | ASR, transcripciones, síntesis, consentimiento, identidad y cancelación | Datos/modelos simulados y funciones de producción |
| `tests/p04-local-asr-lifecycle-regression.js` | Cierre de recursos, fallo de modelos, reintento y cargas antiguas | 19 comprobaciones; no ejecuta Whisper real |
| `tests/p04-capture-temporal-regression.js` | Congelación, errores, inferencias atrasadas/reemplazadas y watchdog | 15 comprobaciones con reloj/modelo controlados |
| `tests/p04-enrollment-capture-regression.js` | Captura válida y cancelada de muestras de rostro/voz | 26 comprobaciones sintéticas |
| `tests/p04-class-audio-cancellation-regression.js` | Cancelación durante permisos y cierre inmediato de pistas clonadas | 5 comprobaciones sintéticas |
| `npm run test:p04:browser` | Diagnóstico y aplicación completa; permisos, pausa, pérdidas, reintento, palabras y gestos viejos | Motor real; permisos, pistas, ASR y modelos simulados |
| `npm run test:ci` | Regresión histórica, tres semillas, contexto, audio, memoria, interfaz y nuevos casos | Chromium y lógica local; no hardware físico |
| Workflow `cross-browser.yml` | Matriz de UI, almacenamiento, diálogo y `test:p04:browser` | Firefox/WebKit reales en CI; multimedia simulada |

El ejecutor conserva informes por motor en `test-results/p04-capture-*.json`, errores y trazas cuando corresponde. GitHub Actions conserva evidencia durante 14 días. El resultado final de integración se consulta en el PR y en Actions del mismo commit; una suite añadida no se considera ejecutada solo por figurar en esta tabla.

## Verificación local final

`npm run test:ci` terminó correctamente en esta revisión: regresión de núcleo, tres semillas, 557 comprobaciones de navegador con cuatro tamaños de pantalla, nuevos casos de captación, matriz de estados, almacenamiento concurrente y resistencia acelerada. Los archivos de evidencia registran `physicalHardware: false`. Firefox/WebKit se verifican además en GitHub Actions del PR.

## Aceptación pendiente

**No cerrado al 100 %:** falta evidencia física y de precisión con personas y grabaciones autorizadas. [P04-HARDWARE-VALIDATION.md](P04-HARDWARE-VALIDATION.md) conserva H01–H16; [P04-REAL-HARDWARE-RUNNER.md](P04-REAL-HARDWARE-RUNNER.md) describe el ejecutor optativo. No se ha sustituido esa evidencia por resultados simulados.

1. Ejecutar permisos, desconexión, cámara lenta, ocultación, apagado de pantalla y recuperación en Android, iPhone y equipos de escritorio representativos.
2. Medir errores de palabras/transcripción y latencia por idioma, dispositivo, ruido y tipo de micrófono con muestras autorizadas e independientes de las de ajuste.
3. Medir falsos reconocimientos, rechazos y abstenciones con personas diferentes y parecidas, varias caras, movimiento e iluminación adversa; ajustar umbrales según resultados.
4. Verificar Whisper/modelos, síntesis y disponibilidad sin red en esos equipos. Los tests de ciclo de vida no certifican calidad de esos modelos.
5. Completar las auditorías separadas de traducción dinámica y voces de los puntos 5 y 6, conservando las seis áreas de [pendientes permanentes](PENDIENTES-PERMANENTES.md).
