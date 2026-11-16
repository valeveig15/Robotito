# P27 — Selección de avatar y catálogo

**Auditado sobre el catálogo existente:** 50 avatares con IDs estables, incluidos panda, oso pardo/polar, perro, mono, gato, panda rojo, iguana, armadillo, pingüino, elefante y tortuga. No se duplican ni se eliminan figuras.

**Cambios:** la preferencia de idioma ya se conservaba; ahora, si existe ese idioma pero no un avatar válido guardado, la pantalla inicial salta al selector de avatar en ese idioma en vez de ocultarlo. Si ambos existen, entra directamente con el avatar anterior. Al elegir otro avatar desde la barra superior, no se reinicia la cámara/micrófono ni se pierde el idioma. Valores legados inexistentes usan el panda de respaldo sin romper la pantalla. No se muestra un cartel permanente con el nombre del animal; se conservan descripciones accesibles del selector y del personaje.

**Prueba:** `npm run test:p27:browser` verifica 50 IDs únicos, 12 especies obligatorias, seis idiomas, persistencia en reload, cambio durante la sesión e instalación anterior que solo guardó idioma. La batería general se amplía con este test. Falta confirmar físicamente Android/iOS y lectores de pantalla; no se certifica hardware real por emulación.

**Preservación:** Modo Clase, chat, biblioteca, memoria, órdenes, voz y «Chocar los cinco» sin recortar.