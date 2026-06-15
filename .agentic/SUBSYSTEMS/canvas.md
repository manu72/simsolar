<!-- agentic:managed:start -->
# canvas

## Purpose
React Three Fiber 3D scene — simulation render loop, celestial bodies, orbit path, annotations, camera sync.

## Owned paths
- `components/canvas/`

## Public contracts
- `SimulationContext` — provides mutable `SimulationClock` ref (`julianDay`, `rotationAngle`)
- `Scene` — R3F `<Canvas>`; exposes shared Three.js refs to `Animator` and body components
- `Animator` — `useFrame` loop; advances clock, positions bodies, sets shader uniforms, applies focus-frame offsets
- Focus targets: `'sun' | 'earth' | 'moon'` (read from store via `getState()`)
- Earth shader uniform `uSunPositionWorld` — updated each frame for correct lighting in all reference frames

## Source-of-truth files
- `components/canvas/Animator.tsx` — per-frame simulation driver
- `components/canvas/Scene.tsx` — scene graph composition and refs
- `components/canvas/SimulationContext.ts` — clock context type

## Related tests
- Indirect — logic tested in `__tests__/orbitalMechanics.test.ts`, `__tests__/cameraMath.test.ts`, `__tests__/seasonExplainer.test.ts`
- No dedicated canvas component tests

## Dependencies
- `lib/orbitalMechanics.ts`, `lib/constants.ts`, `lib/cameraMath.ts`
- `store/useAppStore.ts` (read-only in `useFrame`)
- `lib/shaders/` (Earth, Sun GLSL)

## Invariants
- Do not call Zustand `set()` from `useFrame` for high-frequency updates
- Pre-allocate reusable `THREE.Vector3`/`THREE.Euler` at module scope in hot loops
- Moon parented under Earth group; inherits position, scale, reference frame
- `worldGroupRef` holds Sun, orbit path, annotations — offset in geocentric/selenocentric modes

## Common failure modes
- R3F click events fire on all ray-intersected meshes — focus appears broken without `stopPropagation`
- Unstable inline props to drei `Html` → infinite re-render loops
- Wrong Moon Euler order or tidal-lock sign → incorrect lunar orientation

## Do-not-do rules
- Do not use `@react-three/postprocessing` (incompatible with React 19 + Three r183)
- Do not store per-frame simulation time in React `useState`
- Do not use raw `.glsl` files — shaders live in `lib/shaders/*.ts`

## Related lessons
- none in `LESSONS/` yet — see `WORKING_MEMORY.md` § Lessons

## Unknowns
- WebGL failure UX beyond `ErrorBoundary` and `LoadingOverlay`
<!-- agentic:managed:end -->

<!-- human:notes:start -->
Start with `Animator.tsx` when debugging visual/orbit issues; trace backward to `lib/orbitalMechanics.ts` for math bugs. Season explainer mode temporarily overrides clock advancement in Animator.
<!-- human:notes:end -->
