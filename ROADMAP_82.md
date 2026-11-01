# Robotito — ejecución secuencial de los 82 pedidos

Fuente: `Robotito_82_pedidos_completos-1.docx`, versión del 27/10/2026. Este registro es operativo, no reemplaza el documento de aceptación.

## Condiciones obligatorias
- Seguir orden 01 → 82. **No pasar al siguiente mientras el actual no esté completamente comprobado**; no confundir un incremento integrado con un pedido completo.
- Para cada punto: inspeccionar lo existente, identificar faltantes, implementar incrementos en la aplicación principal, añadir pruebas positivas/negativas, verificar integración de módulos y datos, abrir PR y correr CI en el HEAD; fusionar solo en verde.
- Probar navegador y dispositivos cuando sea posible; las pruebas sintéticas y emulación no garantizan funcionamiento perfecto en cámaras, micrófonos o móviles físicos. Dejar explícito qué no pudo validarse.
- Preservar archivos, registros locales, avatares, idiomas, permisos y funcionalidades verificadas. Evitar duplicar motores.
- Estado **POR AUDITAR** no significa que la funcionalidad no existe. Solo declara que aún no se verificó su cumplimiento completo en esta secuencia.

## Prioridad correctiva de la creadora
La orden posterior de la creadora prevalece sobre el texto antiguo del punto 30: **«Chocar los cinco» NO debe eliminarse**; se conserva el control, la animación en cada avatar y el comando conversacional. «Abrazar» sí sigue retirado como acción especial. Referencia: [PR #18](https://github.com/valeveig15/Robotito/pull/18).

## Pedido 01 — COMPLETADO para los criterios de aceptación comprobables

**Revisión de detalles, 30/10/2026:** corregidos fallos que no cubría la aceptación inicial, con alcance y evidencia actualizados en [P01-STATUS.md](P01-STATUS.md). El [PR #110](https://github.com/valeveig15/Robotito/pull/110) ya está integrado con CI aprobada. La revisión amplía a 22 familias en seis idiomas, conserva restricciones hasta los ejecutores, transmite entidades a ejercicios y distingue formatos repetidos de diversidad semántica. La validación masiva independiente permanece explícita en el registro de pendientes.

**Base documental:** el pedido 01 de `Robotito_82_pedidos_completos-1.docx` pide un planificador central integrado en `semantic-planner.js`, `intent-engine.js` y `script.js` que diferencie preguntas, órdenes, emociones, negaciones, referencias y seguimiento en los seis idiomas, sin confundir conocimiento general con clases. La aceptación pide probar paráfrasis, ambigüedades, contradicciones y aclaraciones.

**Implementación integrada en `main`, en incrementos independientes y verificados:**
- [PR #19](https://github.com/valeveig15/Robotito/pull/19): negaciones dirigidas frente a citas/definiciones y autorización de fuentes. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40552815193).
- [PR #21](https://github.com/valeveig15/Robotito/pull/21): citas de terceros inertes, instrucciones secuenciadas, referencias horarias y foco que sobrevive a afirmaciones incidentales. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40586326340).
- [PR #22](https://github.com/valeveig15/Robotito/pull/22): cortesía, vocativos, familias morfológicas y 360 paráfrasis de definición; corrección de la ambigüedad entre «che» rioplatense e italiano. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40586939547).
- [PR #24](https://github.com/valeveig15/Robotito/pull/24): seguimientos reales por perfil («más breve», «más en profundidad», «¿Y en portugués?», «como para un examen», «¿y con un ejemplo?»), salida y control de fuentes sin compartir estado entre personas. La traducción puntual de una respuesta anterior usa exclusivamente un modelo **local**; sin ese modelo se explica la limitación, nunca se declara una traducción ficticia. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40592284565).
- [PR #25](https://github.com/valeveig15/Robotito/pull/25): «no hagas X, hacé Y» separa acciones positivas y negativas, resuelve números explícitos y pide precisión si falta el objeto; amplía nombres de idiomas. Añade 900 variantes reproducibles de seis idiomas y pruebas de navegador que impiden que una prohibición de leer apuntes termine consultando clases. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40593586665).

**Evidencia en el HEAD del PR #25:** 5.766 comprobaciones del planificador (incluidas 900 variantes de superficie de seis idiomas, 50 por combinación de idioma/intención y las 360 paráfrasis semánticas previas); 3.192 comprobaciones de composición; 555/555 regresiones de navegador y 4 tamaños responsive; escenarios de 108 estados de UI × 3 semillas y el resto de la CI de núcleo, audio, memoria, pruebas generativas y adversariales, sin fallos.

**Criterios de aceptación de P01:** implementados y probados con cobertura positiva y negativa para intenciones generales, fuentes, emoción conversacional existente, negaciones, variaciones textuales, referencias, continuaciones, correcciones y ambigüedades. Los casos no resueltos piden aclaración o exponen una limitación; los ejemplos son semilla para generar más casos, no una lista fija de frases.

**Alcance y límites explícitos:** la cifra de 999.999 preguntas y 50 variantes cada una es un objetivo arquitectónico de generalización, **no** un volumen de consultas arbitrarias probado ni una promesa de comprensión perfecta. La precisión del habla ASR/voz, los modelos locales disponibles, la validación en micrófonos/cámaras físicos y la ampliación continua del corpus pertenecen a los siguientes pedidos y a pruebas de campo. Los 900 casos son variaciones metamórficas; no se presentan engañosamente como 900 paráfrasis semánticas independientes. Cada nueva falla real debe añadirse a la regresión del núcleo sin reabrir el trabajo ya verificado de forma ficticia.

**Secuencia:** el pedido 01 queda aceptado en su alcance comprobable; el pedido 02 se cerró posteriormente con sus propios PR y CI. «Chocar los cinco» permanece obligatorio según la decisión posterior de la creadora.

## Pedido 02 — COMPLETADO según aceptación comprobable

**Revisión de detalles del 30/10/2026:** se está ampliando el cierre anterior con integridad de reproducciones, informes de fallos y ejecución de la aplicación en otros motores. Ver [P02-STATUS.md](P02-STATUS.md) para evidencia y alcance actuales; los resultados históricos siguientes se conservan como antecedentes.

**Base documental:** conservar y ampliar pruebas, Playwright, matrices generativas, GitHub Actions y regresiones; ejecutar pruebas después de **cada** incremento con semillas reproducibles. La aceptación pide positivos, negativos, fallos, persistencia, interrupciones, escenarios adversos y distintos tamaños de pantalla.

**Infraestructura previa conservada (auditada, no reemplazada):** `npm run test:core`, `test:regressions`, `test:kit`, `test:properties:matrix`, `test:planner`, `test:semantic`, `test:memory`, `test:generative`, `test:browser`, `test:browser:matrix`; Playwright/Chromium; tres semillas 17/42/99; workflow `.github/workflows/regression.yml` en cada PR/push, más prueba profunda programada/manual.

**Incrementos nuevos, ambos integrados en `main` tras CI verde:**
- [PR #27](https://github.com/valeveig15/Robotito/pull/27): reparación del reductor de fallos generativos. Consumo perezoso máximo 64 candidatos y retención determinista del menor caso **que sigue fallando**. Nuevas regresiones ejercitan generadores infinitos, contraejemplos de diferentes tamaños y comandos para reproducir la semilla y el índice. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40598018853).
- [PR #28](https://github.com/valeveig15/Robotito/pull/28): 15 defectos históricos nuevos (45 en total) con aserciones **por cada acción** de órdenes compuestas; escenarios reales de Chromium con permisos de micrófono denegados, dispositivos ausentes, desconexión simulada, suspender/reactivar pestaña, modos normal/clase/silencio, persistencia IndexedDB, pruebas de limpieza, overflow y tamaños móvil/horizontal/escritorio. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40598516132).

**Resultados del HEAD de #28, ejecutados por GitHub:** 121/121 pruebas de núcleo; 1.769 aserciones del kit generativo; 45 regresiones históricas con 411 aserciones; tres semillas con 4.300 casos de propiedades cada una; 5.766 pruebas del planificador; 3.192 de composición; 22.472 comprobaciones universales por semilla; 555/555 pruebas de navegador con cuatro tamaños responsive; tres matrices de 108 estados de navegador y 441 combinaciones objetivo; prueba de disponibilidad de voz con 135 objetivos por semilla; matriz adversa de 61 pares/triples objetivo por semilla y 14, 16 y 13 estados realmente ejecutados (semillas 17, 42 y 99). Estos números corresponden a **baterías diferentes**: pueden repetir casos y no se suman para afirmar tests únicos.

**Cobertura de aceptación:** positivos, negativos, distintas expresiones e idiomas, condiciones simultáneas, fallos reproducibles, almacenamiento, recarga, suspensión, prohibiciones con acciones positivas posteriores, ventanas y entradas reales en navegador. La batería permanece integrada en cada ejecución de `npm run test:ci`.

**Límites sin ocultar:** son combinaciones definidas y simuladas, no todo el producto cartesiano. El runner no tiene micrófono físico: la API indica permiso `denied` y `getUserMedia` falla con `NotFoundError`; se verifica que no existe grabación fantasma, **pero no** se confirma comportamiento en un micrófono físico real con permiso denegado. La desconexión se emula con Playwright, no se provocan caídas de redes móviles reales. No se garantiza cero errores ni que las 999.999 preguntas arbitrarias hayan sido ejecutadas. Esas verificaciones físicas siguen siendo necesarias para cada funcionalidad dependiente de hardware.

**Puerta al siguiente pedido:** requisitos de P02 cerrados en el alcance comprobable; el pedido 03 permanece **POR AUDITAR**, sin comenzar su implementación en este cierre. Todas las nuevas regresiones se mantienen al avanzar de punto.

## Pedido 03 — EN PROGRESO, no cerrado

**Revisión de detalles 31/10/2026:** corregidos el atajo de «¡Salud!» por texto/ASR, la evidencia que sobrevivía a fallos, las observaciones almacenadas, la recuperación de modelos bloqueados y el baile con consultas rápidas. Ver [P03-STATUS.md](P03-STATUS.md) para pruebas y validación acústica externa pendiente.

**Objetivo del documento:** voz, música, aplausos, risa, llanto, tos, estornudos, golpes y silencio, usando evidencia acústica temporal/espectral y un modelo cuando haga falta; bailar o aplaudir solamente con evidencia, abstenerse ante eventos inciertos y no reaccionar a voz propia, clase o audio suspendido.

**Incrementos ya fusionados en `main` con CI completa verde:**
- [PR #30](https://github.com/valeveig15/Robotito/pull/30): separación de decisión de baile y aplausos en `audio-reactions.js`; exige música sostenida (seis frames y duración mínima), y aplausos con al menos cinco ataques independientes o evidencia de un modelo. Reaccionar se detiene al entrar en Modo Clase, sueño, voz propia o pestaña oculta. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40600042455).
- [PR #31](https://github.com/valeveig15/Robotito/pull/31): clasificador YAMNet de AudioSet real, **optativo** y procesado en navegador mediante MediaPipe y Web Worker; no se descarga sin marcar casilla, se revelan las posibles métricas del proveedor. Produce candidatos **tentativos** en seis idiomas sin afirmar certeza ni reaccionar ante eventos humanos no calibrados. El audio no se carga a un servidor de Robotito. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40600534228).
- [PR #32](https://github.com/valeveig15/Robotito/pull/32): borrado de PCM y predicciones antiguas durante interrupciones, fallos y reintentos del modelo, para no mezclar clases, sesiones ni voz sintetizada con eventos del usuario. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40600832906).
- [PR #34](https://github.com/valeveig15/Robotito/pull/34): caducidad de inferencias y protección ante resultados de sesiones anteriores, interrupciones y Workers colgados; reintento seguro. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40602225519).
- [PR #35](https://github.com/valeveig15/Robotito/pull/35): PCM continuo y sin ventanas repetidas mediante AudioWorklet, con alternativa del analizador en navegadores antiguos. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40602479524).
- [PR #36](https://github.com/valeveig15/Robotito/pull/36): ciclo de vida de AudioWorklet subordinado al consentimiento y comprobación de dos fragmentos reales de 2048 muestras en `OfflineAudioContext` de Chromium. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40602826814).
- [PR #37](https://github.com/valeveig15/Robotito/pull/37): primera versión del evaluador para clips locales etiquetados; la interpretación de falsos positivos **por grabación** fue precisada y ampliada en PR #46, sin aprobación automática. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40603392917).
- [PR #38](https://github.com/valeveig15/Robotito/pull/38): detectó y corrigió fallos reales del cargador WASM MediaPipe (Worker clásico, exportación `Audio`); nueva CI carga el modelo genuino YAMNet y clasifica una onda artificial, con 64 categorías y primera clase `Sine wave`. [Prueba real y CI completa aprobadas](https://github.com/valeveig15/Robotito/actions/runs/40604288455).
- [PR #40](https://github.com/valeveig15/Robotito/pull/40): remuestreo continuo desde fuentes 16/44,1/48 kHz a 16 kHz, filtro de paso bajo de cuatro polos y preservación de fase al cambiar de bloque; pruebas de continuidad, conservación de tono, silencio y atenuación de frecuencias fuera de banda. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40609786542).
- [PR #41](https://github.com/valeveig15/Robotito/pull/41): prueba **de extremo a extremo** del adaptador y Worker YAMNet real con audio de 48 kHz y 44,1 kHz, con clasificación de prueba y sin afirmar precisión; desconexión explícita de la conexión micrófono → AudioWorklet al apagar la función opcional. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40610209148).
- [PR #43](https://github.com/valeveig15/Robotito/pull/43): evaluación de sonidos breves, como tos/estornudo/golpe, mediante silencio añadido hasta 975 ms, sin perder el tramo final de grabaciones largas; prueba real de YAMNet con señal breve y regresiones de ventanas. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40679937250).
- [PR #44](https://github.com/valeveig15/Robotito/pull/44): herramienta para preparar manifiestos de sonidos reales de ESC-50 **solo a petición de quien pueda usar el corpus conforme a CC BY-NC 3.0**; clases positivas y negativos de puertas, aspiradoras y golpes, sin descargar ni publicar grabaciones automáticamente. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40680460373).
- [PR #45](https://github.com/valeveig15/Robotito/pull/45): las clases YAMNet desconocidas compiten con tos/estornudo/llanto/música/aplauso y las puntuaciones próximas obligan a abstenerse; previene falsos positivos por categorías excluidas del mapeo. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40680848513).
- [PR #46](https://github.com/valeveig15/Robotito/pull/46): informe de evaluación esquema v2 con matrices por categoría de fuente, tasa de errores **por clip**, límites Wilson y muestras insuficientes; evita presentar esa cifra como alarmas por hora de escucha continua. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40681214145).
- [PR #48](https://github.com/valeveig15/Robotito/pull/48): evita combinar puntuaciones máximas de momentos separados y utilizar espigas aisladas como evidencia; evalúa ventanas temporales en orden, con dos ventanas adyacentes para eventos humanos en clips largos y abstención ante clases simultáneas contradictorias. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40682941325).
- [PR #49](https://github.com/valeveig15/Robotito/pull/49): añade evaluación **offline** de archivos de escucha continua con eventos anotados por tiempo, supresiones, detecciones positivas, omisiones, falsos episodios por hora negativa efectivamente observada y separación por ambiente. Genera un informe **de referencia**, que no autoriza ni mide directamente las reacciones desplegadas. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40683685441).
- [PR #50](https://github.com/valeveig15/Robotito/pull/50): nueva CI prueba el **comando completo** de evaluación continua con un WAV artificial generado en el momento, Chromium y el modelo YAMNet genuino, y comprueba el informe JSON final, tiempos de observación y supresión. No se recopila audio humano ni demuestra exactitud de reconocimiento. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40684129316).
- [PR #52](https://github.com/valeveig15/Robotito/pull/52): las ventanas de una grabación que contienen cualquier tramo marcado como Modo Clase/sueño/voz propia **no se envían a YAMNet** ni se contabilizan como tiempo observado; se registran muestras omitidas y tiempos físicamente posibles de inferencia. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40686099743).
- [PR #53](https://github.com/valeveig15/Robotito/pull/53): el AudioWorklet de la captura opcional arranca sin emitir PCM y recibe permisos de captura por mensaje; deja de transferir audio al hilo principal durante supresión y borra paquetes parciales al reanudar. CI real de AudioWorklet en Chromium y regresiones de pausas, sin micrófono físico. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40686705341).
- [PR #55](https://github.com/valeveig15/Robotito/pull/55): el permiso para emitir audio desde `AudioWorklet` vence después de 250 ms sin una renovación del hilo principal, impidiendo que una pestaña congelada continúe transfiriendo PCM y borrando fragmentos parciales. Regresión con pausa/reanudación, expiración y Chromium real, sin hardware. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40688391288).
- [PR #56](https://github.com/valeveig15/Robotito/pull/56): prueba de integración genuina **AudioWorklet → PCM 48 kHz → remuestreador → Worker YAMNet/MediaPipe**, con permiso renovado y un oscilador artificial silenciado en Chromium. Comprueba que el control de privacidad no rompe la ruta de inferencia autorizada; no comprueba reconocimiento humano ni usa micrófono físico. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40688853393).
- [PR #58](https://github.com/valeveig15/Robotito/pull/58): validación **previa a Chromium/YAMNet** de permisos, ID únicos, audio físico dentro de la carpeta autorizada, anotaciones temporales, tamaños y origen/licencia de un corpus abierto. El informe conserva atribución sin exponer rutas privadas. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40690456898).
- [PR #59](https://github.com/valeveig15/Robotito/pull/59): informe de falsas alertas temporales con límite estadístico superior unilateral 95 % (Poisson, condicionado a independencia) por hora negativa observada, incluso si se detectaron cero falsas alertas, y valores nulos sin exposición. No demuestra tasas reales en hardware. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40690913033).
- [PR #60](https://github.com/valeveig15/Robotito/pull/60): separa eventos anotados **evaluables** (dos ventanas de audio consecutivas disponibles) de `unevaluableEvents` con cobertura insuficiente, evitando falsos negativos inventados; retiene estadísticas por entorno. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40691377980).
- [PR #62](https://github.com/valeveig15/Robotito/pull/62): telemetría local de latencia YAMNet por sesión: última/media/máxima inferencia, completadas, ocupadas y timeouts; se borra al desactivar, no incluye resultados obsoletos ni afirma rendimiento en hardware real. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40704445088).

- [PR #64](https://github.com/valeveig15/Robotito/pull/64): los errores de clasificación del Worker llevan identificador de inferencia; se ignoran errores tardíos de sesiones canceladas, pero se conserva el fallo seguro ante una inferencia vigente. Regresiones cubren errores de inicialización, cancelaciones e inferencia actual. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40715411809).

- [PR #66](https://github.com/valeveig15/Robotito/pull/66): el detector descarta ritmos, palmadas y evidencia de modelos después de pausas del navegador, retrocesos del reloj o marcas temporales inválidas, con regresiones nuevas. [CI aprobada](https://github.com/valeveig15/Robotito/actions/runs/40718367216).
- [PR #67](https://github.com/valeveig15/Robotito/pull/67): las ventanas casi duplicadas del final de los clips no cuentan como observaciones independientes de sonidos humanos; el evaluador continuo exige separación temporal coherente y distingue anotaciones que dejan de ser evaluables. Una primera CI falló por el contador de una prueba nueva y fue corregida antes de integrar. [CI final aprobada](https://github.com/valeveig15/Robotito/actions/runs/40719109852).

**Nuevo incremento de evaluación:** se incorporaron categorías opcionales de micrófono `deviceClass` y métricas desagregadas por dispositivo tanto para clips como para escucha continua. Los ejemplos de manifiesto ya no indican una licencia abierta sin procedencia; toda evaluación mantiene bloqueada la aprobación automática y no se fingen pruebas de hardware.

**Siguiente incremento de P03, verificación de captura alternativa:** se sustituyó el sondeo de `AnalyserNode` que repetía o saltaba PCM cuando faltaba `AudioWorklet` por bloques consecutivos de `ScriptProcessorNode` (API heredada), siempre bajo consentimiento, supresión, silencio de salida y desconexión, con aviso localizado en seis idiomas si ninguna API sirve. El modelo continúa siendo opcional, no calibrado y sin reacciones humanas automáticas. La compatibilidad física con dispositivos antiguos no se presupone.

**Nuevo seguro para las reacciones del avatar:** `audio-reactions.js` deniega por defecto todas las reacciones procedentes de modelos para risa, llanto, tos, estornudo y palmadas. Se exige una aprobación explícita `humanModelReactionsApproved` adicional al estado de calibración y a los cuadros de evidencia; la aplicación mantiene esa aprobación desactivada hasta que exista validación real. El detector marca exclusivamente los eventos de un clasificador que declara calibración, y las palmadas acústicas con evidencia temporal siguen habilitadas. Se añadieron regresiones Node y Chromium y se actualizó la caché de los scripts.

**Nuevo preflight de independencia de grabaciones:** los manifiestos ahora rechazan grabaciones idénticas aunque estén duplicadas con nombres o IDs diferentes, mediante huella SHA-256 local en bloques de 64 KiB. La misma grabación tampoco puede aparecer simultáneamente como clip y sesión continua. El informe indica solo la cantidad de fuentes únicas; nunca publica huellas digitales. Aún falta auditar muestras **parecidas, editadas o provenientes de una misma sesión/persona**, y validarlas en audio real independiente.

**Nuevo control de separación de fuentes:** cada grabación autorizada puede declarar `sourceGroup` y `evaluationSplit`. El preflight impide que muestras del mismo origen declarado aparezcan entre desarrollo, validación y prueba, incluidos recortes con bytes distintos; los informes separan las métricas de clips y sesiones por partición. El informe cuenta grupos sin publicar sus identificadores, señala los no declarados y mantiene `independentlyVerified:false`. Las etiquetas son manuales y no demuestran independencia real sin corroboración externa.

**Nuevo control de incertidumbre estadística:** la evaluación por archivos ahora ofrece métricas y límites Wilson por grupo de grabación original, además de las métricas antiguas por clip. Si varios fragmentos provienen de una sola fuente, no aparentan ser observaciones independientes; sin grupos negativos declarados se informa `null` en vez de una tasa. `evaluate` y `evaluateContinuous` también rechazan usos directos con el mismo grupo cruzado entre desarrollo, validación y prueba. Sigue sin existir una validación con grabaciones humanas autorizadas de alcance suficiente.

**Nuevo control de desconexión real del micrófono:** la ruta de audio avanzada, tanto AudioWorklet como el respaldo heredado, ahora comprueba que la pista de MediaStream siga `live`, `enabled` y sin `muted`. Descarta PCM y evidencia ante mute, deshabilitación o desconexión, desmarca el modelo opcional al terminar definitivamente la pista y muestra un aviso en seis idiomas. La política acústica de música/palmadas también queda suprimida sin micrófono vivo; los oyentes de pista se limpian al terminar. Verificado con Node y MediaStreamTrack de Chromium sin hardware. Falta verificar interrupciones de micrófonos físicos reales.

**Nuevo preflight de grabaciones reales:** `npm run validate:audio -- <manifest>` decodifica el corpus local con Chromium sin cargar YAMNet y detecta archivos dañados y anotaciones/supresiones fuera de la duración efectiva. La evaluación principal exige esa validación para **todo** el corpus antes de la primera inferencia; no se genera un reporte parcial al fallar. La CI comprueba el comando con WAV sintético correcto, audio corrupto y anotación inválida; sigue faltando grabar y etiquetar audios humanos autorizados, y medir errores acústicos en campo.

**Herramienta de obtención y anotación autorizada de sonidos:** la página independiente `tools/audio-corpus-studio.html` deja importar audio local o grabar tras consentimiento explícito, etiquetar eventos por tiempo, suprimir intervalos y exportar audio + manifiesto compatibles con `validate:audio` / `evaluate:audio`. Sin servicio remoto ni modelos en la página; por defecto el micrófono está apagado. La regresión Chromium prueba un WAV sintético, JSON descargado, controles negativos y grabación con dispositivo **falso**. El corpus humano autorizado sigue **sin aportarse** y las pruebas de micrófonos físicos y tasas de falsos episodios no se pueden afirmar completas.

**Nuevo endurecimiento de privacidad del laboratorio de sonidos:** la herramienta de captura P03 descarta una grabación cuando se retira el consentimiento, se pierde el micrófono, se oculta la página o se abandona la sesión. Un permiso `getUserMedia` concedido después de cancelar, o una importación decodificada después de «Descartar», ya no puede reactivar la captura ni recuperar archivos; «Detener» normalmente continúa guardando con autorización vigente. Chromium verifica grabación revocada, solicitud pendiente, importación asíncrona y página suspendida. El corpus humano real y el micrófono físico siguen pendientes.

**Nuevo control de coherencia de etiquetas y privacidad:** los sonidos humanos anotados ya no pueden superponerse con tramos excluidos de clasificación: se comprueba en el laboratorio de corpus antes de guardar, en `loadManifest` antes de YAMNet y en `evaluateContinuous` cuando se utiliza directamente. Los intervalos que solo se tocan por sus bordes siguen permitidos. Las regresiones prueban el conflicto en ambos sentidos y el caso límite, evitando métricas sesgadas por muestras deliberadamente suprimidas. Falta corpus humano real, evaluación y dispositivos físicos.

**Control de revisión humana antes de certificar falsos eventos:** en `audio-corpus-studio.html` se puede guardar un borrador sin declarar que los sonidos estén completamente anotados. El manifiesto guarda `annotationReview` (`draft` por defecto y `complete` solo tras casilla explícita); cualquier edición de sonidos o descarte de audio lo restablece a borrador. `loadManifest` conserva compatibilidad con archivos antiguos (los marca como borradores); `validate:audio` permite su lectura, pero `evaluate:audio` y `evaluateContinuous` rechazan sesiones no revisadas antes de producir tasas estadísticas. Nuevas regresiones Node, Chromium y CLI con WAV sintético; la declaración humana no demuestra por sí misma calidad de etiquetas. El corpus real y los micrófonos físicos siguen pendientes.

**Integridad de las grabaciones ya revisadas:** `annotationReview:"complete"` ahora exige `audioSha256` calculado localmente del archivo exportado. El laboratorio lo genera al cargar o grabar; `loadManifest` lo compara con el archivo real y tanto el preflight de Chromium como el momento de inferencia comprueban de nuevo que no se hayan cambiado los bytes. Un reemplazo con nombre y duración idénticos se rechaza antes de generar resultados; nunca se publica la huella en los informes. Los borradores siguen admitidos sin huella; las antiguas sesiones completas requieren revisión y migración manual con `npm run fingerprint:audio -- archivo.wav`. La CI verifica casos con hashes válidos, ausentes, inválidos y sustitución de audio. No sustituye pruebas humanas, licencias ni permisos de micrófonos físicos.

**Integridad de anotaciones humanas revisadas:** el laboratorio genera `reviewAnnotationsSha256` vinculado a `audioSha256`, tipos y tiempos de eventos e intervalos de supresión. El `loadManifest` de la evaluación lo compara antes de inicializar YAMNet; evita que un JSON modificado accidentalmente convierta una ausencia no revisada en un dato falso negativo o altere intervalos excluidos. La representación canónica compartida por Node y navegador tolera reordenamientos inocuos. Borradores siguen legibles, revisiones antiguas requieren migración manual mediante `npm run fingerprint:audio:annotations -- manifiesto.json ID --confirm-reviewed` después de verificar las marcas; las huellas no prueban procedencia ni revisión humana y no aparecen en informes. Las regresiones cubren alteraciones de etiquetas y supresiones con audio intacto.

**Preparación de pruebas voluntarias con micrófono físico:** se creó `tools/audio-device-check.html` junto al laboratorio de corpus. Su uso requiere autorización explícita y un botón; calcula solo niveles RMS temporales para comprobar entrada y deja de escuchar ante detener/cancelar, pista terminada, revocación de consentimiento o pestaña oculta. Puede guardar un JSON local de resultados **sin sonido, identificadores de hardware ni etiquetas**. La CI automatiza en Chromium con dispositivo falso el permiso optativo, nivel, detención, cierre de pistas, errores de permisos, concesión tardía, limpieza y privacidad. Esto **no** significa que ya se hayan probado teléfonos, micrófonos USB u otros dispositivos reales; sigue faltando la ejecución física voluntaria y medir las reacciones del avatar con muestras humanas.

**Corpus de múltiples sesiones locales, sin copiar audio:** `npm run assemble:audio -- /corpus/combinado.json /corpus/a/manifest.json /corpus/b/manifest.json` reúne dos o más sesiones bajo una carpeta común, conserva sus grupos, particiones, derechos, etiquetas y verificaciones SHA-256, y crea un único manifiesto referencial para `validate:audio` y `evaluate:audio`. Antes de escribir el archivo, se verifica el corpus **completo**, incluyendo IDs repetidos, audio byte-idéntico, mezcla de grupos entre desarrollo/validación/prueba, licencias abiertas incompatibles, rutas fuera del corpus, audios o revisiones alterados. No copia ni publica grabaciones y no sobreescribe la salida. Los borradores se pueden reunir pero **no** evaluar como horas negativas confirmadas. La CI prueba combinaciones correctas e inválidas; todavía falta corpus real autorizado, independencia constatada por personas y pruebas físicas del micrófono.

**Matriz temporal detallada de tipos de sonido:** las métricas continuas ahora registran confusiones `sneeze→cough`, `background→sneeze` y casos `missed` para eventos con cobertura suficiente, sin duplicar alertas ni convertir tramos imposibles de evaluar en falsos negativos. Se agregan tiempos p50/p95 hasta la decisión del detector de referencia por evento y estrato ambiental, dispositivo y partición. El detector existente conserva TP/FP/FN y el permiso para reacciones automáticas continúa desactivado. Se verifica con etiquetas y WAV sintéticos, no con estornudos reales ni latencia de avatares físicos.

**Inventario verificable de lo que falta para cerrar P03:** `audit:audio:p03` revisa un corpus local junto con los informes voluntarios de micrófono y muestra qué clases carecen de fuentes positivas de desarrollo, validación o prueba independiente, qué grabaciones permanecen en borrador y qué evidencia manual de hardware existe. No revela nombres ni hashes ni convierte los WAV sintéticos de CI en precisión humana. El resultado es deliberadamente bloqueante (`p03VerifiedComplete:false`, `automaticHumanReactionsApproved:false`) hasta validaciones externas auténticas. El código de inventario y sus regresiones están integrados, pero la prueba real de exactitud, independencia, latencia y comportamiento del avatar sigue pendiente.

**Benchmark opcional con orígenes independientes declarados:** el generador local ESC-50 ahora conserva en `sourceGroup` el ID Freesound de la grabación de origen; distribuye folds 1–3 en desarrollo, 4 en validación y 5 en prueba independiente, y rechaza incoherencias del CSV o fugas de un mismo origen entre particiones. Se verifica el formato con datos sintéticos de CI, sin descargar ESC-50 ni emitir afirmaciones de exactitud con voces reales. Las condiciones CC BY-NC, las etiquetas débiles de clip y la inexistencia de pruebas con micrófono físico siguen limitando la certificación de P03.

**Corrección de acumulación temporal para inferencias reales:** `audio-perception.js` reconoce ahora que YAMNet produce observaciones independientes con salto ~487,5 ms y que el bucle de la aplicación actualiza sus características cada ~50 ms. Una evidencia etiquetada con `frameId` o `observedAt` se acumula a través de ventanas independientes válidas, pero no cuando se repite un ID, llegan IDs a menos de 300 ms, hay un hueco de más de 1300 ms o el audio está suprimido. Se preserva el contrato de clasificadores síncronos previos y la negación predeterminada de reacciones ante sonidos humanos sin aprobación externa. La CI prueba ventanas, cinco tipos de sonido, interrupciones y competencia acústica **solo con un modelo simulado**; faltan modelos calibrados, audio humano real y hardware físico.

**Observación voluntaria del avatar en la aplicación real:** el panel de Robotito incluye un registro local de recuentos de eventos, acciones y baile aplicado, con inicio y parada explícitos, exportación JSON solo de agregados y descarte automático cuando la pestaña se oculta o abandona. No altera la captura ni habilita respuestas de modelos sin aprobar. Las pruebas Node y Chromium estimulan los callbacks reales del avatar con micrófono simulado, incluyendo clap visible y bloqueo durante Modo Clase. Este instrumento prepara las pruebas de campo, pero no demuestra que una clasificación corresponda a un aplauso humano, ni mide el comienzo acústico o latencia física, y **no sustituye un corpus real auditado**.

**Nuevas métricas para el detector temporal:** cada clase y cohorte informa precisión, recuperación, denominadores efectivos y cotas de error Wilson; ausencia de avisos o de eventos evaluables da `null` y no porcentajes supuestos. No cambia autorización de reacciones, intervalos Poisson por horas negativas ni necesidad de corpus humano real.

**Pendiente para completar P03:** calibración y matriz de confusión con grabaciones reales, diversidad de dispositivos/entornos y eventos de sonidos similares (tos vs. estornudo, golpes vs. palmas, aspiradora/TV vs. música); el pipeline WASM/YAMNet y la captura AudioWorklet ya pasaron pruebas de **integración real de Chromium sin micrófono físico**, pero faltan mediciones de rendimiento/latencia y pruebas con micrófono y corpus auténticos; decisión sobre umbrales para habilitar reacciones naturales sin afirmar certeza del 100%; pruebas de precisión con muestras humanas de audio real y corpus autorizado. La evaluación continua de referencia ya existe (#49 y #50), pero sus muestras de CI son sintéticas y **no** equivalen a falsas reacciones reales por hora del avatar. La carga del Worker genuino ya está verificada por PR #38. Hasta entonces las reacciones automáticas de risa/llanto/tos/estornudo no quedan habilitadas por YAMNet. Mantener el resto de las funcionalidades y no avanzar al punto 04 antes de verificar lo anterior.

**Registro transversal de las limitaciones que podemos mejorar por código:** [PENDIENTES_CONTROLABLES.md](PENDIENTES_CONTROLABLES.md). Las aspiraciones abiertas de puntos ya aceptados, especialmente 999.999 preguntas × 50 variantes, **no deben desaparecer** por marcar su aceptación mínima como completada.

## Los 82 puntos en orden
- [x] **01.** Cerebro semántico y generalización de formulaciones — COMPLETADO según los criterios de aceptación comprobables; ver límites y evidencia anteriores
- [x] **02.** Pruebas automáticas generativas, combinatorias y de navegador — COMPLETADO según aceptación comprobable, con límites de simulación documentados
- [ ] **03.** Clasificación de sonidos y reacciones naturales — EN PROGRESO (PR #30–32, #34–38, #40–41, #43–46, #48–50, #52–53, #55–56, #58–60, #62, #64, #66 y #67 integradas; faltan corpus real, mediciones físicas y reacciones observadas)
- [ ] **04.** Escucha, voz y rostro: captación de calidad — POR AUDITAR
- [ ] **05.** Internacionalización completa de interfaz y conversación — POR AUDITAR
- [ ] **06.** Voces nuevas, estilos y eliminación de «Gravedad» — POR AUDITAR
- [ ] **07.** Memoria contextual, fechas y datos durables — POR AUDITAR
- [ ] **08.** Identificación rigurosa de personas registradas — POR AUDITAR
- [ ] **09.** Memoria persistente y relación afectiva con visitantes aún no registrados — POR AUDITAR
- [ ] **10.** Órdenes temporales, reproducción y repetición — POR AUDITAR
- [ ] **11.** Reglas personalizadas de tipo «si/cuando X, hacé Y» — POR AUDITAR
- [ ] **12.** Modo Clase: audio completo, silencio y reproducción — POR AUDITAR
- [ ] **13.** Diferenciación de hablantes y correcciones de transcripción — POR AUDITAR
- [ ] **14.** Apuntes propios prioritarios y respuestas de clases justificadas — POR AUDITAR
- [ ] **15.** Resúmenes por clase, tema y materia completa — POR AUDITAR
- [ ] **16.** Compartir selectivamente memorias de clases — POR AUDITAR
- [ ] **17.** Grupos de estudio con chat y entregas conjuntas — POR AUDITAR
- [ ] **18.** Lista de prioridades y tareas propia de Robotito — POR AUDITAR
- [ ] **19.** Matemáticas y ecuaciones expresadas oralmente — POR AUDITAR
- [ ] **20.** Nomenclatura química como tutor — POR AUDITAR
- [ ] **21.** Países, capitales, autoridades e historia contextualizada — POR AUDITAR
- [ ] **22.** Vídeos y materiales de estudio — POR AUDITAR
- [ ] **23.** Visión de objetos y seguimiento visual — POR AUDITAR
- [ ] **24.** Mostrar objetos mediante una pequeña escena, no un cartel — POR AUDITAR
- [ ] **25.** Interfaz móvil sin superposiciones y chat escrito visible — POR AUDITAR
- [ ] **26.** Redimensionamiento horizontal y desplazamiento del panel derecho — POR AUDITAR
- [ ] **27.** Selección de avatar al inicio y catálogo de especies — POR AUDITAR
- [ ] **28.** Integración visual de los cinco avatares nuevos como referencia prioritaria — POR AUDITAR
- [ ] **29.** Especie, alimentación, camaleón y preguntas sobre sí mismo — POR AUDITAR
- [ ] **30.** Gestos, acciones y eliminación de abrazar/chocar los cinco — POR AUDITAR
- [ ] **31.** Ojos, parpadeo, despertar y transición al sueño — POR AUDITAR
- [ ] **32.** Emociones visuales coherentes y vínculo personal — POR AUDITAR
- [ ] **33.** Batería real, avisos e inactividad — POR AUDITAR
- [ ] **34.** Cumpleaños con tres franjas, música, torta y regalo — POR AUDITAR
- [ ] **35.** Libros sin Goodreads y metadatos verificables — POR AUDITAR
- [ ] **36.** Simulación de al menos 50 perfiles lectores — POR AUDITAR
- [ ] **37.** Lectura y traducción de descripciones de libros — POR AUDITAR
- [ ] **38.** Biblioteca personal con estanterías decoradas y escaneo — POR AUDITAR
- [ ] **39.** Clubes de lectura y valoraciones por aspectos — POR AUDITAR
- [ ] **40.** Sorteo de próxima lectura y broma de «libro abandonado» — POR AUDITAR
- [ ] **41.** Reproducción de música por tema, artista, banda o género — POR AUDITAR
- [ ] **42.** Escenario de clima adaptado a las condiciones — POR AUDITAR
- [ ] **43.** Panel de preguntas, feedback y contador honesto — POR AUDITAR
- [ ] **44.** Modo foto/captura de pantalla con reacción simpática — POR AUDITAR
- [ ] **45.** Analítica y reportes con consentimiento explícito — POR AUDITAR
- [ ] **46.** Integración final, rendimiento, privacidad y regresión — POR AUDITAR
- [ ] **47.** Origen uruguayo, creadora y biografía adaptable según la especie — POR AUDITAR
- [ ] **48.** Personalidad musical: rock and roll de Uruguay y Argentina — POR AUDITAR
- [ ] **49.** Acceso web confiable y aprendizaje verificable de información pública — POR AUDITAR
- [ ] **50.** Noticias del día: país del usuario, mundo y deduplicación semántica — POR AUDITAR
- [ ] **51.** Reloj visual exacto, hora hablada y cuenta regresiva hasta otra hora — POR AUDITAR
- [ ] **52.** Pruebas, cuestionarios y exámenes a partir de material cargado — POR AUDITAR
- [ ] **53.** Migración incremental de los cinco avatares HTML aprobados — POR AUDITAR
- [ ] **54.** Apuntes y punteos editables por clase, con historial — POR AUDITAR
- [ ] **55.** Relaciones razonadas entre clases y temas de una materia — POR AUDITAR
- [ ] **56.** Esquemas, gráficos y visualizaciones académicas pertinentes — POR AUDITAR
- [ ] **57.** Editor gráfico universal y uso didáctico del color — POR AUDITAR
- [ ] **58.** Tomar fotografías y leer el contenido en voz alta — POR AUDITAR
- [ ] **59.** Fotografía y limpieza de pizarrón/libro vinculada al instante de clase — POR AUDITAR
- [ ] **60.** Cronómetro, temporizador y progreso temporal visual — POR AUDITAR
- [ ] **61.** Estimación adaptativa del tiempo de estudio por rendimiento real — POR AUDITAR
- [ ] **62.** Ajustes manuales de tiempos previstos y escenarios de estudio — POR AUDITAR
- [ ] **63.** Agenda de sesiones de estudio con avisos a la hora elegida — POR AUDITAR
- [ ] **64.** Avisos escalonados antes de pruebas y entregas — POR AUDITAR
- [ ] **65.** Planificador nativo de materias, horarios y prioridades — POR AUDITAR
- [ ] **66.** Lista de pendientes tachable con satisfacción de progreso — POR AUDITAR
- [ ] **67.** Tarjetas de memoria editables y repaso organizado — POR AUDITAR
- [ ] **68.** Modo concentración que silencia notificaciones de Robotito — POR AUDITAR
- [ ] **69.** Gráficos semanales y seguimiento del tiempo por materia — POR AUDITAR
- [ ] **70.** Metas de estudio y recordatorios tras tres horas sin avanzar — POR AUDITAR
- [ ] **71.** Ejemplos adaptados a teoría y práctica — POR AUDITAR
- [ ] **72.** Tipografías accesibles y ajustes de lectura — POR AUDITAR
- [ ] **73.** Modo de lectura con inicio de palabras destacado — POR AUDITAR
- [ ] **74.** Temas de fondo suaves, modo oscuro y guía de lectura por línea — POR AUDITAR
- [ ] **75.** Mapas mentales automáticos de apuntes extensos — POR AUDITAR
- [ ] **76.** Activación de Modo Clase muy visible y accesible — POR AUDITAR
- [ ] **77.** Marcadores de colores durante clases grabadas — POR AUDITAR
- [ ] **78.** Sincronización bidireccional entre audio y transcripción — POR AUDITAR
- [ ] **79.** Minijuegos educativos interactivos basados en clases — POR AUDITAR
- [ ] **80.** Progreso visual por integrantes en equipos y grupos de estudio — POR AUDITAR
- [ ] **81.** Exámenes adaptativos por tema y carpeta de materia — POR AUDITAR
- [ ] **82.** Trajes y ambientaciones para festividades — POR AUDITAR

> Marcar un casillero solo al cerrar todas las obligaciones y pruebas documentadas de ese punto. Registrar los PR de los incrementos dentro de su sección y no cambiar un estado sin evidencia.
