# Robotito — pendientes permanentes y seguimiento

Actualizado: 31 de octubre de 2026.

> Este documento **no reemplaza los 82 pedidos originales**, cuyo orden de implementación se mantiene. Sirve para conservar las limitaciones solucionables que se detectan al desarrollar y probar cada punto. Nunca eliminar una limitación por pasar al siguiente punto; marcarla resuelta únicamente con evidencia y pruebas.

## Seis bloques permanentes

1. **Punto 1: cerebro semántico y diversidad de preguntas.**
   - Ampliar cobertura contextual, variaciones lingüísticas y combinaciones adversarias; conservar el objetivo de las 999.999 formulaciones y 50 variantes por cada una como aspiración de pruebas, sin prometer comprensión perfecta.
   - Verificar fuentes, contexto, ambigüedad, repreguntas y regresiones sin ejecuciones indebidas.
   - **Revisión 30/10:** corregidas fuentes excluidas, citas, órdenes literales, reparaciones y referencias en seis idiomas; modelo local limitado y contexto protegido frente a resultados atrasados. Auditoría finita: 22 familias, 352 casos semánticos, 5.632 ejecuciones y cero fallos. Se conserva la expansión con corpus independiente y el objetivo masivo: [P01-STATUS.md](P01-STATUS.md).
2. **Alternativa privada para traducción.**
   - Proveer una opción útil cuando el modelo local no esté disponible, con consentimiento explícito antes de enviar información a servicios externos.
   - No fingir que se tradujo texto que quedó en el idioma original.
3. **Punto 3: percepción avanzada de sonidos.**
   - La ingeniería de detección y protección temporal está integrada. **Pendiente de validación real:** corpus autorizado de sonidos humanos, etiquetas auditadas, fuentes independientes, negativos y casos ambiguos.
   - Medir precisión, recuperación, confusiones, falsos avisos por hora y latencia.
   - Verificar micrófonos, permisos, suspensión y recuperación en dispositivos físicos.
   - Revisar GitHub Actions tras las últimas modificaciones. Mantener desactivadas las reacciones humanas automáticas hasta aprobación documentada.
   - **Revisión 31/10:** corregidos avisos por onomatopeyas de texto/ASR, acumulación tras errores, resultados atrasados, consultas rápidas del baile y bloqueo del modelo sin PCM nuevo; regresiones de lógica y controles reales con micrófono sintético. No equivale a calibración humana.
   - Consultar [P03-STATUS.md](P03-STATUS.md) para los criterios de aceptación sin falsos certificados.
4. **Dependencias externas y rendimiento.**
   - Reducir dependencias innecesarias, verificar navegación con descarga/caché de modelos, tiempos de arranque, memoria y latencia en dispositivos representativos.
   - La capacidad de acceder al código de GitHub es el requisito básico de disponibilidad; las funciones que requieran micrófono o modelos específicos necesitan pruebas adicionales.
5. **Punto 4: seis idiomas y traducción dinámica.**
   - Completar todas las respuestas dinámicas, clases, tareas, libros, clima, cumpleaños, estados de ánimo y mensajes de error en español, inglés, portugués, francés, italiano y alemán.
   - Probar ASR, TTS, cambio por selector/texto/voz y las modalidades persistente, sesión y una sola respuesta en navegadores reales.
   - **Aplicado 29/10:** inicio de los seis idiomas; avisos iniciales de micrófono/cámara y bienvenida localizados; impedir usar una voz de otro idioma. Pruebas específicas P04: 1.770 comprobaciones de lógica y localización, además de consentimiento (16), cambios de sesión ASR (8) y alcance persistente/sesión/una respuesta (27), órdenes multilingües (21), descarte de traducciones atrasadas (12), diagnóstico privado (30) y manejador de síntesis (68), manejo de eventos ASR del navegador en seis idiomas (85) y almacenamiento atómico/borrado de muestras (19). Integradas selecciones de los seis idiomas, 50 avatares, diez estilos, traducción privada y grupos prioritarios de mensajes. Se agregaron plantillas de fechas, cumpleaños, clases, tareas y biblioteca, traducción del registro de cara y voz, y localización de estados y errores del reconocimiento nativo de voz. Las respuestas dinámicas no cubiertas siguen dependiendo de modelos locales disponibles; la suite de CI y las pruebas de voz físicas todavía requieren validación. Se incorporó [p04-device-check.html](p04-device-check.html) para comprobar micrófono y voces reales sin almacenar audio. El audio de muestras voluntarias y su consentimiento se guardan atómicamente; el borrado elimina también blobs huérfanos anteriores.
6. **Voces, muestras y consentimiento.**
   - Mantener diez estilos de voz como preajustes de síntesis; no presentarlos como diez actores garantizados ni como clonación.
   - Verificar disponibilidad, ajustes y reproducción real por sistema operativo; eliminar muestras voluntarias correctamente y revisar consentimiento para audios de terceros.
   - **Aplicado 29/10:** sustituido «Gravedad» por «Tono»; grabación cancelable con consentimiento revocable y borrado local de muestras, con controles de autorización traducidos a seis idiomas.

## Reglas de integración

- Implementar en el código de GitHub cada mejora antes de avanzar; adjuntar prueba fija para cada defecto descubierto.
- Mantener separados: **implementado**, **probado con datos simulados**, **probado en navegador real** y **validado con dispositivos/personas reales**.
- Proteger los puntos 1 y 2 al continuar con los puntos 3, 4 y siguientes.
- **Nunca eliminar «¡Chocar los cinco!»**, ni el gesto ni sus pruebas.
- Conservar la lista completa en los informes siguientes y agregar subpendientes sin sustituir los bloques históricos.

## Estado del punto 4

Ver [P04-STATUS.md](P04-STATUS.md). No se debe considerar terminada la validación física ni la localización exhaustiva de todos los mensajes dinámicos hasta que existan pruebas reales y auditoría completa de cadenas. Conservar el bloqueo de despliegue como pendiente, aunque comience el siguiente trabajo de ingeniería.

- **P04 (29/10):** recuperación ante rechazo de traducción local implementada; pendiente la comprobación en Chromium real.
