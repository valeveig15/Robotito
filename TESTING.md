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

The user can now opt in to an **on-device YAMNet AudioSet** model (Google MediaPipe Tasks Audio, pinned package and model URL). By default the checkbox is **off**: no model worker, WASM or model files are downloaded until the person opts in. It processes microphone audio locally, maintains an ephemeral rolling ~0.975-second window and classifies no more often than a half-second hop, in a worker. The full Chromium CI now also sends 48 kHz and 44.1 kHz generated microphone-rate PCM through the **actual streaming adapter and real YAMNet WASM Worker**, verifying continuity from microphone-rate conversion to inference rather than checking the Worker alone. The classification remains tentative and no measured accuracy is claimed. Disabling advanced audio capture disconnects both the microphone-to-worklet and worklet-to-output graph edges.

Supported browsers now use an `AudioWorklet` for **continuous nonoverlapping PCM**; this avoids duplicate/omitted samples when repeatedly reading the FFT analyser. A stateful fourth-order low-pass plus fractional-phase converter resamples 44.1/48 kHz mic capture to the 16 kHz expected by YAMNet without resetting on each packet. Tests exercise nonuniform packet sizes, silence, 1 kHz fidelity, out-of-band suppression and 16k/44.1k/48k durations. The fallback analyser snapshots may still overlap or miss audio; real-world microphone/acoustic accuracy remains uncalibrated. The analyser fallback remains in less capable browsers and requires separate accuracy evaluation. The worklet's processor runs only after microphone access **and explicit activation of the optional advanced classifier**; switching the option off disconnects the audio graph and ignores pending module loads. The zero-gain route does not play audio through speakers. A real Chromium `OfflineAudioContext` verifies that the actual rendering thread returns two contiguous 2048-sample packets, without microphone hardware. Runtime/model assets are obtained from third parties; MediaPipe may emit usage metrics, disclosed beside the opt-in. Turning it off terminates the worker and clears the sample buffers. Inferences expire after 2.5 seconds, older replies cannot release a newer job, and hung workers are terminated with an explicit retry path. Entering Modo Clase, sleep, hidden tab or self-speech clears the rolling PCM and invalidates in-flight predictions; load failures release their Worker and allow retry. A failed download does not disable existing microphone controls, and no microphone PCM or transcript is uploaded by Robotito.

**This is a pre-trained classifier but NOT a validated or calibrated classifier for Robotito.** Its labels are displayed as *possible* sounds, only at a confidence threshold; automatic cough/sneeze/laughter/crying reactions remain **disabled** until a diverse real-sound dataset, per-class confusion matrices and a human-approved activation profile have established safe thresholds. This protects against a false unsolicited “¡Salud!”. `tests/audio-model-adapter-regression.js` verifies opt-in, bounded PCM, label mapping, freshness and opt-out using a fake worker; CI does **not** download the real model or test true accuracy. Browser support and network are required for this optional download.

## Evaluación de sonido real con corpus etiquetado (P03, sin falsos certificados)

La aceptación del clasificador humano requiere un corpus real con ejemplos positivos y negativos, fuentes de uso autorizado y contextos distintos. Las ventanas de evaluación **incluyen clips breves de menos de 975 ms** (completados con silencio simétrico, sin afirmar certeza) y el tramo final de las grabaciones largas; el planificador de ventanas se comprueba con regresiones sintéticas para estornudos/golpes breves y transitorios finales. El comando `npm run evaluate:audio -- /ruta/manifest.json` carga **solamente archivos locales** definidos en el manifiesto, resamplea sus ventanas a 16 kHz en Chromium, ejecuta el YAMNet real en un Worker clásico del navegador y guarda una matriz de confusión y tasas de precisión/recall/falsos positivos por tipo. Ver `tests/fixtures/audio-manifest.example.json`. No hay subida de los archivos de sonido a Robotito ni generación de modelos calibrados por este proceso; la descarga opcional de MediaPipe/YAMNet requiere conexión y se inicia explícitamente al ejecutar el comando.

La CI ahora ejecuta `npm run test:audio:real`: inicializa **YAMNet y MediaPipe reales en Chromium mediante un Worker clásico compatible con el cargador WASM** y clasifica una señal artificial. Esto comprueba la descarga, carga de WASM, Worker y salida del modelo, pero **NO** mide exactitud ni falsos positivos. Si fallan los servicios externos, la prueba falla explícitamente.

**Advertencia:** el informe devuelve siempre `calibrated:false` y `automaticHumanReactionsApproved:false`. Cada clase necesita muestras diversas, análisis de falsos positivos por entorno, revisión humana y un proceso explícito de aprobación de umbrales. Los escenarios sintéticos de CI verifican la aritmética y los fallos seguros del evaluador, no sustituyen una prueba de audio real; no se incluye ningún archivo de audio en el repositorio.

## Audio event classifier contract (October 2026)

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
