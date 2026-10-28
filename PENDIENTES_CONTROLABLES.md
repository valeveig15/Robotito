# Robotito — limitaciones controlables que siguen pendientes

Actualizado: 27/10/2026. **No borrar este registro al cerrar una aceptación parcial.** Incluir un resumen de estas tareas pendientes al final de las respuestas del chat y actualizar cada entrada cuando se implemente y pase la CI. La prioridad de ejecución de los 82 pedidos sigue determinada por [ROADMAP_82.md](ROADMAP_82.md).

Las tareas siguientes son **mejorables mediante desarrollo**, aunque no se garantiza resolver literalmente todas las expresiones humanas ni certificar funcionamiento perfecto en cualquier hardware. Se diferencian de la mera capacidad de abrir GitHub: una página HTTPS se puede abrir desde múltiples dispositivos, pero cámara, micrófono, Web Audio, Web Worker y modelos locales también requieren permisos y APIs compatibles.

## P01 — Generalización semántica a 999.999 preguntas y 50 variantes

**Estado: pendiente de expansión; el criterio básico de P01 ya se aceptó.**
El objetivo aspiracional equivale a hasta **49.999.950 formulaciones**. Las 360 paráfrasis de definiciones, 900 variaciones de superficie, propiedades generativas y CI existentes NO prueban ese volumen ni 999.999 intenciones distintas. Implementar generadores combinatorios semánticamente diversos en seis idiomas, contexto temporal, reparaciones, ironía, negación, citas, fuentes, profundidad y múltiples canales. Conservar casos adversariales reales como oráculos versionados; medir tasas de exactitud por familia y por idioma, no solo cantidad de casos. Ejecutar matrices grandes en trabajos programados separados de la CI rápida. Corregir familias de errores en módulos generales, no con millones de frases rígidas. Informar errores y límites.

## P01/P05 — Traducción puntual cuando no existe el modelo local

**Estado: pendiente.** El seguimiento «¿Y en portugués?» usa traducción local cuando está disponible y una limitación explícita cuando no. Incorporar una alternativa privada y verificable, idealmente un modelo descargable **optativo** en el dispositivo o traducción local equivalente, sin filtrar transcripciones de clases ni recuerdos. Auditar también otros caminos de traducción que hoy usan APIs externas; consentimiento, privacidad y coincidencia real del idioma. Probar español, inglés, portugués, francés, italiano y alemán, más fallos de red y carga.

## P03 — Precisión y calibración de risa, llanto, tos, estornudos y aplausos

**Estado: pendiente, P03 abierto.** Existe una ruta opcional para YAMNet/MediaPipe [PR #31](https://github.com/valeveig15/Robotito/pull/31), su ejecución auténtica en Chromium está verificada por [PR #38](https://github.com/valeveig15/Robotito/pull/38), y [PR #37](https://github.com/valeveig15/Robotito/pull/37) añadió un evaluador para un corpus real autorizado, ampliado a sonidos breves [PR #43](https://github.com/valeveig15/Robotito/pull/43) y a errores por categoría de fuente [PR #46](https://github.com/valeveig15/Robotito/pull/46). [PR #44](https://github.com/valeveig15/Robotito/pull/44) ofrece un generador opcional de manifiestos ESC-50 (solo uso permitido por su licencia CC BY-NC 3.0); **no se descargaron ni evaluaron esas grabaciones en la CI**. [PR #45](https://github.com/valeveig15/Robotito/pull/45) impide que una clase desconocida de YAMNet sea descartada a favor de una reacción humana débil. [PR #48](https://github.com/valeveig15/Robotito/pull/48) evita mezclar máximos de ventanas de distintos instantes. [PR #49](https://github.com/valeveig15/Robotito/pull/49) permite evaluar **sesiones continuas con tiempos anotados** y estimar falsos episodios de un detector offline de referencia; la [CI #50](https://github.com/valeveig15/Robotito/pull/50) ejecuta el comando completo con una señal sintética y YAMNet verdadero. **No hay todavía un corpus humano validado ni una medición prospectiva de las reacciones desplegadas de Robotito**. Es un clasificador preentrenado, **no validado para Robotito**; su etiqueta no autoriza automáticamente «¡Salud!» ni una reacción emocional. Reunir grabaciones reales etiquetadas y autorizadas (ruido, TV, música, puerta, palmadas, tos, estornudos, dobles estornudos, risa, llanto), medir matrices de confusión **en audio real** y eventos falsos por hora de escucha continua (distintos de errores de clasificación por clip), establecer umbrales y tiempos de evidencia, y recién entonces habilitar reacciones prudentes. Registrar y probar cooldowns, silencios, solapamientos y supresión de voz propia.

## P03 — Autonomía del modelo opcional y pruebas de su ejecución real

**Estado: parcialmente verificado.** El Worker genuino y la carga WASM/TFLite pasaron la CI de Chromium con una onda sintética (64 categorías, `Sine wave` como primera), y el AudioWorklet real devolvió ventanas contiguas. El remuestreo continuo 16/44,1/48 kHz tiene pruebas de fase, amplitud y filtrado [PR #40](https://github.com/valeveig15/Robotito/pull/40); el recorrido completo hasta el **modelo real** para 44,1/48 kHz fue verificado en Chromium por [PR #41](https://github.com/valeveig15/Robotito/pull/41). Todavía faltan métricas de rendimiento en dispositivos variados y pruebas de precisión con micrófonos y audio ambiental reales. Evaluar alojar los archivos necesarios en GitHub Pages para reducir dependencia de CDNs/terceros y documentar licencias y consentimiento. Conservar el modo sin clasificador cuando falle la descarga o falten APIs; el botón de acceso al código de GitHub no equivale a disponer de micrófono y Web Audio en cada dispositivo.

## P05 — Inicio y contenido dinámico en los seis idiomas

**Estado: pendiente de su punto en el orden.** El selector incluye seis idiomas, pero una condición del inicio en `script.js` todavía restringe el arranque a español, inglés y portugués. También quedan textos dinámicos sin localizar. Resolver y probar los seis idiomas, sin afirmar que un contenido traducido permanece en español. No adelantar este punto mientras P03 siga abierto.

## P06 — Selector de voces y control visible «Gravedad»

**Estado: pendiente de su punto en el orden.** La interfaz todavía incluye un control visible con la etiqueta «Gravedad» y la experiencia de voces depende de las voces del sistema. Retirar el control visible al abordar P06 y verificar estilos, muestras consentidas y soporte real sin prometer clonación de voz.

---

**Criterio de actualización:** cambiar a `resuelto` únicamente con enlace a PR fusionado, CI pasada y pruebas correspondientes. Los objetivos aspiracionales pueden mantenerse abiertos aun cuando el punto de aceptación mínimo anterior conste como completado; eso no es una contradicción, sino una declaración precisa del alcance.
