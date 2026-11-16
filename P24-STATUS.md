# P24 — Escena para mostrar objetos

**Estado: implementación enlazada; validación física pendiente.**

Las solicitudes explícitas de mostrar objetos reconocibles del catálogo atraviesan el router compartido de voz y texto. `object-presentation-scene.js` anima la salida lateral, búsqueda, regreso y presentación de un emoji del objeto junto a la anatomía del avatar, sin hacer pasar un cartel por un objeto físico. El reconocimiento por cámara P23 sigue siendo tentativo y separado de esta escena.

La escena se cancela al cambiar de avatar, hacer otro pedido, ocultar la pestaña, salir o pedir otro objeto. Respeta la preferencia de movimiento reducido. No usa permisos de cámara ni datos de otra persona. Los sonidos son opcionales, discretos y solo se intentan cuando el navegador permite reproducción con activación humana; el audio no es garantía en todos los navegadores.

**Pruebas automatizadas agregadas:** `npm run test:p24` comprueba frases, objetos faltantes, animación/cancelación y visibilidad con entorno simulado. `npm run test:p24:browser` comprueba la ruta real, el objeto unido al avatar y que un objeto desconocido no se represente falsamente. Ambas están añadidas a la batería CI. Verificar los resultados del HEAD antes de fusionar.

**Límites:** la escena es una representación visual 2D con emoji, no un modelo anatómico 3D del objeto. Falta validación real con tacto y audio en iPhone/Android, medidas de accesibilidad con VoiceOver/TalkBack, distintos tamaños, avatares no humanoides, interrupciones de audio, memoria y navegadores. Mantener «Chocar los cinco».
