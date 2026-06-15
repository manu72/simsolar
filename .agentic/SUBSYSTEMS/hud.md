<!-- agentic:managed:start -->
# hud

## Purpose
2D React DOM overlay — timeline scrubbing, playback controls, speed/zoom/scale sliders, hemisphere and planet selection.

## Owned paths
- `components/hud/`

## Public contracts
- `HUD` — container with play/pause; gated until `sceneReady` in `ClientRoot`
- `TimelineSlider` — year scrubber; polls `SimulationClock` ref via `setInterval` for date display
- `SpeedControls` — orbit speed, rotation speed, camera zoom, earth scale
- `HemisphereControl` — southern/northern labels and terminology toggle
- `PlanetSelector` — Earth only in Phase 1

## Source-of-truth files
- `components/hud/TimelineSlider.tsx` — date polling pattern (pull model from clock ref)
- `store/useAppStore.ts` — writable HUD state fields

## Related tests
- none dedicated to HUD components

## Dependencies
- `store/useAppStore.ts`
- `SimulationContext` (TimelineSlider reads clock ref)
- `components/canvas/ZoomSync.tsx` — bidirectional camera ↔ `zoomDistance` sync

## Invariants
- HUD writes to Zustand; does not mutate `SimulationClock` directly (Animator/scrub handlers drive clock)
- Display date is local state in TimelineSlider, not Zustand

## Common failure modes
- Moving date display into Zustand tied to `useFrame` → cascading re-renders
- `ZoomSync` calls `setZoomDistance` from `useFrame` with >1 unit threshold — monitor for rAF/store issues

## Do-not-do rules
- Do not push per-frame clock updates through Zustand subscribers

## Related lessons
- none in `LESSONS/` yet

## Unknowns
- Full mobile layout optimisation plan
<!-- agentic:managed:end -->

<!-- human:notes:start -->
HUD is shown only after WebGL scene ready (`ClientRoot` gate). Desktop-first layout (2560×1440 target); controls wrap on narrow viewports.
<!-- human:notes:end -->
