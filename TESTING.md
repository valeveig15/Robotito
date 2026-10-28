# Robotito — testing and architecture contracts

## Commands

- `npm test`: core regression, planner checks and three seeded generative matrices.
- `npm run test:browser`: Chromium integration, IndexedDB binary migration, source contracts and four responsive viewports.
- `npm run test:ci`: both suites.
- `npm run test:semantic`: structured semantic-frame and legacy-adapter regression.
- `npm run test:audio`: temporal acoustic classification, uncertain-event abstention and avatar-reaction regression.
- `ROBOTITO_TEST_SEED=123 npm run test:universal`: reproduce a specific generative run.
- `ROBOTITO_TEST_SEED=42 npm run test:browser:scenarios`: reproduce real Chromium fault, viewport and audio-state combinations.

GitHub Actions runs the checks for pushes and pull requests. The browser scenario suite also covers simulated denied microphone permission and rejected/unavailable capture, offline IndexedDB round trips, hidden-tab interruptions, class/mute audio suppression and mobile layout under combined simulated faults. Historical regression entries can assert per-clause `expectedActions` in addition to the top-level semantic frame. **A passing automated suite is evidence only for the cases and environments actually tested**; it does not prove perfect natural-language understanding, sound classification or device support.

## Central dialogue

1. `semantic-planner.js`: text normalization, tentative language, context, intent, source authorization, depth, entities and action splitting.
2. `nlu-temporal.js`: shared relative-date resolver; used for book-memory retrieval, and exposed to other domains.
3. `i18n.js`: six language identifiers, a controlled set of localized interface strings and language-command semantics.
4. `script.js`: the current integration with educational sources, external knowledge and UI actions.
5. Optional **on-device** `LanguageModel` API: refines less-certain plans where the browser supports it. No remote LLM dependency; deterministic fallback otherwise.

The engine is **hybrid**, not a universally trained semantic model. Some rare or ambiguous phrasings still require clarification. Unrecognized speaker/class claims must not be treated as evidence. Stored transcript content never authorizes a query on its own.

## Audio and voice

`audio-perception.js` fuses duration, energy, spectrum, harmonicity and periodicity to label silence, unknown sounds, voice-like activity, music, broadband clap candidates and individual impacts. An isolated loud impact is not an applause event; uncertain situations remain `unknown`/`noise`. The detector never infers cough, sneeze, laughter or crying from amplitude alone. Dancing now passes through an independent stability policy (six independently spaced frames and at least 330 ms of confirmed music; immediate stop on non-music or suppression). Clap animations require acoustic evidence of at least five bursts or at least two distinct model-confirmed frames. These are conservative gates, not measured real-world accuracy. It suppresses responses to Robotito’s own speech, classroom recording, sleep and hidden tabs. `audio-reactions.js` separately enforces event confidence, model provenance, cooldown and context before moving the avatar or speaking.

`voice-system.js` implements ten rate/pitch/style presets over system speech synthesis, not ten guaranteed distinct voice actors. The available timbres depend on the operating system. User-provided samples are opt-in, kept in IndexedDB and may be deleted. **No voice cloning is performed.** Another person's recording requires explicit consent and a recorded name; the voice is always labelled synthetic.

Six language selections are available; the completeness of dynamic content translation and on-device speech recognition depends on browser voices, recognition availability and translation facilities. Never relabel Spanish text as French or German and claim it has been translated.

## Durable storage

`robotito-store.js` upgrades the original `robotito-data-v2` IndexedDB database to schema version 4. It stores keyed legacy state alongside indexed typed records and blobs.

- Record types: people, conversations, preferences, memories, classes, subjects, topics, audios, transcripts, pdfs, notes, exercises, books, recommendations, tasks, rules and birthdays.
- Each record has an ID, type, owner, timestamp, source, subject, topic, tags, relations, language and schema version.
- Keyed writes are queued to prevent older asynchronous writes from overtaking newer ones.
- Legacy collections are migrated idempotently. Never remove local copies before verifying their durable destination.
- Modo Clase recordings migrate from the older audio database into indexed binary objects and typed metadata.

Browser data is stored **on that device and browser profile**, not synchronized across devices. IndexedDB can be unavailable in restricted/private browsing; failures must remain visible, and large media must never silently fall back to a localStorage megablob.

## Regression policy

Every discovered defect gets a fixed regression case; follow with generated lexical/order/input variants, pairwise/critical combinations, negative checks and long-session simulation. In particular test:

- General definitions must not silently search saved classes.
- Class queries require actual class evidence; uploaded materials require proper source selection.
- Statements about a teacher must not automatically become a class query.
- "¿Y de noche?" must resolve in the domain of the previous focused turn.
- Audio noise must not trigger dancing or "¡Salud!".
- Unknown battery values must not be invented.
- Browser storage migrations must preserve audio bytes and support deletion.
- Portrait phone layouts must not overlap controls.

## Pending limitations and follow-ups

- High-accuracy sneeze/cough versus other event recognition requires a validated audio-classifier model and real-world audio datasets.
- The experimental on-device semantic API is not available in every browser; the deterministic planner has finite linguistic coverage.
- The current multilingual dictionary covers key application controls. Many legacy dynamic messages are still authored in Spanish and need full catalog extraction/localization.
- High-fidelity custom voice synthesis and third-party voice imitation are intentionally **not** provided by saving a recording.
- The full historical interaction code still includes compatibility paths; migration away from all legacy handlers should be incremental and gated on integration tests.

## Temporal weather queries and contextual recall

The live weather handler requests **four forecast days** from Open-Meteo, with hourly values for nighttime and daily values for future dates. It selects the requested date, preserving the referenced day across short follow-ups such as `¿Y de noche?`. An unavailable date produces an explicit no-forecast answer rather than reusing current observations. Forecasts require permission to access approximate location and network access.

Conversation turns are stored as typed local IndexedDB records. A **single** shared `memory-retrieval.js` retrieves prior evidence by owner, time range and topic; it rejects the currently asked question as its own memory and refuses unrelated records for explicitly named topics. The active recognized person's records must not leak to another person. This is local-device storage, not a cloud-synchronized memory.

The regression suite includes deterministic time-sensitive examples: weather today versus tomorrow, tomorrow evening hours, unavailable forecast dates, six-language descriptions, a classroom-source definition contrast, and person-isolated memory retrieval.

## Incremental semantic-planner integration (2026-10-26)

The same semantic frame now reaches `intent-engine.js`, `robotito-vnext.js` and the typed/voice `script.js` dialogue. It distinguishes direct questions, instructions, passive commentary and social turns; annotates negation and corrections; uses a bounded, per-person context; and splits clearly sequenced requests into individually actionable steps. The router must not call protected sources or camera actions merely because a source word appeared in a passive comment or a negated instruction. The historical specialized handlers remain as compatibility fallbacks for calculations, books, objects and response styling.

Recognition alternatives are scored using semantic plausibility and context in addition to ASR confidence; this does **not** replace acoustic speech recognition. The tests in `tests/semantic-composition-regression.js` cover comments, quotations, clarifications, negation, context, mixed orders, source gating, optional local-model suggestions and thousands of simulated turns. The Chromium regression additionally checks the actual typed dialogue and the n-best ASR selection path.

**Limits:** offline understanding still uses compositional lexical/morphological cues and may be uncertain with highly novel constructions; an optional local language-model API improves coverage only where supported. It is not equivalent to open-ended, universally reliable semantic interpretation. Conversational context is in-memory and separated by recognized local person; per-person isolation and speaker recognition depend on the existing identity subsystem. Feature support differs between web browsers. This increment makes no destructive storage migration.

## Optional real audio classifier (P03 incremental)

**Aprobación de reacciones humanas (P03, 28/10/2026):** la política de acciones del avatar utiliza una autorización independiente `humanModelReactionsApproved`, con valor predeterminado `false` y explícitamente desactivado en `script.js`. Un modelo YAMNet preentrenado, una etiqueta `model` y aun puntuaciones altas **no autorizan** sonreír por risa, consolar por llanto, reaccionar a tos ni decir «¡Salud!» por estornudo. Si en el futuro se aprueba una calibración real independiente, el camino hipotético requiere también `metadata.calibrated===true`, identificación de modelo no vacía, al menos dos observaciones y cooldown. Las palmadas acústicas con cinco ataques verificados no dependen de esa aprobación. La CI verifica ambos escenarios de política con eventos simulados y el estado predeterminado en Chromium; no implica que exista un modelo validado ni que las reacciones estén actualmente activadas.

The user can now opt in to an **on-device YAMNet AudioSet** model (Google MediaPipe Tasks Audio, pinned package and model URL). By default the checkbox is **off**: no model worker, WASM or model files are downloaded until the person opts in. It processes microphone audio locally, maintains an ephemeral rolling ~0.975-second window and classifies no more often than a half-second hop, in a worker. The full Chromium CI now also sends 48 kHz and 44.1 kHz generated microphone-rate PCM through the **actual streaming adapter and real YAMNet WASM Worker**, verifying continuity from microphone-rate conversion to inference rather than checking the Worker alone. The classification remains tentative and no measured accuracy is claimed. Disabling advanced audio capture disconnects both the microphone-to-worklet and worklet-to-output graph edges.

Los errores de clasificación del Worker YAMNet ahora llevan el identificador de la inferencia que falló. Si Robotito suspendió la escucha y ya canceló esa inferencia, el mensaje tardío no puede inutilizar una sesión de escucha nueva. Un fallo real de la inferencia vigente sigue marcándose como error y termina el Worker; se cubren ambos casos en las regresiones con Worker simulado. Esto no sustituye pruebas de sonidos humanos.

**Continuidad temporal y ventanas no independientes (P03, 28/10/2026):** pausas de navegador superiores a 500 ms, retrocesos del reloj y timestamps inválidos descartan inmediatamente la evidencia acústica, conservando los límites de reacción. En evaluación offline, dos ventanas del mismo clip separadas por menos de un salto YAMNet de 7800/16000 s no son dos confirmaciones independientes; los puntajes incluyen el tiempo real de inicio de cada ventana y la evaluación continua admite una tolerancia del 5 % del salto. Los casos de audio anotado que no reúnen evidencia independiente se informan como no evaluables, no falsos negativos. Regresiones sintéticas y Chromium/Worker genuinos pasaron en los PR #66 y #67; esto no prueba exactitud con audio humano real.

El permiso de captura opcional en `AudioWorklet` ahora es **temporal (250 ms de audio)**. La aplicación lo renueva en cada ciclo de escucha autorizado, pero si la pestaña se congela o el hilo principal deja de enviar confirmaciones, el procesador deja de transferir PCM por sí mismo y borra la ventana incompleta. Se comprueba tanto en regresión VM (con pausa, reanudación y cientos de bloques sin renovación) como con el `AudioWorklet` real de Chromium sobre una fuente artificial de 1 segundo. Esto es protección ante suspensión, **no** una prueba con micrófono físico.

El procesador real `audio-capture-worklet.js` ahora es **default-deny**: no emite paquetes PCM hasta recibir un mensaje explícito de habilitación de captura. En el ciclo de audio real, Robotito manda `capture:false` durante Modo Clase, sueño, voz propia, pestaña oculta, fallo/desactivación del modelo, y limpia evidencia antigua al reanudar. La prueba VM comprueba que ni siquiera se transfiere un buffer durante la pausa y que fragmentos anteriores no sobreviven; la integración real de `AudioWorklet` en Chromium se adapta al nuevo consentimiento. Estas pruebas no reemplazan una medición de micrófono en dispositivo físico.

**Navegadores sin AudioWorklet (P03):** la alternativa anterior releía el buffer de `AnalyserNode` cada ~45 ms, lo que podía duplicar audio a tasas bajas o descartar tramos a tasas altas. Ahora se conecta **solo después del consentimiento** un `ScriptProcessorNode` de 2048 muestras contiguas y salida completamente silenciada, mientras exista esa API antigua. Se comprueban buffers ordenados, bloqueo inicial, supresión por modo de clase/sueño/voz propia, reinicio ante pausas/retrocesos temporales y desconexión completa al revocar consentimiento. Si tampoco existe `ScriptProcessorNode`, el control optativo se desmarca y se informa la incompatibilidad en los seis idiomas: no se vuelve a inventar PCM a partir del analizador. Es una API obsoleta y la integración real con hardware antiguo sigue pendiente; Chromium verifica la carga y el comportamiento lógico, mientras la ruta moderna conserva las pruebas reales de AudioWorklet.

Supported browsers now use an `AudioWorklet` for **continuous nonoverlapping PCM**; this avoids duplicate/omitted samples when repeatedly reading the FFT analyser. A stateful fourth-order low-pass plus fractional-phase converter resamples 44.1/48 kHz mic capture to the 16 kHz expected by YAMNet without resetting on each packet. Tests exercise nonuniform packet sizes, silence, 1 kHz fidelity, out-of-band suppression and 16k/44.1k/48k durations. The fallback analyser snapshots may still overlap or miss audio; real-world microphone/acoustic accuracy remains uncalibrated. The analyser fallback remains in less capable browsers and requires separate accuracy evaluation. The worklet's processor runs only after microphone access **and explicit activation of the optional advanced classifier**; switching the option off disconnects the audio graph and ignores pending module loads. The zero-gain route does not play audio through speakers. A real Chromium `OfflineAudioContext` verifies that the actual rendering thread returns two contiguous 2048-sample packets, without microphone hardware. Runtime/model assets are obtained from third parties; MediaPipe may emit usage metrics, disclosed beside the opt-in. Turning it off terminates the worker and clears the sample buffers. Inferences expire after 2.5 seconds, older replies cannot release a newer job, and hung workers are terminated with an explicit retry path. Entering Modo Clase, sleep, hidden tab or self-speech clears the rolling PCM and invalidates in-flight predictions; load failures release their Worker and allow retry. A failed download does not disable existing microphone controls, and no microphone PCM or transcript is uploaded by Robotito.

**This is a pre-trained classifier but NOT a validated or calibrated classifier for Robotito.** Its labels are displayed as *possible* sounds, only at a confidence threshold; automatic cough/sneeze/laughter/crying reactions remain **disabled** until a diverse real-sound dataset, per-class confusion matrices and a human-approved activation profile have established safe thresholds. This protects against a false unsolicited “¡Salud!”. `tests/audio-model-adapter-regression.js` verifies opt-in, bounded PCM, label mapping, freshness and opt-out using a fake worker; CI does **not** download the real model or test true accuracy. Browser support and network are required for this optional download.

## Evaluación de sonido real con corpus etiquetado (P03, sin falsos certificados)

**Incertidumbre corregida por fuentes correlacionadas (P03, 28/10/2026):** además de las métricas históricas **por clip**, `audio-calibration.js` informa `sourceGroupMetrics` y `sourceGroupMetricsBySplit`: para cada evento humano, cuenta una sola unidad por fuente original **declarada** que contenga solamente negativos para esa clase; una fuente con al menos un falso positivo cuenta una vez, aunque se hayan extraído muchos clips de ella. Se excluyen del denominador de fuentes negativas los grupos con alguna etiqueta positiva de la clase y se informan por separado. La tasa y el intervalo Wilson superior 95 % son **`null`** cuando no hay grupos negativos declarados, incluso si existen miles de archivos sin origen. Los intervalos siguen suponiendo independencia entre grupos declarados, **no comprobada automáticamente**; no son tasas de reacciones reales/hora. Las funciones directas `evaluate` y `evaluateContinuous` también comprueban la separación de grupos, en lugar de confiar exclusivamente en el preflight del manifiesto. Las pruebas comparan nueve clips procedentes de dos fuentes y rechazan contaminación entre desarrollo y prueba.

**Particiones de origen declaradas (P03, 28/10/2026):** para el corpus autorizado, cada grabación puede señalar un `sourceGroup` seudónimo y su partición `evaluationSplit` (`development`, `validation`, `test`). Se impide mezclar dos muestras del mismo origen declarado entre particiones, incluso si sus bytes son distintos, antes de ejecutar YAMNet. La ausencia de `sourceGroup` se informa como `ungroupedRecordings` y no se cuenta como independencia verificada. Los informes tienen `splitMetrics`, `continuousEvaluation.bySplit` y cantidades por partición, sin difundir los IDs de origen; `independentlyVerified:false` sigue explícito porque el programa no puede demostrar que los grupos declarados coincidan con los originales. Usar el conjunto de desarrollo para ajustar umbrales y dejar validación/prueba realmente independientes sigue siendo una obligación humana; no se ajustan umbrales ni se habilitan reacciones automáticamente.

**Independencia de fuentes del corpus (P03, 28/10/2026):** antes de usar YAMNet, el preflight ahora rechaza grabaciones de bytes idénticos aunque tengan nombres, IDs, etiquetas, rutas o enlaces distintos, incluso si se reusan entre clips y sesiones continuas. La huella SHA-256 se calcula de forma local con lectura en fragmentos y **no** se incluye en el informe. `datasetIntegrity` expone el conteo de fuentes únicas y aclara que un recorte, conversión o transformación de la grabación original podría no detectarse. La comprobación evita inflar las métricas por copias exactas, pero **no** demuestra independencia entre personas, sesiones o conjuntos de entrenamiento y validación; eso todavía requiere auditoría humana y corpus autorizado.

La aceptación del clasificador humano requiere un corpus real con ejemplos positivos y negativos, fuentes de uso autorizado y contextos distintos. Las ventanas de evaluación **incluyen clips breves de menos de 975 ms** (completados con silencio simétrico, sin afirmar certeza) y el tramo final de las grabaciones largas; el planificador de ventanas se comprueba con regresiones sintéticas para estornudos/golpes breves y transitorios finales. El comando `npm run evaluate:audio -- /ruta/manifest.json` carga **solamente archivos locales** definidos en el manifiesto, resamplea sus ventanas a 16 kHz en Chromium, ejecuta el YAMNet real en un Worker clásico del navegador y guarda una matriz de confusión y tasas de precisión/recall/falsos positivos por tipo. Ver `tests/fixtures/audio-manifest.example.json`. No hay subida de los archivos de sonido a Robotito ni generación de modelos calibrados por este proceso; la descarga opcional de MediaPipe/YAMNet requiere conexión y se inicia explícitamente al ejecutar el comando.

### Corpus ESC-50: preparación opcional de prueba real

El dataset público [ESC-50](https://github.com/karolpiczak/ESC-50) contiene 40 grabaciones de 5 segundos para cada una de 50 clases, incluyendo estornudos, tos, risas, llanto de bebés, palmadas, puertas, golpes y aspiradoras. **Licencia CC BY-NC 3.0: solo usos no comerciales, con atribución a los creadores.** Robotito NO descarga, reutiliza ni redistribuye esos archivos automáticamente. Si la finalidad y los derechos lo permiten, la persona puede obtener el dataset original respetando su licencia y generar localmente un manifiesto de ejemplos positivos y negativos con `npm run prepare:audio:esc50 -- /ruta/ESC-50 1` (fold piloto 1), o `... all` para los cinco folds, y luego `npm run evaluate:audio -- /ruta/ESC-50/robotito-esc50-1-manifest.json`. Se incluye el identificador original, categoría de fuente, fold, licencia y cita. Este dataset tiene **etiquetas débiles por clip**, no los instantes exactos de cada sonido y no cubre la diversidad necesaria para certificar reacciones en vivo. Su evaluación es exploratoria y no habilita acciones automáticas. Las pruebas CI solo comprueban el generador con archivos ficticios de prueba, no descargan audio real.

El estado del clasificador opcional `audio-sound-model.js` ahora incluye contadores por sesión y latencias de inferencia (última, media y máxima, en milisegundos), además de ejecuciones agotadas por timeout. Se reinician al desactivar el modelo, y los resultados obsoletos no suman al promedio. Son medidas instrumentales del navegador que **deben obtenerse en hardware físico representativo** antes de extraer conclusiones sobre respuesta real; los tests de CI usan relojes simulados y ondas artificiales.

La CI integra además el recorrido **AudioWorklet real → PCM 48 kHz → remuestreador continuo → Worker MediaPipe/YAMNet real**, alimentado exclusivamente con una onda de 440 Hz generada en el navegador. La prueba renueva periódicamente el permiso temporal del procesador y exige que el Worker genere puntuaciones reales. No usa un micrófono físico, no mide exactitud acústica humana y no desbloquea reacciones automáticas.

La CI ahora ejecuta `npm run test:audio:real`: inicializa **YAMNet y MediaPipe reales en Chromium mediante un Worker clásico compatible con el cargador WASM** y clasifica una señal artificial. Esto comprueba la descarga, carga de WASM, Worker y salida del modelo, pero **NO** mide exactitud ni falsos positivos. Si fallan los servicios externos, la prueba falla explícitamente.

**Evidencia temporal del clasificador:** para clips con más de una ventana YAMNet, el evaluador conserva las clases de **cada ventana en orden**, exige al menos dos ventanas adyacentes que coincidan para declarar un sonido humano y se abstiene si hay dos tipos humanos distintos en una sola grabación. Esto impide fabricar simultaneidad mediante máximos de ventanas dispares o contar picos aislados como certeza. Clips subsegundo conservan una sola ventana válida; el informe registra cuántos clips usaron esta ruta y cuántos tenían conflictos. Esto sigue siendo un **criterio conservador de evaluación**, no un umbral calibrado ni una medición de las acciones del avatar.

### Validación previa de corpus autorizados (P03)

El evaluador comprueba **antes de cargar YAMNet** los ID únicos de clips y sesiones, etiquetas, derechos, intervalos positivos de anotación y silencio, archivos regulares de hasta 50 MB y rutas físicas que no pueden escapar de la carpeta del manifiesto mediante enlaces simbólicos. Las grabaciones `open-license` necesitan `license` y `source`; ESC-50 ya los incluye. El informe conserva la procedencia sin exponer rutas privadas. No es una auditoría legal de permisos ni una evaluación de precisión.

### Cobertura temporal y eventos no evaluables (P03)

El detector de referencia exige **dos ventanas de audio analizadas y consecutivas**. Un evento humano anotado con una sola ventana válida, con intervalos sin muestras, o después de supresiones no se registra como un falso negativo: se conserva en `annotatedEvents`, aparece en `unevaluableEvents` y queda fuera del denominador `evaluableEvents`. Las sumas por entorno también lo informan. Así no se confunde falta de cobertura con fallo de clasificación; tampoco se ocultan los ejemplos sin evidencia suficiente. La regla corresponde **solo** al evaluador offline de referencia y no implica aprobar reacciones automáticas.

### Incertidumbre estadística de falsas alertas (P03)

La evaluación offline de sesiones continuas informa ahora `negativeHours` y `falseAlertsPerNegativeHourUpper95`, el **límite superior unilateral del 95 % bajo el supuesto de episodios Poisson independientes y tasa estacionaria**. Con cero falsos episodios la tasa empírica es cero, **pero la cota superior es positiva** (aprox. `2.996 / horas negativas observadas`). Sin exposición observada, ambas tasas son `null`. No hay evidencia de que esas hipótesis estadísticas se cumplan en un micrófono real; es una indicación exploratoria de incertidumbre, no una garantía de precisión ni una autorización de reacciones.

### Grabaciones continuas con eventos temporales etiquetados (P03)

La integración de CI ahora ejecuta `npm run test:audio:timeline:real`: genera localmente un WAV sintético y un manifiesto temporal, abre **Chromium y YAMNet reales**, evalúa el archivo con el comando de usuario y valida el informe guardado, tiempos observados y supresiones. Esta prueba comprueba el **recorrido completo de código**, no la exactitud de detección de sonidos humanos; no se almacenan ni descargan grabaciones humanas.

La evaluación continua **no envía ninguna ventana que se superponga, siquiera parcialmente, con un intervalo de supresión al modelo YAMNet**; tampoco contabiliza esas ventanas como tiempo negativo observado. El sello temporal de cada resultado corresponde al **final de la ventana**, cuando la predicción ya es físicamente posible, no a su centro. La regresión incluye intervalos de voz propia o Modo Clase que intersectan solo el borde de una ventana y una prueba integral con Chromium/YAMNet real. Los intervalos de supresión deben estar correctamente anotados por quien posee el audio; esto no constituye una prueba con hardware físico.

El comando `npm run evaluate:audio -- /ruta/manifest.json` también acepta `sessions` además de `clips`, o solo sesiones: cada sesión contiene un archivo de audio local autorizado, `environment`, `rights`, `annotations` con `kind` y tiempos `startSeconds/endSeconds`, y períodos `suppressions` opcionales. Ver `tests/fixtures/audio-timeline-manifest.example.json` (sin audios). Chromium decodifica cada archivo, ejecuta **YAMNet auténtico** sobre ventanas ordenadas y entrega `continuousEvaluation` con eventos de referencia, emparejamiento único de anotaciones y **falsas alertas de referencia por hora de audio negativo observado**, desglosadas por entorno. No se cuentan minutos no observados ni períodos de supresión.

**No es una medición de las reacciones reales del avatar**: el evaluador offline requiere dos ventanas adyacentes y usa cooldowns fijos y tolerancia de anotación. Una prueba sintética valida el cálculo, no la precisión. Las tasas solo serán informativas con grabaciones reales continuas, marcas temporales humanas revisadas, consentimiento y contraste independiente con las acciones desplegadas de Robotito. El informe guarda tiempos de eventos en un archivo local; no publicarlo sin permiso. Siempre `calibrated:false` y `automaticHumanReactionsApproved:false`.

**Interpretación correcta de las métricas:** la matriz y sus tasas se calculan por **clip etiquetado**, no por eventos continuos. El nuevo esquema `schemaVersion:2` informa `falsePositiveClipRate`, su límite superior de Wilson 95 % y `falsePositiveClipsPerNegativeHour` (clips falsos / horas de audio negativo). También separa resultados por `environment` para encontrar confusiones en ruidos como puertas o aspiradoras. **Ninguna de esas tasas equivale a «Robotito dirá ¡Salud! X veces por hora».** Esa cifra requiere grabaciones continuas con marcas temporales, evaluación de los cooldowns y una prueba prospectiva independiente.

**Advertencia:** el informe devuelve siempre `calibrated:false` y `automaticHumanReactionsApproved:false`. Cada clase necesita muestras diversas, análisis de falsos positivos por entorno, revisión humana y un proceso explícito de aprobación de umbrales. Los escenarios sintéticos de CI verifican la aritmética y los fallos seguros del evaluador, no sustituyen una prueba de audio real; no se incluye ningún archivo de audio en el repositorio.

## Audio event classifier contract (October 2026)

YAMNet devuelve muchas clases ajenas a nuestra lista de sonidos. Sus puntuaciones ahora **compiten como alternativa desconocida** con estornudo, tos, risa, llanto, música y aplausos. Si otra clase es más probable o la diferencia es menor de 0,12, la interfaz se abstiene en lugar de mostrar una identificación humana débil. También evita tratar el canto de pájaros como música de una persona. Son reglas conservadoras sobre puntuaciones no calibradas, no equivalen a precisión demostrada.

The browser includes an **optional pretrained YAMNet classifier** for laughter, crying, coughs and sneezes, but it is **not calibrated or approved for automatic human-event reactions**. These categories and an isolated model-confirmed clap can be identified only if a separately validated, locally executing model is supplied before microphone initialization as `window.ROBOTITO_AUDIO_EVENT_MODEL`, exposing:

```javascript
{
  calibrated: true,               // Only after genuine calibration/validation
  version: "validated-model-id",
  predict: (frame, {noiseFloor, history}) => ({
    clap: 0, laugh: 0, cry: 0, cough: 0, sneeze: 0
  })
}
```

Predictions are synchronous and numerical in [0, 1]. A worker-based async classifier can cache its latest result and return it synchronously. Merely setting `calibrated: true` is **not evidence of real calibration**; developers must first evaluate real, diverse annotated recordings and confusion matrices, particularly sneeze versus cough and applause versus impacts. No server upload is required by this module. Without a validated implementation, those events stay unrecognized and Robotito **does not** say “¡Salud!” based solely on noisy features. The existing onomatopoeia handling via speech transcripts is a separate, less certain user-input path.

A model-confirmed event must sustain its score and beat competing class probabilities by a margin. A latch groups continuously high predictions, plus per-kind cooldowns, so a long sneeze label cannot repeatedly trigger “¡Salud!”. Reactions are suppressed during Robotito's own synthesized speech, Modo Clase, sleep and hidden tabs. Acoustic applause requires at least five temporally grouped broadband transients; the feature-only detector cannot reliably distinguish every clap from every manufactured impact.

Tests: `tests/audio-event-regression.js` runs deterministic synthetic voice/music/noise/impact/clap sequences; calibrated **fake model** predictions exercise the event gates, cooldown, latching and suppression. Browser tests verify modules loaded, no reactions without model proof and 48 localized sound labels. These are **synthetic and simulated tests**, not a measured real-world detection accuracy. Diverse recordings, real microphones and field calibration remain mandatory before claiming reliable detection of all requested classes.
