# P36–P38 · Implementación y condiciones de aceptación

## P36 — 60 perfiles lectores de prueba
- Generador **determinista** de 60 lectores sintéticos con IDs independientes, 10 géneros, 5 exclusiones, 3 extensiones, 6 idiomas y combinaciones de biblioteca propia/exclusión de leídos.
- Comparación reproducible de preferencias frente a un catálogo de prueba, con orden estable y penalizaciones por temas rechazados.
- Los 60 perfiles son **datos sintéticos de prueba**, no personas reales ni valoraciones inventadas. Nunca se guardan como perfiles personales.
- Se integran pruebas de unicidad, variación, puntuación y reproducibilidad en CI.
- Pendiente: evaluación con personas reales y anotaciones humanas de relevancia narrativa; las métricas sintéticas no prueban satisfacción real.

## P37 — Descripciones completas y traducción
- En cada recomendación: botón para desplegar la **descripción completa del catálogo** sin el anterior recorte visible de 320 caracteres, además de «Escuchar descripción», detener y solicitar traducción.
- La narración utiliza **el sistema de voz ya existente de Robotito**, para respetar Modo Clase, silencio, idioma y pausa de escucha que evita que reaccione a su propia voz.
- La traducción se ejecuta mediante `ROBOTITO_LOCALIZED_CONTENT`, en el dispositivo si hay traductor/modelo compatible. Si no existe, se conserva **el texto original**; nunca se inventa una traducción.
- Los textos se presentan con `textContent`; no se ejecuta HTML de terceros. Se indica que la descripción procede del catálogo y no es una reseña de lector.
- Pendiente: verificar la disponibilidad real de modelos locales y voces por navegador, licencias de descripciones y dispositivos físicos.

## P38 — Biblioteca personal con estanterías y escaneo
- Tres estanterías decoradas «Leídos», «Leyendo» y «Por leer». Los lomos tienen colores y título legible; cambiar estantería actualiza la biblioteca existente (compatible con CSV Goodreads opcional).
- Alta manual con título, autor, ISBN opcional y estado; deduplicación por ISBN validado o título+autor. La biblioteca se guarda mediante el sistema por propietario de Robotito; no se envía al servidor de Robotito.
- Búsqueda puntual del ISBN en Google Books, comprobando que el resultado devuelve el ISBN solicitado. Si no hay ficha, se puede completar manualmente.
- Escaneo de código de barras con `BarcodeDetector` **solo tras presionar el botón** y autorizar cámara; vídeo local, límite de 12 segundos, cancelación, cierre al ocultar página/cambiar historial y parada de pistas. Si la API no existe, permite ISBN manual. No se prometen cámaras automáticas.
- La consulta de ISBN comunica ese ISBN a Google Books; requiere conectividad. El vídeo no se sube.
- Pendiente: validar permisos denegados, códigos reales, fotos imperfectas y UI física Android/iPhone. `BarcodeDetector` no está disponible en todos los navegadores.

## Compatibilidad y pruebas
- `npm run test:p36-p38`
- `npm run test:p36-p38:browser`
- `npm run test:ci`

Se mantienen «Chocar los cinco», las interfaces de perfiles, almacenamiento y voz existentes. **No cerrar P36–P38 como completamente aceptados hasta CI verde y validación física/documental de los casos pendientes.**
