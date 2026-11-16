# P23 — Reconocimiento de objetos y seguimiento temporal

**Estado: incremento de reconocimiento por consenso en PR; aceptación de hardware real pendiente.**

`object-tracker.js` exige varias predicciones recientes y estables y rechaza etiquetas competidoras/ambiguas, resultados antiguos y puntuaciones insuficientes. `robotito-vnext.js` toma varias imágenes de la cámara activa, verifica sesión y permisos, y solo comunica nombres cotidianos presentes en el catálogo de objetos. No atribuye identidad a una persona por la clasificación visual. Si COCO-SSD no es concluyente, MobileNet solo puede sugerir un nombre del catálogo cuando existen dos predicciones fuertes y compatibles. La interfaz deja claro que la identificación es tentativa; si no está segura pide acercar, iluminar o estabilizar el objeto.

`script.js` exige tres lecturas consistentes de MediaPipe antes de comunicar el conteo de dedos, y borra datos recientes al desaparecer una mano. Se mantienen las restricciones anteriores de cámara, clase y privacidad.

**Pruebas:** `npm run test:p23` y `npm run test:p23:browser` (CI) con objetos parecidos, etiquetas competidoras, manos, cámara inactiva y caducidad temporal.

**Falta para cierre total:** medición con conjuntos etiquetados y licenciados de objetos parecidos, iluminación escasa y movimiento; pruebas Android/iPhone de cámaras reales, fallos de permisos e interrupciones; calibración de incertidumbre y sesgo del detector; rotaciones de mano y oclusiones; seguimiento con identidad temporal para varios objetos simultáneos y escenas de presentación del P24. No declarar clasificación humana confirmada ni identificación universal.
