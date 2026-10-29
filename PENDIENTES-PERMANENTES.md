# Robotito — pendientes permanentes y seguimiento

Actualizado: 29 de octubre de 2026.

> Este documento **no reemplaza los 82 pedidos originales**, cuyo orden de implementación se mantiene. Sirve para conservar las limitaciones solucionables que se detectan al desarrollar y probar cada punto. Nunca eliminar una limitación por pasar al siguiente punto; marcarla resuelta únicamente con evidencia y pruebas.

## Seis bloques permanentes

1. **Punto 1: cerebro semántico y diversidad de preguntas.**
   - Ampliar cobertura contextual, variaciones lingüísticas y combinaciones adversarias; conservar el objetivo de las 999.999 formulaciones y 50 variantes por cada una como aspiración de pruebas, sin prometer comprensión perfecta.
   - Verificar fuentes, contexto, ambigüedad, repreguntas y regresiones sin ejecuciones indebidas.
2. **Alternativa privada para traducción.**
   - Proveer una opción útil cuando el modelo local no esté disponible, con consentimiento explícito antes de enviar información a servicios externos.
   - No fingir que se tradujo texto que quedó en el idioma original.
3. **Punto 3: percepción avanzada de sonidos.**
   - La ingeniería de detección y protección temporal está integrada. **Pendiente de validación real:** corpus autorizado de sonidos humanos, etiquetas auditadas, fuentes independientes, negativos y casos ambiguos.
   - Medir precisión, recuperación, confusiones, falsos avisos por hora y latencia.
   - Verificar micrófonos, permisos, suspensión y recuperación en dispositivos físicos.
   - Revisar GitHub Actions tras las últimas modificaciones. Mantener desactivadas las reacciones humanas automáticas hasta aprobación documentada.
   - Consultar [P03-STATUS.md](P03-STATUS.md) para los criterios de aceptación sin falsos certificados.
4. **Dependencias externas y rendimiento.**
   - Reducir dependencias innecesarias, verificar navegación con descarga/caché de modelos, tiempos de arranque, memoria y latencia en dispositivos representativos.
   - La capacidad de acceder al código de GitHub es el requisito básico de disponibilidad; las funciones que requieran micrófono o modelos específicos necesitan pruebas adicionales.
5. **Punto 4: seis idiomas y traducción dinámica.**
   - Completar todas las respuestas dinámicas, clases, tareas, libros, clima, cumpleaños, estados de ánimo y mensajes de error en español, inglés, portugués, francés, italiano y alemán.
   - Probar ASR, TTS, cambio por selector/texto/voz y las modalidades persistente, sesión y una sola respuesta en navegadores reales.
   - **Aplicado 29/10:** inicio de los seis idiomas; avisos iniciales de micrófono/cámara y bienvenida localizados; impedir usar una voz de otro idioma. Pruebas aisladas P04: 160 comprobaciones satisfactorias. La suite completa de CI todavía requiere validación.
6. **Voces, muestras y consentimiento.**
   - Mantener diez estilos de voz como preajustes de síntesis; no presentarlos como diez actores garantizados ni como clonación.
   - Verificar disponibilidad, ajustes y reproducción real por sistema operativo; eliminar muestras voluntarias correctamente y revisar consentimiento para audios de terceros.
   - **Aplicado 29/10:** sustituido el rótulo «Gravedad» por «Tono»; controles conservados y traducibles.

## Reglas de integración

- Implementar en el código de GitHub cada mejora antes de avanzar; adjuntar prueba fija para cada defecto descubierto.
- Mantener separados: **implementado**, **probado con datos simulados**, **probado en navegador real** y **validado con dispositivos/personas reales**.
- Proteger los puntos 1 y 2 al continuar con los puntos 3, 4 y siguientes.
- **Nunca eliminar «¡Chocar los cinco!»**, ni el gesto ni sus pruebas.
- Conservar la lista completa en los informes siguientes y agregar subpendientes sin sustituir los bloques históricos.
