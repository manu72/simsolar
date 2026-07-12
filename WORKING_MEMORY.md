# Working Memory

**Last Updated:** 2026-07-12

## Architecture

### State Model

- **Zustand** (`store/useAppStore.ts`): `isPlaying`, `orbitSpeed`, `rotationSpeed`, `hemisphere`, `zoomDistance`, `earthScale` (1–20x — UI label is "Planet Scale"; applies to the **focused** planet only, others render at `DEFAULT_EARTH_SCALE`), `focusTarget` (`'sun' | 'mercury' | 'venus' | 'earth' | 'moon'`), `activeSeasonExplainer` (`ActiveSeasonExplainer | null`), `showOrbitalLabels` (boolean).
- **SimulationClock** (mutable ref via `SimulationContext`): `julianDay`, `rotationAngle` — written every frame by `Animator`, never in Zustand.
- **Display date** is local state in `TimelineSlider`, polled from the clock ref via `setInterval`.

### Render Architecture

```
ClientRoot (SimulationContext.Provider)
├── Scene (R3F Canvas)
│   ├── Animator          useFrame loop — advances clock, positions Earth/Moon, updates shader uniforms
│   ├── Starfield         ~2000 instanced points (outside worldGroup — static backdrop)
│   ├── worldGroup        offset by -focusOffset whenever a non-Sun body is focused
│   │   ├── OrbitPath     elliptical orbit line (parameterised; reused by Planet)
│   │   ├── Sun           animated surface shader + pointLight + CSS radial-gradient glow (Html)
│   │   ├── Planet ×2     Mercury/Venus — heliocentric self-positioning, own orbit paths
│   │   └── Annotations   drei Html labels at solstice/equinox positions
│   ├── Earth (Suspense)  day/night shader, axial tilt group, axis line
│   │   └── Moon          textured sphere, 5.14° inclined orbit, tidal locking, nodal precession
│   ├── ZoomSync          camera ↔ Zustand zoomDistance sync + explainer camera positioning
│   └── OrbitControls     mouse orbit/zoom
├── HUD (React DOM overlay)
│   ├── TimelineSlider    year scrubber with season bands, date display
│   ├── SpeedControls     orbit speed, rotation speed, camera zoom, planet scale
│   ├── HemisphereControl S/N toggle
│   ├── LabelsControl     orbital labels toggle
│   └── PlanetSelector    Mercury/Venus/Earth focusable; Mars–Neptune disabled placeholders
├── TopLeftControls       Info + Solstice/Equinox explainer panel; embeds InfoModal
│   └── SeasonDiagramModal "See how it works" — portal bottom-sheet with SVG SeasonDiagram
└── InfoModal             about/help modal + offline caching toggle
```

### Key Design Decisions

- **Five reference frames:** `focusTarget` puts the focused body at the origin via a single `focusOffset` (its heliocentric position; for the Moon, `earthPos + moonLocalPos`). `worldGroup` is offset by `-focusOffset`, the Earth group by `earthPos - focusOffset`. Mercury/Venus position themselves heliocentrically inside `worldGroup`, so the same offset covers them. The Earth shader uniform `uSunPositionWorld` is set accordingly in all modes. Each body's click handler calls `setFocusTarget` with its own identity (idempotent, no toggle) and `event.stopPropagation()` to prevent R3F ray propagation to meshes behind it.
- **Axial tilt direction:** Earth's axis leans toward its December-solstice orbital position (`TILT_DIRECTION_RAD = 90° − ϖ`), not toward perihelion. `EARTH_AXIS_WORLD` in constants exports the world-space spin axis; subsolar-latitude tests validate it.
- **Mercury/Venus:** generic `Planet.tsx` + `PLANET_DATA` J2000 elements + `getPlanetOrbitalPosition` (perihelion angle relative to Earth's keeps elongations/conjunctions correct). Orbital inclination deliberately omitted (all orbits in the ecliptic plane). Hidden during season explainers.
- **Season diagram modals (2026-07-12):** `lib/seasonDiagram.ts` maps event label + hemisphere to five SVG variants; `components/explainers/SeasonDiagram(Modal).tsx` render a portrait SVG in a portal bottom-sheet ("See how it works" in the explainer panel). Reduced-motion static fallback; animations pause when the page is hidden.
- **Shaders as TypeScript:** GLSL lives in `.ts` template literals (`lib/shaders/*.ts`), not raw `.glsl` files. No Turbopack raw loader needed; `next.config.ts` is empty.
- **No postprocessing library:** `@react-three/postprocessing` removed from rendering due to React 19 + Three.js r183 incompatibilities. Sun glow uses CSS radial-gradient via drei `Html`.
- **Moon parented under Earth:** Moon is a child of the Earth group, so it inherits Earth's position, scale, and reference frame automatically. Orbit angle derived from `clock.rotationAngle / MOON_SIDEREAL_PERIOD_DAYS`.
- **PWA offline support:** Service worker (`public/sw.js`) caches textures and assets. `useOfflineStatus` hook manages cache state. `InfoModal` provides opt-in offline toggle.

### AgenticOS Infrastructure

- **`.agentic/`** — t8 Agentic OS operational memory: project brief, subsystem docs, lessons learned, memory index. Runtime uses `.agentic/CONFIG/agentic.json` (graph-first with Understand Anything provider, codemap fallback). Scripts in `scripts/agentic/` (`graph_sync.py`, `route_task.py`, `update_memory.py`, `validate_memory.py`).
- **`.understand-anything/`** — knowledge graph system with auto-update enabled. Graph at `.understand-anything/knowledge-graph.json`. AgenticOS config references this via `"provider": "understand-anything"`.
- Purpose: agent-first routing and operational memory for future AI coding assistants working on the codebase.

## Recent Features

### Mercury/Venus + Explainer Diagrams (`fca49ea`..`9107609`, 2026-07)
- Mercury and Venus as clickable, focusable planets with Keplerian orbits (`Planet.tsx`, `PLANET_DATA`, `getPlanetOrbitalPosition`); `FocusTarget` extended to five values.
- Planet Scale slider applies to the focused planet only; Mercury/Venus/Moon hidden during explainers; equinox explainer camera hemisphere-aware (southern default).
- Earth's axial tilt aligned with the solstice line instead of perihelion (fixes ~5° terminator miss at equinoxes); subsolar-latitude test suite added.
- Animated SVG equinox/solstice explainer diagrams in a mobile bottom-sheet modal (5 variants, focus-trapped dialog, reduced-motion support).

### Focus Target Refactor + Selenocentric View (`66f8ac0`, `b07d5b2`)
- Replaced `toggleFocusTarget()` with `setFocusTarget(target: 'sun' | 'earth' | 'moon')` in Zustand store. Each body declares its own identity on click — idempotent, no toggle. Clicking the already-focused body is a no-op.
- Added `event.stopPropagation()` to all mesh click handlers (Earth, Sun, Moon) to prevent R3F raycast propagation to meshes further along the ray.
- Selenocentric view: Moon at origin, `earthGroupRef` offset by `-moonLocalPos` (Moon's inclined position in Earth-local space), `worldGroupRef` offset by `-(earthPos + moonLocalPos)`.
- Hoisted moon orbital calculations (angle, precession, inclined local position) above focus-target positioning in Animator so all three branches can use them. Pre-allocated `_moonLocalPos` and `_inclinationEuler` at module scope to avoid per-frame GC pressure.
- Moon mesh (`Moon.tsx`): added `onClick`, `onPointerOver`, `onPointerOut` matching Earth/Sun interaction pattern.

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
- Click celestial body to focus (heliocentric/geocentric/selenocentric). Earth shader uses `uSunPositionWorld` with per-vertex direction.
- Procedural FBM sun surface with 3D trilinear noise and view-space limb darkening.
- Camera zoom (bidirectional via `ZoomSync`), Earth scale (1–20x). Defaults: orbit 2x, rotation 5000x, zoom 400, scale 5x.

## Recent Commits (since last doc sync)

- `b4c6306` — Initialize t8 Agentic OS for agent-first routing and memory.
- `d9a230c` — Add Understand Anything knowledge graph with auto-update enabled.
- `2bbfd35` — Increased max earth scale to 20 and bumped explainer earthScale to max.

## Lessons

- **Do not call Zustand `set()` from R3F `useFrame` for high-frequency updates.** Pushing state from `requestAnimationFrame` into Zustand triggers React 19's `useSyncExternalStore` tearing avoidance, causing cascading re-renders. Use a pull model: components poll mutable refs via `setInterval` in `useEffect`. Low-frequency guarded updates (e.g. `ZoomSync` with >1 unit threshold) are acceptable.
- **`@react-three/postprocessing` v3.0.4 is incompatible with React 19 + Three.js r183.** `Selection`/`Select` causes infinite re-render loops; `EffectComposer` triggers WebGL context loss. Use lightweight shader-based or CSS alternatives.
- **Clean up superseded files in the same commit as a format migration.** When moving shaders from `.glsl` raw imports to `.ts` template literals, delete the old files, type declarations, and loader config together.
- **Memoize objects passed as R3F component props.** Drei's `Html` and similar components use `useEffect` with prop dependencies. Unstable array/object references (e.g. `position={[x, y, z]}` inline, `style={{...}}` inline) trigger infinite re-render loops. Always hoist to module constants or `useMemo`.
- **Never use `hash(floor(p))` for animated displacement — it pops.** `floor()` creates a step function that jumps at integer boundaries. Always trilinearly interpolate hash values across lattice corners with smoothstepped `fract()`.
- **Three.js Euler order matters for compound rotations.** Default `'XYZ'` applies X last (parent frame). For Moon nodal precession: `'YXZ'` tilts the plane first (Rx), then precesses the tilted plane (Ry). With `'XYZ'`, Ry applies to a circular orbit (no-op) before tilting.
- **Lunar nodal precession is retrograde.** The ascending node drifts westward. Three.js positive `rotation.y` is counterclockwise from +Y (prograde), so the precession angle must be negated.
- **Tidal locking rotation sign:** `rotation.y = -orbitalAngle + π`, not `+orbitalAngle + π`. Three.js `Ry(θ)` maps local +X to `(cos θ, 0, -sin θ)`, matching Earth direction only with the negated angle.
- **Always guard `cache.put()` with `response.ok`.** Service worker `fetch()` resolves for 4xx/5xx — only the network failing causes rejection. Without `if (response.ok)` before caching, error pages poison the cache and are served on subsequent visits. Apply to every fetch-then-cache path: textures, static assets, navigation, and precaching.
- **R3F click events propagate through ALL intersected meshes along the ray.** When a raycast hits multiple meshes (e.g. Earth in front of Sun), `onClick` fires on every one unless `event.stopPropagation()` is called. Always call `e.stopPropagation()` in mesh click handlers to ensure only the nearest mesh responds. Without this, `setFocusTarget('earth')` fires first, then `setFocusTarget('sun')` overwrites it, making the click appear to do nothing.
- **Use `setX(value)` not `toggleX()` for focus/selection state.** Toggle actions are fragile: dual-firing events (R3F ray propagation), double-clicks, or future multi-target scenarios all break them. Explicit `setFocusTarget('earth')` is idempotent, composable, and scales to N targets.
- **Zustand v5: returning `{}` from a functional `set()` still notifies subscribers.** For true no-op idempotency, return the existing state reference (`return s`) when nothing changes — not an empty partial. Test no-ops with a `subscribe` spy, not just state equality.
- **`backdrop-filter` creates a containing block for `position: fixed` descendants.** The explainer panel uses `backdrop-blur-md`, so a nested modal's `fixed inset-0` overlay gets trapped inside the panel instead of covering the viewport. Render full-screen overlays via `createPortal(..., document.body)` (see `SeasonDiagramModal`). z-index tiers: mobile explainer scrim 55, panel 60, diagram modal 70.
- **Pre-allocate reusable `THREE.Vector3`/`THREE.Euler` at module scope for `useFrame` loops.** Allocating `new Vector3()` or calling `.clone()` every frame creates GC pressure. Declare module-level scratch objects (e.g. `const _moonLocalPos = new THREE.Vector3()`) and `.set()`/`.copy()` into them each frame.

## Technical Debt

- **`public/sw.js` does not precache Mercury/Venus textures.** `TEXTURE_FILES` still lists only earth-day/earth-night/moon; `mercury.jpg`/`venus.jpg` are missing, so offline mode serves broken planets. Fix requires adding both files and bumping `TEXTURE_CACHE` (coupled to `lib/useOfflineStatus.ts`, guarded by `swCacheNames.test.ts`).
- **`ZoomSync` calls `setZoomDistance` from `useFrame`:** guarded by >1 unit threshold so it only fires on mouse wheel, but follows the same Zustand-from-rAF pattern identified as risky. Monitor for issues.