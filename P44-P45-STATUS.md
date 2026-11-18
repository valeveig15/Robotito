# P44–P45 · Capturas privadas y estadísticas locales consentidas

## P44 — Fotografía y captura de pantalla
- **Cámara:** el botón solicita `getUserMedia({video:true,audio:false})` solo tras pulsarlo. Vista previa local; «Tomar foto» obtiene PNG de un fotograma. No se realiza captura automática.
- **Pantalla:** el navegador abre su propio selector de `getDisplayMedia` **solo al pulsar el botón**; se captura un fotograma de lo seleccionado y se detienen las pistas. Robotito no escoge ventanas, no evita el consentimiento y no graba audio.
- La imagen se mantiene exclusivamente en RAM como `Blob` y URL temporal. El usuario decide «Guardar imagen PNG» (descarga local) o «Descartar». Se revocan URLs, se cierran permisos al ocultar la página/cambiar identidad y se muestra una reacción simpática sin evaluar quién aparece en la foto.
- Una cámara o un permiso denegado se comunican sin inventar capturas. No se sube a ningún servidor ni se incorpora a la memoria sin autorización posterior.

## P45 — Analítica consentida
- Contadores **desactivados por defecto**, opt-in explícito mediante casilla en Memoria.
- Solo se computa fecha local y categoría de interacción (preguntas enviadas, inicio de clase, búsqueda de recomendaciones, registros de sesión y creación de tareas). No se guardan textos de preguntas, audio, imágenes, geolocalización ni identidad externa en el registro.
- Almacenamiento en IndexedDB por propietario, siguiendo el aislamiento y modo visitante temporal existente. Retención máxima de 30 días; exportación voluntaria JSON, botón de borrado y posibilidad de desactivar nuevas cuentas sin destruir automáticamente el historial.
- Se cuentan **intentos/acciones de interfaz**, no se fingen respuestas acertadas, usuarios únicos, tasa de éxito o telemetría en la nube.
- No hay infraestructura analítica central ni envío de datos remoto.

## Pruebas y aceptación
- `npm run test:p45`: rechazo de categorías prohibidas, consentimiento, datos negativos, retención, acumulación.
- `npm run test:p44-p45:browser`: no se solicita cámara/selección al cargar, permisos denegados, descarga no disponible sin fotografía, activación/desactivación/borrado de métricas.
- Añadido a `test:ci`, sin tocar reconocimiento existente, gestos o «Chocar los cinco».
- **Pendiente para cierre completo**: pruebas reales Android/iOS de capturas y cancelación, validación de accesibilidad y captura de pantalla en Safari/Firefox/Chrome, política de privacidad revisada, cuota/memoria, preferencia de contenido/guardado, y evaluación de seguridad frente a pestañas compartidas.
