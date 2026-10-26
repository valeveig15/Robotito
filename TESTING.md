# Robotito — testing and architecture contracts

## Commands

- `npm test`: core regression, planner checks and three seeded generative matrices.
- `npm run test:browser`: Chromium integration, IndexedDB binary migration, source contracts and four responsive viewports.
- `npm run test:ci`: both suites.
- `npm run test:semantic`: structured semantic-frame and legacy-adapter regression.
- `npm run test:audio`: temporal acoustic classification, uncertain-event abstention and avatar-reaction regression.
- `ROBOTITO_TEST_SEED=123 npm run test:universal`: reproduce a specific generative run.

GitHub Actions runs the checks for pushes and pull requests. **A passing automated suite is evidence only for the cases and environments actually tested**; it does not prove perfect natural-language understanding, sound classification or device support.

## Central dialogue

1. `semantic-planner.js`: text normalization, tentative language, context, intent, source authorization, depth, entities and action splitting.
2. `nlu-temporal.js`: shared relative-date resolver; used for book-memory retrieval, and exposed to other domains.
3. `i18n.js`: six language identifiers, a controlled set of localized interface strings and language-command semantics.
4. `script.js`: the current integration with educational sources, external knowledge and UI actions.
5. Optional **on-device** `LanguageModel` API: refines less-certain plans where the browser supports it. No remote LLM dependency; deterministic fallback otherwise.

The engine is **hybrid**, not a universally trained semantic model. Some rare or ambiguous phrasings still require clarification. Unrecognized speaker/class claims must not be treated as evidence. Stored transcript content never authorizes a query on its own.

## Audio and voice

`audio-perception.js` fuses duration, energy, spectrum, harmonicity and periodicity to label silence, unknown sounds, voice-like activity, music, broadband clap candidates and individual impacts. An isolated loud impact is not an applause event; uncertain situations remain `unknown`/`noise`. The detector never infers cough, sneeze, laughter or crying from amplitude alone. It suppresses responses to Robotito’s own speech, classroom recording, sleep and hidden tabs. `audio-reactions.js` separately enforces event confidence, model provenance, cooldown and context before moving the avatar or speaking.

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

## Audio event classifier contract (October 2026)

The browser includes **no pretrained classifier for laughter, crying, coughs or sneezes**. These categories and an isolated model-confirmed clap can be identified only if a separately validated, locally executing model is supplied before microphone initialization as `window.ROBOTITO_AUDIO_EVENT_MODEL`, exposing:

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
