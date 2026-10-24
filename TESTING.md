# Robotito — testing and architecture contracts

## Commands

- `npm test`: core regression, planner checks and three seeded generative matrices.
- `npm run test:browser`: Chromium integration, IndexedDB binary migration, source contracts and four responsive viewports.
- `npm run test:ci`: both suites.
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

`audio-perception.js` fuses duration, energy, spectrum, harmonicity and periodicity. React only to confidence-gated events. It suppresses reactions to the avatar's own voice, classroom recording and sleep. **Sneeze vs. cough requires an independently trained and calibrated audio event classifier**; the current conservative implementation does not emit sneeze events. This is preferable to claiming a reliable medical/acoustic distinction from amplitude alone.

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
