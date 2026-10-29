# Robotito — Punto 4: balance de implementación y aceptación

Actualizado: 29 de octubre de 2026.

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
- Regresión P04 de voces, traducción, interfaz, instrucciones y respuestas dinámicas: **1.683 comprobaciones aisladas**.
- Captura privada de muestras y cancelación por consentimiento: **16 comprobaciones aisladas**.
- ASR y cambios de sesión: **8 comprobaciones aisladas**.
- Cambios de idioma persistentes, por sesión y por una respuesta: **27 comprobaciones aisladas**.
- Regresiones anteriores de planificador, audio y pruebas generativas: **74.713 comprobaciones aisladas** (3 semillas).
- **Total de estas ejecuciones:** **76.447 comprobaciones aisladas**. Sin fallos en los casos ejecutados.

No representan un `npm run test:ci` completo ejecutado en GitHub Actions ni una certificación de compatibilidad/precisión con micrófonos físicos o voces del sistema.

## Aceptación que sigue pendiente

1. Revisar y completar TODAS las cadenas dinámicas históricas que aún están escritas en español, especialmente respuestas extensas de clases, ejercicios y libros, más textos no cubiertos de interfaz.
2. Probar `npm run test:ci`, `npm run test:browser` y la matriz de estrés del punto 4 en un entorno Chromium real y verificar el resultado de GitHub Actions del commit final.
3. Probar en dispositivos reales selección de voz, síntesis, reconocimiento, pausas y cambios persistente/sesión/una respuesta en los seis idiomas, incluyendo permisos e interrupciones.
4. Probar rendimiento y disponibilidad real de modelos locales de traducción/ASR. Cuando no existan, informar con claridad el límite en vez de pronunciar texto no traducido.
5. Auditar consentimiento, eliminación de muestras, funcionamiento sin conexión y accesibilidad en dispositivos físicos.

**Estado:** implementación extensa integrada y comprobada de forma aislada; certificación exhaustiva del punto 4 **no completada**. La suite de Chromium está integrada en CI pero no verificada desde esta sesión. No se han ejecutado pruebas físicas de micrófono o sintetizador reales. No presentar el punto 5 como iniciado mientras este bloqueo permanezca.
