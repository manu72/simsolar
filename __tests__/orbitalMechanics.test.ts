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
