<!-- agentic:managed:start -->
# Project brief

## Purpose
Browser-based 3D solar system simulation (SolarSim) for teaching solstice and equinox concepts through interactive Keplerian orbital mechanics. Phase 1 covers Sun, Earth, and Moon with a southern-hemisphere-default perspective.

## Stack
- Languages: TypeScript (strict)
- Frameworks: Next.js 16 (App Router), React 19, React Three Fiber + Drei + Three.js, Zustand, Tailwind CSS v4
- Runtime: Node.js 20+
- Package manager: pnpm (do not use npm or yarn)

## Deployment
- Hosting: Vercel (`vercel.json` — 1yr immutable cache headers for `/textures/*`)
- CI/CD: none (README instructs local `pnpm test`, `pnpm lint`, `pnpm build` before PR)
- Dev server: port 3100 (`pnpm dev`)

## Major subsystems
- `canvas` — R3F scene graph, Animator render loop, celestial bodies — see `SUBSYSTEMS/canvas.md`
- `hud` — timeline, playback, speed/zoom/scale controls — see `SUBSYSTEMS/hud.md`
- `ui` — season explainer picker, info modal, loading overlay — see `SUBSYSTEMS/ui.md`
- `lib` — orbital mechanics, constants, shaders, camera math, hooks — see `SUBSYSTEMS/lib.md`
- `store` — Zustand playback and view state — see `SUBSYSTEMS/store.md`
- `pwa-offline` — service worker asset caching — see `SUBSYSTEMS/pwa-offline.md`

## Source-of-truth files
- `lib/constants.ts` — orbital, scene, Moon, and control constants
- `lib/orbitalMechanics.ts` — Julian day, Kepler solver, Earth position, seasons
- `lib/seasonExplainer.ts` — explainer events, copy, scene presets
- `store/useAppStore.ts` — playback, focus target, hemisphere, season explainer state
- `components/canvas/SimulationContext.ts` — mutable `SimulationClock` contract
- `public/sw.js` — offline cache strategy and cache names
- `package.json` — dependencies and scripts

## External agent instruction sources
- `CLAUDE.md` — commands, render pipeline, focus modes, key patterns (references `AGENTS.md`)
- `AGENTS.md` — Next.js 16 breaking-change warning; read `node_modules/next/dist/docs/` before App Router edits
- `.cursor/rules/*` — absent
- `.cursor/skills/*` — not ingested (project-local skills unknown)
- `.github/copilot-instructions.md` — absent
- `WORKING_MEMORY.md` — pitfalls, recent decisions, tech debt (informal; not a routing source of truth)

## Conflicts
- none between instruction sources on durable rules
- note: `WORKING_MEMORY.md` states `@react-three/postprocessing` was removed from rendering; `package.json` still lists it as unused dependency (tech debt, not doc conflict)

## Unknowns
- Phase 2 planet scope and timeline
- Mobile UX optimisation plan (README: desktop-first, narrow viewports wrap but not fully mobile-optimised)
<!-- agentic:managed:end -->

<!-- human:notes:start -->
## Product intent
Educational tool for solstice/equinox understanding — physically grounded mechanics with southern hemisphere default (AU/NZ calibration). PWA-ready for classroom/offline texture use.

## Architectural philosophy
Separate simulation time (`SimulationClock` mutable ref) from React/Zustand UI state. Pure logic in `lib/` with no React/Three imports. Canvas reads store via `getState()` in `useFrame` to avoid re-renders. GLSL as TypeScript template literals, not raw `.glsl` files.

## Business constraints
Unknown — review (no PRD or business docs found; open-source educational project).

## Project-specific judgement
Read `WORKING_MEMORY.md` before touching `Animator.tsx`, mesh click handlers, or service worker caching — highest-impact pitfalls live there. Do not add postprocessing library; CSS/shader alternatives only.
<!-- human:notes:end -->
