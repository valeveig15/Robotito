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

Failures report seed, index, original input and a reduced case when a shrinker exists. To add a permanent regression, first add a unique issue ID, failing input, expected result and why it was wrong to `tests/regressions/semantic-issues.json`; fix the behavior and keep the case in CI.

Coverage targets are the explicitly declared pairwise and critical triple relationships, **not** the entire Cartesian product. The property matrix certifies 785 targets per seed. Each browser matrix certifies 441 targets and exercises real Chromium handlers at simulated screen sizes, not physical devices. Hardware-dependent camera, microphone, voice and real-device accessibility need separate validation.

A desktop overflow defect found by the new test was traced to `layout-resizer.js` computing grid tracks without subtracting container padding. The correction and overflow assertion remain as regression coverage.
