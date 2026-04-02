# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev          # Start Next.js dev server (port 3100)
pnpm build        # Production build
pnpm lint         # ESLint (flat config, eslint.config.mjs)
pnpm test         # Run all tests (vitest)
pnpm test:watch   # Watch mode
```

Package manager is **pnpm**. Do not use npm or yarn.

## Architecture

SimSolar is a browser-based solar system simulation built with **Next.js 16**, **React Three Fiber (R3F)**, and **Zustand**. It renders an interactive 3D scene showing Earth and the Moon orbiting the Sun with accurate Keplerian orbital mechanics.

### Rendering pipeline

`app/page.tsx` (server component) → `ClientRoot` (client boundary) → `Scene` (R3F `<Canvas>`)

- **`ClientRoot`** creates a mutable `SimulationClock` object (Julian day + rotation angle) and shares it via `SimulationContext` (React context). This clock is mutated every frame — it is not React state.
- **`Animator`** runs inside `useFrame` and advances the clock each frame based on store speeds. It positions Earth along its orbit, drives Moon orbital position/tidal locking/nodal precession, manages focus-target reference frames, and updates shader uniforms.
- **`Scene`** owns shared Three.js refs (`earthGroupRef`, `earthMeshRef`, `earthMaterialRef`, `worldGroupRef`, `moonGroupRef`, `moonInclinationGroupRef`) and passes them to both `Animator` and `Earth`/`Moon`.

### State management

`store/useAppStore.ts` — single Zustand store holding playback state (isPlaying, orbitSpeed, rotationSpeed), camera/zoom, earth scale, hemisphere toggle, and focus target (`'sun' | 'earth' | 'moon'`). The Animator reads this via `useAppStore.getState()` inside `useFrame` to avoid React re-renders in the render loop.

### Orbital mechanics

`lib/orbitalMechanics.ts` — pure functions for Julian day conversion, Kepler's equation solver (Newton-Raphson), Earth orbital position, sidereal rotation, and season/solstice labelling. All physical constants live in `lib/constants.ts`.

### Component layout

- `components/canvas/` — Three.js scene components (Sun, Earth, Moon, OrbitPath, Starfield, Annotations, ZoomSync, Animator, ErrorBoundary)
- `components/hud/` — 2D overlay UI (HUD, TimelineSlider, SpeedControls, HemisphereControl, PlanetSelector)
- `components/ui/` — InfoModal (about/help overlay with offline caching toggle)
- `lib/` — Pure logic (`orbitalMechanics.ts`, `constants.ts`, `cameraMath.ts`), React hooks (`usePlanetDrag.ts`, `useOfflineStatus.ts`), and GLSL shaders as TypeScript string exports (`shaders/`)

### Focus modes

The scene supports three focus targets: **sun-centric** (default, Sun at origin), **earth-centric** (Earth at origin, world group offset by `-earthPos`), and **moon-centric** (Moon at origin, Earth offset by `-moonLocalPos`, world group offset by `-(earthPos + moonLocalPos)`). The `Animator` handles the position swaps; `worldGroupRef` contains Sun, orbit path, and annotations. Clicking any body calls `setFocusTarget` with its identity and `event.stopPropagation()` to prevent R3F raycast propagation. The focused planet can also be dragged to reposition it on screen (`usePlanetDrag` hook).

## Key patterns

- Earth uses custom ShaderMaterial with `uSunPositionWorld` uniform for day/night lighting — the Animator updates this uniform each frame to work in all three reference frames
- The `SimulationClock` is a plain mutable object shared via context, not React state — this avoids re-renders during animation
- HUD components read from Zustand store reactively; canvas components read via `getState()` in `useFrame`
- Vitest config uses `globals: true` and `@` path alias resolving to project root
- Tailwind v4 with PostCSS plugin (`@tailwindcss/postcss`)
