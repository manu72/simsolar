# SimSolar — Phase 1 Design Spec

**Date:** 2026-03-22
**Scope:** Phase 1 — Sun + Earth only
**Target:** 2560×1440 desktop primary, mobile usable

---

## Overview

An animated, interactive solar system visualisation web app that teaches solstice and equinox via accurate orbital mechanics. Defaults to a **southern hemisphere perspective** — camera orientation, season labels, and terminology all assume a southern hemisphere audience.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| 3D rendering | Three.js via React Three Fiber + Drei |
| Post-processing | `@react-three/postprocessing` (Bloom) |
| State | Zustand (UI state only — not animation hot path) |
| Styling | Tailwind CSS, dark mode only |
| Language | TypeScript throughout |
| Package manager | pnpm |
| Deployment | Vercel |
| Testing | Vitest (orbital mechanics only) |

---

## Architecture

### Time System (Approach B — Mutable ref clock, Zustand for UI)

**Source of truth ownership:**

| Field | Owner | Written by | Read by |
|---|---|---|---|
| `julianDay` | `SimulationClock` ref | `Animator` (each frame) + HUD scrub | `Animator`, canvas components |
| `isPlaying` | Zustand | HUD play/pause button | `Animator` reads via non-reactive snapshot each frame |
| `orbitSpeed` | Zustand | HUD slider | `Animator` reads via non-reactive snapshot each frame |
| `rotationSpeed` | Zustand | HUD slider | `Animator` reads via non-reactive snapshot each frame |
| `displayDate` | Zustand | `Animator` throttled ~4fps | HUD date label, timeline slider thumb |

`Animator` reads `isPlaying`, `orbitSpeed`, `rotationSpeed` from Zustand using `useAppStore.getState()` (non-reactive, zero re-renders) each frame. Zustand never reads from the clock ref.

`SimulationClock` only holds `julianDay` — it is purely a rendering cursor, not duplicating control state:

```ts
type SimulationClock = {
  julianDay: number  // mutable, updated every frame
}
```

**Initial state:** `julianDay` is initialised to the Julian day of the current date at app load (`dateToJulianDay(new Date())`). Zustand `displayDate` is initialised to `new Date()` (matching the initial `julianDay`) — it is never `undefined` on first render.

**Timeline scrubbing:** The HUD slider fires `onInput` → writes `julianDay` directly to the clock ref (immediate visual) and calls `setDisplayDate` in Zustand (HUD sync). On `pointerdown` on the slider, sets `isPlaying = false` in Zustand. On `pointerup`, restores `isPlaying` to whatever value it had before scrubbing began (not always `true` — respects prior play state).

The clock ref is passed via `SimulationContext` (a plain React context holding the ref — not reactive, causes no re-renders).

### Zustand Store — UI state only

```ts
{
  isPlaying: boolean           // default true
  orbitSpeed: number           // 0–50, default 10
  rotationSpeed: number        // 0–100, default 20
  displayDate: Date            // initialised to new Date(); updated ~4fps from Animator
  hemisphere: 'north' | 'south'  // default 'south'
  // latitudeInput deferred to Phase 2
}
```

Never written at 60fps except `displayDate` throttled to ~4fps.

---

## Orbital Mechanics (`/lib/orbitalMechanics.ts`)

Pure functions, no React/Three imports. Fully unit-tested.

**Key exports:**

```ts
dateToJulianDay(date: Date): number
julianDayToDate(jd: number): Date

// Returns Earth's position in scene world units (semi-major axis = 200 units)
getEarthOrbitalPosition(jd: number): Vector3   // Keplerian ellipse, eccentricity 0.0167

// Returns Earth's sidereal rotation angle in radians — pure, no speed multiplier
// Animator applies the rotationSpeed multiplier before writing to mesh ref
getSiderealRotationAngle(jd: number): number

getSeasonLabel(jd: number, hemisphere: 'north' | 'south'): string
getSolsticeEquinoxEvents(): { label: string; jd: number; date: Date }[]
```

`uSunDirection` computation is inlined in `Animator` as `earthPosition.clone().negate().normalize()` — trivial since Sun is always at origin; no need for a named export. If the Sun moves in Phase 2, this will be promoted to an export then.

**Orbital constants (`/lib/constants.ts`):**

```ts
ECCENTRICITY = 0.0167
AXIAL_TILT_DEG = 23.5
SEMI_MAJOR_AXIS = 200          // Three.js world units
SUN_RADIUS = 12                // world units
EARTH_RADIUS = 3               // world units
EARTH_AXIS_LENGTH = 7          // world units (pole-to-pole line)
PERIHELION_JD = 2451547.5      // ~Jan 3 2000 epoch, advances annually
```

These values give a visually well-proportioned scene at the camera defaults below.

---

## 3D Scene

### Scene Graph

```
<Canvas>
  <SimulationContext.Provider>
    <Animator />              ← renders null; owns useFrame loop
    <Starfield />
    <Selection>               ← @react-three/postprocessing selective bloom wrapper
      <Select enabled>
        <Sun />               ← inside Selection; receives bloom
      </Select>
    </Selection>
    <Earth />                 ← outside Selection; no bloom
    <OrbitPath />
    <Annotations />
    <EffectComposer>
      <Bloom luminanceThreshold={0.2} intensity={1.5} mipmapBlur />
    </EffectComposer>
    <OrbitControls minDistance={50} maxDistance={600} />
  </SimulationContext.Provider>
</Canvas>
```

`Selection` + `Select` from `@react-three/postprocessing` is the correct API for selective bloom — it uses an internal render pass that only blooms meshes wrapped in `<Select enabled>`. No manual layer manipulation required.

### Sun

- `MeshBasicMaterial` (not Standard) with warm yellow-orange colour — avoids self-lighting artifact from the co-located `PointLight`
- `PointLight` at `(0, 0, 0)` illuminates Earth
- Wrapped in `<Select enabled>` for selective bloom
- Mesh radius: `SUN_RADIUS` (12 units)

### Earth

- Mesh group rotated 23.5° on Z-axis (axial tilt, constant — represents the fixed tilt of Earth's axis relative to the ecliptic)
- `ShaderMaterial` with uniforms:
  - `uDayTexture` — NASA Blue Marble (`/public/textures/earth-day.jpg`)
  - `uNightTexture` — NASA city lights (`/public/textures/earth-night.jpg`)
  - `uSunDirectionLocal` — `vec3` in Earth **local** space (see below)
  - `uAtmosphereColor` — `vec3(0.3, 0.6, 1.0)` blue rim
- **Coordinate frame for `uSunDirectionLocal`:** `Animator` computes the sun direction in world space (`earthPosition.clone().negate().normalize()`), then transforms it to Earth local space using the Earth group's `matrixWorld` inverse before passing it as the uniform. This ensures `dot(vNormal, uSunDirectionLocal)` is computed in a consistent frame in the fragment shader.
- Fragment shader: blends day/night textures by `dot(vNormal, uSunDirectionLocal)` with a ~15° smooth step terminator band. Atmosphere rim is applied on the **lit limb only** (intentional design choice — not physically accurate but visually clean for this app).
- Axis line: `Line` from Drei, from `(0, -EARTH_AXIS_LENGTH/2, 0)` to `(0, EARTH_AXIS_LENGTH/2, 0)` in local space, opacity 0.4, white
- Mesh radius: `EARTH_RADIUS` (3 units)

### Orbit Path

- `EllipseCurve` with `a = SEMI_MAJOR_AXIS` (200 units), `b = SEMI_MAJOR_AXIS * sqrt(1 - e²)` ≈ 199.7 units
- Static geometry, generated once on mount
- `LineBasicMaterial` with opacity 0.3, slightly blue-white

### Starfield

- ~2000 instanced `Points`, positions generated once with seeded `Math.random()` on mount
- Varied sizes (0.3–1.5) and brightness (0.4–1.0) via per-vertex `size` and `opacity` attributes
- Rendered on a large sphere (radius 800 units) so they stay in background

### Annotations

- `<Html>` components from Drei at the 4 solstice/equinox world positions (computed from `getSolsticeEquinoxEvents()` at mount)
- Label text toggles between northern and southern hemisphere terminology based on `hemisphere` store value:

| Date | South | North |
|---|---|---|
| Jun 21 | Winter Solstice | Summer Solstice |
| Dec 21 | Summer Solstice | Winter Solstice |
| Mar 20 | Autumn Equinox | Spring Equinox |
| Sep 23 | Spring Equinox | Autumn Equinox |

### Camera

- Default position: `(0, 120, 280)` — above and slightly behind ecliptic plane
- Scene oriented so Earth's south pole points in the +Y direction (southern hemisphere default)
- Target: `(0, 0, 0)` (Sun)
- `OrbitControls`: `minDistance={50}` `maxDistance={600}` `enablePan={false}`

---

## HUD (Spacious two-row)

Fixed bottom panel, `backdrop-filter: blur(12px)`, ~110px tall on desktop. Stacks vertically on mobile.

**Row 1 — Timeline**

- Full-width `<input type="range">` styled with CSS
- Range: Julian days for Jan 1 of the current year to Dec 31 (365 or 366 day window). Does not wrap — at year end, animation clamps and stops.
- Season colour bands as absolute-positioned CSS overlay (southern seasons):
  - Summer: orange, Dec 1 – Mar 1 (wraps — rendered as two bands: start of track + end of track)
  - Autumn: brown, Mar 1 – Jun 1
  - Winter: blue, Jun 1 – Sep 1
  - Spring: green, Sep 1 – Dec 1
- Tick marks + labels at 4 solstice/equinox calendar positions
- Current date shown right-aligned in row label
- **Scrub behaviour:**
  - `pointerdown`: record current `isPlaying` state; set `isPlaying = false`
  - `input`: write new `julianDay` to clock ref + `setDisplayDate` to Zustand
  - `pointerup`: restore `isPlaying` to recorded pre-scrub value

**Row 2 — Controls**

- Play/pause button (circle icon, left-most)
- Orbit Speed slider (0–50×, default 10×, label shows current value)
- Rotation Speed slider (0–100×, default 20×, label shows current value)
- Hemisphere toggle (S / N pill — `south` active by default)
- Planet selector: 8 dots (Mercury → Neptune). Only Earth is active (highlighted, full opacity). Inactive planets: 30% opacity, `cursor: not-allowed`, click is a no-op (no toast, no event — silently ignored), `title` attribute tooltip: "Coming in Phase 2".

---

## File Structure

```
/app
  layout.tsx
  page.tsx

/components
  /canvas
    Scene.tsx         # <Canvas> + SimulationContext.Provider
    Animator.tsx      # renders null; owns useFrame
    Sun.tsx
    Earth.tsx
    OrbitPath.tsx
    Starfield.tsx
    Annotations.tsx
  /hud
    HUD.tsx
    TimelineSlider.tsx
    SpeedControls.tsx
    PlanetSelector.tsx
    HemisphereControl.tsx

/lib
  orbitalMechanics.ts
  constants.ts
  shaders/
    earth.vert.glsl
    earth.frag.glsl

/store
  useAppStore.ts

/public
  /textures
    earth-day.jpg       # NASA Blue Marble, 8192×4096 (~8MB)
    earth-night.jpg     # NASA city lights, 8192×4096 (~4MB)

/__tests__
  orbitalMechanics.test.ts

vercel.json
```

---

## Testing

Vitest unit tests (`/__tests__/orbitalMechanics.test.ts`):

- `dateToJulianDay` / `julianDayToDate` round-trip accuracy
- `getEarthOrbitalPosition` — perihelion is closest to origin ~Jan 3, aphelion ~Jul 4; distance varies (orbit is elliptical)
- `getSiderealRotationAngle` — monotonically increasing with JD; one full rotation per sidereal day
- `getSeasonLabel` — all 4 events × both hemispheres (Jun 21 south = "Winter Solstice", etc.)
- `getSolsticeEquinoxEvents` — returns 4 events with correct calendar dates ±2 days

No React component tests in Phase 1.

---

## Error Handling

- Textures: `<Suspense>` boundary around `<Canvas>`; shows a loading spinner until both textures resolve via `useTexture`
- Texture 404: `<ErrorBoundary>` wrapping `<Canvas>` with message "Could not load Earth textures — check /public/textures/"
- Timeline slider: Julian day clamped to `[yearStartJD, yearEndJD]` in store setter
- No latitude input in Phase 1 (deferred to Phase 2)

---

## Deployment

`vercel.json`:

```json
{
  "headers": [
    {
      "source": "/textures/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

Next.js App Router deploys to Vercel with zero additional config beyond this.

---

## Phase 1 Quality Bar

- [ ] Earth orbits Sun in visually correct ellipse with accurate axial tilt throughout
- [ ] Day/night terminator visible and updates correctly as Earth rotates and orbits
- [ ] City lights visible on night side
- [ ] Timeline slider correctly maps to calendar dates with solstice/equinox markers
- [ ] Southern hemisphere is the default — camera, season labels, and terminology
- [ ] Bloom glow on Sun is visible; Earth has no bloom
- [ ] All HUD controls function correctly
- [ ] No console errors in production build
- [ ] Vitest suite passes
- [ ] Deployed and running on Vercel
