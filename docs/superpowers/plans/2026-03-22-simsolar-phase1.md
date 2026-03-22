# SimSolar Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an animated, interactive solar system visualisation web app focused on solstice/equinox education with a southern hemisphere default.

**Architecture:** Mutable ref (`SimulationClock`) owns `julianDay` as the rendering cursor — updated every frame without React re-renders. Zustand holds UI-only state (play/pause, speeds, hemisphere). `Animator` reads Zustand via `getState()` each frame and writes transforms directly to Three.js mesh refs. Five pure orbital mechanics functions in `/lib/orbitalMechanics.ts` are fully unit-tested with Vitest.

**Tech Stack:** Next.js 15 (App Router), React Three Fiber, Drei, @react-three/postprocessing (selective Bloom), Three.js, Zustand, Tailwind CSS v3, TypeScript, Vitest, pnpm, Vercel

---

## File Map

| File | Purpose |
|---|---|
| `app/layout.tsx` | Root layout, Tailwind globals, `dark` class on `<html>` |
| `app/page.tsx` | Renders `<ClientRoot />` |
| `components/ClientRoot.tsx` | **Creates clock, provides SimulationContext, renders Scene + HUD** — must wrap both so TimelineSlider can write to the live clock |
| `components/canvas/Scene.tsx` | `<Canvas>` wrapper, reads clock from SimulationContext, creates mesh refs |
| `components/canvas/Animator.tsx` | `useFrame` loop, renders null, writes to mesh refs |
| `components/canvas/Sun.tsx` | Emissive sphere inside `<Select>` for selective bloom |
| `components/canvas/Earth.tsx` | ShaderMaterial sphere + axis line, 23.5° tilt group |
| `components/canvas/OrbitPath.tsx` | Static EllipseCurve line geometry |
| `components/canvas/Starfield.tsx` | ~2000 instanced Points on a large sphere |
| `components/canvas/Annotations.tsx` | Drei `<Html>` labels at 4 solstice/equinox positions |
| `components/canvas/SimulationContext.ts` | Context type + `createContext` — holds mutable clock ref |
| `components/canvas/ErrorBoundary.tsx` | Class component, wraps Canvas, shows texture error message |
| `components/hud/HUD.tsx` | Fixed bottom panel container, backdrop blur |
| `components/hud/TimelineSlider.tsx` | Full-width range input with season bands |
| `components/hud/SpeedControls.tsx` | Orbit + rotation speed sliders |
| `components/hud/PlanetSelector.tsx` | 8 planet dots, only Earth active |
| `components/hud/HemisphereControl.tsx` | S/N pill toggle |
| `lib/orbitalMechanics.ts` | Pure functions: date↔JD, Earth position, rotation, seasons |
| `lib/constants.ts` | All orbital and scene constants |
| `lib/shaders/earth.vert.glsl` | Passes UV, normal, view direction to fragment stage |
| `lib/shaders/earth.frag.glsl` | Day/night blend, atmosphere rim on lit limb |
| `store/useAppStore.ts` | Zustand store — UI state only |
| `__tests__/orbitalMechanics.test.ts` | Vitest unit tests |
| `types/glsl.d.ts` | TypeScript declaration for `*.glsl` / `*.vert` / `*.frag` imports |
| `vercel.json` | Cache-Control headers for `/public/textures/*` |

---

## Task 1: Scaffold project and configure tooling

**Files:**
- Create: `package.json` (via pnpm create)
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `types/glsl.d.ts`
- Create: `.gitignore`
- Create: `public/textures/.gitkeep`

- [ ] **Step 1: Scaffold Next.js app**

Run from inside `/Users/manuhume/GIT/simsolar` (directory already exists, is empty except for `.claude/` and `docs/`):

```bash
pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --import-alias="@/*" \
  --no-src-dir
```

When prompted about existing files, accept overwriting. This creates `app/`, `components/`, `public/`, `tailwind.config.ts`, `tsconfig.json`, etc.

- [ ] **Step 2: Install 3D and state dependencies**

```bash
pnpm add three @react-three/fiber @react-three/drei @react-three/postprocessing zustand
pnpm add -D @types/three vitest @vitest/globals
```

- [ ] **Step 3: Configure Tailwind for dark mode**

Edit `tailwind.config.ts` — add `darkMode: 'class'`:

```ts
import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: { extend: {} },
  plugins: [],
}
export default config
```

- [ ] **Step 4: Configure Next.js for GLSL imports**

Create `next.config.ts`:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vert|frag)$/,
      type: 'asset/source',
    })
    return config
  },
}

export default nextConfig
```

- [ ] **Step 5: Add GLSL TypeScript declarations**

Create `types/glsl.d.ts`:

```ts
declare module '*.glsl' {
  const content: string
  export default content
}
declare module '*.vert' {
  const content: string
  export default content
}
declare module '*.frag' {
  const content: string
  export default content
}
```

- [ ] **Step 6: Configure Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

Add test script to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Create texture directory and update .gitignore**

```bash
mkdir -p public/textures
touch public/textures/.gitkeep
```

Add to `.gitignore`:
```
public/textures/*.jpg
public/textures/*.png
.superpowers/
```

- [ ] **Step 8: Verify dev server starts**

```bash
pnpm dev
```

Expected: server starts at http://localhost:3000. No errors in terminal. Stop with Ctrl+C.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with R3F, Zustand, Vitest"
```

---

## Task 2: Constants

**Files:**
- Create: `lib/constants.ts`

- [ ] **Step 1: Create constants file**

```bash
mkdir -p lib
```

Create `lib/constants.ts`:

```ts
export const ECCENTRICITY = 0.0167
export const AXIAL_TILT_DEG = 23.5
export const AXIAL_TILT_RAD = (23.5 * Math.PI) / 180

// Scene scale (Three.js world units)
export const SEMI_MAJOR_AXIS = 200
export const SUN_RADIUS = 12
export const EARTH_RADIUS = 3
export const EARTH_AXIS_LENGTH = 7

// Orbital timing
export const ORBITAL_PERIOD_DAYS = 365.25
export const SIDEREAL_DAY_DAYS = 0.99726958    // one sidereal day in Julian days
export const SIDEREAL_DAY_SECONDS = 86164.1    // one sidereal day in seconds
export const TWO_PI_PER_SIDEREAL_SECOND = (2 * Math.PI) / SIDEREAL_DAY_SECONDS

// Julian day of perihelion for J2000.0 epoch (Jan 3, 2000)
export const PERIHELION_JD_2000 = 2451547.5

// Base: days of simulation time per real second at orbitSpeed = 1
export const DAYS_PER_SECOND_BASE = 1

// Default control values
export const DEFAULT_ORBIT_SPEED = 10
export const DEFAULT_ROTATION_SPEED = 20

// Orbit path geometry (semi-minor axis)
// b = a * sqrt(1 - e^2)
export const SEMI_MINOR_AXIS = SEMI_MAJOR_AXIS * Math.sqrt(1 - ECCENTRICITY ** 2) // ≈ 199.972
```

- [ ] **Step 2: Commit**

```bash
git add lib/constants.ts
git commit -m "feat: add orbital and scene constants"
```

---

## Task 3: Orbital mechanics — Julian day conversions (TDD)

**Files:**
- Create: `lib/orbitalMechanics.ts` (partial)
- Create: `__tests__/orbitalMechanics.test.ts` (partial)

- [ ] **Step 1: Write failing tests for Julian day**

Create `__tests__/orbitalMechanics.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  dateToJulianDay,
  julianDayToDate,
} from '@/lib/orbitalMechanics'

describe('dateToJulianDay', () => {
  it('converts Unix epoch to correct JD', () => {
    const unixEpoch = new Date('1970-01-01T00:00:00Z')
    expect(dateToJulianDay(unixEpoch)).toBeCloseTo(2440587.5, 1)
  })

  it('converts J2000.0 noon to JD 2451545.0', () => {
    const j2000 = new Date('2000-01-01T12:00:00Z')
    expect(dateToJulianDay(j2000)).toBeCloseTo(2451545.0, 2)
  })
})

describe('julianDayToDate', () => {
  it('round-trips back to the same calendar date', () => {
    const original = new Date('2024-06-21T00:00:00Z')
    const jd = dateToJulianDay(original)
    const recovered = julianDayToDate(jd)
    // Same calendar day (within 1 minute)
    expect(Math.abs(recovered.getTime() - original.getTime())).toBeLessThan(60_000)
  })

  it('round-trips December solstice', () => {
    const original = new Date('2024-12-21T00:00:00Z')
    const jd = dateToJulianDay(original)
    const recovered = julianDayToDate(jd)
    expect(recovered.getUTCFullYear()).toBe(2024)
    expect(recovered.getUTCMonth()).toBe(11) // December
    expect(recovered.getUTCDate()).toBe(21)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pnpm test
```

Expected: FAIL — `orbitalMechanics` module not found

- [ ] **Step 3: Implement Julian day functions**

Create `lib/orbitalMechanics.ts`:

```ts
import { Vector3 } from 'three'
import {
  ECCENTRICITY,
  SEMI_MAJOR_AXIS,
  ORBITAL_PERIOD_DAYS,
  PERIHELION_JD_2000,
  SIDEREAL_DAY_DAYS,
} from './constants'

// ─── Julian Day ────────────────────────────────────────────────────────────

/** Unix epoch (Jan 1 1970 00:00:00 UTC) = JD 2440587.5 */
export function dateToJulianDay(date: Date): number {
  return date.getTime() / 86_400_000 + 2440587.5
}

export function julianDayToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86_400_000)
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pnpm test
```

Expected: PASS (2 describe blocks, 4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/orbitalMechanics.ts __tests__/orbitalMechanics.test.ts
git commit -m "feat: Julian day conversion with passing tests"
```

---

## Task 4: Orbital mechanics — Earth position (TDD)

**Files:**
- Modify: `lib/orbitalMechanics.ts`
- Modify: `__tests__/orbitalMechanics.test.ts`

- [ ] **Step 1: Add failing tests for Earth orbital position**

Append to `__tests__/orbitalMechanics.test.ts`:

```ts
import {
  dateToJulianDay,
  julianDayToDate,
  getEarthOrbitalPosition,
} from '@/lib/orbitalMechanics'

describe('getEarthOrbitalPosition', () => {
  it('returns a position in the ecliptic plane (y ≈ 0)', () => {
    const jd = dateToJulianDay(new Date('2024-06-21T00:00:00Z'))
    const pos = getEarthOrbitalPosition(jd)
    expect(pos.y).toBeCloseTo(0, 5)
  })

  it('perihelion (~Jan 3) is closer than aphelion (~Jul 4)', () => {
    const perihelionJD = dateToJulianDay(new Date('2024-01-03T00:00:00Z'))
    const aphelionJD = dateToJulianDay(new Date('2024-07-04T00:00:00Z'))
    const perihelionDist = getEarthOrbitalPosition(perihelionJD).length()
    const aphelionDist = getEarthOrbitalPosition(aphelionJD).length()
    expect(perihelionDist).toBeLessThan(aphelionDist)
  })

  it('orbit is elliptical — distance varies across the year', () => {
    const jan = getEarthOrbitalPosition(dateToJulianDay(new Date('2024-01-01T00:00:00Z')))
    const jul = getEarthOrbitalPosition(dateToJulianDay(new Date('2024-07-01T00:00:00Z')))
    expect(Math.abs(jan.length() - jul.length())).toBeGreaterThan(0.1)
  })

  it('position distance is approximately SEMI_MAJOR_AXIS (within 2%)', () => {
    const jd = dateToJulianDay(new Date('2024-04-01T00:00:00Z'))
    const dist = getEarthOrbitalPosition(jd).length()
    expect(dist).toBeGreaterThan(SEMI_MAJOR_AXIS * 0.98)
    expect(dist).toBeLessThan(SEMI_MAJOR_AXIS * 1.02)
  })
})
```

Also add this import at the top of the test file:
```ts
import { SEMI_MAJOR_AXIS } from '@/lib/constants'
```

- [ ] **Step 2: Run tests — verify new tests fail**

```bash
pnpm test
```

Expected: 4 new failures, prior tests still pass.

- [ ] **Step 3: Implement Keplerian Earth position**

Append to `lib/orbitalMechanics.ts`:

```ts
// ─── Keplerian Orbit ───────────────────────────────────────────────────────

/**
 * Solve Kepler's equation M = E - e*sin(E) for eccentric anomaly E.
 * Uses Newton-Raphson iteration.
 */
function solveKepler(M: number, e: number): number {
  let E = M
  for (let i = 0; i < 50; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E))
    E += dE
    if (Math.abs(dE) < 1e-8) break
  }
  return E
}

/**
 * Returns Earth's position in Three.js world units.
 * Orbit lies in the XZ plane (y = 0). Origin is the Sun.
 * PERIHELION_JD_2000 advances by one orbital period per year.
 */
export function getEarthOrbitalPosition(jd: number): Vector3 {
  // Advance perihelion JD to the correct year
  const yearsSince2000 = (jd - PERIHELION_JD_2000) / ORBITAL_PERIOD_DAYS
  const completedOrbits = Math.floor(yearsSince2000)
  const perihelionJD = PERIHELION_JD_2000 + completedOrbits * ORBITAL_PERIOD_DAYS

  const daysSincePerihelion = jd - perihelionJD
  const M = (2 * Math.PI * daysSincePerihelion) / ORBITAL_PERIOD_DAYS

  const E = solveKepler(M, ECCENTRICITY)

  // True anomaly ν
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + ECCENTRICITY) * Math.sin(E / 2),
    Math.sqrt(1 - ECCENTRICITY) * Math.cos(E / 2),
  )

  // Orbital radius
  const r = SEMI_MAJOR_AXIS * (1 - ECCENTRICITY * Math.cos(E))

  // Position in ecliptic plane: XZ in Three.js (Y is up)
  return new Vector3(r * Math.cos(nu), 0, r * Math.sin(nu))
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/orbitalMechanics.ts __tests__/orbitalMechanics.test.ts
git commit -m "feat: Keplerian Earth orbital position with passing tests"
```

---

## Task 5: Orbital mechanics — rotation, season labels, events (TDD)

**Files:**
- Modify: `lib/orbitalMechanics.ts`
- Modify: `__tests__/orbitalMechanics.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `__tests__/orbitalMechanics.test.ts`:

```ts
import {
  dateToJulianDay,
  julianDayToDate,
  getEarthOrbitalPosition,
  getSiderealRotationAngle,
  getSeasonLabel,
  getSolsticeEquinoxEvents,
} from '@/lib/orbitalMechanics'

describe('getSiderealRotationAngle', () => {
  it('returns a number in [0, 2π)', () => {
    const jd = dateToJulianDay(new Date('2024-06-21T00:00:00Z'))
    const angle = getSiderealRotationAngle(jd)
    expect(angle).toBeGreaterThanOrEqual(0)
    expect(angle).toBeLessThan(2 * Math.PI)
  })

  it('advances by one full rotation per sidereal day', () => {
    const jd1 = dateToJulianDay(new Date('2024-01-01T00:00:00Z'))
    const jd2 = jd1 + 0.99726958 // one sidereal day later
    const a1 = getSiderealRotationAngle(jd1)
    const a2 = getSiderealRotationAngle(jd2)
    // Should complete one full cycle: difference ≈ 0 (mod 2π)
    const diff = Math.abs(a2 - a1)
    expect(Math.min(diff, 2 * Math.PI - diff)).toBeLessThan(0.01)
  })
})

describe('getSeasonLabel', () => {
  it('Jun 21 south = Winter', () => {
    const jd = dateToJulianDay(new Date('2024-06-21T00:00:00Z'))
    expect(getSeasonLabel(jd, 'south')).toBe('Winter')
  })

  it('Dec 21 south = Summer', () => {
    const jd = dateToJulianDay(new Date('2024-12-21T00:00:00Z'))
    expect(getSeasonLabel(jd, 'south')).toBe('Summer')
  })

  it('Mar 20 south = Autumn', () => {
    const jd = dateToJulianDay(new Date('2024-03-20T00:00:00Z'))
    expect(getSeasonLabel(jd, 'south')).toBe('Autumn')
  })

  it('Sep 23 south = Spring', () => {
    const jd = dateToJulianDay(new Date('2024-09-23T00:00:00Z'))
    expect(getSeasonLabel(jd, 'south')).toBe('Spring')
  })

  it('Jun 21 north = Summer (opposite of south)', () => {
    const jd = dateToJulianDay(new Date('2024-06-21T00:00:00Z'))
    expect(getSeasonLabel(jd, 'north')).toBe('Summer')
  })
})

describe('getSolsticeEquinoxEvents', () => {
  it('returns exactly 4 events', () => {
    expect(getSolsticeEquinoxEvents()).toHaveLength(4)
  })

  it('March equinox is within ±3 days of Mar 20', () => {
    const events = getSolsticeEquinoxEvents()
    const march = events.find(e => e.label.includes('Mar'))!
    expect(march).toBeDefined()
    expect(march.date.getUTCMonth()).toBe(2) // March
    expect(march.date.getUTCDate()).toBeGreaterThanOrEqual(17)
    expect(march.date.getUTCDate()).toBeLessThanOrEqual(23)
  })

  it('December solstice is within ±3 days of Dec 21', () => {
    const events = getSolsticeEquinoxEvents()
    const dec = events.find(e => e.label.includes('Dec'))!
    expect(dec).toBeDefined()
    expect(dec.date.getUTCMonth()).toBe(11) // December
    expect(dec.date.getUTCDate()).toBeGreaterThanOrEqual(18)
    expect(dec.date.getUTCDate()).toBeLessThanOrEqual(24)
  })
})
```

- [ ] **Step 2: Run — verify new tests fail**

```bash
pnpm test
```

- [ ] **Step 3: Implement remaining functions**

Append to `lib/orbitalMechanics.ts`:

```ts
// ─── Earth Rotation ────────────────────────────────────────────────────────

/**
 * Returns Earth's sidereal rotation angle in radians for the given JD.
 * Pure — no speed multiplier. Animator applies rotationSpeed separately.
 */
export function getSiderealRotationAngle(jd: number): number {
  return ((2 * Math.PI * jd) / SIDEREAL_DAY_DAYS) % (2 * Math.PI)
}

// ─── Seasons ───────────────────────────────────────────────────────────────

/** Fixed approximate solstice/equinox day-of-year (month, day in UTC) */
const SOLAR_EVENTS = [
  { month: 2,  day: 20, label: 'Mar Equinox' },   // March 20
  { month: 5,  day: 21, label: 'Jun Solstice' },   // June 21
  { month: 8,  day: 23, label: 'Sep Equinox' },    // September 23
  { month: 11, day: 21, label: 'Dec Solstice' },   // December 21
] as const

export function getSolsticeEquinoxEvents(): { label: string; jd: number; date: Date }[] {
  const year = new Date().getUTCFullYear()
  return SOLAR_EVENTS.map(({ month, day, label }) => {
    const date = new Date(Date.UTC(year, month, day))
    return { label, date, jd: dateToJulianDay(date) }
  })
}

/**
 * Returns the current season name for the given hemisphere.
 * Based on fixed solstice/equinox calendar boundaries.
 */
export function getSeasonLabel(jd: number, hemisphere: 'north' | 'south'): string {
  const year = julianDayToDate(jd).getUTCFullYear()

  const marchJD  = dateToJulianDay(new Date(Date.UTC(year,      2,  20)))
  const juneJD   = dateToJulianDay(new Date(Date.UTC(year,      5,  21)))
  const septJD   = dateToJulianDay(new Date(Date.UTC(year,      8,  23)))
  const decJD    = dateToJulianDay(new Date(Date.UTC(year,      11, 21)))

  let northSeason: string
  if (jd >= marchJD && jd < juneJD)   northSeason = 'Spring'
  else if (jd >= juneJD && jd < septJD)  northSeason = 'Summer'
  else if (jd >= septJD && jd < decJD)   northSeason = 'Autumn'
  else                                    northSeason = 'Winter'

  if (hemisphere === 'north') return northSeason

  const flip: Record<string, string> = {
    Spring: 'Autumn',
    Summer: 'Winter',
    Autumn: 'Spring',
    Winter: 'Summer',
  }
  return flip[northSeason]
}
```

- [ ] **Step 4: Run — verify all tests pass**

```bash
pnpm test
```

Expected: all tests pass. Green.

- [ ] **Step 5: Commit**

```bash
git add lib/orbitalMechanics.ts __tests__/orbitalMechanics.test.ts
git commit -m "feat: complete orbital mechanics — rotation, seasons, events"
```

---

## Task 6: Zustand store and SimulationContext

**Files:**
- Create: `store/useAppStore.ts`
- Create: `components/canvas/SimulationContext.ts`

- [ ] **Step 1: Create Zustand store**

```bash
mkdir -p store
```

Create `store/useAppStore.ts`:

```ts
import { create } from 'zustand'
import { DEFAULT_ORBIT_SPEED, DEFAULT_ROTATION_SPEED } from '@/lib/constants'

interface AppState {
  isPlaying: boolean
  orbitSpeed: number
  rotationSpeed: number
  displayDate: Date
  hemisphere: 'north' | 'south'

  setIsPlaying: (v: boolean) => void
  setOrbitSpeed: (v: number) => void
  setRotationSpeed: (v: number) => void
  setDisplayDate: (d: Date) => void
  setHemisphere: (h: 'north' | 'south') => void
}

export const useAppStore = create<AppState>((set) => ({
  isPlaying: true,
  orbitSpeed: DEFAULT_ORBIT_SPEED,
  rotationSpeed: DEFAULT_ROTATION_SPEED,
  displayDate: new Date(),
  hemisphere: 'south',

  setIsPlaying: (v) => set({ isPlaying: v }),
  setOrbitSpeed: (v) => set({ orbitSpeed: Math.max(0, Math.min(50, v)) }),
  setRotationSpeed: (v) => set({ rotationSpeed: Math.max(0, Math.min(100, v)) }),
  setDisplayDate: (d) => set({ displayDate: d }),
  setHemisphere: (h) => set({ hemisphere: h }),
}))
```

- [ ] **Step 2: Create SimulationContext**

```bash
mkdir -p components/canvas
```

Create `components/canvas/SimulationContext.ts`:

```ts
import { createContext } from 'react'
import { dateToJulianDay } from '@/lib/orbitalMechanics'

export type SimulationClock = {
  julianDay: number      // current simulation time — written every frame
  rotationAngle: number  // accumulated Earth rotation in radians
}

export const SimulationContext = createContext<SimulationClock>({
  julianDay: dateToJulianDay(new Date()),
  rotationAngle: 0,
})
```

- [ ] **Step 3: Commit**

```bash
git add store/useAppStore.ts components/canvas/SimulationContext.ts
git commit -m "feat: Zustand store and SimulationContext"
```

---

## Task 7: Earth GLSL shaders

**Files:**
- Create: `lib/shaders/earth.vert.glsl`
- Create: `lib/shaders/earth.frag.glsl`

- [ ] **Step 1: Create vertex shader**

```bash
mkdir -p lib/shaders
```

Create `lib/shaders/earth.vert.glsl`:

```glsl
varying vec2 vUv;
varying vec3 vNormal;      // world-space normal
varying vec3 vViewDir;     // world-space view direction

void main() {
  vUv = uv;

  // World-space normal (mat3(modelMatrix) for uniform-scale sphere).
  // NOT normalMatrix — that transforms to view space and would mismatch
  // uSunDirectionWorld which is kept in world space.
  vNormal = normalize(mat3(modelMatrix) * normal);

  // World-space view direction (for atmosphere rim Fresnel)
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - worldPos.xyz);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

- [ ] **Step 2: Create fragment shader**

Create `lib/shaders/earth.frag.glsl`:

```glsl
uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform vec3 uSunDirectionWorld;  // world-space, matches world-space vNormal
uniform vec3 uAtmosphereColor;

varying vec2 vUv;
varying vec3 vNormal;   // world-space
varying vec3 vViewDir;  // world-space

void main() {
  vec3 normal = normalize(vNormal);
  vec3 sunDir = normalize(uSunDirectionWorld);

  // Dot product: 1.0 at subsolar point, -1.0 at antisolar point
  float sunDot = dot(normal, sunDir);

  // Soft terminator band: blend day→night over ~12° either side of terminator
  // smoothstep(-0.1, 0.1, sunDot): 0.0 on night side, 1.0 on day side
  float dayBlend = smoothstep(-0.1, 0.1, sunDot);

  vec4 dayColor   = texture2D(uDayTexture,   vUv);
  vec4 nightColor = texture2D(uNightTexture, vUv) * 0.9;

  vec4 color = mix(nightColor, dayColor, dayBlend);

  // Atmosphere rim — only on lit limb (intentional design choice)
  // Fresnel: strongest at grazing viewing angles
  float fresnel = 1.0 - abs(dot(normal, normalize(vViewDir)));
  fresnel = pow(fresnel, 3.0);
  float rimStrength = max(0.0, sunDot) * fresnel * 0.5;

  color.rgb += uAtmosphereColor * rimStrength;

  gl_FragColor = color;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/shaders/
git commit -m "feat: Earth day/night GLSL shaders with soft terminator"
```

---

## Task 8: Static scene components — Starfield and OrbitPath

**Files:**
- Create: `components/canvas/Starfield.tsx`
- Create: `components/canvas/OrbitPath.tsx`

- [ ] **Step 1: Create Starfield**

Create `components/canvas/Starfield.tsx`:

```tsx
'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const STAR_COUNT = 2000
const SPHERE_RADIUS = 800

export function Starfield() {
  const positionsRef = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3)
    const sizes = new Float32Array(STAR_COUNT)

    for (let i = 0; i < STAR_COUNT; i++) {
      // Random point on sphere surface
      const theta = Math.random() * 2 * Math.PI
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3]     = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = SPHERE_RADIUS * Math.cos(phi)
      sizes[i] = 0.3 + Math.random() * 1.2
    }
    return { positions, sizes }
  }, [])

  const geometryRef = useRef<THREE.BufferGeometry>(null)

  return (
    <points>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[positionsRef.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[positionsRef.sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={1.5}
        sizeAttenuation
        transparent
        opacity={0.8}
        vertexColors={false}
      />
    </points>
  )
}
```

- [ ] **Step 2: Create OrbitPath**

Create `components/canvas/OrbitPath.tsx`:

```tsx
'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { SEMI_MAJOR_AXIS, SEMI_MINOR_AXIS } from '@/lib/constants'

const SEGMENTS = 256

export function OrbitPath() {
  const points = useMemo(() => {
    const curve = new THREE.EllipseCurve(
      0, 0,                        // center
      SEMI_MAJOR_AXIS,             // x radius (semi-major)
      SEMI_MINOR_AXIS,             // y radius (semi-minor)
      0, 2 * Math.PI,
      false,
      0,
    )
    const pts = curve.getPoints(SEGMENTS)
    // EllipseCurve returns points in XY plane; rotate to XZ (ecliptic)
    return pts.map(p => new THREE.Vector3(p.x, 0, p.y))
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    return geo
  }, [points])

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#4488aa" transparent opacity={0.3} />
    </line>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/canvas/Starfield.tsx components/canvas/OrbitPath.tsx
git commit -m "feat: Starfield and OrbitPath static components"
```

---

## Task 9: Sun component

**Files:**
- Create: `components/canvas/Sun.tsx`

- [ ] **Step 1: Create Sun component**

Create `components/canvas/Sun.tsx`:

```tsx
'use client'

import { SUN_RADIUS } from '@/lib/constants'

export function Sun() {
  return (
    <group position={[0, 0, 0]}>
      {/* Point light that illuminates Earth */}
      <pointLight
        intensity={2.5}
        distance={600}
        decay={1}
        color="#fff5e0"
      />
      {/* Sun mesh — MeshBasicMaterial avoids self-lighting artifact */}
      <mesh>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshBasicMaterial color="#ffa500" />
      </mesh>
    </group>
  )
}
```

Note: `Sun` is rendered inside `<Select enabled>` in Scene.tsx — that is where the bloom selection happens, not inside this component.

- [ ] **Step 2: Commit**

```bash
git add components/canvas/Sun.tsx
git commit -m "feat: Sun component with PointLight"
```

---

## Task 10: Earth component

**Files:**
- Create: `components/canvas/Earth.tsx`

- [ ] **Step 1: Create Earth component**

Create `components/canvas/Earth.tsx`:

```tsx
'use client'

import { useRef, useMemo } from 'react'
import { useTexture, Line } from '@react-three/drei'
import * as THREE from 'three'
import { EARTH_RADIUS, EARTH_AXIS_LENGTH, AXIAL_TILT_RAD } from '@/lib/constants'
import earthVert from '@/lib/shaders/earth.vert.glsl'
import earthFrag from '@/lib/shaders/earth.frag.glsl'

interface EarthProps {
  groupRef: React.RefObject<THREE.Group>
  meshRef: React.RefObject<THREE.Mesh>
  materialRef: React.RefObject<THREE.ShaderMaterial>
}

export function Earth({ groupRef, meshRef, materialRef }: EarthProps) {
  const [dayTexture, nightTexture] = useTexture([
    '/textures/earth-day.jpg',
    '/textures/earth-night.png',
  ])

  const uniforms = useMemo(
    () => ({
      uDayTexture:         { value: dayTexture },
      uNightTexture:       { value: nightTexture },
      uSunDirectionWorld:  { value: new THREE.Vector3(1, 0, 0) }, // world-space, set each frame by Animator
      uAtmosphereColor:    { value: new THREE.Vector3(0.3, 0.6, 1.0) },
    }),
    [dayTexture, nightTexture],
  )

  // Axis line endpoints in local space (pole to pole)
  const axisPoints = useMemo<[THREE.Vector3, THREE.Vector3]>(
    () => [
      new THREE.Vector3(0, -EARTH_AXIS_LENGTH / 2, 0),
      new THREE.Vector3(0,  EARTH_AXIS_LENGTH / 2, 0),
    ],
    [],
  )

  return (
    // Outer group: handles orbital position (set by Animator)
    // Inner group: handles axial tilt (23.5° rotation on Z axis, fixed)
    <group ref={groupRef}>
      <group rotation={[0, 0, AXIAL_TILT_RAD]}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
          <shaderMaterial
            ref={materialRef}
            vertexShader={earthVert}
            fragmentShader={earthFrag}
            uniforms={uniforms}
          />
        </mesh>

        {/* Axis line — pole to pole, subtle */}
        <Line
          points={axisPoints}
          color="white"
          lineWidth={0.8}
          transparent
          opacity={0.4}
        />
      </group>
    </group>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/canvas/Earth.tsx
git commit -m "feat: Earth component with ShaderMaterial, textures, axis line"
```

---

## Task 11: Animator component

**Files:**
- Create: `components/canvas/Animator.tsx`

- [ ] **Step 1: Create Animator**

Create `components/canvas/Animator.tsx`:

```tsx
'use client'

import { useContext, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SimulationContext } from './SimulationContext'
import { useAppStore } from '@/store/useAppStore'
import { getEarthOrbitalPosition, julianDayToDate } from '@/lib/orbitalMechanics'
import {
  DAYS_PER_SECOND_BASE,
  TWO_PI_PER_SIDEREAL_SECOND,
} from '@/lib/constants'

interface AnimatorProps {
  earthGroupRef: React.RefObject<THREE.Group>
  earthMeshRef: React.RefObject<THREE.Mesh>
  earthMaterialRef: React.RefObject<THREE.ShaderMaterial>
}

export function Animator({ earthGroupRef, earthMeshRef, earthMaterialRef }: AnimatorProps) {
  const clock = useContext(SimulationContext)
  const lastDisplayUpdate = useRef(0)

  useFrame((_, delta) => {
    // Read controls non-reactively (zero re-renders)
    const { isPlaying, orbitSpeed, rotationSpeed, setDisplayDate } =
      useAppStore.getState()

    // Advance simulation time
    if (isPlaying) {
      clock.julianDay   += delta * orbitSpeed * DAYS_PER_SECOND_BASE
      clock.rotationAngle += delta * rotationSpeed * TWO_PI_PER_SIDEREAL_SECOND
    }

    // Update Earth orbital position
    const earthPos = getEarthOrbitalPosition(clock.julianDay)

    if (earthGroupRef.current) {
      earthGroupRef.current.position.copy(earthPos)
    }

    // Update Earth rotation (Y axis spin in local space — inside the tilt group)
    if (earthMeshRef.current) {
      earthMeshRef.current.rotation.y = clock.rotationAngle
    }

    // Update sun direction uniform — world space matches world-space vNormal in shader
    if (earthMaterialRef.current) {
      // World-space unit vector from Earth toward Sun (Sun is always at origin)
      const worldSunDir = earthPos.clone().negate().normalize()
      earthMaterialRef.current.uniforms.uSunDirectionWorld.value.copy(worldSunDir)
    }

    // Throttle HUD date update to ~4fps
    lastDisplayUpdate.current += delta
    if (lastDisplayUpdate.current >= 0.25) {
      lastDisplayUpdate.current = 0
      setDisplayDate(julianDayToDate(clock.julianDay))
    }
  })

  return null
}
```

- [ ] **Step 2: Commit**

```bash
git add components/canvas/Animator.tsx
git commit -m "feat: Animator useFrame loop — orbit, rotation, shader uniforms"
```

---

## Task 12: Scene assembly, Annotations, ErrorBoundary, and app shell

**Files:**
- Create: `components/canvas/Annotations.tsx`
- Create: `components/canvas/Scene.tsx`
- Create: `components/canvas/ErrorBoundary.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create Annotations**

Create `components/canvas/Annotations.tsx`:

```tsx
'use client'

import { Html } from '@react-three/drei'
import { useMemo } from 'react'
import { getSolsticeEquinoxEvents, getEarthOrbitalPosition, dateToJulianDay } from '@/lib/orbitalMechanics'
import { useAppStore } from '@/store/useAppStore'

const SOUTH_LABELS: Record<string, string> = {
  'Mar Equinox': 'Mar 20 — Autumn Equinox',
  'Jun Solstice': 'Jun 21 — Winter Solstice',
  'Sep Equinox': 'Sep 23 — Spring Equinox',
  'Dec Solstice': 'Dec 21 — Summer Solstice',
}

const NORTH_LABELS: Record<string, string> = {
  'Mar Equinox': 'Mar 20 — Spring Equinox',
  'Jun Solstice': 'Jun 21 — Summer Solstice',
  'Sep Equinox': 'Sep 23 — Autumn Equinox',
  'Dec Solstice': 'Dec 21 — Winter Solstice',
}

export function Annotations() {
  const hemisphere = useAppStore(s => s.hemisphere)
  const labels = hemisphere === 'south' ? SOUTH_LABELS : NORTH_LABELS

  const events = useMemo(() => getSolsticeEquinoxEvents(), [])

  return (
    <>
      {events.map(event => {
        const pos = getEarthOrbitalPosition(event.jd)
        return (
          <Html
            key={event.label}
            position={[pos.x, pos.y + 6, pos.z]}
            center
            distanceFactor={80}
          >
            <div className="text-xs text-blue-200 bg-black/40 px-2 py-1 rounded whitespace-nowrap border border-blue-900/40 pointer-events-none">
              {labels[event.label]}
            </div>
          </Html>
        )
      })}
    </>
  )
}
```

- [ ] **Step 2: Create ClientRoot (new file)**

**Important:** `SimulationContext.Provider` must wrap both `<Scene />` and `<HUD />` so that `TimelineSlider` (inside HUD, outside Canvas) can write to the live clock. Create a shared `ClientRoot` component that owns the clock and provides the context to both.

Create `components/ClientRoot.tsx`:

```tsx
'use client'

import { useMemo, Suspense } from 'react'
import { SimulationContext, SimulationClock } from '@/components/canvas/SimulationContext'
import { CanvasErrorBoundary } from '@/components/canvas/ErrorBoundary'
import { Scene } from '@/components/canvas/Scene'
import { HUD } from '@/components/hud/HUD'
import { dateToJulianDay } from '@/lib/orbitalMechanics'

export function ClientRoot() {
  // Single clock instance — shared between Scene (3D) and HUD (timeline scrub)
  const clock = useMemo<SimulationClock>(() => ({
    julianDay: dateToJulianDay(new Date()),
    rotationAngle: 0,
  }), [])

  return (
    <SimulationContext.Provider value={clock}>
      <CanvasErrorBoundary>
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center bg-black">
              <p className="text-blue-300 text-sm tracking-widest uppercase animate-pulse">
                Loading…
              </p>
            </div>
          }
        >
          <Scene />
        </Suspense>
      </CanvasErrorBoundary>
      <HUD />
    </SimulationContext.Provider>
  )
}
```

- [ ] **Step 4: Create Scene**

`Scene` reads the clock from context (it doesn't create it — that's `ClientRoot`'s job).

Create `components/canvas/Scene.tsx`:

```tsx
'use client'

import { useRef, useContext } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Selection, Select, EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { SimulationContext } from './SimulationContext'
import { Animator } from './Animator'
import { Sun } from './Sun'
import { Earth } from './Earth'
import { OrbitPath } from './OrbitPath'
import { Starfield } from './Starfield'
import { Annotations } from './Annotations'

export function Scene() {
  // Shared mesh refs — created here, passed to Animator + Earth
  const earthGroupRef    = useRef<THREE.Group>(null)
  const earthMeshRef     = useRef<THREE.Mesh>(null)
  const earthMaterialRef = useRef<THREE.ShaderMaterial>(null)

  return (
    <Canvas
      camera={{ position: [0, 120, 280], fov: 45 }}
      style={{ background: '#000005' }}
      gl={{ antialias: true }}
    >
      {/* SimulationContext is provided by ClientRoot — no Provider here */}
      <Animator
        earthGroupRef={earthGroupRef}
        earthMeshRef={earthMeshRef}
        earthMaterialRef={earthMaterialRef}
      />

      <Starfield />
      <OrbitPath />
      <Annotations />

      <Selection>
        <Select enabled>
          <Sun />
        </Select>
        <Earth
          groupRef={earthGroupRef}
          meshRef={earthMeshRef}
          materialRef={earthMaterialRef}
        />
      </Selection>

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          intensity={1.5}
          mipmapBlur
        />
      </EffectComposer>

      <OrbitControls
        minDistance={50}
        maxDistance={600}
        enablePan={false}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
}
```

- [ ] **Step 5: Create ErrorBoundary**

Create `components/canvas/ErrorBoundary.tsx`:

```tsx
'use client'

import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-black text-white">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-2">Could not load Earth textures</p>
            <p className="text-gray-500 text-sm">Check that files exist in /public/textures/</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
```

- [ ] **Step 6: Update app/layout.tsx**

Replace the generated `app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SimSolar — Solstice & Equinox',
  description: 'Interactive solar system visualisation with southern hemisphere perspective',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white overflow-hidden">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Update app/page.tsx**

`page.tsx` is a server component — it just renders `ClientRoot` (client component) which handles everything.

Replace the generated `app/page.tsx`:

```tsx
import { ClientRoot } from '@/components/ClientRoot'

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <ClientRoot />
    </main>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add components/ app/
git commit -m "feat: Scene assembly, ClientRoot, Annotations, ErrorBoundary, app shell"
```

---

## Task 13: HUD components

**Files:**
- Create: `components/hud/HUD.tsx`
- Create: `components/hud/TimelineSlider.tsx`
- Create: `components/hud/SpeedControls.tsx`
- Create: `components/hud/PlanetSelector.tsx`
- Create: `components/hud/HemisphereControl.tsx`

- [ ] **Step 1: Create HemisphereControl**

```bash
mkdir -p components/hud
```

Create `components/hud/HemisphereControl.tsx`:

```tsx
'use client'

import { useAppStore } from '@/store/useAppStore'

export function HemisphereControl() {
  const hemisphere = useAppStore(s => s.hemisphere)
  const setHemisphere = useAppStore(s => s.setHemisphere)

  return (
    <div className="flex flex-col gap-1 flex-shrink-0">
      <span className="text-[8px] uppercase tracking-wider text-gray-500">Hemisphere</span>
      <div className="flex bg-black/60 border border-white/10 rounded overflow-hidden">
        <button
          onClick={() => setHemisphere('south')}
          className={`px-3 py-1 text-xs transition-colors ${
            hemisphere === 'south'
              ? 'bg-blue-900/50 text-blue-300'
              : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          South
        </button>
        <button
          onClick={() => setHemisphere('north')}
          className={`px-3 py-1 text-xs transition-colors border-l border-white/10 ${
            hemisphere === 'north'
              ? 'bg-blue-900/50 text-blue-300'
              : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          North
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create PlanetSelector**

Create `components/hud/PlanetSelector.tsx`:

```tsx
'use client'

const PLANETS = [
  { name: 'Mercury', color: '#9e9e9e', size: 10, active: false },
  { name: 'Venus',   color: '#c2956c', size: 11, active: false },
  { name: 'Earth',   color: '#4a8fd4', size: 14, active: true  },
  { name: 'Mars',    color: '#c1440e', size: 11, active: false },
  { name: 'Jupiter', color: '#c88b3a', size: 13, active: false },
  { name: 'Saturn',  color: '#e8d5a3', size: 12, active: false },
  { name: 'Uranus',  color: '#7de8e8', size: 11, active: false },
  { name: 'Neptune', color: '#4169e1', size: 11, active: false },
]

export function PlanetSelector() {
  return (
    <div className="flex flex-col gap-1 flex-shrink-0">
      <span className="text-[8px] uppercase tracking-wider text-gray-500">Planets</span>
      <div className="flex items-center gap-1.5">
        {PLANETS.map(planet => (
          <button
            key={planet.name}
            title={planet.active ? planet.name : `${planet.name} — Coming in Phase 2`}
            disabled={!planet.active}
            className={`rounded-full transition-all ${
              planet.active
                ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-black cursor-pointer'
                : 'opacity-30 cursor-not-allowed'
            }`}
            style={{
              width: planet.size,
              height: planet.size,
              backgroundColor: planet.color,
            }}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create SpeedControls**

Create `components/hud/SpeedControls.tsx`:

```tsx
'use client'

import { useAppStore } from '@/store/useAppStore'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}

function SpeedSlider({ label, value, min, max, onChange }: SliderProps) {
  return (
    <div className="flex-1">
      <div className="flex justify-between mb-1">
        <span className="text-[8px] uppercase tracking-wider text-gray-500">{label}</span>
        <span className="text-[8px] text-blue-300">{value}×</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 bg-gray-800 rounded appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-blue-400"
      />
    </div>
  )
}

export function SpeedControls() {
  const orbitSpeed    = useAppStore(s => s.orbitSpeed)
  const rotationSpeed = useAppStore(s => s.rotationSpeed)
  const setOrbitSpeed    = useAppStore(s => s.setOrbitSpeed)
  const setRotationSpeed = useAppStore(s => s.setRotationSpeed)

  return (
    <>
      <SpeedSlider
        label="Orbit Speed"
        value={orbitSpeed}
        min={0}
        max={50}
        onChange={setOrbitSpeed}
      />
      <SpeedSlider
        label="Rotation Speed"
        value={rotationSpeed}
        min={0}
        max={100}
        onChange={setRotationSpeed}
      />
    </>
  )
}
```

- [ ] **Step 4: Create TimelineSlider**

Create `components/hud/TimelineSlider.tsx`:

```tsx
'use client'

import { useRef, useContext, useEffect, useState } from 'react'
import { SimulationContext } from '@/components/canvas/SimulationContext'
import { useAppStore } from '@/store/useAppStore'
import { dateToJulianDay, julianDayToDate, getSolsticeEquinoxEvents } from '@/lib/orbitalMechanics'

function getYearBounds() {
  const year = new Date().getUTCFullYear()
  const min = dateToJulianDay(new Date(Date.UTC(year, 0, 1)))
  const max = dateToJulianDay(new Date(Date.UTC(year, 11, 31)))
  return { min, max, year }
}

export function TimelineSlider() {
  const clock          = useContext(SimulationContext)
  const displayDate    = useAppStore(s => s.displayDate)
  const setIsPlaying   = useAppStore(s => s.setIsPlaying)
  const setDisplayDate = useAppStore(s => s.setDisplayDate)

  const preScrubPlayingRef = useRef(true)
  const { min, max } = getYearBounds()

  const events = getSolsticeEquinoxEvents()

  const sliderValue = Math.max(min, Math.min(max, clock.julianDay))
  const pct = (sliderValue - min) / (max - min) * 100

  const formattedDate = displayDate.toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })

  // Season band positions (approximate % along the year for southern seasons)
  // Summer wraps: Dec 1–Dec 31 is at end, Jan 1–Mar 1 is at start
  const seasonBands = [
    { label: 'Summer',  color: 'rgba(255,140,0,0.25)',   left: 0,     width: 16.4 }, // Jan 1–Mar 1
    { label: 'Autumn',  color: 'rgba(160,100,40,0.25)',  left: 16.4,  width: 25.2 }, // Mar 1–Jun 1
    { label: 'Winter',  color: 'rgba(50,100,180,0.25)',  left: 41.6,  width: 24.9 }, // Jun 1–Sep 1
    { label: 'Spring',  color: 'rgba(60,160,80,0.25)',   left: 66.5,  width: 16.9 }, // Sep 1–Dec 1
    { label: 'Summer',  color: 'rgba(255,140,0,0.2)',    left: 83.4,  width: 16.6 }, // Dec 1–Dec 31
  ]

  return (
    <div className="w-full">
      {/* Label row */}
      <div className="flex justify-between mb-1.5">
        <span className="text-[8px] uppercase tracking-wider text-gray-500">Timeline</span>
        <span className="text-[9px] text-gray-400">{formattedDate}</span>
      </div>

      {/* Slider track with season bands */}
      <div className="relative">
        {/* Season colour bands */}
        <div className="absolute inset-0 h-2 rounded overflow-hidden pointer-events-none">
          {seasonBands.map((band, i) => (
            <div
              key={i}
              className="absolute top-0 h-full"
              style={{
                left: `${band.left}%`,
                width: `${band.width}%`,
                backgroundColor: band.color,
              }}
            />
          ))}
          {/* Solstice/equinox tick marks */}
          {events.map(event => {
            const tickPct = (event.jd - min) / (max - min) * 100
            return (
              <div
                key={event.label}
                className="absolute top-0 h-full w-px bg-white/20"
                style={{ left: `${tickPct}%` }}
              />
            )
          })}
        </div>

        {/* Range input */}
        <input
          type="range"
          min={min}
          max={max}
          step={0.01}
          value={sliderValue}
          onPointerDown={() => {
            preScrubPlayingRef.current = useAppStore.getState().isPlaying
            setIsPlaying(false)
          }}
          onInput={e => {
            const newJD = parseFloat((e.target as HTMLInputElement).value)
            clock.julianDay = newJD
            setDisplayDate(julianDayToDate(newJD))
          }}
          onPointerUp={() => {
            setIsPlaying(preScrubPlayingRef.current)
          }}
          className="relative w-full h-2 bg-transparent rounded appearance-none cursor-pointer z-10
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-3
                     [&::-webkit-slider-thumb]:h-3
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-blue-300
                     [&::-webkit-slider-thumb]:cursor-grab"
        />
      </div>

      {/* Tick labels */}
      <div className="flex justify-between mt-0.5 px-0.5">
        <span className="text-[7px] text-gray-600">Jan</span>
        {events.map(event => {
          const tickPct = (event.jd - min) / (max - min) * 100
          return (
            <span
              key={event.label}
              className="text-[7px] text-gray-500 absolute transform -translate-x-1/2"
              style={{ left: `${tickPct}%` }}
            >
              {event.date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
            </span>
          )
        })}
        <span className="text-[7px] text-gray-600">Dec</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create HUD container**

Create `components/hud/HUD.tsx`:

```tsx
'use client'

import { useAppStore } from '@/store/useAppStore'
import { TimelineSlider } from './TimelineSlider'
import { SpeedControls } from './SpeedControls'
import { PlanetSelector } from './PlanetSelector'
import { HemisphereControl } from './HemisphereControl'

export function HUD() {
  const isPlaying  = useAppStore(s => s.isPlaying)
  const setPlaying = useAppStore(s => s.setIsPlaying)

  return (
    <div
      className="
        fixed bottom-0 left-0 right-0 z-50
        bg-black/85 backdrop-blur-md
        border-t border-white/[0.06]
        px-4 py-3
      "
    >
      {/* Row 1 — Timeline */}
      <div className="relative mb-3">
        <TimelineSlider />
      </div>

      {/* Row 2 — Controls */}
      <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
        {/* Play/pause */}
        <button
          onClick={() => setPlaying(!isPlaying)}
          className="
            flex-shrink-0 w-8 h-8 rounded-full
            bg-blue-900/30 border border-blue-500/30
            text-blue-300 hover:bg-blue-900/50
            flex items-center justify-center
            transition-colors
          "
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <SpeedControls />
        <HemisphereControl />
        <PlanetSelector />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/hud/
git commit -m "feat: all HUD components — timeline, speed, hemisphere, planet selector"
```

---

## Task 14: Download Earth textures

**Files:**
- Download to: `public/textures/earth-day.jpg`
- Download to: `public/textures/earth-night.png`

NASA Visible Earth provides free high-resolution textures. These must be downloaded once and placed in `/public/textures/`. They are excluded from git (`.gitignore` already set).

- [ ] **Step 1: Download day texture (NASA Blue Marble)**

```bash
curl -L "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x8192x4096.jpg" \
  -o public/textures/earth-day.jpg
```

If this URL is unavailable, go to https://visibleearth.nasa.gov and search "Blue Marble Next Generation". Download the 8192×4096 `.jpg` and save as `public/textures/earth-day.jpg`.

- [ ] **Step 2: Download night texture (NASA city lights)**

```bash
curl -L "https://eoimages.gsfc.nasa.gov/images/imagerecords/55000/55167/earth_lights_4800.png" \
  -o public/textures/earth-night.png
```

If this URL is unavailable, go to https://visibleearth.nasa.gov and search "Earth's City Lights". Download the largest `.jpg` or `.png` available and save as `public/textures/earth-night.png`.

- [ ] **Step 3: Verify files exist and are non-zero**

```bash
ls -lh public/textures/
```

Expected: both files present, each several MB in size.

- [ ] **Step 4: Start dev server and verify Earth renders with textures**

```bash
pnpm dev
```

Open http://localhost:3000. Verify:
- Earth is visible with blue/green/white day texture
- Night side shows city lights (rotate Earth to see dark side)
- Sun has bloom glow
- HUD is visible at the bottom
- No console errors

---

## Task 15: vercel.json, production build verification

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create vercel.json**

Create `vercel.json` at project root:

```json
{
  "headers": [
    {
      "source": "/textures/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Run production build**

```bash
pnpm build
```

Expected: exits with code 0. No TypeScript errors. No missing module errors.

If build fails with TypeScript errors, fix them before proceeding. Common issues:
- Missing `'use client'` on components using hooks
- Ref type mismatches — use `React.RefObject<T | null>` for nullable refs in React 19
- GLSL import type errors — verify `types/glsl.d.ts` is included in `tsconfig.json` (it should be via `include: ["."]`)

- [ ] **Step 3: Run full test suite**

```bash
pnpm test
```

Expected: all tests pass. Green.

- [ ] **Step 4: Commit**

```bash
git add vercel.json
git commit -m "feat: vercel.json cache headers + production build verified"
```

---

## Task 16: Deploy to Vercel

- [ ] **Step 1: Install Vercel CLI (if not already installed)**

```bash
pnpm add -g vercel
```

- [ ] **Step 2: Link project to Vercel**

```bash
vercel link
```

Follow prompts: create new project, name it `simsolar`, accept defaults.

- [ ] **Step 3: Deploy to production**

```bash
vercel --prod
```

Expected: deployment URL printed to console.

- [ ] **Step 4: Verify deployed app**

Open the Vercel URL. Verify all items from the Phase 1 quality bar:
- [ ] Earth orbits Sun in visually correct ellipse with accurate axial tilt throughout
- [ ] Day/night terminator visible and updates correctly as Earth rotates and orbits
- [ ] City lights visible on night side
- [ ] Timeline slider correctly maps to calendar dates with solstice/equinox markers
- [ ] Southern hemisphere is the default — camera, season labels, and terminology
- [ ] Bloom glow on Sun is visible; Earth has no bloom
- [ ] All HUD controls function correctly
- [ ] No console errors in production build
- [ ] Vitest suite passes
- [ ] Deployed and running on Vercel ← confirm URL here

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: Phase 1 complete — SimSolar deployed to Vercel"
```
