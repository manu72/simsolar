import { describe, it, expect } from 'vitest'
import { SEMI_MAJOR_AXIS } from '@/lib/constants'
import {
  dateToJulianDay,
  julianDayToDate,
  getEarthOrbitalPosition,
  getSiderealRotationAngle,
  getSeasonLabel,
  getSolsticeEquinoxEvents,
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

describe('getSiderealRotationAngle', () => {
  it('returns a number in [0, 2π)', () => {
    const jd = dateToJulianDay(new Date('2024-06-21T00:00:00Z'))
    const angle = getSiderealRotationAngle(jd)
    expect(angle).toBeGreaterThanOrEqual(0)
    expect(angle).toBeLessThan(2 * Math.PI)
  })

  it('advances by one full rotation per sidereal day', () => {
    const jd1 = dateToJulianDay(new Date('2024-01-01T00:00:00Z'))
    const jd2 = jd1 + 0.99726958
    const a1 = getSiderealRotationAngle(jd1)
    const a2 = getSiderealRotationAngle(jd2)
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

  it('Jun 21 north = Summer', () => {
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
    expect(march.date.getUTCMonth()).toBe(2)
    expect(march.date.getUTCDate()).toBeGreaterThanOrEqual(17)
    expect(march.date.getUTCDate()).toBeLessThanOrEqual(23)
  })

  it('December solstice is within ±3 days of Dec 21', () => {
    const events = getSolsticeEquinoxEvents()
    const dec = events.find(e => e.label.includes('Dec'))!
    expect(dec).toBeDefined()
    expect(dec.date.getUTCMonth()).toBe(11)
    expect(dec.date.getUTCDate()).toBeGreaterThanOrEqual(18)
    expect(dec.date.getUTCDate()).toBeLessThanOrEqual(24)
  })
})
