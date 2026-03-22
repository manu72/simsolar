# SimSolar

Interactive 3D solar system visualisation for solstice and equinox education. Built with a southern hemisphere default perspective, SimSolar renders Keplerian orbital mechanics in the browser using WebGL shaders, letting users scrub through a full year to observe how Earth's axial tilt creates the seasons.

**Phase 1** — Sun + Earth. Additional planets planned for future phases.

## Vision and Goals

- Teach solstice and equinox concepts through interactive visualisation
- Default to a southern hemisphere viewpoint (camera, labels, terminology)
- Physically grounded: Keplerian elliptical orbit, sidereal rotation, real solstice/equinox dates
- Accessible on desktop (optimised for 2560x1440) and usable on mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| 3D Engine | React Three Fiber + Drei + Three.js |
| Post-processing | `@react-three/postprocessing` (Bloom) |
| State | Zustand |
| Styling | Tailwind CSS v4 (dark mode) |
| Shaders | Custom GLSL (day/night terminator, atmosphere rim) |
| Language | TypeScript (strict) |
| Testing | Vitest |
| Package Manager | pnpm |
| Deployment | Vercel |

## Project Structure

```
simsolar/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (dark theme, metadata)
│   ├── page.tsx                  # Home page — renders ClientRoot
│   └── globals.css               # Tailwind imports, CSS variables
├── components/
│   ├── ClientRoot.tsx            # Client entry — clock, context, canvas + HUD
│   ├── canvas/                   # 3D scene components
│   │   ├── Scene.tsx             # R3F Canvas, camera, controls, bloom, composition
│   │   ├── Animator.tsx          # useFrame loop — orbit, rotation, shader uniforms
│   │   ├── SimulationContext.ts  # React context for SimulationClock ref
│   │   ├── Sun.tsx               # Sun mesh + point light (bloom selected)
│   │   ├── Earth.tsx             # Shader sphere with day/night textures, axial tilt
│   │   ├── OrbitPath.tsx         # Elliptical orbit line in XZ plane
│   │   ├── Starfield.tsx         # ~2000 instanced star points
│   │   ├── Annotations.tsx       # HTML labels at solstice/equinox positions
│   │   └── ErrorBoundary.tsx     # Error boundary for texture loading
│   └── hud/                      # 2D overlay controls
│       ├── HUD.tsx               # HUD container with play/pause
│       ├── TimelineSlider.tsx    # Year scrubber with season bands and event ticks
│       ├── SpeedControls.tsx     # Orbit and rotation speed sliders
│       ├── HemisphereControl.tsx # S/N hemisphere toggle
│       └── PlanetSelector.tsx    # Planet selector (Earth only in Phase 1)
├── lib/                          # Pure logic (no React/Three dependencies)
│   ├── constants.ts              # Orbital and scene constants
│   ├── orbitalMechanics.ts       # Julian day, Keplerian position, rotation, seasons
│   └── shaders/
│       ├── earth.vert.glsl       # Vertex shader — UVs, world normals, view direction
│       └── earth.frag.glsl       # Fragment shader — day/night blend, terminator, atmosphere
├── store/
│   └── useAppStore.ts            # Zustand store (playing, speeds, date, hemisphere)
├── types/
│   └── glsl.d.ts                 # TypeScript declarations for GLSL imports
├── public/
│   └── textures/                 # Earth day and night texture maps
├── __tests__/
│   └── orbitalMechanics.test.ts  # Orbital mechanics unit tests
├── docs/
│   └── superpowers/
│       ├── specs/                # Design specifications
│       └── plans/                # Implementation plans
├── vercel.json                   # Cache headers for texture assets
├── next.config.ts                # Turbopack raw loader for GLSL files
├── vitest.config.ts              # Vitest configuration with @ alias
├── tsconfig.json                 # TypeScript strict config
└── package.json                  # Dependencies and scripts
```

## Architecture

**Time model:** A `SimulationClock` ref holds `julianDay` and `rotationAngle` — mutated every frame by the `Animator` component. Zustand holds UI-level state (`isPlaying`, `orbitSpeed`, `rotationSpeed`, `displayDate`, `hemisphere`).

**Rendering loop:** `Animator` reads Zustand via `getState()` each frame (no re-renders), advances the clock, computes Earth's Keplerian position, updates mesh transforms, and sets the sun-direction shader uniform for the day/night terminator.

**Orbital mechanics:** Pure TypeScript functions with no React or Three.js dependencies — Julian day conversions, elliptical orbit position, sidereal rotation angle, season labelling, and solstice/equinox event detection.

**Shaders:** Custom GLSL vertex/fragment pair blends day and night textures across a soft terminator with an atmosphere rim glow on the lit limb.

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
- **Axial tilt** — 23.44° tilt accurately represented, driving seasonal variation
- **Timeline scrubber** — drag through a full year; season colour bands and solstice/equinox tick marks
- **Playback controls** — play/pause, independent orbit and rotation speed sliders
- **Hemisphere toggle** — switch between southern and northern hemisphere labels and terminology
- **Solstice/equinox annotations** — labelled positions on the orbit path, updating with hemisphere choice
- **Bloom post-processing** — sun glow via selective bloom
- **Starfield** — ~2000 background stars for spatial context
- **Vercel deployment** — production-ready with texture cache headers

## Recent Updates

- HUD hemisphere labels (S/N), season bands computed from orbital events, scrub/play ref fix
- Complete HUD: timeline slider, speed controls, hemisphere toggle, planet selector
- Scene assembly with ClientRoot, annotations, error boundary, app shell
- Animator useFrame loop for orbit, rotation, and shader uniforms
- Earth component with custom ShaderMaterial, day/night textures, axis line
- Sun, Starfield, OrbitPath components
- Day/night GLSL shaders with soft terminator
- Zustand store and SimulationContext
- Orbital mechanics: Julian day, Keplerian position, sidereal rotation, season labels, events
- Vercel cache headers and production build verified
