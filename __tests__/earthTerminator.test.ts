import { describe, it, expect } from 'vitest'
import { Vector3 } from 'three'
import { EARTH_AXIS_WORLD, EARTH_RADIUS, MAX_EARTH_SCALE } from '@/lib/constants'
import { dateToJulianDay, getEarthOrbitalPosition } from '@/lib/orbitalMechanics'
import earthVert from '@/lib/shaders/earth.vert'

// Regression for the equinox terminator: the Sun is only a few Earth radii
// away in scene units, so a per-vertex sun direction (point-source lighting)
// shrinks the lit cap below a hemisphere and leaves both poles dark at the
// equinox. The shader must derive one direction from Earth's centre instead.

// Mirrors the two candidate vertex-shader formulas for a pole vertex.
function poleSunDot(jd: number, perVertex: boolean): number {
  const earthCentre = getEarthOrbitalPosition(jd)
  const axis = new Vector3(...EARTH_AXIS_WORLD)
  const pole = axis.clone().multiplyScalar(EARTH_RADIUS * MAX_EARTH_SCALE).add(earthCentre)
  const origin = perVertex ? pole : earthCentre
  const sunDir = new Vector3(0, 0, 0).sub(origin).normalize() // Sun at world origin
  return axis.dot(sunDir)
}

describe('Earth day/night terminator at the equinox', () => {
  const equinoxes = [
    dateToJulianDay(new Date(Date.UTC(2026, 2, 20, 18, 57))),
    dateToJulianDay(new Date(Date.UTC(2026, 8, 23, 4, 47))),
  ]

  it('lights both poles right on the terminator with a centre-based sun direction', () => {
    for (const jd of equinoxes) {
      // Inside the shader's ±0.03 smoothstep band => pole sits on the day/night line
      expect(Math.abs(poleSunDot(jd, false))).toBeLessThan(0.02)
    }
  })

  it('documents why per-vertex direction is wrong: poles fall deep into night', () => {
    for (const jd of equinoxes) {
      // arccos(R/D) with R = 60, D ≈ 200 => sunDot ≈ -0.3 at the pole
      expect(poleSunDot(jd, true)).toBeLessThan(-0.25)
    }
  })

  it('vertex shader derives vSunDir from the Earth centre, not the vertex', () => {
    expect(earthVert).toMatch(/vSunDir\s*=\s*normalize\(uSunPositionWorld\s*-\s*earthCentre\)/)
    expect(earthVert).not.toMatch(/uSunPositionWorld\s*-\s*worldPos/)
  })
})
