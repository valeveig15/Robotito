# Robotito — limitaciones controlables que siguen pendientes

Actualizado: 27/10/2026. **No borrar este registro al cerrar una aceptación parcial.** Incluir un resumen de estas tareas pendientes al final de las respuestas del chat y actualizar cada entrada cuando se implemente y pase la CI. La prioridad de ejecución de los 82 pedidos sigue determinada por [ROADMAP_82.md](ROADMAP_82.md).

Las tareas siguientes son **mejorables mediante desarrollo**, aunque no se garantiza resolver literalmente todas las expresiones humanas ni certificar funcionamiento perfecto en cualquier hardware. Se diferencian de la mera capacidad de abrir GitHub: una página HTTPS se puede abrir desde múltiples dispositivos, pero cámara, micrófono, Web Audio, Web Worker y modelos locales también requieren permisos y APIs compatibles.

## P01 — Generalización semántica a 999.999 preguntas y 50 variantes

**Estado: pendiente de expansión; el criterio básico de P01 ya se aceptó.**
El objetivo aspiracional equivale a hasta **49.999.950 formulaciones**. Las 360 paráfrasis de definiciones, 900 variaciones de superficie, propiedades generativas y CI existentes NO prueban ese volumen ni 999.999 intenciones distintas. Implementar generadores combinatorios semánticamente diversos en seis idiomas, contexto temporal, reparaciones, ironía, negación, citas, fuentes, profundidad y múltiples canales. Conservar casos adversariales reales como oráculos versionados; medir tasas de exactitud por familia y por idioma, no solo cantidad de casos. Ejecutar matrices grandes en trabajos programados separados de la CI rápida. Corregir familias de errores en módulos generales, no con millones de frases rígidas. Informar errores y límites.

## P01/P05 — Traducción puntual cuando no existe el modelo local

**Estado: pendiente.** El seguimiento «¿Y en portugués?» usa traducción local cuando está disponible y una limitación explícita cuando no. Incorporar una alternativa privada y verificable, idealmente un modelo descargable **optativo** en el dispositivo o traducción local equivalente, sin filtrar transcripciones de clases ni recuerdos. Auditar también otros caminos de traducción que hoy usan APIs externas; consentimiento, privacidad y coincidencia real del idioma. Probar español, inglés, portugués, francés, italiano y alemán, más fallos de red y carga.

## P03 — Precisión y calibración de risa, llanto, tos, estornudos y aplausos

**Estado: pendiente, P03 abierto.** Ya existe una ruta opcional para YAMNet/MediaPipe [PR #31](https://github.com/valeveig15/Robotito/pull/31). Es un clasificador preentrenado, **no validado para Robotito**; su etiqueta no autoriza automáticamente «¡Salud!» ni una reacción emocional. Reunir grabaciones reales etiquetadas y autorizadas (ruido, TV, música, puerta, palmadas, tos, estornudos, dobles estornudos, risa, llanto), medir matrices de confusión y falsos positivos por entorno, establecer umbrales y tiempos de evidencia, y recién entonces habilitar reacciones prudentes. Registrar y probar cooldowns, silencios, solapamientos y supresión de voz propia.

## P03 — Autonomía del modelo opcional y pruebas de su ejecución real

**Estado: pendiente.** Verificar el Worker y la carga WASM/TFLite verdaderos (no solo Worker simulado), rendimiento en navegadores, resampling y calidad del audio. Evaluar alojar los archivos necesarios en GitHub Pages para reducir dependencia de CDNs/terceros y documentar licencias y consentimiento. Conservar el modo sin clasificador cuando falle la descarga o falten APIs; el botón de acceso al código de GitHub no equivale a disponer de micrófono y Web Audio en cada dispositivo.

## P05 — Inicio y contenido dinámico en los seis idiomas

**Estado: pendiente de su punto en el orden.** El selector incluye seis idiomas, pero una condición del inicio en `script.js` todavía restringe el arranque a español, inglés y portugués. También quedan textos dinámicos sin localizar. Resolver y probar los seis idiomas, sin afirmar que un contenido traducido permanece en español. No adelantar este punto mientras P03 siga abierto.

## P06 — Selector de voces y control visible «Gravedad»

**Estado: pendiente de su punto en el orden.** La interfaz todavía incluye un control visible con la etiqueta «Gravedad» y la experiencia de voces depende de las voces del sistema. Retirar el control visible al abordar P06 y verificar estilos, muestras consentidas y soporte real sin prometer clonación de voz.

---

**Criterio de actualización:** cambiar a `resuelto` únicamente con enlace a PR fusionado, CI pasada y pruebas correspondientes. Los objetivos aspiracionales pueden mantenerse abiertos aun cuando el punto de aceptación mínimo anterior conste como completado; eso no es una contradicción, sino una declaración precisa del alcance.
