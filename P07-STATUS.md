# P07 — Memoria contextual, fechas y datos durables

Revisión del 16/11/2026. **Implementación de software terminada en el alcance documentado; validación física pendiente.** La aceptación automatizada y la publicación deben corresponder al HEAD final del PR. No equivale a certificar dispositivos ni identificación biométrica.

## Funcionalidad integrada

- IndexedDB v4 conserva registros tipados, archivos y migraciones compatibles. Se añade el tipo `relationships` sin romper los tipos anteriores.
- Recuperación por propietario, categoría, fecha y tema. «Ayer», «la última vez», «hace una semana», fechas ISO y fechas de calendario se resuelven sin inventar recuerdos. Una fecha imposible no devuelve datos de otra fecha. La búsqueda recorre todo el historial del propietario, incluso cuando la coincidencia queda fuera de los primeros 100 registros.
- El planificador autoriza la consulta antes de recuperar datos; seis idiomas cubiertos en pruebas del recorrido real planificador→buscador. Órdenes negadas, citas y preguntas generales no habilitan búsquedas privadas.
- Sesiones sin identidad confirmada permanecen en RAM y no entran al respaldo. La recarga crea otra sesión. Un cambio de propietario oculta el historial anterior antes de cargar el siguiente y descarta respuestas demoradas de otro propietario.
- Personas registradas requieren la confirmación de voz reciente de P08 y coherencia con el rostro si está presente. La nueva separación no convierte un nombre, una cara aislada o una clave de visitante en autenticación biométrica.
- Clases, transcripciones, apuntes, libros, tareas, recuerdos y preferencias personales usan ámbitos separados. Los recordatorios guardados expresamente en Horarios (P10/P11), tareas nativas de P18 y evidencias de vídeo de P22 también se integran en colecciones tipadas por propietario; las capturas de vídeo conservan su propietario inicial.
- Los datos antiguos explícitamente atribuidos conservan su perfil. Los datos compartidos o sin atribución se guardan en `legacy:unassigned`, visibles en el archivo anterior de solo lectura, sin asignarlos al siguiente visitante. La migración del planificador/vídeos antiguos conserva los datos antes de retirar la copia de localStorage.
- Corrección y borrado por ID, propietario y revisión. Conflictos entre pestañas se rechazan sin sobrescritura silenciosa; los cambios en colecciones actualizan las revisiones de los registros. El borrado de un historial elimina sus archivos y conserva los demás, incluso con nombres que comparten prefijos.

Las órdenes dadas en conversación conservan el comportamiento transitorio del PR #150: no se escriben en Horarios. El chat visible de P25 se cambia inmediatamente junto con el propietario, sin esperar al siguiente mensaje.

## Visitantes y reversibilidad

El panel Memoria permite crear un historial pseudónimo con consentimiento explícito. La clave privada permite retomarlo manualmente; solo se guarda un hash del secreto. Una recarga no identifica automáticamente al visitante y los recuerdos anónimos anteriores no se transfieren.

Para vincular el historial a un perfil registrado se revisan el destino y el número de registros, se escribe el nombre de destino y se comprueba otra vez la revisión del historial dentro de una transacción. Se conservan relaciones, archivos y colecciones, con procedencia `identityConfirmed: false`. La clave permite deshacer una vinculación equivocada: devuelve los registros, mantiene las correcciones posteriores y no resucita lo eliminado.

Este flujo es continuidad voluntaria del historial. La bóveda biométrica de P09 conserva su propio consentimiento y cifrado; la clave de historial no sustituye su evaluación ni convierte sus vínculos biométricos en enlaces reversibles.

## Copia, restauración y concurrencia

Ver [P07-MEMORY-BACKUP.md](P07-MEMORY-BACKUP.md).

- Formato binario completo hasta 256 MiB y 128 MiB por archivo, con comprobaciones de estructura, propietarios, tamaños y SHA-256. La metadata tiene un límite de 32 MiB y cada tabla admite hasta 50.000 filas.
- Cifrado optativo AES-256-GCM, PBKDF2-SHA-256 con 310.000 iteraciones y valores aleatorios por exportación. Contraseña nunca guardada. Compatibilidad con JSON anterior sin cifrar o cifrado; versiones de base 3 y 4 aceptadas, versiones futuras rechazadas antes de escribir.
- Estado, registros, archivos y migraciones se reemplazan juntos y se conserva un único punto de recuperación en la misma transacción. Deshacer funciona después de recargar y consume el punto de recuperación.
- Un cambio de generación impide que una pestaña abierta antes de restaurar escriba datos anteriores sobre el estado restaurado. Es necesario recargar esa pestaña antes de seguir escribiendo.
- El formato completo incluye preferencias `robotito.*`. IndexedDB y localStorage no comparten transacción: las preferencias se aplican desde una operación pendiente recuperable. Si falla, la interfaz distingue los datos ya restaurados y permite reintentar al recargar.
- El respaldo excluye sesiones temporales y el punto de recuperación interno. El borrado invalida la recuperación para evitar resucitar datos eliminados. Las grabaciones activas deben finalizar antes de exportar o restaurar.

## Evidencia reproducible

| Prueba | Alcance |
|---|---|
| `tests/p07-contextual-memory-regression.js` | 88 comprobaciones: seis idiomas, fechas, planificador real, ausencia de evidencia, propietario, negación, citas y búsqueda fuera de la primera ventana |
| `tests/p07-memory-browser.js` | 34 comprobaciones: sesión temporal, consentimiento, recarga, edición, vínculo/deshacer, carreras entre pestañas, borrado y actualización real de IndexedDB v3 |
| `tests/p07-archive-browser.js` | 36 comprobaciones: archivo binario de 17.825.795 bytes, igualdad exacta, contraseña equivocada, alteración, truncamiento, cuota fallida, restauración, deshacer, preferencias y pestaña desactualizada |
| `tests/p07-scoped-modules-browser.js` | 9 comprobaciones: tareas/vídeos/reglas por propietario, recarga, migración antigua, prefijos de nombres, archivos de sesión y deshacer después de corregir una tarea |
| Cuatro suites P07 históricas | JSON, edición/borrado con espejo antiguo, cifrado anterior, recuperación de un paso |
| `npm run test:ci` | Regresión del repositorio, incluidos P01–P26 y «Chocar los cinco» |
| CI `cross-browser` | Mismos recorridos de aplicación y P07 en Firefox y WebKit, además de Chromium en regresión |

## Límites de aceptación

Los límites son explícitos y un exceso se rechaza sin entregar una copia parcial. No se afirma haber probado 256 MiB ni 50.000 filas: el archivo binario automatizado pesa aproximadamente 17 MiB. Exportar/descifrar y crear el punto de recuperación necesitan memoria y cuota adicionales del dispositivo.

Las etiquetas de propietario previenen mezclas en los recorridos normales; no aíslan criptográficamente a personas que comparten el perfil del navegador. IndexedDB ordinario no se cifra en reposo. Los respaldos cifrados y la bóveda P09 tienen sus protecciones específicas.

No hay sincronización automática entre dispositivos. La pérdida del navegador/dispositivo requiere una copia descargada; perder su contraseña impide descifrarla. Siguen pendientes ensayos en Android/iPhone físicos, presión real de memoria/disco, pérdida de energía y exactitud de identidad con personas reales. Las pruebas de cuota usan un fallo inyectado en la escritura IndexedDB real, no una interrupción eléctrica.
