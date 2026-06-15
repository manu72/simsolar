<!-- agentic:managed:start -->
# store

## Purpose
Single Zustand store for playback, view, and UI mode state — not simulation clock time.

## Owned paths
- `store/useAppStore.ts`

## Public contracts
- Playback: `isPlaying`, `orbitSpeed`, `rotationSpeed`
- View: `hemisphere`, `zoomDistance`, `earthScale`, `focusTarget` (`'sun' | 'earth' | 'moon'`)
- Season explainer: `activeSeasonExplainer` (mode + event label, or null) with snapshot restore on clear
- `setFocusTarget(target)` — idempotent setter (not toggle)

## Source-of-truth files
- `store/useAppStore.ts`

## Related tests
- none dedicated; behaviour covered indirectly via integration and lib tests

## Dependencies
- Read by HUD/ui via `useAppStore()` (reactive)
- Read by canvas via `useAppStore.getState()` in `useFrame` (non-reactive)

## Invariants
- `julianDay` and `rotationAngle` live in `SimulationClock` ref, not here
- Zustand v5: return existing state reference (`return s`) for true no-op idempotency, not `{}`

## Common failure modes
- High-frequency `set()` from render loop → React 19 tearing avoidance / re-render storms
- Toggle-based focus API breaks under double-clicks or ray propagation

## Do-not-do rules
- Do not store per-frame simulation time in this store
- Do not reintroduce `toggleFocusTarget()` pattern

## Related lessons
- none in `LESSONS/` yet

## Unknowns
- Additional planets in Phase 2 may extend `PlanetSelector` and store shape
<!-- agentic:managed:end -->

<!-- human:notes:start -->
When adding state, decide: UI/low-frequency → Zustand; per-frame simulation → SimulationClock ref. Defaults documented in README (orbit 2×, rotation 5000×, zoom 400, scale 5×).
<!-- human:notes:end -->
