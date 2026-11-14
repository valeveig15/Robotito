# Punto 07 — copia local y recuperación de memoria

El botón **Descargar copia de seguridad** del panel **Memoria** exporta el contenido actual de las cuatro tablas de **IndexedDB** de Robotito (estado, registros tipados, audios/PDF binarios y marcadores de migración). Es una operación local y voluntaria: no hay subida automática a GitHub ni a ningún servidor.

## Privacidad y funcionamiento

- La copia contiene datos de múltiples personas, muestras de audio, identificadores, recuerdos, transcripciones o metadatos biométricos. **Por defecto el JSON continúa sin cifrar** para conservar compatibilidad. Activar **«Cifrar esta copia con una contraseña»** antes de descargar para proteger el archivo mediante AES-256-GCM con derivación PBKDF2-HMAC-SHA-256 (310.000 iteraciones, sal aleatoria de 128 bits y nonce aleatorio de 96 bits). La contraseña **nunca se almacena** ni se envía a servidores. Si se pierde, **no existe recuperación automática del respaldo cifrado**.
- Para restaurar una copia cifrada, escribir su contraseña en el campo local antes de seleccionar el archivo. El descifrado comprueba la integridad: contraseña errónea o archivo alterado no reemplazan los datos. Se aceptan también archivos JSON anteriores sin cifrar. No guardar copias sin cifrar en lugares compartidos ni adjuntarlas a incidencias.
- La copia es **de este navegador**, no de toda la cuenta ni de todos los dispositivos. No incluye datos ubicados exclusivamente en localStorage, archivos fuera de IndexedDB ni permisos del sistema.
- Antes de restaurar, Robotito exige haber preparado una copia actual en esa sesión, una confirmación afirmativa y escribir exactamente `RESTAURAR`. Hay que comprobar además que el navegador **efectivamente guardó** el archivo descargado.
- La restauración **reemplaza** las tablas IndexedDB, no combina historias. Mantiene etiquetas de propietarios originales (`local`, personas registradas y visitantes pseudónimos), sin vincular perfiles o identidades automáticamente.
- Los cuatro almacenes se escriben en **una sola transacción**. Un error de escritura o de cuota provoca el aborto de la transacción, en lugar de dejar la mitad de las tablas restauradas.
- El JSON se valida antes de modificar los datos: estructura, versión, IDs duplicados, tipos permitidos, tamaño de archivos y correspondencia entre cada registro y su audio. No instala código de un archivo importado.
- Límite intencional de un respaldo JSON: **32 MiB**, con **12 MiB por archivo binario**. Cuando se supera el límite, la exportación se rechaza sin entregar una copia incompleta. Un conjunto de clases o audios grandes podría requerir en el futuro un respaldo fragmentado. El cifrado opcional protege la confidencialidad e integridad del archivo, **no amplía** esos límites.
- Antes de restaurar, cerrar otras pestañas de Robotito para evitar cambios simultáneos. Después de una restauración exitosa, la página se recarga.
- **Reversibilidad:** para deshacer una restauración, conservar la copia descargada **antes** de sustituir datos y restaurarla explícitamente. La aplicación no dispone de un historial remoto automático.
- Para visitantes, el respaldo no es autorización para fusionar rostros ni identidades. El enlace voluntario al registro queda sujeto a un flujo adicional de consentimiento y verificación.

## Pruebas

Ejecutar `npm run test:p07:browser` (Chromium real con IndexedDB): exportación y restauración, aislamiento por propietario, PDF/audio binario, identificadores duplicados, bytes corruptos, confirmación rechazada y reemplazo de datos. Después ejecutar `npm run test:ci`.

**Limitaciones abiertas:** conservación de archivos individuales mayores de 12 MiB; backup/exportación de datos que solo viven en localStorage; restauración entre versiones incompatibles; concurrencia auténtica entre múltiples pestañas/dispositivos; reversión sin copia previa; asociación pseudónima consentida; validación de casos con archivos grandes reales. La restauración cifrada requiere Web Crypto y contexto seguro HTTPS/localhost, y no protege los datos mientras siguen almacenados en IndexedDB. No declarar el punto 7 concluido por una prueba en Chromium.
