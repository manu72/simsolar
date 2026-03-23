# Working Memory

## Lessons

- **Clean up superseded files when migrating formats.** When moving shader code from `.glsl` raw imports to `.ts` template literal exports, the old `.glsl` files and their `types/glsl.d.ts` declarations were left behind as dead code. Always delete the old files and their supporting infrastructure (type declarations, loader config) in the same commit as the migration.
- **Do not call Zustand `set()` from R3F `useFrame`.** Pushing state updates from `requestAnimationFrame` into Zustand triggers React 19's `useSyncExternalStore` tearing avoidance, causing cascading re-renders. Use a pull model instead: let React components poll mutable refs via `setInterval` in `useEffect`.
- **`@react-three/postprocessing` v3.0.4 is incompatible with React 19 + Three.js r183.** `Selection`/`Select` causes infinite re-render loops; `EffectComposer` triggers WebGL context loss. Replaced with a lightweight additive glow mesh on the Sun.
