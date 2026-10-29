# Robotito — Punto 4: balance de implementación y aceptación

Actualizado: 29 de octubre de 2026.

## Verificación posterior con CI (29/10/2026)

Las advertencias históricas de esta página que dicen que todavía no se había ejecutado CI se refieren a la fecha de esos incrementos, **no al estado actual**. GitHub Actions confirmó:

- [CI final en `main` tras PR #91](https://github.com/valeveig15/Robotito/actions/runs/40895269669): **success**, `npm run test:ci` con regresiones de núcleo y navegador, audio, idiomas/voz y privacidad.
- [CI de PR #91](https://github.com/valeveig15/Robotito/actions/runs/40894995211): **success**, incluyendo matriz profunda de estrés con las semillas configuradas.
- La regresión de selección facial añadió 31 comprobaciones (una cara, varias, desconocidos, baja confianza, cambio de identidad, pestaña oculta); la batería de navegador informó 555/555 pruebas aprobadas y cuatro tamaños de pantalla.

**Instrumento físico:** [`p04-device-check.html`](p04-device-check.html) incluye vista previa de cámara, medidor de micrófono, voces del sistema y transcripción ASR manual por idioma. [`P04-HARDWARE-VALIDATION.md`](P04-HARDWARE-VALIDATION.md) define H01–H16 para pruebas en equipos físicos, con consentimiento y resultados PASS/FAIL/BLOCKED/NOT RUN. Los tests automatizados usan dispositivos simulados y **no sustituyen** un micrófono o cámara reales.

**Pendiente de aceptación final:** resultados de H01–H16 ejecutados en dispositivos físicos representativos, además de completar cadenas dinámicas históricas aún no localizadas. No declarar el punto 4 al 100 % solo por una CI verde.



## Implementado y enviado a GitHub
- Arranque y mensajes de cámara/micrófono en español, inglés, portugués, francés, italiano y alemán.
- Selector de 50 avatares con nombres en seis idiomas; conservación de «¡Chocar los cinco!».
- Controles y mensajes prioritarios de Modo Clase, tareas, biblioteca, memoria y privacidad localizados. Se reemplazó «Gravedad» por «Tono».
- Plantillas numéricas en los seis idiomas para tareas, personas, clases, libros, fechas, cumpleaños, recuerdos y alimentación, sin acceso a servicios externos. Se ampliaron respuestas fijas de hambre, ánimo, reconocimiento de voz, estudios, biblioteca, identidad y capacidades en seis idiomas, con equivalencias españolas para respuestas de origen inglés.
- Instrucciones de registro de cara y voz traducidas a seis idiomas; corregida la clasificación italiana para evitar bloqueos de voz.
- Pruebas añadidas al recorrido de Chromium para verificar la interfaz, plantillas y precedencia de cambios temporales de idioma.
- Diez estilos de síntesis mediante los motores instalados del sistema (no son diez voces humanas garantizadas ni clonación).
- La voz elegida debe corresponder al idioma; si el navegador solo ofrece voces extranjeras, la respuesta permanece escrita.
- Cambios explícitos de idioma por selector, texto o voz; protección contra órdenes negadas y citas; modos persistente, sesión y una respuesta. Cualquier cambio manual, permanente o de sesión cancela un idioma pendiente de una sola respuesta.
- El reconocimiento móvil descarta resultados pendientes cuando se cambia de idioma, pausa o detiene la escucha.
- Traducción de frases locales comunes y motor Translator/LanguageModel en el navegador si está disponible. No se envía contenido a servicios externos de traducción sin autorización.
- Grabación voluntaria de voz con consentimiento explícito, cancelación de permisos retrasados, retirada del consentimiento, cierre de micrófonos y borrado local de muestras.

## Evidencias ejecutadas
- Regresión P04 de voces, traducción, interfaz, instrucciones y respuestas dinámicas: **1.770 comprobaciones aisladas**.
- Captura privada de muestras y cancelación por consentimiento: **16 comprobaciones aisladas**.
- ASR y cambios de sesión: **8 comprobaciones aisladas**.
- Cambios de idioma persistentes, por sesión y por una respuesta: **27 comprobaciones aisladas**.
- Órdenes «decime algo en…» en seis idiomas: **21 comprobaciones aisladas**.
- Descarte de traducciones atrasadas después de cambios de idioma: **12 comprobaciones aisladas**.
- Diagnóstico manual de voces y micrófono, comprobado con mocks: **30 comprobaciones aisladas**.
- Manejador real de síntesis probado con voces sintéticas del sistema: **68 comprobaciones aisladas**.
- Reconocimiento de voz nativo del navegador (eventos de escucha, errores, reconexión y permisos en seis idiomas): **85 comprobaciones aisladas**.
- Almacenamiento atómico de muestras privadas y borrado de blobs antiguos: **19 comprobaciones aisladas**.
- Regresiones anteriores de planificador, audio y pruebas generativas: **74.713 comprobaciones aisladas** (3 semillas).
- **Total de estas ejecuciones:** **76.769 comprobaciones aisladas**. Sin fallos en los casos ejecutados.

No representan un `npm run test:ci` completo ejecutado en GitHub Actions ni una certificación de compatibilidad/precisión con micrófonos físicos o voces del sistema.

## Ampliación de localización ASR nativa

Se localizó el ciclo real de reconocimiento de voz proporcionado por `SpeechRecognition` / `webkitSpeechRecognition` para español, inglés, portugués, francés, italiano y alemán: escuchando, voz detectada, micrófono bloqueado, ayuda de permisos, recuperación de micrófono, recuperación general, reconexión, inicio y navegador sin soporte. Se probó el manejador de eventos directamente con un reconocimiento simulado y se validó que usa `recognitionLanguage()` según el idioma. También se bloquearon órdenes negativas como «No quiero hablar en inglés» y «Je ne veux pas parler français», sin anular correcciones posteriores explícitas como «No quiero inglés, quiero italiano».

## Integridad del almacenamiento de muestras de voz

Se reemplazó la escritura en dos pasos por `ROBOTITO_STORE.putRecordWithBlob`, que usa una única transacción `readwrite` sobre `records` y `blobs`; si una operación falla, IndexedDB revierte ambas. El botón de eliminación borra el registro vinculado y también el identificador de blob conocido, incluso si alguna versión anterior dejó audio sin metadatos. La regresión `tests/p04-voice-atomic-storage-regression.js` verifica las llamadas y el consentimiento mediante simulaciones. Se añadió a `tests/browser-regression.js` una comprobación del ciclo real de IndexedDB en Chromium, aún pendiente de ejecución verificada.

## Diagnóstico manual de dispositivos

El archivo [p04-device-check.html](p04-device-check.html) permite verificar manualmente las voces instaladas, escuchar una muestra por idioma y comprobar el micrófono con permiso explícito. No graba ni almacena audio; apaga las pistas al detener la prueba o al salir. Su prueba estática y de interacciones simuladas integra `npm run test:p04`. Una prueba independiente de Chromium (`npm run test:p04:browser`) se agregó a `npm run test:ci`, pero todavía **no está verificada como ejecutada** en este entorno. Las pruebas de audio reales en dispositivos siguen siendo necesarias.

Se corrigieron además las frases «decime algo en francés/italiano/alemán», la pérdida de coherencia por traducciones asíncronas atrasadas y el uso de voces del idioma incorrecto cuando `getVoices()` todavía está vacío. También se evita un fallo si el navegador expone `speechSynthesis` pero su motor no está inicializado. El estado de síntesis «respondiendo» quedó localizado.

## Aceptación que sigue pendiente

1. Revisar y completar TODAS las cadenas dinámicas históricas que aún están escritas en español, especialmente respuestas extensas de clases, ejercicios y libros, más textos no cubiertos de interfaz.
2. Probar `npm run test:ci`, `npm run test:browser` y la matriz de estrés del punto 4 en un entorno Chromium real y verificar el resultado de GitHub Actions del commit final.
3. Probar en dispositivos reales selección de voz, síntesis, reconocimiento, pausas y cambios persistente/sesión/una respuesta en los seis idiomas, incluyendo permisos e interrupciones.
4. Probar rendimiento y disponibilidad real de modelos locales de traducción/ASR. Cuando no existan, informar con claridad el límite en vez de pronunciar texto no traducido.
5. Auditar consentimiento, eliminación de muestras, funcionamiento sin conexión y accesibilidad en dispositivos físicos.

**Estado:** implementación extensa integrada y comprobada de forma aislada; certificación exhaustiva del punto 4 **no completada**. La suite de Chromium está integrada en CI pero no verificada desde esta sesión. No se han ejecutado pruebas físicas de micrófono o sintetizador reales. No presentar el punto 5 como iniciado mientras este bloqueo permanezca.

### Recuperación de fallos de traducción

La promesa de localización asíncrona ahora cuenta con recuperación ante rechazo, evitando dejar «Preparando…» indefinidamente. Esta protección requiere todavía un ensayo en navegador real; la integración CI no se certifica desde las pruebas aisladas.

### Prueba de rechazo de traducción (29/10)

`tests/p04-localization-race-regression.js` ahora simula una promesa que rechaza explícitamente, verifica que se muestre un mensaje de error localizado y que un rechazo tardío no restaure contenido luego de cambiar el idioma. **15 comprobaciones aisladas aprobadas** para esa regresión. El cambio está integrado en el código de GitHub; la validación en Chromium y dispositivos físicos continúa pendiente.
