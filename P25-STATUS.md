# P25 — Interfaz móvil sin superposiciones y chat escrito visible

**Estado: implementación de software y regresiones en rama; validación en teléfonos físicos pendiente.**

La aplicación mantiene la escena animada en un espacio propio, con controles de estado y acciones separados del avatar. La conversación escrita aparece en un historial visible encima del formulario existente, sin crear un segundo sistema de respuesta; tanto voz como texto siguen la misma función `handleSpeech`, con localización compartida. Los mensajes de usuario entran al enviar el formulario y las respuestas de Robotito se muestran cuando se completa la respuesta. El historial UI es temporal, limitado a 20 mensajes y 12 propietarios, sin almacenamiento adicional; al cambiar la identidad activa no se mezclan mensajes entre perfiles.

Mejoras de presentación: campos con tipografía de 16 px para evitar zoom automático en iOS, dimensiones táctiles de al menos 44 px, chat legible con texto largo, filas de acciones que fluyen sin tapar al avatar, barra de estado desplazable, apertura de teclado con desplazamiento del campo y manejo de anchos de 320–430 px y paisaje.

Regresiones: `npm run test:p25` comprueba límites, aislamiento, deduplicación y texto inerte. `npm run test:p25:browser` comprueba la geometría de escena/acciones/chat, anchura horizontal, envío real del formulario y respuesta de Robotito y dos perfiles simulados, incluida matriz móvil y paisaje. Se incluyeron en `npm run test:ci`.

**Límite de aceptación:** las pruebas de navegador emulado no sustituyen Android/iPhone físicos, teclados virtuales, VoiceOver/TalkBack ni una sesión prolongada en teléfonos estrechos con permisos denegados. Se debe probar antes de marcar el pedido cerrado por completo. «Chocar los cinco» permanece accesible.
