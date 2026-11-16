# Aclaraciones de experiencia de Robotito — 15/11/2026

## Órdenes habladas y horarios
El usuario puede decir o escribir, por ejemplo, «En 5 minutos decime tomar agua» o «decime tomar agua en 5 minutos». La acción se registra **solo en la sesión del navegador**, se procesa por el motor temporal existente y no aparece en la lista ni en el almacenamiento de Horarios. Requiere la página abierta y visible; no es una alarma de sistema operativo y puede perderse al cerrar la pestaña. Se admiten instrucciones condicionales temporales en sesión y repeticiones limitadas, sin ejecutar código ni acciones destructivas.

La pestaña anteriormente llamada «Órdenes y reglas» ahora dice **Horarios**. Guardar ahí es una acción voluntaria para quien quiera mantener recordatorios escritos y recurrentes. La información previamente guardada conserva su formato y no se elimina. La propiedad `persist:true` es explícita solo en el formulario de Horarios; el chat y la voz utilizan `persist:false`.

## Encendido y selección
Se elimina el botón visible «Detener cámara y micrófono». El procedimiento interno de detener captura **se conserva** para limpiar permisos, dispositivos desconectados, cerrar el contexto o evitar mezclas de sesiones. No se promete captura perpetua en segundo plano ni acceso a hardware denegado.

Hay un botón **Cambiar avatar** y selector **Idioma** en la barra superior. Reabren el selector original o cambian idioma de la misma sesión sin reiniciar al avatar. El selector inicial aún funciona y se conserva el avatar preferido entre visitas. No se muestran los nombres de las especies en pantalla; la descripción accesible se mantiene para lectores de pantalla.

## Chat y jerarquía
El formulario `#robotitoTextForm` va después del HUD, las acciones y el historial de respuestas, en la base del área de controles. La luna, estrellas y sol pertenecen solo a `.world-scene` y no participan en el reconocimiento de clics. El formulario es interactivo, con foco visible y altura táctil.

## Validación
- `npm run test:p10-p11`: órdenes temporales, instrucciones transitorias sin almacenamiento y recordatorios explícitamente persistentes.
- `npm run test:ui-clarifications:browser`: selección inicial, cambio posterior de avatar e idioma, ausencia del botón de detener, nombres de especies no visibles, campo inferior accesible de día/noche, foco y envío de texto en distintos tamaños.
- `npm run test:ci`: regresiones históricas, navegador Chromium y nuevas verificaciones.
- Probar también Firefox/WebKit y, cuando se disponga de dispositivos, Android/iPhone reales y lector de pantalla. El funcionamiento continuo de micrófono/cámara depende de permisos del navegador; no afirmar validación física donde no existe.

**Regresión irrenunciable:** conservar «Chocar los cinco».
