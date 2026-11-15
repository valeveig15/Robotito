# P19 — Matemáticas y ecuaciones orales

**Estado: incremento implementado en PR; pendiente validación completa de CI.**

El cálculo aritmético anterior permanece en `spoken-math.js` y las funciones de geometría permanecen conectadas. La nueva capa `algebra-tutor.js` resuelve ecuaciones lineales de una incógnita y sistemas lineales 2×2, acepta formas simbólicas y números pronunciados frecuentes, explica transformación y sustitución final, y distingue identidades, contradicciones, indeterminación, división por cero y relaciones no lineales sin simular certezas. Los mensajes de resolución básica incluyen cabeceras en es/en/pt/fr/it/de.

Se integra en el panel de Clase y en consultas habladas, antes del cálculo aritmético existente. Se agregaron regresión matemática y prueba Playwright.

**No declarar cerrados todos los problemas matemáticos:** este tutor no cubre aún ecuaciones no lineales, problemas generales redactados libremente, análisis dimensional complejo ni el 100 % de vocabulario numérico de seis idiomas. Hace falta evaluación de precisión y dispositivos reales. No se debe interpretar una abstención como solución.
