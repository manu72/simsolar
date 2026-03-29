# SimSolar

Interactive 3D solar system visualisation for solstice and equinox education. Built with a southern hemisphere default perspective, SimSolar renders Keplerian orbital mechanics in the browser using WebGL shaders, letting users scrub through a full year to observe how Earth's axial tilt creates the seasons.

**Phase 1** — Sun, Earth, and Moon. Additional planets planned for future phases.

## Vision and Goals

- Teach solstice and equinox concepts through interactive visualisation
- Default to a southern hemisphere viewpoint (camera, labels, terminology)
- Physically grounded: Keplerian elliptical orbit, sidereal rotation, real solstice/equinox dates
- Accessible on desktop (optimised for 2560x1440) and usable on mobile
- PWA-ready with optional offline caching of textures and assets

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| 3D Engine | React Three Fiber + Drei + Three.js |
| State | Zustand |
| Styling | Tailwind CSS v4 (dark mode) |
| Shaders | Custom GLSL — Earth day/night terminator, atmosphere rim, animated sun surface |
| Language | TypeScript (strict) |
| Testing | Vitest |
| Package Manager | pnpm |
| Deployment | Vercel |

## Project Structure

```
simsolar/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (dark theme, metadata)
│   ├── page.tsx                      # Home page — renders ClientRoot
│   └── globals.css                   # Tailwind imports, CSS variables
├── components/
│   ├── ClientRoot.tsx                # Client entry — clock, context, canvas + HUD
│   ├── canvas/                       # 3D scene components
│   │   ├── Scene.tsx                 # R3F Canvas, camera, controls, scene composition
│   │   ├── Animator.tsx              # useFrame loop — orbit, rotation, Moon, shader uniforms
│   │   ├── SimulationContext.ts      # React context for SimulationClock ref
│   │   ├── Sun.tsx                   # Animated surface shader + pointLight + CSS glow + click-to-focus
│   │   ├── Earth.tsx                 # Shader sphere with day/night textures, axial tilt
│   │   ├── Moon.tsx                  # Textured sphere, 5.14° inclined orbit, tidal locking, precession
│   │   ├── OrbitPath.tsx             # Elliptical orbit line in XZ plane
│   │   ├── Starfield.tsx             # ~2000 instanced star points
│   │   ├── Annotations.tsx           # HTML labels at solstice/equinox positions
│   │   ├── ZoomSync.tsx              # Bidirectional camera ↔ Zustand zoom sync
│   │   └── ErrorBoundary.tsx         # Error boundary for texture loading
│   ├── hud/                          # 2D overlay controls
│   │   ├── HUD.tsx                   # HUD container with play/pause
│   │   ├── TimelineSlider.tsx        # Year scrubber with season bands and event ticks
│   │   ├── SpeedControls.tsx         # Orbit speed, rotation speed, camera zoom, earth scale
│   │   ├── HemisphereControl.tsx     # S/N hemisphere toggle
│   │   └── PlanetSelector.tsx        # Planet selector (Earth only in Phase 1)
│   └── ui/
│       └── InfoModal.tsx             # About/help modal with offline caching toggle
├── lib/                              # Pure logic (no React/Three dependencies)
│   ├── constants.ts                  # Orbital, scene, Moon, and control constants
│   ├── orbitalMechanics.ts           # Julian day, Keplerian position, rotation, seasons
│   ├── useOfflineStatus.ts           # Hook for service worker cache state and progress
│   └── shaders/                      # GLSL as TypeScript template literals
│       ├── earth.vert.ts             # Earth vertex — UVs, world normals, per-vertex sun direction
│       ├── earth.frag.ts             # Earth fragment — day/night blend, terminator, atmosphere rim
│       ├── sunSurface.vert.ts        # Sun vertex — 3D noise displacement, time animation
│       └── sunSurface.frag.ts        # Sun fragment — procedural FBM noise, limb darkening
├── store/
│   └── useAppStore.ts                # Zustand store (playing, speeds, hemisphere, zoom, scale, focus)
├── public/
│   ├── textures/                     # Earth day/night and Moon texture maps
│   ├── icons/                        # PWA app icons (192px, 512px)
│   ├── manifest.json                 # PWA manifest
│   └── sw.js                         # Service worker for offline asset caching
├── __tests__/
│   └── orbitalMechanics.test.ts      # Orbital mechanics unit tests
├── docs/
│   └── superpowers/
│       ├── specs/                    # Design specifications
│       └── plans/                    # Implementation plans
├── vercel.json                       # Cache headers for texture assets
├── next.config.ts                    # Next.js configuration
├── vitest.config.ts                  # Vitest configuration with @ alias
├── tsconfig.json                     # TypeScript strict config
└── package.json                      # Dependencies and scripts
```

## Architecture

**Time model:** A `SimulationClock` ref holds `julianDay` and `rotationAngle` — mutated every frame by the `Animator` component. Zustand holds UI-level state (`isPlaying`, `orbitSpeed`, `rotationSpeed`, `hemisphere`, `zoomDistance`, `earthScale`, `focusTarget`). Display date is derived locally in `TimelineSlider` by polling the clock ref.

**Triple reference frame:** Clicking any celestial body sets `focusTarget` to `'sun'` (heliocentric — Sun at origin), `'earth'` (geocentric — Earth at origin, world group offset by `-earthPos`), or `'moon'` (selenocentric — Moon at origin, Earth offset by `-moonLocalPos`, world group offset by `-(earthPos + moonLocalPos)`). Each body's click handler is idempotent and calls `event.stopPropagation()` to prevent R3F raycast propagation. The Earth shader uniform `uSunPositionWorld` is set accordingly so lighting works in all three modes.

**Rendering loop:** `Animator` reads Zustand via `getState()` each frame (no re-renders), advances the clock, computes Earth's Keplerian position, drives Moon orbital position/tidal locking/nodal precession, updates mesh transforms and reference frame, and sets shader uniforms. `ZoomSync` keeps the camera distance and HUD zoom slider bidirectionally synchronised.

**Moon orbit:** The Moon is parented under the Earth group, inheriting its position, scale, and reference frame. Lunar orbital angle is derived from `clock.rotationAngle / MOON_SIDEREAL_PERIOD_DAYS`. Tidal locking keeps the same face toward Earth (`rotation.y = -orbitalAngle + PI`). The orbital plane is tilted 5.14 degrees with an 18.6-year retrograde nodal precession cycle (Euler order `'YXZ'`).

**Orbital mechanics:** Pure TypeScript functions with no React or Three.js dependencies — Julian day conversions, elliptical orbit position, sidereal rotation angle, season labelling, and solstice/equinox event detection.

**Shaders:** GLSL stored as TypeScript template literals. Earth uses a custom vertex/fragment pair that blends day and night textures across a soft terminator with atmosphere rim glow, computing per-vertex sun direction from the sun's world position. Sun uses a procedural FBM noise surface shader with limb darkening, animated by `uTime`. Moon uses `meshStandardMaterial` with a NASA texture, lit by the Sun's point light.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Install

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the simulation.

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

## Features

- **Keplerian orbit** — Earth follows a real elliptical path with correct eccentricity and perihelion longitude
- **Day/night shader** — custom GLSL blends day and night textures with a soft terminator and atmosphere rim
- **Animated sun** — procedural FBM noise surface shader with limb darkening and CSS radial-gradient glow
- **Moon** — orbits Earth with 5.14 degree inclination, tidal locking, 18.6-year nodal precession, NASA texture
- **Axial tilt** — 23.44 degrees tilt accurately represented, driving seasonal variation
- **Click-to-focus views** — click Sun, Earth, or Moon to centre the view on that body (heliocentric, geocentric, or selenocentric)
- **Timeline scrubber** — drag through a full year; season colour bands and solstice/equinox tick marks
- **Playback controls** — play/pause, independent orbit and rotation speed sliders
- **Camera zoom** — HUD slider bidirectionally synced with mouse wheel via ZoomSync
- **Earth scale** — enlarge Earth (1-10x) independently of camera zoom for detail viewing
- **Hemisphere toggle** — switch between southern and northern hemisphere labels and terminology
- **Solstice/equinox annotations** — labelled positions on the orbit path, updating with hemisphere choice
- **Starfield** — ~2000 background stars for spatial context
- **PWA offline support** — opt-in service worker caching of textures and assets via info modal
- **Info modal** — about/help overlay with usage instructions and offline caching toggle
- **Vercel deployment** — production-ready with texture cache headers

## Recent Updates

- Selenocentric view — click the Moon to centre the scene on it, with Earth and Sun offset accordingly
- Focus target refactored from toggle to explicit `setFocusTarget` with `event.stopPropagation()` for reliable click handling
- Info modal with about/help content and opt-in offline caching toggle
- PWA support with service worker, manifest, and app icons
- Moon tidal locking sign corrected (same face now always toward Earth)
- Moon nodal precession Euler order fixed to `'YXZ'` (precession now visually correct)
- Moon nodal precession angle negated for astronomically correct retrograde direction
- Moon orbiting Earth with 5.14 degree inclination, tidal locking, and 18.6-year nodal precession
- Lunar surface texture from NASA/Solar System Scope
- Sun CSS radial-gradient glow via drei Html, inline props hoisted to module constants
- Cursor cleanup on Sun unmount to prevent sticky pointer
- Sun vertex shader noise fixed (trilinear interpolation replaces discontinuous hash)
- Axial tilt negated so June solstice correctly darkens Antarctica
- Geocentric view with per-vertex sun lighting in both reference frames
- Animated sun surface shader with procedural FBM noise and limb darkening
- Camera zoom slider with bidirectional ZoomSync component
- Earth scale slider (1-10x) for independent detail control
