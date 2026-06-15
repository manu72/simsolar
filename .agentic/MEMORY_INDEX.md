<!-- agentic:managed:start -->
# Memory index

## Subsystems
- See `SUBSYSTEMS/` — `canvas`, `hud`, `ui`, `lib`, `store`, `pwa-offline`

## High-risk areas
- `components/canvas/Animator.tsx` — render loop; never high-frequency Zustand `set()` from `useFrame`
- `components/canvas/*.tsx` mesh click handlers — must call `event.stopPropagation()` (R3F ray propagation)
- `lib/shaders/` — custom GLSL; day/night lighting depends on `uSunPositionWorld` in all focus modes
- `components/canvas/Moon.tsx` — compound Euler rotations (`'YXZ'`), tidal lock sign, precession direction
- `public/sw.js` + `lib/useOfflineStatus.ts` — cache poisoning if `response.ok` not guarded before `cache.put()`
- `store/useAppStore.ts` — `focusTarget`, season explainer snapshot/restore; idempotent `setFocusTarget` not toggle

## Source-of-truth files
- `lib/constants.ts` — physical and scene constants
- `lib/orbitalMechanics.ts` — orbit and season math
- `lib/seasonExplainer.ts` — guided tour events and presets
- `store/useAppStore.ts` — UI and view state shape
- `components/canvas/SimulationContext.ts` — clock ref contract
- `vitest.config.ts` — test path alias (`@` → project root)
- `vercel.json` — production texture cache policy

## Lessons and decisions index
- Decisions: `LESSONS/decisions.md`
- Incidents: `LESSONS/incidents.md`
- Informal pitfalls (not yet migrated): `WORKING_MEMORY.md` § Lessons

## External instruction sources
- `CLAUDE.md`, `AGENTS.md`, `WORKING_MEMORY.md`
- `.cursor/rules/*` — absent

## Graph status (reference)
- See `.agentic/GRAPH_INDEX.md` — provider: understand-anything; path: `.agentic/GRAPH/knowledge-graph.json`; parseable; 109 nodes, 199 edges

## Memory freshness
- Last refreshed: 2026-06-15T00:45:00Z
- Files refreshed this run: `PROJECT_BRIEF.md`, `MEMORY_INDEX.md`, `SUBSYSTEMS/README.md`, `SUBSYSTEMS/canvas.md`, `SUBSYSTEMS/hud.md`, `SUBSYSTEMS/ui.md`, `SUBSYSTEMS/lib.md`, `SUBSYSTEMS/store.md`, `SUBSYSTEMS/pwa-offline.md`, `LESSONS/decisions.md`, `LESSONS/incidents.md`
<!-- agentic:managed:end -->

<!-- human:notes:start -->
## Routing hints
- Orbital math / seasons / solstice dates → `lib/orbitalMechanics.ts`, `__tests__/orbitalMechanics.test.ts`
- Season explainer copy or presets → `lib/seasonExplainer.ts`, `components/ui/TopLeftControls.tsx`, `components/canvas/Animator.tsx`
- Render loop / focus frames / shader uniforms → `components/canvas/Animator.tsx`, `CLAUDE.md`
- HUD sliders / timeline date display → `components/hud/`, `store/useAppStore.ts`; date polls clock ref not Zustand
- Offline caching / PWA → `public/sw.js`, `lib/useOfflineStatus.ts`, `components/ui/InfoModal.tsx`
- Next.js App Router API changes → read `node_modules/next/dist/docs/` per `AGENTS.md`

## Priority warnings
- Package manager is pnpm only
- Simulation clock is NOT React state — do not move `julianDay`/`rotationAngle` into Zustand for per-frame updates
- `@react-three/postprocessing` is incompatible (React 19 + Three r183) — do not reintroduce; remove from `package.json` when cleaning deps
- No CI workflow — run `pnpm test`, `pnpm lint`, `pnpm build` locally before PR
<!-- human:notes:end -->
