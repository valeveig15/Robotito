# Robotito — revisión de los puntos 1 al 12

Fecha: 25/11/2026. Fuente: `Robotito_82_pedidos_completos-1.docx` y pedido expreso de revisar los doce puntos. Cambios: [PR #176](https://github.com/valeveig15/Robotito/pull/176).

Se revisaron código, integración, datos, documentación y pruebas de cada punto. Se corrigieron fallos concretos en traducción de recordatorios, aislamiento de audios, reproducción por fecha, reglas y recuperación de clases interrumpidas. Los doce puntos **no se declaran completamente certificados**: varias condiciones requieren personas, corpus independientes, modelos disponibles y dispositivos físicos.

## Resultado por punto

| Punto | Resultado de la revisión de software | Qué falta para aceptación integral |
| --- | --- | --- |
| [01 — Semántica](P01-STATUS.md) | Planificador central, seis idiomas, contexto, negaciones y permisos conservados; reproducción de clases como acción autorizada. | Corpus humano independiente y generalización abierta; las familias finitas no demuestran entender cualquier formulación. |
| [02 — Pruebas](P02-STATUS.md) | Regresión, tres semillas, escenarios adversos, responsive y tres motores; nuevas regresiones incorporadas a CI. | Dispositivos físicos. CI no equivale a todos los entornos posibles. |
| [03 — Sonidos](P03-STATUS.md) | Captura, supresión de voz propia, políticas, laboratorio y evaluadores conservados. Reacciones humanas sin calibrar deshabilitadas. | Corpus real autorizado/revisado, precisión, falsos avisos, latencia y observación física. Sigue bloqueado el cierre de P03. |
| [04 — Captación e identidad](P04-STATUS.md) | Segmentación, cancelación, revocación, sesiones y voz/rostro independientes; reproducción propia no alimenta reconocimiento. | ASR/latencia por idioma/micrófono, ruido, luz y personas parecidas. |
| [05 — Idiomas](P05-STATUS.md) | Descripciones/estados de Horarios corregidos en seis idiomas; recuperación localizada y originales preservados. | Traducción libre sin modelo local compatible, corpus independiente y pronunciación física. |
| [06 — Voces](P06-STATUS.md) | Selección/prueba/cancelación de voces del sistema, estilos y muestras consentidas con borrado; sin Gravedad visible. | Disponibilidad/calidad acústica por sistema e idioma. Estilos no equivalen a voces nuevas ni clonación. |
| [07 — Memoria](P07-STATUS.md) | Registros, fuentes, fechas, ámbitos, backup y vínculos reversibles; corregido audio visible al cambiar de perfil y edición/borrado sin revisión. | Recursos/cuota/energía reales y precisión de atribución. Anónimos temporales; sin sincronización automática. |
| [08 — Personas registradas](P08-STATUS.md) | Consentimiento, varias muestras, abstención, aislamiento de voz/rostro y borrado conservados y sometidos a regresión. | Calibración, falsas aceptaciones/rechazos con personas reales. No es autenticación fuerte. |
| [09 — Visitantes](P09-STATUS.md) | Bóveda cifrada opcional, seguimiento efímero sin permiso, vínculos revisados y eliminación conservados. | Reencuentros prolongados, personas parecidas, condiciones adversas y hardware real. |
| [10 — Tiempo y reproducción](P10-STATUS.md) | Archivo propio por fecha/materia si hay coincidencia única; aclara ambigüedad/ausencia; repetición literal y recordatorios. | Órdenes habladas y equipos reales. Página visible requerida; sin alarmas con pestaña cerrada. |
| [11 — Reglas](P11-STATUS.md) | Gestión, prioridades, ciclos y combinaciones acotadas de sensores; avisos sin pérdida por el límite de tres ni duplicación entre dos pestañas en el escenario probado; listas demoradas descartadas al cambiar de persona. | Precisión física, lenguaje independiente y cambios horarios. Eventos sin fuente verificable no habilitados. |
| [12 — Modo Clase](P12-STATUS.md) | Fragmentos atómicos, cierre fiable, recuperación tras recarga, archivo parcial honesto y limpieza de pistas; audio generado grabado/reproducido sin red. | Clases de horas, suspensión/energía/cuota reales y exactitud ASR. Máximos: 128 MiB por grabación y 8 MiB de cola. |

## Evidencia reproducible

| Comando / comprobación | Qué verifica |
| --- | --- |
| `npm test` | Suites Node de semántica, memoria, sonido, identidad, idiomas, voces, reglas y funcionalidades posteriores conservadas. |
| `npm run test:ci` | Batería general, Chromium, matrices y suites registradas, incluidas las nuevas de P12. |
| `npm run test:p05:browser` | Recordatorios en seis idiomas y texto literal sin inyección HTML. |
| `npm run test:p07:browser` | Memoria, backup binario, migración, transacciones, propietario y privacidad de audio. |
| `npm run test:p10-p11` / `npm run test:p10-p11:browser` | Autorización/reproducción, gestión, prioridades, condiciones, silencio de clase y dos pestañas. |
| `npm run test:p12:browser` | 20 comprobaciones de recuperación; cuatro de captura nativa/reproducción o rechazo seguro si falta la API en WebKit/Linux, y siete de fallos provocados. El informe distingue cada recorrido. |
| CI `cross-browser.yml` | Matrices, suites extendidas y permisos en Firefox/WebKit; grabación nativa WebKit en macOS; Chromium en regresión. |

Las verificaciones focalizadas se ejecutaron durante cada incremento. La batería completa `npm run test:ci` pasó localmente el 24/11/2026, incluida la corrección de la prueba antigua que permitía borrar audio sin atribuir desde otro historial. La revisión del 25/11 añade regresión de cierre bloqueado y distingue la ausencia de MediaRecorder en WebKit/Linux; el job macOS exige grabación nativa. Los resultados definitivos de integración son los checks asociados al **HEAD final** del [PR #176](https://github.com/valeveig15/Robotito/pull/176/checks); un resultado de un commit anterior no autoriza integrar uno nuevo. No se suman aserciones repetidas como participantes, frases independientes u horas grabadas.

## Compatibilidad y condiciones conservadas

- «Chocar los cinco», avatares aprobados y funcionalidades posteriores de gestos, libros y estudio conservados al incorporar `main`.
- Sin botón público de detener cámara/micrófono; cancelación interna, revocación, cierre de pistas y protección por ciclo de vida conservados.
- Órdenes conversacionales en RAM; guardar en Horarios requiere acción explícita.
- Historial persistente según ámbito/consentimiento; material antiguo sin atribuir no se asigna al visitante actual.
- Los bloques históricos de [PENDIENTES-PERMANENTES.md](PENDIENTES-PERMANENTES.md) y [PENDIENTES_CONTROLABLES.md](PENDIENTES_CONTROLABLES.md) siguen vigentes donde no exista evidencia de cierre.

El cierre físico requiere ensayos voluntarios, grabaciones autorizadas, separación de calibración/prueba y categorías de equipos, midiendo denominadores, errores y latencias. Las herramientas de P03/P04/P06/P08 preparan esa evaluación; no reemplazan su ejecución ni justifican inventar resultados.
