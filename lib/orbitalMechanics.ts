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
