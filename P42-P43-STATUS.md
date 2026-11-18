# P42–P43 · Visualización meteorológica y contador verificable

## P42 — Escena de clima
- Reutiliza la consulta existente a Open-Meteo: **no** solicita localización, cámara ni redes adicionales por sí sola.
- Una consulta explícita de tiempo valida código meteorológico, temperatura e indicador diurno y adapta la escena a sol, nubes, niebla, llovizna, lluvia, nieve o tormenta. Las condiciones desconocidas no se convierten en una escena inventada.
- Etiqueta temperatura visible con atribución a Open-Meteo. La decoración no intercepta clics y respeta `prefers-reduced-motion`. Se borra al pasar 15 minutos, al ocultar la pestaña o al abandonar la página.
- Al pedir un pronóstico futuro, la escena refleja exclusivamente las **condiciones actuales** que devuelve la misma respuesta, nunca lo que se predice para otro día.
- Pendiente aceptar: validación meteorológica con casos reales de distintas zonas, geolocalización denegada, dispositivos físicos y lectores de pantalla.

## P43 — Panel honesto
- Mantiene el panel de preguntas y la vía existente de comentarios/sugerencias.
- Añade contador verificable de **peticiones de usuario procesadas en la pestaña actual**, sin fingir un contador de usuarios global, conexiones o respuestas de toda la aplicación.
- No guarda contenido de preguntas ni envía analítica al servidor. Las subacciones atómicas de una misma orden no aumentan el contador.
- Pendiente aceptar: pruebas con interacciones de voz en hardware real, internacionalización de esta parte de la UI y verificación de accesibilidad.

## Regresión
- `npm run test:p42` valida códigos y rechaza datos imposibles.
- `npm run test:p42-p43:browser` verifica procedencia, clima, limpieza, contador local y ausencia de superposición en móvil.
- Incluidos en `test:ci`.
- No se tocan ni el botón «Chocar los cinco» ni la captura de audio/cámara.
