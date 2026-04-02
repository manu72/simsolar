import { describe, it, expect } from 'vitest'
import { Vector3, PerspectiveCamera } from 'three'
import {
  pixelToWorldScale,
  applyScreenPan,
  resetPanToOrigin,
  zoomToDistance,
} from '@/lib/cameraMath'

// ---------------------------------------------------------------------------
// pixelToWorldScale
// ---------------------------------------------------------------------------

describe('pixelToWorldScale', () => {
  it('returns the correct scale for 45° FOV, distance 400, viewport 800px', () => {
    // frustumHeight = 2 * 400 * tan(22.5°) ≈ 331.37
    // pixelScale = 331.37 / 800 ≈ 0.4142
    const scale = pixelToWorldScale(45, 400, 800)
    expect(scale).toBeCloseTo(2 * 400 * Math.tan(Math.PI / 8) / 800, 6)
  })

  it('doubles when camera distance doubles', () => {
    const s1 = pixelToWorldScale(45, 200, 600)
    const s2 = pixelToWorldScale(45, 400, 600)
    expect(s2 / s1).toBeCloseTo(2, 6)
  })

  it('halves when viewport height doubles', () => {
    const s1 = pixelToWorldScale(45, 300, 400)
    const s2 = pixelToWorldScale(45, 300, 800)
    expect(s1 / s2).toBeCloseTo(2, 6)
  })

  it('returns 0 when distance is 0', () => {
    expect(pixelToWorldScale(45, 0, 800)).toBe(0)
  })

  it('increases with wider FOV', () => {
    const narrow = pixelToWorldScale(30, 400, 800)
    const wide = pixelToWorldScale(90, 400, 800)
    expect(wide).toBeGreaterThan(narrow)
  })
})

// ---------------------------------------------------------------------------
// applyScreenPan
// ---------------------------------------------------------------------------

describe('applyScreenPan', () => {
  function makeCamera(pos: [number, number, number]) {
    const cam = new PerspectiveCamera(45, 1, 0.1, 1000)
    cam.position.set(...pos)
    cam.lookAt(0, 0, 0)
    cam.updateMatrixWorld(true)
    return cam
  }

  it('translates camera and target by the same vector', () => {
    const cam = makeCamera([0, 0, 100])
    const camPos = cam.position.clone()
    const target = new Vector3(0, 0, 0)

    applyScreenPan(camPos, target, cam.matrixWorld, 10, 5, 0.5)

    // Both should have shifted by the same offset from their starting positions
    const camDelta = camPos.clone().sub(cam.position)
    const targetDelta = target.clone() // started at origin
    expect(camDelta.x).toBeCloseTo(targetDelta.x, 6)
    expect(camDelta.y).toBeCloseTo(targetDelta.y, 6)
    expect(camDelta.z).toBeCloseTo(targetDelta.z, 6)
  })

  it('preserves camera-to-target distance', () => {
    const cam = makeCamera([0, 80, 392])
    const camPos = cam.position.clone()
    const target = new Vector3(0, 0, 0)
    const distBefore = camPos.distanceTo(target)

    applyScreenPan(camPos, target, cam.matrixWorld, 50, -30, 0.4)

    expect(camPos.distanceTo(target)).toBeCloseTo(distBefore, 6)
  })

  it('no-ops when dx and dy are both 0', () => {
    const cam = makeCamera([0, 0, 100])
    const camPos = cam.position.clone()
    const target = new Vector3(5, 10, -3)
    const camBefore = camPos.clone()
    const targetBefore = target.clone()

    applyScreenPan(camPos, target, cam.matrixWorld, 0, 0, 1.0)

    expect(camPos.x).toBeCloseTo(camBefore.x, 6)
    expect(camPos.y).toBeCloseTo(camBefore.y, 6)
    expect(camPos.z).toBeCloseTo(camBefore.z, 6)
    expect(target.x).toBeCloseTo(targetBefore.x, 6)
    expect(target.y).toBeCloseTo(targetBefore.y, 6)
    expect(target.z).toBeCloseTo(targetBefore.z, 6)
  })

  it('moves in screen-right direction for positive dx', () => {
    // Camera at +Z looking at origin: screen-right is -X
    const cam = makeCamera([0, 0, 100])
    const camPos = cam.position.clone()
    const target = new Vector3(0, 0, 0)

    applyScreenPan(camPos, target, cam.matrixWorld, 10, 0, 1.0)

    // Positive dx → shift scene left → target.x should be positive (camera right is +X, negated dx gives +X)
    // Camera looking along -Z, so right vector is +X. -dx * pixelScale = -10.
    // Actually: target shifts by addScaledVector(right, -dx * scale) = right * -10
    // Right vector for camera at (0,0,100) looking at origin is +X.
    // So target.x = 0 + 1*(-10) = -10. Camera.x = 0 + 1*(-10) = -10.
    // The planet (at origin) moves RIGHT on screen because the camera moved LEFT.
    expect(target.x).toBeCloseTo(-10, 4)
  })

  it('moves in screen-up direction for positive dy', () => {
    // Camera at +Z looking at origin: screen-up is +Y
    const cam = makeCamera([0, 0, 100])
    const camPos = cam.position.clone()
    const target = new Vector3(0, 0, 0)

    applyScreenPan(camPos, target, cam.matrixWorld, 0, 10, 1.0)

    // Positive dy → target.addScaledVector(up, dy * scale) = up * 10
    // Up for this camera orientation is +Y
    expect(target.y).toBeCloseTo(10, 4)
  })
})

// ---------------------------------------------------------------------------
// resetPanToOrigin
// ---------------------------------------------------------------------------

describe('resetPanToOrigin', () => {
  it('sets target to the origin', () => {
    const camPos = new Vector3(30, 80, 400)
    const target = new Vector3(15, -5, 20)

    resetPanToOrigin(camPos, target)

    expect(target.x).toBeCloseTo(0, 10)
    expect(target.y).toBeCloseTo(0, 10)
    expect(target.z).toBeCloseTo(0, 10)
  })

  it('preserves camera-to-target distance', () => {
    const camPos = new Vector3(30, 80, 400)
    const target = new Vector3(15, -5, 20)
    const distBefore = camPos.distanceTo(target)

    resetPanToOrigin(camPos, target)

    expect(camPos.distanceTo(target)).toBeCloseTo(distBefore, 6)
  })

  it('preserves camera viewing direction', () => {
    const camPos = new Vector3(30, 80, 400)
    const target = new Vector3(15, -5, 20)
    const dirBefore = camPos.clone().sub(target).normalize()

    resetPanToOrigin(camPos, target)

    const dirAfter = camPos.clone().sub(target).normalize()
    expect(dirAfter.x).toBeCloseTo(dirBefore.x, 6)
    expect(dirAfter.y).toBeCloseTo(dirBefore.y, 6)
    expect(dirAfter.z).toBeCloseTo(dirBefore.z, 6)
  })

  it('handles already-at-origin target (no-op for target)', () => {
    const camPos = new Vector3(0, 80, 392)
    const target = new Vector3(0, 0, 0)
    const camBefore = camPos.clone()

    resetPanToOrigin(camPos, target)

    expect(target.lengthSq()).toBeCloseTo(0, 10)
    expect(camPos.x).toBeCloseTo(camBefore.x, 6)
    expect(camPos.y).toBeCloseTo(camBefore.y, 6)
    expect(camPos.z).toBeCloseTo(camBefore.z, 6)
  })
})

// ---------------------------------------------------------------------------
// zoomToDistance
// ---------------------------------------------------------------------------

describe('zoomToDistance', () => {
  it('sets camera-to-target distance to the requested value', () => {
    const camPos = new Vector3(0, 80, 392)
    const target = new Vector3(0, 0, 0)

    zoomToDistance(camPos, target, 200)

    expect(camPos.distanceTo(target)).toBeCloseTo(200, 6)
  })

  it('preserves target position', () => {
    const target = new Vector3(10, -5, 30)
    const targetBefore = target.clone()
    const camPos = new Vector3(10, 75, 430)

    zoomToDistance(camPos, target, 150)

    expect(target.x).toBeCloseTo(targetBefore.x, 10)
    expect(target.y).toBeCloseTo(targetBefore.y, 10)
    expect(target.z).toBeCloseTo(targetBefore.z, 10)
  })

  it('preserves camera-to-target direction', () => {
    const camPos = new Vector3(0, 80, 392)
    const target = new Vector3(0, 0, 0)
    const dirBefore = camPos.clone().sub(target).normalize()

    zoomToDistance(camPos, target, 250)

    const dirAfter = camPos.clone().sub(target).normalize()
    expect(dirAfter.x).toBeCloseTo(dirBefore.x, 6)
    expect(dirAfter.y).toBeCloseTo(dirBefore.y, 6)
    expect(dirAfter.z).toBeCloseTo(dirBefore.z, 6)
  })

  it('works with offset target (not at origin)', () => {
    const camPos = new Vector3(50, 80, 392)
    const target = new Vector3(40, 10, 20)

    zoomToDistance(camPos, target, 100)

    expect(camPos.distanceTo(target)).toBeCloseTo(100, 6)
    // Target untouched
    expect(target.x).toBeCloseTo(40, 10)
    expect(target.y).toBeCloseTo(10, 10)
    expect(target.z).toBeCloseTo(20, 10)
  })

  it('zooms in closer than the original distance', () => {
    const camPos = new Vector3(0, 0, 500)
    const target = new Vector3(0, 0, 0)

    zoomToDistance(camPos, target, 50)

    expect(camPos.distanceTo(target)).toBeCloseTo(50, 6)
    // Camera should still be along +Z
    expect(camPos.z).toBeGreaterThan(0)
  })
})
