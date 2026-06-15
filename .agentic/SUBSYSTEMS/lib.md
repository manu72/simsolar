<!-- agentic:managed:start -->
# lib

## Purpose
Pure TypeScript logic, GLSL shader sources, camera math, and React hooks — no direct scene graph ownership.

## Owned paths
- `lib/`
- `lib/shaders/`

## Public contracts
- `orbitalMechanics.ts` — Julian day, Kepler solver (Newton-Raphson), Earth position, sidereal rotation, season labels, solstice/equinox events
- `constants.ts` — orbital, scene, Moon, control constants
- `seasonExplainer.ts` — explainer events, educational copy, scene presets
- `cameraMath.ts` — pixel-to-world, screen pan, zoom-to-distance
- `usePlanetDrag.ts` — drag focused planet on screen
- `useOfflineStatus.ts` — service worker cache state hook
- `shaders/*.ts` — GLSL as exported template literal strings

## Source-of-truth files
- `lib/constants.ts`
- `lib/orbitalMechanics.ts`
- `lib/seasonExplainer.ts`
- `lib/shaders/earth.vert.ts`, `earth.frag.ts`, `sunSurface.vert.ts`, `sunSurface.frag.ts`

## Related tests
- `__tests__/orbitalMechanics.test.ts`
- `__tests__/cameraMath.test.ts`
- `__tests__/seasonExplainer.test.ts`

## Dependencies
- No React or Three.js imports in pure logic modules (hooks excepted)
- Consumed by `components/canvas/`, `components/hud/`, `components/ui/`

## Invariants
- Pure functions in `lib/` remain testable without R3F
- Solstice/equinox dates are fixed approximations (not per-year astronomical computation)
- Moon orbit radius/size compressed for visibility — constants document compression

## Common failure modes
- Animated displacement using `hash(floor(p))` causes popping — use trilinear interpolation
- Changing constants without updating tests

## Do-not-do rules
- Do not add React/Three imports to `orbitalMechanics.ts` or `constants.ts`
- Do not create separate `.glsl` files

## Related lessons
- none in `LESSONS/` yet

## Unknowns
- Per-year solstice/equinox precision improvement scope
<!-- agentic:managed:end -->

<!-- human:notes:start -->
Best onboarding entry point: read `orbitalMechanics.ts` and its tests — no framework dependencies. Shaders are the other deep area when touching Earth day/night or Sun surface.
<!-- human:notes:end -->
