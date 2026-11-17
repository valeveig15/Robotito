# Memoria duradera por dispositivo — continuación al reingresar

## Implementación
- **Modo de dispositivo personal optativo:** la pestaña Memoria permite habilitar explícitamente la continuidad local. Se pide confirmación antes de guardar conversaciones nuevas para próximos accesos. La elección se guarda en `localStorage`, y los registros se guardan en IndexedDB con un identificador aleatorio `device:<UUID>` que se reutiliza en ese mismo navegador/perfil.
- Al volver a abrir Robotito se recuperan automáticamente los recuerdos, historial de conversación, preferencias, tareas, clases, materiales, libros y otras colecciones **que el motor realmente haya guardado**. La conversación visual muestra los 20 intercambios más recientes, pero el historial IndexedDB no se recorta a 20.
- Las preguntas de texto y voz se registran al inicio del procesamiento, incluidas las órdenes atendidas antes de la planificación general. Las subacciones de una misma orden no generan duplicados. Se conserva el guardado normal de respuestas y recuerdos.
- Al desactivar la opción, el navegador vuelve al modo visitante temporal: no se elimina la memoria previamente guardada del dispositivo y puede retomarse volviendo a habilitar la opción. «Nuevo visitante sin historial» desactiva el modo personal y abre una sesión temporal diferente sin borrar el historial persistente.
- Los perfiles de personas identificadas siguen teniendo sus historias separadas y requieren la comprobación existente. El modo de dispositivo se debe activar **solo** en dispositivos personales; en dispositivos compartidos otras personas con acceso al mismo perfil de navegador podrían ver ese historial.
- No se reactivan automáticamente micrófono ni cámara: el navegador puede exigir permiso y una acción de usuario. Despertar los sentidos es independiente de recuperar la memoria.

## Limitaciones reales
El almacenamiento local no equivale a una copia indestructible. Navegación privada, borrar datos del sitio, cambiar de navegador/perfil, desinstalar la aplicación o la expulsión del almacenamiento por el sistema pueden eliminar los datos. La sincronización entre dispositivos no se implementa. Para preservar el historial incluso ante pérdida del dispositivo, utilizar el respaldo cifrado disponible en Robotito.
Los recuerdos de visitantes anteriores que solo estuvieron en RAM **no pueden recuperarse retroactivamente**. Tampoco se promete grabar sonidos ajenos sin permisos ni conservar cada estado instantáneo de la cámara: se almacenan los datos y acciones que efectivamente captura el sistema.

## Verificación
`npm run test:persistent-device:browser` prueba consentimiento, persistencia de ID, mensajes, recuerdos, recarga, separación de visitantes, desactivación sin pérdida y retoma. Se incluye en `test:ci` y `test:browser:extended`. Falta corroborar Android/iOS físicos, cuota y borrado de datos, pestañas concurrentes, exportación/restauración y permisos.
