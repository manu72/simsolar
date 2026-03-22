import { describe, it, expect } from 'vitest'
import { SEMI_MAJOR_AXIS } from '@/lib/constants'
import {
  dateToJulianDay,
  julianDayToDate,
  getEarthOrbitalPosition,
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
    expect(Math.abs(recovered.getTime() - original.getTime())).toBeLessThan(60_000)
  })

  it('round-trips December solstice', () => {
    const original = new Date('2024-12-21T00:00:00Z')
    const jd = dateToJulianDay(original)
    const recovered = julianDayToDate(jd)
    expect(recovered.getUTCFullYear()).toBe(2024)
    expect(recovered.getUTCMonth()).toBe(11)
    expect(recovered.getUTCDate()).toBe(21)
  })
})

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
