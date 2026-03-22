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

### Time System (Approach B — Mutable ref + Zustand for UI)

A `SimulationClock` object lives as a mutable ref at the Canvas scope:

```ts
type SimulationClock = {
  julianDay: number
  isPlaying: boolean
  orbitSpeed: number
  rotationSpeed: number
}
```

An invisible `<Animator />` component owns the `useFrame` loop:
1. Increments `clock.julianDay` by `delta * orbitSpeed * DAYS_PER_SECOND`
2. Calls `orbitalMechanics.getEarthState(julianDay)` → position, rotation angle
3. Writes results directly to mesh refs — zero React involvement
4. Throttles Zustand `setDisplayDate` writes to ~4fps for HUD display

The clock ref is passed via `SimulationContext` (a plain React context holding the ref — not reactive, causes no re-renders).

**Timeline scrubbing:** writes to both the `timeRef` (immediate visual response) and Zustand (HUD sync).

### Zustand Store — UI state only

```ts
{
  isPlaying: boolean           // default true
  orbitSpeed: number           // 0–50, default 10
  rotationSpeed: number        // 0–100, default 20
  displayDate: Date            // updated ~4fps from Animator
  hemisphere: 'north' | 'south'  // default 'south'
  latitudeInput: string        // raw text input, parsed on change
}
```

Never written at 60fps.

---

## Orbital Mechanics (`/lib/orbitalMechanics.ts`)

Pure functions, no React/Three imports. Fully unit-tested.

**Key exports:**

```ts
dateToJulianDay(date: Date): number
julianDayToDate(jd: number): Date
getEarthOrbitalPosition(jd: number): Vector3   // Keplerian ellipse, eccentricity 0.0167
getEarthRotationAngle(jd: number, rotationSpeed: number): number
getSunDirection(earthPosition: Vector3): Vector3  // unit vector Earth→Sun
getSeasonLabel(jd: number, hemisphere: 'north' | 'south'): string
getSolsticeEquinoxEvents(): { label: string; jd: number; date: Date }[]
```

**Orbital constants:**
- Eccentricity: 0.0167
- Axial tilt: 23.5°
- Perihelion: ~Jan 3 (JD 2451547.5 + annual)
- Aphelion: ~Jul 4
- Solstice/equinox dates: Jun 21, Sep 23, Dec 21, Mar 20

---

## 3D Scene

### Scene Graph

```
<Canvas>
  <SimulationContext.Provider>
    <Animator />
    <Starfield />
    <Sun />
    <Earth />
    <OrbitPath />
    <Annotations />
    <EffectComposer>
      <Bloom />   ← selective: Sun mesh on layer 1 only
    </EffectComposer>
    <OrbitControls minDistance={50} maxDistance={600} />
  </SimulationContext.Provider>
</Canvas>
```

### Sun

- `MeshStandardMaterial` with high `emissiveIntensity`
- `PointLight` at Sun position illuminates Earth
- Assigned to Three.js layer 1 for selective bloom
- Positioned at origin `(0, 0, 0)`

### Earth

- Mesh group rotated 23.5° on Z-axis (axial tilt, constant throughout orbit)
- `ShaderMaterial` with uniforms:
  - `uDayTexture` — NASA Blue Marble (bundled `/public/textures/earth-day.jpg`)
  - `uNightTexture` — NASA city lights (bundled `/public/textures/earth-night.jpg`)
  - `uSunDirection` — `vec3`, updated each frame by `Animator` (transformed to Earth local space via inverse world matrix)
  - `uAtmosphereColor` — `vec3` blue rim
- Fragment shader: blends day/night by `dot(normal, uSunDirection)` with ~15° soft terminator band; adds atmosphere rim on lit limb
- Axis line: `Line` component through poles, subtle opacity, always visible

### Orbit Path

- Static `EllipseCurve` geometry, rendered once
- Semi-major axis compressed for visual clarity (not astronomical scale)
- Slightly luminous line material

### Starfield

- ~2000 instanced `Points`, positions generated once with `Math.random()` on mount
- Varied sizes and brightness via per-vertex attributes
- No Milky Way band in Phase 1

### Annotations

- `<Html>` components from Drei at the 4 solstice/equinox world positions
- Labels: "Jun 21 — Southern Winter Solstice", "Dec 21 — Southern Summer Solstice", etc.
- Toggle label text based on `hemisphere` store value

### Camera

- Default position: `(0, 120, 280)`
- Up vector: `(0, 1, 0)` — scene oriented so Earth's south pole is in the +Y direction at default
- Target: `(0, 0, 0)` (Sun)
- `OrbitControls`: minDistance 50, maxDistance 600

---

## HUD (Option B — Spacious two-row)

Fixed bottom panel, `backdrop-blur`, ~110px tall on desktop. Stacks vertically on mobile.

**Row 1 — Timeline**
- Full-width `<input type="range">` styled with CSS
- Season colour bands as absolute-positioned CSS overlay (southern seasons: summer=orange Dec–Mar, autumn=brown Mar–Jun, winter=blue Jun–Sep, spring=green Sep–Dec)
- Tick marks + labels at 4 solstice/equinox dates
- Current date shown inline in row label (right-aligned)
- Scrubbing: pauses animation, updates timeRef + Zustand immediately; releasing resumes

**Row 2 — Controls**
- Play/pause button (circle, left)
- Orbit Speed slider (0–50×, default 10×)
- Rotation Speed slider (0–100×, default 20×)
- Hemisphere toggle (S / N pill)
- Planet selector dots (8 planets; only Earth active, others 30% opacity with "Coming in Phase 2" tooltip)

---

## File Structure

```
/app
  layout.tsx
  page.tsx

/components
  /canvas
    Scene.tsx
    Animator.tsx
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
    earth-day.jpg
    earth-night.jpg

/__tests__
  orbitalMechanics.test.ts
```

---

## Testing

Vitest unit tests for `/lib/orbitalMechanics.ts`:

- `dateToJulianDay` / `julianDayToDate` round-trip
- `getEarthOrbitalPosition` — perihelion ~Jan 3, aphelion ~Jul 4, orbit is elliptical
- `getSunDirection` — unit vector, correct hemisphere at known dates
- `getSeasonLabel` — all 4 events × 2 hemispheres
- `getSolsticeEquinoxEvents` — correct calendar dates ±2 days

No React component tests in Phase 1.

---

## Error Handling

- Textures: `<Suspense>` boundary around Canvas; loading spinner until both textures resolve
- Texture 404: `<ErrorBoundary>` around Canvas with clear fallback message
- Timeline slider: Julian day clamped to valid range in store
- Latitude input: `parseFloat`, ignore invalid values silently

---

## Deployment

- `vercel.json` with cache headers for `/public/textures/*` (1 year immutable)
- Next.js App Router deploys to Vercel with zero additional config

---

## Phase 1 Quality Bar

- [ ] Earth orbits Sun in visually correct ellipse with accurate axial tilt throughout
- [ ] Day/night terminator visible and updates correctly as Earth rotates and orbits
- [ ] Timeline slider correctly maps to calendar dates with solstice/equinox markers
- [ ] Southern hemisphere is the default — camera, season labels, terminology
- [ ] Bloom glow on Sun is visible and attractive
- [ ] Earth day texture applied, city lights visible on night side
- [ ] All HUD controls function correctly
- [ ] No console errors in production build
- [ ] Vitest suite passes
- [ ] Deployed and running on Vercel
