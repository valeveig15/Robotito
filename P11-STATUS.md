# P11 — Reglas personales seguras y modulares

Estado: **software en revisión**; automatizaciones únicamente con la pestaña abierta, nunca se prometen notificaciones externas ni ejecución en segundo plano.

## Implementado

- Motor `custom-rules.js` aislado, sin `eval`, expresiones JavaScript ni llamadas a red; parser restringido de `si/cuando X, hacé Y` en idiomas admitidos y reglas editables desde la pestaña Tareas.
- Eventos que puede escuchar cuando realmente están disponibles: una frase textual exacta, un sonido que haya aprobado la política de percepción existente, una persona visible, ausencia observada durante diez segundos, hora del día y una interacción real.
- Acciones autorizadas únicamente: decir texto corto, recordar mediante una respuesta hablada de esta sesión, cambiar a un estado emocional permitido y conservar la acción Chocar los cinco.
- Máximo 50 reglas por propietario, prioridad entre 0 y 5, enfriamiento mínimo de 60 segundos, a lo sumo una regla ganadora por evento; desactivación, corrección y eliminación sin ejecutar código externo.
- Las reglas del perfil se guardan como datos con revisión monotónica en IndexedDB y actualización transaccional CAS: dos pestañas no pueden reservar la misma ejecución sin conflicto detectable.
- Los eventos de reglas no se reinyectan al motor: las respuestas no generan nuevas reglas ni pueden iniciar bucles. Los permisos, visibilidad de pestaña, modo clase, sueño y habla propia impiden ejecuciones inapropiadas.
- La UI indica expresamente que **no hay un agente que vigile en segundo plano**: al cerrar la pestaña se detienen los eventos y recordatorios; no se solicitan permisos ocultos ni notificaciones persistentes.
- Las reglas por persona se retiran al borrar un perfil registrado mediante P08.

## Pruebas

- `npm run test:p11`: gramática y rechazo de acciones peligrosas, prioridad/conflictos, cooldown, propietario, concurrencia, ciclo, desactivación y activación.
- `npm run test:p11:browser`: guardar, reabrir, ejecutar, desactivar y recuperar reglas en la UI real. Las tres suites de navegador se mantienen en CI.

## Criterios sin cerrar

- Las reglas acústicas y visuales siguen dependiendo de modelos/calibración P03/P04/P08: la suite no mide su precisión sobre sonidos, personas o hardware reales.
- Los recordatorios de horario solo se ejecutan mientras Robotito esté abierto, activo y el temporizador del navegador no esté suspendido. Para avisos con la pestaña cerrada será necesaria una infraestructura externa o una extensión/sistema de alarmas con autorización explícita, fuera de este punto.
- Aumentar la cobertura lingüística con usuarios de cada idioma y evaluar permisos en Android/iPhone/escritorio reales. No exponer datos de un propietario a otro al compartir perfil del navegador.

**No declarar capacidad en segundo plano ni precisión física sin ensayos.** La implementación de software debe superar la CI final antes de fusionarse. Se conserva «Chocar los cinco».
