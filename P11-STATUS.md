# P11 — Reglas personalizadas «si/cuando X, hacé Y»

Revisión: 23/11/2026, [PR #176](https://github.com/valeveig15/Robotito/pull/176). **Motor declarativo integrado y probado en su alcance; validación física pendiente.** Ver [P01-P12-AUDIT.md](P01-P12-AUDIT.md).

## Reglas y administración

- Disparadores por frase normalizada, reloj diario, recordatorio relativo y repetición finita. La respuesta conserva su texto literal. La única acción del motor es decir el mensaje; no ejecuta código, URLs ni órdenes incluidas en ese mensaje.
- Consulta, edición de respuesta, pausa, reactivación, cancelación y prioridad 0–9 mediante órdenes numeradas en seis idiomas. El panel muestra número, descripción, pausa/reactivación y borrado. Editar una regla persistida conserva su ámbito; crear una regla en conversación no la guarda automáticamente en Horarios.
- Prioridad determinista, enfriamiento de cinco segundos para frases y rechazo de ciclos de respuestas. Límites: 40 instrucciones, respuesta de 240 caracteres, disparador de 90 y repeticiones de 2 a 12.
- La revisión transaccional evita entrega duplicada del mismo aviso guardado entre dos pestañas en el escenario probado. Si hay más de tres avisos vencidos, el resto queda pendiente; Modo Clase no consume ni dice avisos.

## Condiciones de percepción

La gramática admite hasta tres condiciones combinadas mediante «y» u «o»: aplauso confirmado, música confirmada, persona visible y ausencia visual sostenida. Puede exigir permanencia de hasta 60 segundos; ausencia exige al menos tres segundos. No admite combinaciones arbitrarias de todos los operadores ni cualquier evento del mundo.

Los eventos proceden del adaptador de la aplicación: captura vigente, pista activa, permiso, evidencia reciente y continuidad de sesión. Visión requiere dos cuadros independientes; audio reutiliza las políticas existentes de reacción/música. Cambiar de historial, interrumpir captura u ocultar la página invalida la evidencia. Una condición sostenida no se repite en cada cuadro; debe dejar de cumplirse para rearmarse.

Estas reglas **no habilitan** reacciones humanas de tos/risa/llanto/estornudo sin aprobación de P03, ni activan cámara/micrófono por sí solas. Presencia visual no confirma identidad. Modo Clase, síntesis propia, sueño, inscripción biométrica, muestras y reproducción de clases bloquean su ejecución.

## Evidencia y límites

- `tests/p10-p11-temporal-rules-regression.js`: reglas históricas, perfiles, caducidad, recarga y límites.
- `tests/p11-rules-audit-regression.js`: 52 comprobaciones de idiomas, gestión, prioridad, ciclos, permiso, antigüedad, continuidad y combinaciones.
- `tests/p11-rules-audit-browser.js`: siete comprobaciones principales; cinco avisos durante Modo Clase, edición transitoria, adaptador con pistas simuladas, entrega única entre pestañas y cambio de persona durante una lista demorada. Este último caso reprodujo una divulgación de respuestas privadas; ahora la respuesta se descarta al cambiar de historial.
- `npm run test:p10-p11:browser` integra esos recorridos; la matriz de CI los ejecuta en Chromium, Firefox y WebKit.

Pendientes: precisión de sensores con participantes/hardware reales, variantes lingüísticas independientes y cambios de hora/DST. No hay ejecución con pestaña cerrada ni coordinación entre dispositivos. Compartir el perfil del navegador no es autenticación fuerte; las reglas ordinarias no se cifran en reposo. No se garantiza entrega ante cierre abrupto entre guardar el estado y emitir voz. «Chocar los cinco» se conserva.
