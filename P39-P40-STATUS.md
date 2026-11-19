# P39–P40 — Clubes de lectura, valoraciones y sorteo

## Implementación en software
- **P39**: permite crear clubes de lectura **locales** con nombre, libro, fecha de reunión y notas; listar y borrar clubes, exportar e importar planes en JSON validado por formato, tamaño y estructura. Ninguna operación pretende ser mensajería en tiempo real; compartir el archivo es una acción expresa del usuario. Los datos se guardan por propietario en IndexedDB, sin mezclar perfiles.
- Valoraciones con escala íntegra **1–5** para trama, personajes, mundo, escritura y ritmo. No hay promedios inventados: se obtiene la media de esos cinco campos. Se conserva un registro acotado de las últimas 1000 valoraciones por perfil y las últimas 12 se muestran en la interfaz.
- **P40**: sorteador entre libros de la estantería «Por leer» que elimina duplicados por título y autor y evita volver a elegir inmediatamente el mismo título cuando hay más de una opción. Usa números aleatorios de Web Crypto con rechazo de sesgo módulo, no `Math.random`.
- Broma del «libro abandonado» disponible solo al pulsar el botón; no genera reproches ni notificaciones automáticas.

## Validaciones y límites
- `npm run test:p39-p40` comprueba escala válida, valores fuera de rango, uniformidad por índice, exclusión de leídos, deduplicación, prevención de repetición, e importación con datos inválidos.
- `npm run test:p39-p40:browser` comprueba crear clubes, guardar valoraciones, sortear pendientes, broma y vuelta a entrar en perfil persistente.
- Ambas pruebas integradas en `test:ci`.
- **Pendiente para declarar 39 completo:** infraestructura multiusuario consentida, invitaciones seguras y chat sincronizado entre dispositivos, con permisos, moderación y pruebas reales. El planificador local y el archivo para compartir no constituyen un club conectado.
- **Pendiente para declarar 40 completo:** pruebas visuales y de accesibilidad en dispositivos Android/iPhone reales; verificar restauración de estanterías en almacenamiento real y comportamiento al eliminar libros.
- Se conservan los motores de identificación, memoria, voz, biblioteca y «Chocar los cinco».
