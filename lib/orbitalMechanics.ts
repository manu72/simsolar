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
 */
export function getEarthOrbitalPosition(jd: number): Vector3 {
  const yearsSince2000 = (jd - PERIHELION_JD_2000) / ORBITAL_PERIOD_DAYS
  const completedOrbits = Math.floor(yearsSince2000)
  const perihelionJD = PERIHELION_JD_2000 + completedOrbits * ORBITAL_PERIOD_DAYS

  const daysSincePerihelion = jd - perihelionJD
  const M = (2 * Math.PI * daysSincePerihelion) / ORBITAL_PERIOD_DAYS

  const E = solveKepler(M, ECCENTRICITY)

  const nu = 2 * Math.atan2(
    Math.sqrt(1 + ECCENTRICITY) * Math.sin(E / 2),
    Math.sqrt(1 - ECCENTRICITY) * Math.cos(E / 2),
  )

  const r = SEMI_MAJOR_AXIS * (1 - ECCENTRICITY * Math.cos(E))

  return new Vector3(r * Math.cos(nu), 0, r * Math.sin(nu))
}

// ─── Earth Rotation ────────────────────────────────────────────────────────

/**
 * Returns Earth's sidereal rotation angle in radians for the given JD.
 * Pure — no speed multiplier. Animator applies rotationSpeed separately.
 */
export function getSiderealRotationAngle(jd: number): number {
  return ((2 * Math.PI * jd) / SIDEREAL_DAY_DAYS) % (2 * Math.PI)
}

// ─── Seasons ───────────────────────────────────────────────────────────────

const SOLAR_EVENTS = [
  { month: 2,  day: 20, label: 'March Equinox' },
  { month: 5,  day: 21, label: 'June Solstice' },
  { month: 8,  day: 23, label: 'September Equinox' },
  { month: 11, day: 21, label: 'December Solstice' },
] as const

export function getSolsticeEquinoxEvents(): { label: string; jd: number; date: Date }[] {
  const year = new Date().getUTCFullYear()
  return SOLAR_EVENTS.map(({ month, day, label }) => {
    const date = new Date(Date.UTC(year, month, day))
    return { label, date, jd: dateToJulianDay(date) }
  })
}

export function getSeasonLabel(jd: number, hemisphere: 'north' | 'south'): string {
  const year = julianDayToDate(jd).getUTCFullYear()

  const marchJD = dateToJulianDay(new Date(Date.UTC(year, 2,  20)))
  const juneJD  = dateToJulianDay(new Date(Date.UTC(year, 5,  21)))
  const septJD  = dateToJulianDay(new Date(Date.UTC(year, 8,  23)))
  const decJD   = dateToJulianDay(new Date(Date.UTC(year, 11, 21)))

  let northSeason: string
  if (jd >= marchJD && jd < juneJD)       northSeason = 'Spring Equinox'
  else if (jd >= juneJD && jd < septJD)   northSeason = 'Summer Solstice'
  else if (jd >= septJD && jd < decJD)    northSeason = 'Autumn Equinox'
  else                                     northSeason = 'Winter Solstice'

  if (hemisphere === 'north') return northSeason

  const flip: Record<string, string> = {
    'Spring Equinox': 'Autumn Equinox',
    'Summer Solstice': 'Winter Solstice',
    'Autumn Equinox': 'Spring Equinox',
    'Winter Solstice': 'Summer Solstice',
  }
  return flip[northSeason]
}
