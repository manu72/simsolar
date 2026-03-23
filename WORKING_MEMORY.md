# Working Memory

**Last Updated:** 2026-03-22

## Architecture

### State Model

- **Zustand** (`store/useAppStore.ts`): `isPlaying`, `orbitSpeed`, `rotationSpeed`, `hemisphere`, `zoomDistance`, `earthScale`, `focusTarget` (`'sun' | 'earth'`).
- **SimulationClock** (mutable ref via `SimulationContext`): `julianDay`, `rotationAngle` — written every frame by `Animator`, never in Zustand.
- **Display date** is local state in `TimelineSlider`, polled from the clock ref via `setInterval`.

### Render Architecture

```
ClientRoot (SimulationContext.Provider)
├── Scene (R3F Canvas)
│   ├── Animator          useFrame loop — advances clock, positions Earth, updates shader uniforms
│   ├── Starfield         ~2000 instanced points (outside worldGroup — static backdrop)
│   ├── worldGroup        moves when focusTarget='earth' (geocentric view)
│   │   ├── OrbitPath     elliptical orbit line
│   │   ├── Sun           animated surface shader + pointLight + click to toggle focus
│   │   └── Annotations   drei Html labels at solstice/equinox positions
│   ├── Earth (Suspense)  day/night shader, axial tilt group, axis line
│   ├── ZoomSync          bidirectional camera ↔ Zustand zoomDistance sync
│   └── OrbitControls     mouse orbit/zoom
└── HUD (React DOM overlay)
    ├── TimelineSlider    year scrubber with season bands, date display
    ├── SpeedControls     orbit speed, rotation speed, camera zoom, earth scale
    ├── HemisphereControl S/N toggle
    └── PlanetSelector    Earth only (Phase 1)
```

### Key Design Decisions

- **Dual reference frame:** `focusTarget` toggles between heliocentric (Sun at origin) and geocentric (Earth at origin, `worldGroup` offset by `-earthPos`). The Earth shader uniform `uSunPositionWorld` is set accordingly.
- **Shaders as TypeScript:** GLSL lives in `.ts` template literals (`lib/shaders/*.ts`), not raw `.glsl` files. No Turbopack raw loader needed; `next.config.ts` is empty.
- **No postprocessing library:** `@react-three/postprocessing` removed from rendering due to React 19 + Three.js r183 incompatibilities. Sun uses a procedural animated surface shader instead of bloom.

## Recent Features

### Geocentric View (`61febe0`)
- Click Sun to toggle `focusTarget` between `'sun'` and `'earth'`.
- `Animator` repositions `worldGroupRef` (Sun, orbit, annotations) by `-earthPos` when Earth is focused.
- Earth shader switched from `uSunDirectionWorld` (unit vector) to `uSunPositionWorld` (point) with per-vertex direction computed in vertex shader — works in both frames.

### Animated Sun Surface Shader (`212d965`)
- `sunSurface.vert.ts` / `sunSurface.frag.ts`: procedural FBM noise, animated by `uTime`, with limb darkening.
- Replaced static `MeshBasicMaterial` + additive glow mesh.
- `sunGlow.vert.ts` / `sunGlow.frag.ts` exist but are **not rendered** (TODO: better glow approach).

### HUD Controls (`ff1615e`, `e2c6126`, `c252d9d`)
- **Camera Zoom slider** with bidirectional sync via `ZoomSync` component (slider ↔ mouse wheel).
- **Earth Scale slider** (1–10x) to enlarge Earth independently of camera zoom.
- Rotation speed range increased to 0–10000x.

### Postprocessing Removal & Infinite Loop Fixes (`992c685`..`a2e85dd`)
- `Selection`/`Select` caused infinite re-render loops under React 19.
- `EffectComposer` triggered WebGL context loss under Three.js r183.
- `setDisplayDate` from `useFrame` into Zustand caused cascading re-renders via `useSyncExternalStore`.
- All three issues fixed; display date moved to local state with interval polling.

## Lessons

- **Do not call Zustand `set()` from R3F `useFrame` for high-frequency updates.** Pushing state from `requestAnimationFrame` into Zustand triggers React 19's `useSyncExternalStore` tearing avoidance, causing cascading re-renders. Use a pull model: components poll mutable refs via `setInterval` in `useEffect`. Low-frequency guarded updates (e.g. `ZoomSync` with >1 unit threshold) are acceptable.
- **`@react-three/postprocessing` v3.0.4 is incompatible with React 19 + Three.js r183.** `Selection`/`Select` causes infinite re-render loops; `EffectComposer` triggers WebGL context loss. Use lightweight shader-based alternatives.
- **Clean up superseded files in the same commit as a format migration.** When moving shaders from `.glsl` raw imports to `.ts` template literals, delete the old files, type declarations, and loader config together.
- **Memoize objects passed as R3F component props.** Drei's `Html` and similar components use `useEffect` with prop dependencies. Unstable array/object references (e.g. `position={[x, y, z]}` inline) trigger infinite re-render loops. Always `useMemo`.
- **Never use `hash(floor(p))` for animated displacement — it pops.** `floor()` creates a step function that jumps at integer boundaries. Always trilinearly interpolate hash values across lattice corners with smoothstepped `fract()`, as the fragment shader's `noise()` already does.

## Technical Debt

- **`@react-three/postprocessing` still in `package.json`** but no longer imported anywhere. Should be removed from dependencies.
- **Sun glow shader unused:** `sunGlow.vert.ts` / `sunGlow.frag.ts` are imported in `Sun.tsx` but not rendered. TODO comment in place.
- **`ZoomSync` calls `setZoomDistance` from `useFrame`:** guarded by >1 unit threshold so it only fires on mouse wheel, but follows the same Zustand-from-rAF pattern identified as risky. Monitor for issues.
