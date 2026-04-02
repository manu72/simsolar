import { Vector3, Matrix4 } from 'three'

const _dir = new Vector3()
const _right = new Vector3()
const _up = new Vector3()

/**
 * World-space distance per screen pixel at the given camera distance and FOV.
 * Derived from the vertical frustum height at `distance`:
 *   frustumHeight = 2 * distance * tan(fov / 2)
 *   pixelScale    = frustumHeight / viewportHeight
 */
export function pixelToWorldScale(
  fovDeg: number,
  distance: number,
  viewportHeight: number,
): number {
  const fovRad = fovDeg * (Math.PI / 180)
  return (2 * distance * Math.tan(fovRad / 2)) / viewportHeight
}

/**
 * Translates both `cameraPosition` and `target` by a screen-space pixel
 * delta converted to world space using the camera's orientation.
 * Positive `dx` shifts the scene left (planet moves right on screen).
 * Positive `dy` shifts the scene down (planet moves up on screen).
 * Mutates both vectors in place.
 */
export function applyScreenPan(
  cameraPosition: Vector3,
  target: Vector3,
  cameraMatrixWorld: Matrix4,
  dx: number,
  dy: number,
  pixelScale: number,
): void {
  _right.setFromMatrixColumn(cameraMatrixWorld, 0)
  _up.setFromMatrixColumn(cameraMatrixWorld, 1)

  target.addScaledVector(_right, -dx * pixelScale)
  target.addScaledVector(_up, dy * pixelScale)
  cameraPosition.addScaledVector(_right, -dx * pixelScale)
  cameraPosition.addScaledVector(_up, dy * pixelScale)
}

/**
 * Resets the orbit target to the origin while preserving the camera's
 * viewing direction and distance from the target.
 * Mutates both vectors in place.
 */
export function resetPanToOrigin(
  cameraPosition: Vector3,
  target: Vector3,
): void {
  const dist = cameraPosition.distanceTo(target)
  _dir.copy(cameraPosition).sub(target).normalize()
  target.set(0, 0, 0)
  cameraPosition.copy(_dir).multiplyScalar(dist)
}

/**
 * Repositions the camera along the camera→target direction so that
 * `camera.distanceTo(target) === distance`. Target is unchanged.
 * Mutates `cameraPosition` in place.
 */
export function zoomToDistance(
  cameraPosition: Vector3,
  target: Vector3,
  distance: number,
): void {
  _dir.copy(cameraPosition).sub(target).normalize()
  cameraPosition.copy(target).addScaledVector(_dir, distance)
}
