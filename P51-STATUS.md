# P51: reloj y cuenta regresiva

- Hora visual HH:MM:SS y fecha en idioma del usuario desde el reloj local del dispositivo.
- Hora hablada bajo pulsación explícita, con síntesis de voz nativa y seis idiomas si el navegador la ofrece; no se utiliza durante Modo Clase activo.
- Cuenta regresiva a la próxima hora elegida con paso de medianoche y cálculo según el huso horario local; se puede cancelar.
- Ninguna función pretende sincronización con un reloj oficial ni promete notificaciones cuando el navegador está cerrado.
- Pruebas de conversión, límites y cambio de día en `test:p51`; navegador en `test:p51:browser`; agregadas a `test:ci`.
- Pendiente aceptación real de pronunciación, DST/cambio horario, dispositivo físico, suspensión, accesibilidad y funcionamiento de idiomas.
