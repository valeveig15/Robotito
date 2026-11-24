# Referencia visual aprobada de Robotito — 24 de noviembre de 2026

## Fuente de verdad para los avatares

La referencia de ocho retratos compartida por la usuaria en la conversación muestra, de izquierda a derecha:
- Fila superior: Pandi (panda), Bruno (oso pardo), Nivi (oso polar), Bobi (perro).
- Fila inferior: Momo (mono), Michi (gato), Roji (panda rojo), Igui (iguana verde).

**Nunca sustituir estas caras por el generador animal genérico.** Los retratos tienen una estética suave y facetada con contornos redondeados, ojos grandes y brillantes, hocicos claramente definidos, nariz arriba de la línea de la boca y colores propios de la especie.

### Versiones HTML más recientes entregadas por la usuaria

| Avatar | Versión fuente | HTML íntegro en este repositorio |
| --- | --- | --- |
| Bobi | V35 | `previews/bobi-review.html` |
| Michi | V31 | `previews/michi-review.html` |
| Roji | V3.6 | `previews/roji-review.html` |
| Igui | V24 | `previews/igui-review.html` |

Estos cuatro HTML tienen **15 estados emocionales** y un atlas facial con **45 imágenes WebP** (normal, habla y parpadeo por estado), además del rostro inicial. Hay varias hojas de estilo en cada HTML: *conservarlas todas*. Sus scripts originales se deben analizar como datos de fuente; **no ejecutar scripts HTML en el Shadow DOM de Robotito**.

En la aplicación, `approved-avatar-bridge.js` importa sus SVG auténticos, todas sus capas CSS y las imágenes de cada estado mediante un parser estricto del atlas. Michi necesita conservar su animación de cola en S, anclada a la cadera. El cuerpo entero debe caber en la pantalla, con los pies en el suelo.

**Reglas de conservación:** no redibujar las cabezas, duplicar hocicos ni ojos, exagerar el zoom, separar cuello o miembros, cambiar la paleta, dejar señales de emoción flotantes o eliminar «chocar los cinco». Conservar la apariencia de las versiones más recientes antes de realizar ajustes; comparar primero capturas de frente, perfil y expresiones, y usar la imagen de referencia de la conversación como criterio de aceptación.

### Advertencia de integración

Las versiones anteriores de estos avatares (Bobi V25, Michi V24, Roji V2.10, Igui V13) eran borradores **obsoletos** respecto a los HTML enviados. No usarlas como fuente para nuevas mejoras. Conservar las versiones recientes en una rama de revisión hasta completar pruebas de navegador y verificación visual de gestos, expresiones, voz y cola.