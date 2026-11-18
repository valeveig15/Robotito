# P76–P78: Modo Clase y marcadores cronometrados

## Implementado
- **76**: acceso visible de «Modo Clase» en barra superior, indicador rojo con texto explícito y `role=status` durante una clase activa. El botón no enciende audio por sí mismo: abre la sección Clase y conserva el flujo de permisos existente.
- **77**: marcadores de cuatro colores (amarillo/verde/azul/rosa), nota opcional y tiempo aproximado de clase. Se limitan a 500 por perfil y se conservan por separado en el almacenamiento IndexedDB de ese propietario. Permite borrarlos sin tocar grabaciones.
- **78 (parcial)**: las grabaciones exponen su `sessionId`, y los marcadores pueden llevar a una posición temporal de la grabación del mismo `sessionId` y resaltarse durante la reproducción. Si se borró o no existe audio asociado, el sistema lo reconoce y **no reproduce una grabación incorrecta**.
- Los marcadores no crean ni guardan audio por sí mismos. El modo de clase, transcripción, reconocimiento y archivos existentes se mantienen.

## Aceptación pendiente
- **P78 completo** exige marcas temporales fiables por segmento o palabra de la transcripción real, sincronización bidireccional precisa, edición de transcripciones con conservación de la referencia al audio y pruebas de latencia; solo enlazamos marcas de minuto/segundo aproximadas.
- **P77** requiere validar visualmente colores, tiempos y grabaciones reales en móviles y distintos códecs, permisos denegados y navegación por teclado/lector de pantalla.
- **P76** requiere verificar enfoque, superposiciones y audición de estados por lectores de pantalla en Android/iOS.
- No se afirma que las grabaciones se crean sin autorización ni que estas pruebas sintéticas constituyen validación física.

## Pruebas
- `npm run test:p76-p78`: colores, datos válidos, límites de offsets, asociación y algoritmo de ubicación por tiempo.
- `npm run test:p76-p78:browser`: entrada a clase, indicador, marcador con y sin sesión, restauración local y error honesto de audio ausente.
- Incorporadas a `test:ci`.
