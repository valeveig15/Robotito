# P07 — Memoria contextual, fechas y datos durables

Estado auditado el 14/11/2026: **EN PROGRESO**. Este documento separa funcionamiento comprobable de aceptación física o todavía pendiente.

## Base ya integrada en main antes del P07 actual

- IndexedDB v4 con 17 tipos de registros, índices por tipo/propietario/fecha, relaciones y blobs.
- Recuperación de recuerdos, conversaciones y clases con filtros por propietario, fecha, materia/tema y seis idiomas; nunca presentar una pregunta actual como prueba de un recuerdo.
- Migraciones idempotentes de datos históricos, estado y archivos; aislamiento de propietarios en recuperación.
- Copia local JSON de las cuatro tablas IndexedDB, validación estructural y restauración transaccional con confirmación explícita. Ver [P07-MEMORY-BACKUP.md](P07-MEMORY-BACKUP.md).

## Incremento en PR #118 — edición y borrado de recuerdos

- Crear un recuerdo nuevo ahora escribe a la vez el registro tipado y su vista antigua dentro de la misma transacción. Si falla, no queda una mitad del dato.
- El panel permite corregir y borrar recuerdos individualmente, con mensajes en español, inglés, portugués, francés, italiano y alemán.
- Las mutaciones exigen coincidencia exacta con propietario y versión esperada; si otra pestaña modificó la fila, no se sobrescribe sin aviso.
- Los IDs existentes no se pueden reutilizar para apropiarse de registros ajenos. El historial antiguo solo recibe un ID editable si coincide con una fila local migrada.
- El borrado individual elimina relaciones y archivos vinculados. La opción «Borrar recuerdos» elimina solo los del perfil activo, jamás los de otros propietarios.
- Se conserva «Chocar los cinco», sin cambios en P01–P06.

Las etiquetas de propietario evitan mezclas accidentales en el uso normal del panel y la recuperación, **pero no son autenticación ni aislamiento criptográfico** entre personas que comparten el mismo perfil de navegador.

## Incremento de copia cifrada opcional (PR posterior a #118)

- Exportación optativa a archivo cifrado localmente con Web Crypto AES-256-GCM, sal y nonce aleatorios por copia, PBKDF2-HMAC-SHA-256 con 310.000 iteraciones. Sin servidores, sin librerías externas ni almacenamiento de la contraseña.
- Importación de respaldos cifrados y archivos JSON originales sin cifrar; rechazo de contraseña errónea, contenido alterado, formato y parámetros inesperados. Confirmación destructiva original conservada.
- Botones, contraseñas y advertencias localizados a seis idiomas; contraseña nueva confirmada para evitar errores involuntarios.
- `tests/p07-encrypted-backup-browser.js` prueba un ciclo completo con audio binario y perfiles, adulteración de archivo y UI real en navegadores.
- No da protección criptográfica a los datos que siguen en IndexedDB, ni supera el límite de tamaño existente.

## Incremento de restauración reversible (PR posterior al respaldo cifrado)

- Un checkpoint local del estado anterior se guarda **atómicamente** junto con la restauración. Si no hay capacidad suficiente o un registro no puede preservarse, la restauración aborta sin sustituir nada.
- Opciones de deshacer una vez (confirmación `DESHACER`) y descartar definitivamente el checkpoint; mensajes localizados a seis idiomas.
- El checkpoint interno queda fuera de los respaldos exportados, para que datos antiguos y posibles olvidos no reaparezcan en archivos compartidos.
- El borrado de recuerdos o audios invalida el checkpoint para impedir recuperación no deseada.
- Alcance limitado al mismo navegador y a 64 MiB estimados. No sustituye un respaldo externo ni protege si el almacenamiento se elimina.

## Puertas de calidad

- Repetir `npm run test:memory`, `npm run test:p07:browser` y `npm run test:ci` en la rama.
- Verificar regresión de propietario, recuperación temporal, modificación/borrado, rechazo de cambios desactualizados, preservación de otras personas, exportación/restauración y pruebas en Chromium/Firefox/WebKit.
- Fusionar el PR solo si el HEAD exacto tiene todos los trabajos exigidos aprobados. Verificar nuevamente CI y publicación de Pages tras fusionar.

## Limitaciones y tareas sin resolver: no declarar P07 completo

1. **Archivos grandes:** respaldo JSON tiene tope de 32 MiB y 12 MiB por blob. Falta empaquetado o transmisión fragmentada, importación/exportación bajo cuota y prueba con archivos realmente grandes.
2. **Privacidad de respaldo:** disponible exportación cifrada voluntaria, cuya aceptación multiplataforma depende de CI. El JSON antiguo no cifrado sigue disponible para compatibilidad. Falta cifrado en reposo de datos dentro de IndexedDB y políticas claras de contraseñas/custodia; si se olvida la contraseña de un respaldo cifrado, no se puede recuperar.
3. **Datos complementarios y versiones:** localStorage y archivos externos no se incluyen; restauración de versiones futuras/antiguas no compatible aún. Probar cambios de versión e interrupciones de migración.
4. **Deshacer y recuperación:** hay un checkpoint transaccional local de un paso y opción de borrarlo, sujeto a CI del nuevo PR y al límite de 64 MiB. Falta recuperación ante pérdida total del dispositivo, límites de almacenamiento y varias pestañas; se recomienda mantener una copia externa.
5. **Concurrencia y resiliencia:** faltan pruebas de exportación/restauración con escritura en otra pestaña, bloqueo/recarga y fallos de cuota o energía; el control de versión del PR solo cubre mutaciones individuales de recuerdos.
6. **Visitantes pseudónimos:** falta vinculación explícita, verificable y reversible con registro y consentimiento vigente. Nunca asociar identidades automáticamente por rostro, voz o nombre coincidente.
7. **Escala y dispositivos:** probar cientos de miles de recuerdos, múltiples blobs, Android/iPhone/escritorio, borrado con fallos y recuperación real. CI sintética no es certificación del hardware.

Mantener estos pendientes hasta contar con implementación conectada y evidencia. No iniciar P08 por considerar terminada únicamente la edición de recuerdos.
