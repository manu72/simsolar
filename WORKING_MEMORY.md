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
├── HUD (React DOM overlay)
│   ├── TimelineSlider    year scrubber with season bands, date display
│   ├── SpeedControls     orbit speed, rotation speed, camera zoom, earth scale
│   ├── HemisphereControl S/N toggle
│   └── PlanetSelector    Earth only (Phase 1)
└── InfoModal             about/help modal + offline caching toggle
```

### Key Design Decisions

- **Dual reference frame:** `focusTarget` toggles between heliocentric (Sun at origin) and geocentric (Earth at origin, `worldGroup` offset by `-earthPos`). The Earth shader uniform `uSunPositionWorld` is set accordingly.
- **Shaders as TypeScript:** GLSL lives in `.ts` template literals (`lib/shaders/*.ts`), not raw `.glsl` files. No Turbopack raw loader needed; `next.config.ts` is empty.
- **No postprocessing library:** `@react-three/postprocessing` removed from rendering due to React 19 + Three.js r183 incompatibilities. Sun glow uses CSS radial-gradient via drei `Html`.
- **Moon parented under Earth:** Moon is a child of the Earth group, so it inherits Earth's position, scale, and reference frame automatically. Orbit angle derived from `clock.rotationAngle / MOON_SIDEREAL_PERIOD_DAYS`.
- **PWA offline support:** Service worker (`public/sw.js`) caches textures and assets. `useOfflineStatus` hook manages cache state. `InfoModal` provides opt-in offline toggle.

## Recent Features

### Info Modal + PWA Offline (`b35be68`..`fa6327f`)
- `components/ui/InfoModal.tsx`: about/help modal with usage instructions and offline caching checkbox.
- `lib/useOfflineStatus.ts`: hook for service worker cache state and progress.
- `public/sw.js`: service worker for offline asset caching.
- `public/manifest.json`: PWA manifest with app icons.
- Modal hidden on page load; accessible via info button (top-left).

### Moon Orbital Fixes (`aa9f8b6`, `c40d774`, `92e8b8c`)
- Tidal locking sign: `-moonOrbitalAngle + Math.PI` (was `+`, caused near face to rotate away).
- Euler order: `'YXZ'` on inclination group (default `'XYZ'` made precession invisible — Ry on a circular orbit is a no-op).
- Precession direction: negated angle for correct retrograde (westward) drift.

### Moon (`0a1e24b`..`1ebe3ff`)
- `Moon.tsx`: textured sphere (`/textures/moon.jpg`), circular orbit line, `meshStandardMaterial`.
- Nested groups: `inclinationGroupRef` (5.14° tilt + retrograde nodal precession, `'YXZ'` order) → `groupRef` (position + tidal lock rotation).
- Sun `pointLight` set to `decay: 0` for consistent Moon illumination at all orbital distances.

### Sun CSS Glow + Cursor Cleanup (`72f5d30`, `9ac9c13`, `8351278`)
- CSS radial-gradient glow via drei `Html`. All props hoisted to module constants.
- `useEffect` cleanup resets `cursor` on unmount.

### Geocentric View, Sun Shader, HUD Controls
- Click Sun to toggle heliocentric/geocentric. Earth shader uses `uSunPositionWorld` with per-vertex direction.
- Procedural FBM sun surface with 3D trilinear noise and view-space limb darkening.
- Camera zoom (bidirectional via `ZoomSync`), Earth scale (1–10x). Defaults: orbit 2x, rotation 5000x, zoom 400, scale 5x.

## Lessons

- **Do not call Zustand `set()` from R3F `useFrame` for high-frequency updates.** Pushing state from `requestAnimationFrame` into Zustand triggers React 19's `useSyncExternalStore` tearing avoidance, causing cascading re-renders. Use a pull model: components poll mutable refs via `setInterval` in `useEffect`. Low-frequency guarded updates (e.g. `ZoomSync` with >1 unit threshold) are acceptable.
- **`@react-three/postprocessing` v3.0.4 is incompatible with React 19 + Three.js r183.** `Selection`/`Select` causes infinite re-render loops; `EffectComposer` triggers WebGL context loss. Use lightweight shader-based or CSS alternatives.
- **Clean up superseded files in the same commit as a format migration.** When moving shaders from `.glsl` raw imports to `.ts` template literals, delete the old files, type declarations, and loader config together.
- **Memoize objects passed as R3F component props.** Drei's `Html` and similar components use `useEffect` with prop dependencies. Unstable array/object references (e.g. `position={[x, y, z]}` inline, `style={{...}}` inline) trigger infinite re-render loops. Always hoist to module constants or `useMemo`.
- **Never use `hash(floor(p))` for animated displacement — it pops.** `floor()` creates a step function that jumps at integer boundaries. Always trilinearly interpolate hash values across lattice corners with smoothstepped `fract()`.
- **Three.js Euler order matters for compound rotations.** Default `'XYZ'` applies X last (parent frame). For Moon nodal precession: `'YXZ'` tilts the plane first (Rx), then precesses the tilted plane (Ry). With `'XYZ'`, Ry applies to a circular orbit (no-op) before tilting.
- **Lunar nodal precession is retrograde.** The ascending node drifts westward. Three.js positive `rotation.y` is counterclockwise from +Y (prograde), so the precession angle must be negated.
- **Tidal locking rotation sign:** `rotation.y = -orbitalAngle + π`, not `+orbitalAngle + π`. Three.js `Ry(θ)` maps local +X to `(cos θ, 0, -sin θ)`, matching Earth direction only with the negated angle.

## Technical Debt

- **`@react-three/postprocessing` still in `package.json`** but no longer imported anywhere. Should be removed from dependencies.
- **`ZoomSync` calls `setZoomDistance` from `useFrame`:** guarded by >1 unit threshold so it only fires on mouse wheel, but follows the same Zustand-from-rAF pattern identified as risky. Monitor for issues.
