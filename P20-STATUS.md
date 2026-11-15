# P20 — Tutor de nomenclatura química inorgánica

**Estado: incremento implementado y propuesto en PR; pendiente de CI y validación educativa manual.**

`chemistry-nomenclature.js` contiene un catálogo introductorio delimitado de sales binarias, óxidos iónicos y moleculares, hidróxidos, oxisales, hidrácidos y oxoácidos frecuentes. Reconoce nombres y fórmulas, muestra la familia, cargas y proporciones de neutralidad cuando corresponde, exige estados de oxidación en nombres ambiguos de hierro y cobre, diferencia HCl acuoso y verifica paréntesis en iones poliatómicos. Incluye variantes tradicionales concretas y un grupo de ejercicios con respuestas fundamentadas. La interfaz del panel Clase y una ruta de voz explícita están conectadas. No sustituye química general ni material de curso de mayor nivel.

**Pruebas:** `npm run test:p20` y `npm run test:p20:browser` se incluyen en CI.

**No declarar universo de nomenclatura cubierto:** otros elementos, hidratos, complejos, ácidos menos comunes, formulación orgánica y otras variantes de nomenclatura están fuera del conjunto controlado. Las fórmulas no reconocidas se señalan como no verificadas, nunca automáticamente inválidas. La pronunciación de símbolos químicos vía ASR y la traducción completa de nombres al resto de idiomas necesitan pruebas reales y fuentes académicas adicionales.
