# P07 — Copias y recuperación de memoria

En **Memoria → Descargar copia de seguridad** se puede elegir entre dos formatos:

| Formato | Incluye | Límite |
|---|---|---|
| Completo `.robotito` (predeterminado) | Cuatro tablas IndexedDB, archivos finalizados y preferencias `robotito.*` | 256 MiB en total; 128 MiB por archivo; 32 MiB de metadata; 50.000 filas por tabla |
| JSON compatible | Cuatro tablas IndexedDB, con archivos codificados en base64 | 32 MiB de JSON; 12 MiB por archivo |

Las sesiones temporales en RAM y el punto de recuperación interno quedan fuera de ambas copias. No se exportan permisos del sistema, pestañas abiertas ni archivos que no se hayan incorporado a Robotito. El formato completo no puede abrirse en versiones antiguas de la aplicación; para ellas se conserva JSON.

## Crear la copia

1. Terminá las clases y grabaciones en curso y esperá a que se guarden.
2. Elegí el formato. Para datos privados, activá **Cifrar esta copia con una contraseña**, introducí una contraseña de 12 a 256 caracteres y repetila.
3. Descargá y comprobá que el navegador guardó el archivo. Guardá la contraseña por separado.

El cifrado ocurre localmente mediante Web Crypto AES-256-GCM, PBKDF2-HMAC-SHA-256 con 310.000 iteraciones, sal aleatoria de 128 bits y nonce de 96 bits. La contraseña no se guarda ni se envía. Sin contraseña, el archivo puede ser leído por quien tenga acceso a él. El SHA-256 del formato sin cifrar detecta corrupción accidental; no autentica al autor.

La copia abarca **todos los historiales guardados en ese navegador**, incluidas muestras y perfiles. No es una exportación de una sola persona ni un respaldo de toda la cuenta. No se sube automáticamente a ningún servidor.

## Restaurar y deshacer

1. Prepará primero una copia actual desde el mismo panel.
2. Si el archivo está cifrado, introducí su contraseña en el campo de restauración.
3. Seleccioná el archivo, confirmá y escribí `RESTAURAR`.

La importación valida estructura, versión, IDs, relaciones de archivos y propietarios antes de sustituir datos. Acepta versiones de base 3 y 4 y JSON anterior, cifrado o sin cifrar. Una versión futura, contraseña errónea, archivo alterado o truncado se rechaza. **Restaurar reemplaza los historiales; no los fusiona ni confirma identidades.**

Las cuatro tablas y el punto de recuperación anterior se escriben en una sola transacción IndexedDB. Si falla la escritura o falta cuota, no se reemplazan parcialmente. El punto de recuperación tiene un límite estimado de 256 MiB y 50.000 filas por tabla. La pestaña que restaura se recarga; otras pestañas anteriores quedan impedidas de escribir hasta recargarse.

Las preferencias del formato completo se aplican después de confirmar la transacción. Si localStorage falla, los datos ya están restaurados: el aviso lo explica y la aplicación reintenta las preferencias al recargar. No se promete una transacción conjunta entre ambas APIs.

**Deshacer última restauración** pide confirmar y escribir `DESHACER`. Recupera una vez el estado anterior, incluso después de recargar. Reemplaza los cambios realizados después de restaurar y consume ese punto; no ofrece una cadena de deshacer. **Eliminar punto de recuperación** lo descarta de forma expresa.

El borrado de recuerdos, registros, audios o de un historial invalida también la recuperación local para impedir que un deshacer resucite datos borrados. Las copias descargadas deben eliminarse por separado.

## Alcance comprobado

`npm run test:p07:browser` conserva las suites JSON/cifrado/deshacer originales y añade un ciclo con **17.825.795 bytes binarios**, comparación exacta, archivo cifrado, corrupción, propietario incorrecto, cuota simulada, reversión y pestaña desactualizada. La matriz de CI ejecuta los recorridos en Chromium, Firefox y WebKit.

El tamaño máximo anunciado es un límite de formato, no una promesa de capacidad para todo teléfono. Las operaciones usan memoria y espacio adicionales. No hay recuperación sin una copia externa cuando se pierde el dispositivo, ni recuperación de una contraseña olvidada. El cifrado del archivo no cifra la base IndexedDB ordinaria en reposo. La continuidad voluntaria por clave de visitante y su vinculación reversible se describen en [P07-STATUS.md](P07-STATUS.md).
