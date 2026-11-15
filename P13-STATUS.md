# P13 — Hablantes y correcciones de transcripción

**Estado: EN PROGRESO.** La clasificación existente usa señales acústicas simples y coincidencias previamente consentidas. Los hablantes dudosos pueden recibir una etiqueta tentativa; ello no acredita reconocimiento fiable de identidades.

## Corrección de concurrencia
Una consulta web lenta toma una instantánea de texto, materia y tema. Al regresar, solo aplica la corrección si esa misma línea conserva los tres valores originales. Así no sobrescribe un texto corregido o una clase reclasificada mientras la consulta estaba pendiente.

## Edición directa de la transcripción
Cada frase visible dispone de «Corregir texto», que conserva el ASR original, limita la entrada a 4000 caracteres, mantiene un historial acotado de cambios manuales y permite «Deshacer corrección». Una modificación invalida el sello y las fuentes de verificación de la versión anterior. El estado persistente se guarda en `robotito.classLines.v1` sin alterar las grabaciones.

## Pruebas
`npm run test:p12-p14` incluye una edición de la transcripción antes de resolver la verificación asíncrona y confirma que prevalece la edición. `tests/p13-transcript-edit-regression.js` valida modificación, deshacer, preservación del texto reconocido y rechazo de correcciones vacías.

## Pendientes
Interfaz de historial completo navegable, edición colaborativa de correcciones, marcado explícito de hablante desconocido, adjudicación humana antes de asociar identidades, calibración independiente de diarización y confusiones en voces parecidas/solapadas/ruidosas, datos etiquetados consentidos en seis idiomas, pruebas físicas del reconocimiento en vivo. No atribuir automáticamente una intervención a un estudiante sin evidencia fiable.
