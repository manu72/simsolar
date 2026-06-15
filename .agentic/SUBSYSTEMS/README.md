<!-- agentic:managed:start -->
# Subsystems

One file per major subsystem. Each file is short and routing-oriented:

- Purpose
- Owned paths
- Public contracts
- Source-of-truth files
- Related tests
- Dependencies
- Invariants
- Common failure modes
- Do-not-do rules
- Related lessons
- Unknowns

| File | Scope |
| --- | --- |
| `canvas.md` | R3F scene, Animator, celestial bodies, shaders integration |
| `hud.md` | Timeline, playback, speed/zoom/scale, hemisphere, planet selector |
| `ui.md` | Season explainer UI, info modal, loading overlay |
| `lib.md` | Pure logic, orbital mechanics, GLSL sources, hooks |
| `store.md` | Zustand application state |
| `pwa-offline.md` | Service worker, offline cache, manifest |

Create additional subsystem files only when evidence is strong (dedicated folder, entry point, or architecture doc). Prefer `Unknown` over invention.
<!-- agentic:managed:end -->

<!-- human:notes:start -->
<!-- Seeded on init. Add subsystem routing notes or ownership boundaries here. -->
<!-- human:notes:end -->
