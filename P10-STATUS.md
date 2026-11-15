# P10 — Órdenes temporales, reproducción y repetición

**Estado: funcionalidad de software en progreso, sujeta a CI y validación en navegadores.**

## Integración existente que se conserva

- Repetición de respuestas y seguimiento conversacional por propietario en el planificador semántico.
- Reproducción y detención de voces, muestras locales autorizadas y grabaciones de clases; todo lo anterior permanece sin cambios.
- Fechas relativas de `nlu-temporal.js` para memoria, clases y tareas; no se sustituyó ni duplicó su resolución.

## Incremento P10

- `temporal-rules.js` interpreta expresiones explícitas de tiempo relativo para generar recordatorios de una sola vez: «En 5 minutos decime tomar agua».
- También admite repetición **finita**, de 2 a 12 veces: «Cada 10 minutos por 3 veces decime estirar».
- Las instrucciones se guardan localmente por propietario. Un aviso solo se dice si la pestaña está abierta, visible y activa para ese mismo perfil.
- Las instrucciones vencidas por más de dos minutos se descartan, para evitar que una reanudación horas después repita una cascada de avisos. La cancelación está disponible desde la interfaz.
- Los tiempos aceptados están entre 1 segundo y 24 horas. No hay intervalos ilimitados, ejecución de código, navegación a URLs ni acceso automático a cámara o micrófono.
- La interfaz tiene etiquetas traducidas en seis idiomas y ejemplos. Las expresiones admitidas son deliberadamente estrictas: ante ambigüedad no se programa una tarea.

## Pruebas y aceptación pendiente

- `npm run test:p10-p11`: reglas reales, caducidad, límites, aislación por propietario, recarga y cancelación.
- `npm run test:p10-p11:browser`: funcionamiento del panel, persistencia y repetición finita en Chromium/Firefox/WebKit.
- `npm run test:ci`: regresiones anteriores, voz, memoria, multimedia y «Chocar los cinco».
- Aún no existen notificaciones de sistema ni ejecución con la pestaña cerrada. Para esa capacidad harían falta Service Worker/notificaciones aprobadas y una estrategia de entrega soportada por navegador.
- Se requiere validación en Android, iPhone y equipos reales, especialmente cuando se bloquea pantalla, suspende el proceso o cambia la hora.
- Las órdenes pueden competir entre pestañas y el almacenamiento local no tiene garantía de atomicidad entre dispositivos: se necesitan pruebas de simultaneidad y una coordinación opcional para evitar dobles avisos.
- La repetición de grabaciones de audio privadas sigue requiriendo controles manuales y consentimiento; no se programó reproducción automática de muestras de terceros.

**No declarar cumplimiento universal ni ejecución en segundo plano.**
