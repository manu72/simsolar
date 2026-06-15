<!-- agentic:managed:start -->
# ui

## Purpose
Top-level UI chrome outside the HUD bar — season explainer picker, about/help modal, loading overlay.

## Owned paths
- `components/ui/`

## Public contracts
- `TopLeftControls` — info button, season explainer event picker; sets `activeSeasonExplainer` in store
- `InfoModal` — about/help, offline caching opt-in toggle
- `LoadingOverlay` — visible until scene ready or WebGL failure
- Season explainer flow: UI selection → store → `Animator` snaps clock and preset → `Annotations` highlights event

## Source-of-truth files
- `components/ui/TopLeftControls.tsx` — explainer UI entry
- `components/ui/InfoModal.tsx` — offline toggle wiring
- `lib/seasonExplainer.ts` — event metadata, copy, scene presets (logic, not UI)

## Related tests
- `__tests__/seasonExplainer.test.ts` — events, presets, today-aware selection

## Dependencies
- `store/useAppStore.ts` — `activeSeasonExplainer`, clear/restore playback snapshot
- `components/canvas/Animator.tsx`, `components/canvas/Annotations.tsx`
- `lib/useOfflineStatus.ts` (InfoModal)

## Invariants
- Info modal hidden on page load; opened via top-left info button
- Clearing season explainer restores prior playback snapshot

## Common failure modes
- Explainer preset out of sync with `lib/seasonExplainer.ts` event definitions
- Inline object/array props to drei components → re-render loops

## Do-not-do rules
- Do not duplicate explainer copy outside `lib/seasonExplainer.ts`

## Related lessons
- none in `LESSONS/` yet

## Unknowns
- Additional explainer events or UX beyond solstice/equinox set
<!-- agentic:managed:end -->

<!-- human:notes:start -->
Season explainer is the primary pedagogical overlay — extend copy and presets in `lib/seasonExplainer.ts` first, then wire UI if needed.
<!-- human:notes:end -->
