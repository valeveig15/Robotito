# Punto 06 — Voces, estilos y muestras consentidas

Revisión: 8 de noviembre de 2026. Fuente: punto 06 de `Robotito_82_pedidos_completos-1.docx`: ampliar estilos según las capacidades del sistema, retirar el control visible «Gravedad», permitir probar/elegir voces y distinguir voces disponibles de variaciones de síntesis, con consentimiento y borrado de muestras.

**La implementación controlable queda auditada y ampliada. El cierre integral requiere todavía escuchar y comparar voces en dispositivos físicos.** La CI no demuestra diez timbres distintos, pronunciación perfecta ni compatibilidad acústica universal. Se conserva «Chocar los cinco» y no se inicia el punto 07.

Implementación y evidencia de integración: [PR #117](https://github.com/valeveig15/Robotito/pull/117). La pestaña Checks del PR identifica el commit y los resultados definitivos.

## Cambios de uso

- La lista contiene voces compatibles realmente enumeradas por el navegador, sin identificadores vacíos ni duplicados. Se actualiza cuando aparecen voces y también con **Actualizar voces**. Si no hay una voz del idioma seleccionado, se avisa y no se pronuncia con una de otro idioma.
- La selección explícita se conserva por idioma y tras recargar. Si esa voz desaparece, se usa una alternativa compatible sin borrar la preferencia; vuelve a seleccionarse si reaparece. Por defecto se prefiere una voz que el navegador declare local. Las voces no locales siguen identificadas y mantienen el aviso sobre procesamiento externo del texto.
- Los diez estilos —natural, grave, aguda, tierna, energética, graciosa, robótica, extraña, calmada y narradora— combinan tono, velocidad y volumen de la voz elegida. No se anuncian como diez actores ni como clones. La documentación y la interfaz explican que el motor del sistema puede limitar las diferencias.
- Se retira el deslizador visible antes llamado «Gravedad», y posteriormente «Tono». Se conserva el ajuste interno compatible con preferencias anteriores. **Restablecer estilo** recupera el estilo natural y sus ajustes iniciales. La velocidad sigue ajustable y su valor inicial coincide con el control.
- **Probar voz** usa un saludo en el idioma de la interfaz y funciona aunque las respuestas automáticas estén desactivadas. Una orden de respuesta en otro idioma no altera esa prueba. Modo Clase y un silencio solicitado permanecen silenciosos.
- **Detener voz**, cambiar voz/estilo/velocidad, ocultar la página o detener los sentidos cancelan la síntesis en curso. Estados accesibles informan preparación, reproducción, bloqueo y fallos. Eventos antiguos no terminan la voz nueva; límites de espera recuperan el control cuando falta un evento de inicio o fin. La escucha vuelve solamente si su sesión sigue vigente y sus permisos/condiciones lo permiten.

## Muestras personales

La sección voluntaria graba hasta tres segundos y permite **Detener y guardar** o **Descartar grabación**. No solicita micrófono sin consentimiento. Para otra persona exige también un nombre; cambiar identidad, nombre o consentimiento cancela una captura activa. Los controles y mensajes se traducen a los seis idiomas.

Una muestra válida guarda audio y metadatos en una transacción de IndexedDB, con consentimiento explícito también para voz propia. Solo se admiten blobs de audio entre 50 bytes y 16 MiB. El reproductor nativo permite revisar la grabación guardada, incluida su recuperación al recargar, sin reproducción automática ni conversión de esa muestra en voz sintética. No hay clonación ni envío de esa muestra a un servicio de síntesis.

El borrado elimina registro y audio, también el blob huérfano conocido de versiones anteriores. Una grabación antigua sin consentimiento registrado queda bloqueada para reproducción, pero puede borrarse; la ausencia de su audio se informa. Los errores de lectura, almacenamiento o eliminación no se presentan como éxito.

Las pistas se liberan al detener/cancelar, ante pérdida o mute del micrófono y ante permisos que llegan después de cancelar. Un límite de espera cubre grabadores que no emiten `stop`. Guardado, revocación y eliminación se coordinan para que un resultado tardío no reaparezca ni borre una grabación nueva. Si falla una sustitución atómica, no se elimina la muestra anterior autorizada.

Durante captura o reproducción de la muestra se bloquean reconocimiento de órdenes, características de identificación vocal y clasificación/reacciones acústicas. Se preservan bloqueos de permisos ajenos a la muestra. Al finalizar se reanuda la escucha únicamente en una sesión válida; Modo Clase, silencio, cambio de página y detención de sentidos también paran la reproducción.

## Evidencia reproducible

| Comando | Cobertura específica |
| --- | --- |
| `npm run test:p06` | 107 comprobaciones de catálogo/estilos, 47 de selección/prueba/muestras y 80 de ciclo de síntesis, errores, privacidad y carga: 234 en total |
| `node tests/voice-sample-capture-regression.js` | 56 comprobaciones de consentimiento, permisos tardíos, pistas, eventos antiguos, timeout, borrado concurrente y fallos atómicos |
| `npm run test:p06:browser` | 288 comprobaciones de aplicación: seis idiomas × diez estilos, preferencias, recarga, falta de voces, bloqueos, micrófono simulado, IndexedDB real, reproductor nativo, borrado y controles móviles |
| `npm run test:p04` | Regresiones históricas de ASR/TTS, alcance del idioma, captura, identidad, consentimiento y almacenamiento |
| `npm test` / `npm run test:ci` | Núcleo, audio, memoria, semántica, tres semillas, Chromium, matrices, persistencia y arnés de fallos |
| `cross-browser.yml` | Incluye P06 en `test:browser:extended` para Firefox y WebKit, además de las baterías previas |

La batería local general y las pruebas específicas pasaron en Chromium. La primera CI pasó en Chromium/WebKit; Firefox informó un error nativo de reproducción en el ejecutor sin salida de audio. La corrección del 9/11 configura PulseAudio con una salida virtual que descarta el sonido y exige progreso real del reproductor, sin omitir la prueba ni simular sus eventos. La integración requiere la CI del HEAD definitivo del PR; sus resultados y los del despliegue quedan vinculados en el PR. `test-results/` conserva informes JSON, logs y una captura de los controles a 390 × 844, sin audio humano; los artefactos de CI tienen retención limitada. Se usan voces y entrada de micrófono simuladas. La reproducción nativa del WAV de prueba y las operaciones de IndexedDB sí se ejecutan en el motor del navegador.

Las cifras son de suites diferentes y no se suman para afirmar casos humanos únicos. P05 conserva sus casos históricos y añade las traducciones de los nuevos controles; sus cifras originales describen su revisión anterior.

## Validación pendiente

Ejecutar [P06-VOICE-ACCEPTANCE.md](P06-VOICE-ACCEPTANCE.md) en escritorio, Android e iPhone con los idiomas y voces disponibles. Registrar voces ausentes, estilos indistinguibles, pronunciación, latencia, interrupciones, permisos y reproducción del formato grabado por cada navegador. No hay resultados físicos adjuntos ni consentimientos humanos inventados.

Se conservan los seis bloques de [PENDIENTES-PERMANENTES.md](PENDIENTES-PERMANENTES.md): generalización semántica, traducción privada sin modelo compatible, calibración acústica real, dependencias/rendimiento, ASR/TTS físico en seis idiomas y voces/muestras/consentimiento.
