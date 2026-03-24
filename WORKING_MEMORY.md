# Working Memory

**Last Updated:** 2026-03-24

## Architecture

### State Model

- **Zustand** (`store/useAppStore.ts`): `isPlaying`, `orbitSpeed`, `rotationSpeed`, `hemisphere`, `zoomDistance`, `earthScale`, `focusTarget` (`'sun' | 'earth'`).
- **SimulationClock** (mutable ref via `SimulationContext`): `julianDay`, `rotationAngle` — written every frame by `Animator`, never in Zustand.
- **Display date** is local state in `TimelineSlider`, polled from the clock ref via `setInterval`.

### Render Architecture

```
ClientRoot (SimulationContext.Provider)
├── Scene (R3F Canvas)
│   ├── Animator          useFrame loop — advances clock, positions Earth/Moon, updates shader uniforms
│   ├── Starfield         ~2000 instanced points (outside worldGroup — static backdrop)
│   ├── worldGroup        moves when focusTarget='earth' (geocentric view)
│   │   ├── OrbitPath     elliptical orbit line
│   │   ├── Sun           animated surface shader + pointLight + CSS radial-gradient glow (Html)
│   │   └── Annotations   drei Html labels at solstice/equinox positions
│   ├── Earth (Suspense)  day/night shader, axial tilt group, axis line
│   │   └── Moon          textured sphere, 5.14° inclined orbit, tidal locking, nodal precession
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
- **No postprocessing library:** `@react-three/postprocessing` removed from rendering due to React 19 + Three.js r183 incompatibilities. Sun glow uses CSS radial-gradient via drei `Html`.
- **Moon parented under Earth:** Moon is a child of the Earth group, so it inherits Earth's position, scale, and reference frame automatically. Orbit angle derived from `clock.rotationAngle / MOON_SIDEREAL_PERIOD_DAYS`, not from `julianDay`.

## Recent Features

### Moon (`0a1e24b`..`1ebe3ff`)
- `Moon.tsx`: textured sphere (`/textures/moon.jpg`), circular orbit line, `meshStandardMaterial`.
- Nested groups: `inclinationGroupRef` (5.14° tilt + nodal precession) → `groupRef` (position + tidal lock rotation).
- `Animator` drives lunar orbit from `clock.rotationAngle`, tidal locking via `rotation.y`, and 18.6-year nodal precession cycle on the inclination group.
- Sun `pointLight` set to `decay: 0` for consistent Moon illumination at all orbital distances.
- Constants: `MOON_RADIUS`, `MOON_ORBIT_RADIUS`, `MOON_SIDEREAL_PERIOD_DAYS`, `MOON_INCLINATION_RAD`, `MOON_AXIAL_TILT_RAD`, `MOON_NODAL_PRECESSION_YEARS`.

### Sun CSS Glow + Cursor Cleanup (`72f5d30`, `9ac9c13`, `8351278`)
- Replaced shader-based glow with CSS radial-gradient via drei `Html` component.
- All `Html` props (`style`, `zIndexRange`, glow div `style`) hoisted to module-level constants to prevent re-render loops.
- `useEffect` cleanup resets `cursor` on unmount.

### Axial Tilt Fix (`dd86373`)
- Negated axial tilt so June solstice correctly darkens Antarctica (southern hemisphere winter).

### Geocentric View (`61febe0`)
- Click Sun to toggle `focusTarget` between `'sun'` and `'earth'`.
- `Animator` repositions `worldGroupRef` by `-earthPos` when Earth is focused.
- Earth shader uses `uSunPositionWorld` (point) with per-vertex direction in vertex shader.

### Animated Sun Surface Shader (`212d965`)
- `sunSurface.vert.ts` / `sunSurface.frag.ts`: procedural FBM noise, animated by `uTime`, with view-space limb darkening.
- Vertex noise uses proper 3D trilinear interpolation (fixed from `hash(floor())` popping).

### HUD Controls (`ff1615e`, `e2c6126`, `c252d9d`, `16946a5`)
- Camera Zoom slider with bidirectional sync via `ZoomSync`.
- Earth Scale slider (1–10x). Defaults: orbit 2x, rotation 5000x, zoom 400, scale 5x.

## Lessons

- **Do not call Zustand `set()` from R3F `useFrame` for high-frequency updates.** Pushing state from `requestAnimationFrame` into Zustand triggers React 19's `useSyncExternalStore` tearing avoidance, causing cascading re-renders. Use a pull model: components poll mutable refs via `setInterval` in `useEffect`. Low-frequency guarded updates (e.g. `ZoomSync` with >1 unit threshold) are acceptable.
- **`@react-three/postprocessing` v3.0.4 is incompatible with React 19 + Three.js r183.** `Selection`/`Select` causes infinite re-render loops; `EffectComposer` triggers WebGL context loss. Use lightweight shader-based or CSS alternatives.
- **Clean up superseded files in the same commit as a format migration.** When moving shaders from `.glsl` raw imports to `.ts` template literals, delete the old files, type declarations, and loader config together.
- **Memoize objects passed as R3F component props.** Drei's `Html` and similar components use `useEffect` with prop dependencies. Unstable array/object references (e.g. `position={[x, y, z]}` inline, `style={{...}}` inline) trigger infinite re-render loops. Always hoist to module constants or `useMemo`.
- **Never use `hash(floor(p))` for animated displacement — it pops.** `floor()` creates a step function that jumps at integer boundaries. Always trilinearly interpolate hash values across lattice corners with smoothstepped `fract()`, as the fragment shader's `noise()` already does.

## Technical Debt

- **`@react-three/postprocessing` still in `package.json`** but no longer imported anywhere. Should be removed from dependencies.
- **Sun glow shader files orphaned:** `sunGlow.vert.ts` / `sunGlow.frag.ts` exist in `lib/shaders/` but are not imported anywhere. Should be deleted.
- **`ZoomSync` calls `setZoomDistance` from `useFrame`:** guarded by >1 unit threshold so it only fires on mouse wheel, but follows the same Zustand-from-rAF pattern identified as risky. Monitor for issues.
