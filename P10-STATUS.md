# P10 — Órdenes temporales, audio real y repetición literal

Estado: software en revisión. No se inventa un archivo, un libro ni una reproducción ausente.

- El módulo `temporal-commands.js` recibe frases de voz o texto y reconoce solicitudes de audio de clase, recordar recomendaciones de libros, repetir una frase literal, o armar la repetición de la siguiente frase.
- Reutiliza `ROBOTITO_TEMPORAL.resolve` para ayer, anteayer, última vez, semana pasada y fechas relativas. No mantiene otra implementación del calendario.
- Usa `ROBOTITO_CLASS_AUDIO.listRecordings()` y reproduce únicamente el Blob real que corresponde a una fecha y a la materia solicitada; el control de audio aparece en Clase. Se intenta reproducir si hay un único resultado y, si el navegador bloquea el inicio automático, se ofrece el botón de reproducción. Si hay varias grabaciones, exige elegir una; no inventa una.
- Las recomendaciones de libros se recuperan exclusivamente del tipo `recommendations` de IndexedDB para el propietario confirmado, con fechas verificables y rechazo de ambigüedad. Nunca utiliza preguntas actuales como pruebas de un recuerdo anterior.
- `repetí después de mí` reserva una ventana temporal corta para la siguiente frase, sin tratarla como instrucción. El texto literal o la próxima frase tienen límite de longitud, caducidad, cancelación, aislamiento por interlocutor y se limpian al apagar los sentidos.
- El módulo se mantiene inerte durante Modo Clase; no interrumpe una grabación activa.
- `npm run test:p10` cubre frases en seis idiomas, negaciones, ausencia de material, varias fechas, propietario, caducidad y texto literal. `npm run test:p10:browser` comprueba un archivo Blob real en un motor de navegador, y la CI extendida lo repite en Firefox/WebKit.

**Limitaciones:** el reconocimiento ASR real puede confundir formulaciones, la reproducción automática depende de políticas del navegador y los clips de audio extensos/antiguos pueden necesitar codecs compatibles en Android y iPhone. Las pruebas sintéticas y el navegador de CI no constituyen aceptación de estos casos físicos. Una clase sin audio no puede reproducirse y se indica explícitamente.
