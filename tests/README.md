# Generative and combinatorial verification for Robotito

These test modules supplement (not replace) the existing Node, browser and historical suites. `npm test` runs deterministic checks and `npm run test:ci` adds browser coverage. GitHub Actions runs the CI command for PRs into `main` and on `main` updates.

| Command | Responsibility |
|---|---|
| `npm run test:kit` | PRNG, complete pair/critical-triple covering arrays, reproducibility and failure replay |
| `npm run test:regressions` | Versioned historical cases in `tests/regressions/semantic-issues.json` |
| `npm run test:properties:matrix` | Three seeds of generative/property tests across language, context, audio, time, weather, voice and emotions |
| `npm run test:browser:matrix` | Three Playwright seeds for viewport, language, avatar, mood and audio-state interactions, plus persistence on reload |
| `npm run test:ci` | All new and previous test suites |

**Reproduce a specific property failure:**

```bash
ROBOTITO_TEST_SEED=17 ROBOTITO_REPLAY_PROPERTY='property-name' ROBOTITO_REPLAY_CASE=42 npm run test:properties
```

Failures report seed, index, original input and a reduced case when a shrinker exists. Shrinkers are read lazily (at most 64 candidates), and the smallest failing candidate is retained instead of allowing a later larger case to replace it. To add a permanent regression, first add a unique issue ID, failing input, expected result and why it was wrong to `tests/regressions/semantic-issues.json`; fix the behavior and keep the case in CI.

Historical issue fixtures can also assert individual fields of every action in a compound request using `expectedActions` (including nested paths such as `entities.exerciseNumber`). This prevents a correct top-level intent from concealing an unauthorized first action.

The Chromium scenario matrix also crosses offline/online operation, tab suspension, class/mute audio gates and responsive viewports. A separate browser check sets the microphone permission state to denied and verifies that no recording starts; on headless runners with no audio devices, the capture attempt may report `NotFoundError` rather than `NotAllowedError`. Both reject the stream, but this does **not** substitute for a real microphone permission-denial test on physical hardware. The offline scenarios write, read and delete local IndexedDB records. They are **simulated network and permission conditions**, not measurements from actual phones or microphones.

The P03 real-sound evaluator is separate from synthetic CI. A licence-aware ESC-50 local manifest generator (`npm run prepare:audio:esc50 -- /path/to/ESC-50 1`) selects cough, sneeze, laugh, baby crying, clapping plus noise/impact negatives from a **separately obtained** CC BY-NC dataset. No audio is committed or automatically downloaded; only noncommercial uses permitted by the dataset licence apply. The original ESC-50 clip labels are weak and the output cannot approve automatic reactions. 

The P03 real-sound evaluator is separate from synthetic CI: `npm run evaluate:audio -- /ruta/manifest.json` processes only a locally labelled and authorized corpus through the actual YAMNet Worker (not a simulated classifier). It now handles events shorter than the 0.975s YAMNet window by symmetric silence padding and always includes the last section of each recording. It produces a per-clip confusion matrix with precision/recall and false-positive clips per negative recording hour; **never** auto-enables human-event reactions or presents synthetic reports as calibration.

Coverage targets are the explicitly declared pairwise and critical triple relationships, **not** the entire Cartesian product. The property matrix certifies 785 targets per seed. Each browser matrix certifies 441 targets and exercises real Chromium handlers at simulated screen sizes, not physical devices. Hardware-dependent camera, microphone, voice and real-device accessibility need separate validation.

A desktop overflow defect found by the new test was traced to `layout-resizer.js` computing grid tracks without subtracting container padding. The correction and overflow assertion remain as regression coverage.
