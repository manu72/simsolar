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
