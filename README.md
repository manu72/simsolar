# SolarSim

Interactive 3D solar system visualisation for solstice and equinox education. Built with a southern hemisphere default perspective, SolarSim renders Keplerian orbital mechanics in the browser using WebGL shaders, letting users scrub through a full year to observe how Earth's axial tilt creates the seasons.

**Phase 1** — Sun, Earth, and Moon. Additional planets planned for future phases.

## Vision and Goals

- Teach solstice and equinox concepts through interactive visualisation
- Default to a southern hemisphere viewpoint (camera, labels, terminology)
- Physically grounded: Keplerian elliptical orbit, sidereal rotation, real solstice/equinox dates
- Accessible on desktop (optimised for 2560x1440) and usable on mobile
- PWA-ready with optional offline caching of textures and assets

## Tech Stack


| Layer           | Technology                                                                     | Version                  |
| --------------- | ------------------------------------------------------------------------------ | ------------------------ |
| Framework       | Next.js (App Router)                                                           | 16.2.1                   |
| UI              | React                                                                          | 19.2.4                   |
| 3D Engine       | React Three Fiber + Drei + Three.js                                            | 9.5.0 / 10.7.7 / 0.183.2 |
| State           | Zustand                                                                        | 5.0.12                   |
| Styling         | Tailwind CSS v4 (dark mode, via `@tailwindcss/postcss`)                        | 4.x                      |
| Shaders         | Custom GLSL — Earth day/night terminator, atmosphere rim, animated sun surface | —                        |
| Language        | TypeScript (strict)                                                            | 5.x                      |
| Testing         | Vitest                                                                         | 4.1.0                    |
| Linting         | ESLint (flat config, next core-web-vitals + typescript)                        | 9.x                      |
| Package Manager | pnpm                                                                           | —                        |
| Deployment      | Vercel                                                                         | —                        |


## Project Structure

```
simsolar/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (dark theme, metadata, PWA manifest link)
│   ├── page.tsx                      # Home page — renders ClientRoot only
│   └── globals.css                   # Tailwind v4 imports, CSS custom properties
├── components/
│   ├── ClientRoot.tsx                # Client entry — SimulationClock, Scene, gated HUD, loading overlay
│   ├── canvas/                       # 3D scene components (React Three Fiber)
│   │   ├── Scene.tsx                 # R3F Canvas, camera, controls, scene graph composition
│   │   ├── Animator.tsx              # useFrame loop — orbit, rotation, Moon, shader uniforms
│   │   ├── SimulationContext.ts      # React context for mutable SimulationClock ref
│   │   ├── Sun.tsx                   # Animated surface shader + pointLight + CSS glow + click-to-focus
│   │   ├── Earth.tsx                 # Custom shader sphere with day/night textures, axial tilt
│   │   ├── Moon.tsx                  # Textured sphere, 5.14° inclined orbit, tidal locking, precession
│   │   ├── OrbitPath.tsx             # Elliptical orbit line in XZ plane
│   │   ├── Starfield.tsx             # ~2000 instanced star points with size variation
│   │   ├── Annotations.tsx           # HTML labels at solstice/equinox orbital positions
│   │   ├── ZoomSync.tsx              # Bidirectional camera ↔ Zustand zoom sync
│   │   └── ErrorBoundary.tsx         # Error boundary for WebGL/texture loading failures
│   ├── hud/                          # 2D overlay controls (React DOM)
│   │   ├── HUD.tsx                   # HUD container with play/pause
│   │   ├── TimelineSlider.tsx        # Year scrubber with season colour bands, date display, event ticks
│   │   ├── SpeedControls.tsx         # Orbit speed, rotation speed, camera zoom, earth scale sliders
│   │   ├── HemisphereControl.tsx     # S/N hemisphere toggle
│   │   ├── LabelsControl.tsx         # Orbital labels toggle (Phase 1)
│   │   └── PlanetSelector.tsx        # Planet selector (Earth only in Phase 1)
│   └── ui/
│       ├── TopLeftControls.tsx       # Info button, season explainer picker (embeds InfoModal)
│       ├── InfoModal.tsx             # About/help modal with offline caching toggle
│       └── LoadingOverlay.tsx        # Shown until WebGL scene is ready or fails
├── lib/                              # Pure logic, camera math, and React hooks
│   ├── constants.ts                  # Orbital, scene, Moon, and control constants
│   ├── orbitalMechanics.ts           # Julian day, Kepler solver, Earth position, rotation, seasons
│   ├── seasonExplainer.ts            # Solstice/equinox explainer copy, events, scene presets
│   ├── cameraMath.ts                 # Pixel-to-world conversion, screen pan, pan reset, zoom-to-distance
│   ├── usePlanetDrag.ts              # Hook — drag focused planet to reposition on screen
│   ├── useOfflineStatus.ts           # React hook for service worker cache state and progress
│   └── shaders/                      # GLSL as TypeScript template literals
│       ├── earth.vert.ts             # Earth vertex — UVs, world normals, per-vertex sun direction
│       ├── earth.frag.ts             # Earth fragment — day/night blend, terminator, atmosphere rim
│       ├── sunSurface.vert.ts        # Sun vertex — 3D trilinear noise displacement, time animation
│       └── sunSurface.frag.ts        # Sun fragment — procedural FBM noise, limb darkening
├── store/
│   └── useAppStore.ts                # Zustand (playback, speeds, hemisphere, zoom, scale, focus, season explainer)
├── public/
│   ├── textures/                     # Earth day/night and Moon texture maps (~25MB total)
│   ├── icons/                        # PWA app icons (192px, 512px)
│   ├── manifest.json                 # PWA manifest
│   └── sw.js                         # Service worker for offline asset caching
├── __tests__/                        # Vitest — run `pnpm test` for current counts (5 files, 123 tests)
│   ├── orbitalMechanics.test.ts      # Julian day, Kepler orbit, seasons, solstice/equinox events
│   ├── cameraMath.test.ts            # Pixel-to-world, screen pan, zoom-to-distance
│   ├── seasonExplainer.test.ts       # Explainer events, presets, today-aware selection
│   └── swCacheNames.test.ts          # Service worker cache name coupling with public/sw.js
├── .agentic/                         # t8 Agentic OS operational memory and routing (agent-first)
│   ├── CONFIG/agentic.json           # AgenticOS config (graph-first provider, codemap fallback)
│   ├── MEMORY_INDEX.md               # Memory index for agent routing
│   ├── PROJECT_BRIEF.md              # Project brief from repo evidence
│   ├── SUBSYSTEMS/                   # Subsystem documentation
│   └── LESSONS/                      # Durable lessons from code changes
├── .understand-anything/             # Understand Anything knowledge graph (auto-update enabled)
│   ├── config.json                   # autoUpdate: true, outputLanguage: en
│   ├── meta/                         # Graph metadata
│   └── fingerprints/                 # File fingerprints for freshness
├── scripts/agentic/                  # AgenticOS runtime tooling
│   ├── README.md                     # Scripts documentation
│   ├── graph_sync.py                 # Graph sync script
│   ├── route_task.py                 # Task routing to context bundle
│   ├── update_memory.py              # Runtime memory maintenance
│   └── validate_memory.py            # Memory validation checks
├── CLAUDE.md                         # AI assistant guidance (architecture, commands, patterns)
├── AGENTS.md                         # Agent rules (Next.js version warning)
├── WORKING_MEMORY.md                 # Project context, decisions, lessons, tech debt
├── vercel.json                       # Vercel config — texture cache headers (1yr immutable)
├── next.config.ts                    # Next.js configuration (empty — no custom settings needed)
├── vitest.config.ts                  # Vitest config with @ path alias
├── tsconfig.json                     # TypeScript strict config with @ path alias
├── eslint.config.mjs                 # ESLint flat config (next core-web-vitals + typescript)
├── postcss.config.mjs                # PostCSS with @tailwindcss/postcss
└── package.json                      # Dependencies and scripts
```

## Architecture

### Component Tree

```
ClientRoot (SimulationContext.Provider)
├── Scene (R3F Canvas — loads textures; calls onReady when ready)
├── TopLeftControls + HUD          shown only after sceneReady (not on WebGL failure)
│   ├── TopLeftControls            season explainer picker; embeds InfoModal
│   └── HUD                        TimelineSlider, SpeedControls, HemisphereControl, LabelsControl, PlanetSelector
└── LoadingOverlay                 hidden when sceneReady or sceneFailed

Scene (inside Canvas)
├── Animator                       useFrame — advances clock, positions bodies, shader uniforms
├── Starfield                      static backdrop (outside worldGroup)
├── worldGroup                     Sun, OrbitPath, Annotations — offset in geocentric/selenocentric modes
├── Earth group (+ Moon nested)    day/night shader, axial tilt, inclined lunar orbit
├── ZoomSync                       camera ↔ Zustand zoomDistance
└── OrbitControls                  mouse orbit/zoom
```

### ### Data Flow

```
SimulationClock (mutable ref — { julianDay, rotationAngle })
  └─ Animator.tsx (useFrame per-frame loop)
       ├─ reads Zustand via getState() (no React re-renders)
       ├─ advances julianDay / rotationAngle (unless season explainer overrides clock)
       ├─ calls lib/orbitalMechanics.ts (pure functions)
       ├─ updates mesh transforms & shader uniforms
       └─ parents Moon under Earth group (inherits position/scale/ref frame)

User Input (HUD sliders, buttons, clicks, season explainer, labels toggle)
  └─ Zustand store (store/useAppStore.ts)
       ├─ isPlaying, orbitSpeed, rotationSpeed
       ├─ hemisphere, zoomDistance, earthScale (1–20x), focusTarget
       ├─ activeSeasonExplainer (mode + event label, or null)
       ├─ showOrbitalLabels (boolean)
       └─ HUD / TopLeftControls read via useAppStore() for reactivity

Date Display
  └─ TimelineSlider polls SimulationClock ref via setInterval

Season Explainer (guided solstice/equinox tours)
  └─ TopLeftControls → setActiveSeasonExplainer()
       ├─ Animator snaps/advances clock to event Julian day; applies scene preset
       ├─ Annotations highlights the active event label
       └─ clearActiveSeasonExplainer() restores prior playback snapshot
```

### Season Explainer

Educational guided tours for solstice and equinox events. Copy and event metadata live in [`lib/seasonExplainer.ts`](lib/seasonExplainer.ts). [`TopLeftControls`](components/ui/TopLeftControls.tsx) sets `activeSeasonExplainer` in Zustand; [`Animator`](components/canvas/Animator.tsx) drives the clock and scene preset; [`Annotations`](components/canvas/Annotations.tsx) highlights the active event. Pure logic is covered by [`__tests__/seasonExplainer.test.ts`](__tests__/seasonExplainer.test.ts).

### Triple Reference Frame

Clicking any celestial body sets `focusTarget` to `'sun'` (heliocentric — Sun at origin), `'earth'` (geocentric — Earth at origin), or `'moon'` (selenocentric — Moon at origin). Each click handler is idempotent and calls `event.stopPropagation()`. The Earth shader uniform `uSunPositionWorld` updates accordingly so lighting works in all three modes.

### Rendering Loop

`Animator` reads Zustand via `getState()` each frame (no re-renders), advances the clock, computes Earth's Keplerian position, drives Moon orbital position/tidal locking/nodal precession, updates mesh transforms and reference frame, and sets shader uniforms. `ZoomSync` keeps the camera distance and HUD zoom slider bidirectionally synchronised.

### Orbital Mechanics

Pure TypeScript functions with no React or Three.js dependencies — Julian day conversions, elliptical orbit position via Kepler's equation (Newton-Raphson, 1e-8 rad tolerance), sidereal rotation angle, season labelling, and solstice/equinox event detection.

### Shaders

GLSL stored as TypeScript template literals in `lib/shaders/`. Earth blends day and night textures across a soft terminator with atmosphere rim glow. Sun uses procedural FBM noise surface shader with limb darkening, animated by `uTime`. Moon uses `meshStandardMaterial` lit by the Sun's point light.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Install & Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3100](http://localhost:3100) to view the simulation. The dev server starts on port **3100** (not the default 3000).

### What You'll See

When the app loads, you'll see a 3D scene with a glowing Sun at center and Earth orbiting around it. Below the canvas:

- A **timeline slider** lets you scrub through the year — watch seasons change as you drag
- **Speed controls** let you adjust orbit speed, rotation speed, zoom, and Earth scale independently
- Click the **Sun, Earth, or Moon** to center your view on that body (heliocentric, geocentric, or selenocentric)
- A **hemisphere toggle** switches between southern/northern labels and terminology
- **Season explainer** tours (top-left) walk through solstice and equinox events with guided copy and scene presets

The simulation defaults to a southern hemisphere viewpoint — everything is calibrated for contributors and users in the AU/NZ time zone.

### Build

```bash
pnpm build
pnpm start
```

### Test

```bash
pnpm test          # single run
pnpm test:watch    # watch mode
```

### Lint

```bash
pnpm lint
```

### Verify Your Setup

Run these checks before starting development to confirm everything is working:

```bash
# 1. All tests pass — validates core math and camera logic
pnpm test

# 2. No lint issues
pnpm lint

# 3. Production build succeeds
pnpm build
```

If all three pass, your environment is ready for contributing. Re-run the same checks before submitting a pull request (there is no CI workflow in this repo). If `pnpm dev` fails to start on port 3100, check that no other process is binding to it:

```bash
lsof -i :3100   # find the process
kill <pid>       # free the port
```

## Features

- **Keplerian orbit** — Earth follows a real elliptical path with correct eccentricity and perihelion longitude
- **Day/night shader** — custom GLSL blends day and night textures with a soft terminator and atmosphere rim
- **Animated sun** — procedural FBM noise surface shader with limb darkening and CSS radial-gradient glow
- **Moon** — orbits Earth with 5.14 degree inclination, tidal locking, 18.6-year nodal precession, NASA texture
- **Axial tilt** — 23.44 degrees tilt accurately represented, driving seasonal variation
- **Click-to-focus views** — click Sun, Earth, or Moon to centre the view on that body (heliocentric, geocentric, or selenocentric)
- **Drag-to-reposition** — drag the focused planet to shift it on screen, useful for smaller viewports; resets on focus change
- **Timeline scrubber** — drag through a full year; season colour bands and solstice/equinox tick marks
- **Playback controls** — play/pause, independent orbit and rotation speed sliders
- **Camera zoom** — HUD slider bidirectionally synced with mouse wheel via ZoomSync
- **Earth scale** — enlarge Earth (1–20x) independently of camera zoom for detail viewing
- **Hemisphere toggle** — switch between southern and northern hemisphere labels and terminology
- **Season explainer** — guided solstice/equinox tours with educational copy, scene presets, and orbit annotations
- **Solstice/equinox annotations** — labelled positions on the orbit path, updating with hemisphere choice
- **Starfield** — ~2000 background stars for spatial context
- **PWA offline support** — opt-in service worker caching of textures and assets via info modal
- **Info modal** — about/help overlay with usage instructions and offline caching toggle
- **Vercel deployment** — production-ready with texture cache headers

## Contributing

### Quick Tasks for New Contributors

If you're new to this codebase, pick any task below and start:

| Task | Files to Touch | Effort | What You'll Learn |
|------|---------------|--------|-------------------|
| Remove unused `@react-three/postprocessing` dependency | [`package.json`](package.json), verify no imports across the codebase | 15 min | Dependency cleanup, audit patterns |
| Add Mars orbit rendering for Phase 2 | [`PlanetSelector.tsx`](components/hud/PlanetSelector.tsx), new canvas component, [`lib/constants.ts`](lib/constants.ts) | 4+ hrs | Orbital mechanics, scene graph |
| Extend season explainer copy or add a new event preset | [`lib/seasonExplainer.ts`](lib/seasonExplainer.ts), [`__tests__/seasonExplainer.test.ts`](__tests__/seasonExplainer.test.ts) | 1-2 hrs | Pure functions, educational content |
| Add webp/avif texture fallbacks for Earth/Moon textures | [`public/textures/`](public/textures/), shader texture loading code | 1-2 hrs | Asset pipeline, format detection |
| Improve solstice/equinox date precision (per-year computation) | [`lib/orbitalMechanics.ts`](lib/orbitalMechanics.ts), [`__tests__/orbitalMechanics.test.ts`](__tests__/orbitalMechanics.test.ts) | 2-3 hrs | Orbital mechanics, pure function testing |

### Where to Start (Deep Dive)

If you'd rather explore the codebase top-to-bottom:

1. **Understand the core math** — Read [`lib/orbitalMechanics.ts`](lib/orbitalMechanics.ts) (Julian day, Kepler solver, seasons) and its tests in [`__tests__/orbitalMechanics.test.ts`](__tests__/orbitalMechanics.test.ts). This is pure TypeScript with no React/Three.js dependencies — the easiest entry point.
2. **Follow the rendering loop** — Read [`components/canvas/Animator.tsx`](components/canvas/Animator.tsx) to see how `useFrame` advances the simulation clock each frame and drives all visual updates.
3. **Trace data flow** — Follow from Zustand's [`store/useAppStore.ts`](store/useAppStore.ts) → `Animator` (reader) → HUD / TopLeftControls (writers).

### Documentation Map

| Doc | When to read |
| --- | --- |
| README | Product context, commands, file structure, onboarding |
| [`CLAUDE.md`](CLAUDE.md) | Render loop, focus modes, file roles, key patterns |
| [`WORKING_MEMORY.md`](WORKING_MEMORY.md) | Pitfalls, recent decisions, tech debt, lessons learned (last updated 2026-06-15) |
| [`AGENTS.md`](AGENTS.md) | Next.js 16 API caveats (only if touching App Router) |

### Common Pitfalls

Full detail lives in [`WORKING_MEMORY.md`](WORKING_MEMORY.md) § Lessons. Highest-impact rules when touching canvas or simulation code:

- Do not call Zustand `set()` from `useFrame` for high-frequency updates — keep simulation time in the `SimulationClock` ref; poll it from HUD components (see `TimelineSlider`)
- Always `event.stopPropagation()` on mesh click handlers — R3F fires `onClick` on every intersected mesh along the ray
- Moon compound rotations: Euler order `'YXZ'`, negated nodal precession, tidal lock `rotation.y = -orbitalAngle + π`

Before submitting changes, re-run the checks in [Verify Your Setup](#verify-your-setup).

### Code Conventions

- All GLSL shaders live as TypeScript template literals in `lib/shaders/` — never separate `.glsl` files
- Pure logic functions go in `lib/` with no React/Three.js imports (keeps them testable)
- Simulation time lives in the `SimulationClock` ref and Zustand UI state — not React `useState` (UI gates such as `sceneReady` in `ClientRoot` are fine)
- Tests mirror the lib structure: `lib/orbitalMechanics.ts` → `__tests__/orbitalMechanics.test.ts`
- For deeper patterns and architecture, see [`CLAUDE.md`](CLAUDE.md) and [`WORKING_MEMORY.md`](WORKING_MEMORY.md)

### Running the Full Suite

```bash
pnpm test          # run all tests
pnpm lint          # check code style
pnpm build         # production build
```

## Limitations and Caveats

- **WebGL required** — the simulation requires a browser with WebGL support. There is no non-WebGL fallback.
- **Desktop-optimised** — the HUD layout is designed for wide viewports. Controls wrap on narrow screens but are not fully mobile-optimised.
- **Approximate solstice/equinox dates** — event dates are fixed approximations (e.g. March 20, June 21), not astronomically computed per year. Adequate for educational purposes.
- **Compressed Moon orbit** — the Moon's orbital radius and size are scaled for visibility (real ratio would be invisible at Earth's scale). Constants document the compression.
- **Unused dependency** — `@react-three/postprocessing` remains in `package.json` but is not imported. It is incompatible with React 19 + Three.js r183 and should be removed.
- **No postprocessing** — bloom and glow effects use CSS alternatives (radial-gradient) because `@react-three/postprocessing` is incompatible with the current React/Three.js versions.