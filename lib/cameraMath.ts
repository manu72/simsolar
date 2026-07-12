import { Vector3, Matrix4 } from 'three'
import { TILT_DIRECTION_RAD } from './constants'
import type { Hemisphere, SeasonExplainerCameraKind } from './seasonExplainer'

const _dir = new Vector3()
const _right = new Vector3()
const _up = new Vector3()
const _teachingDirection = new Vector3()
const INITIAL_EARTH_VIEW_ANGLE_RAD = (75 * Math.PI) / 180

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

/**
 * Places the initial heliocentric camera so the current Earth position appears
 * slightly right of the Sun and on the near side of the orbit.
 */
export function getInitialHeliocentricCameraPosition(
  earthPosition: Vector3,
  cameraY: number,
  horizontalDistance: number,
): [number, number, number] {
  const earthOrbitAngle = Math.atan2(earthPosition.z, earthPosition.x)
  const cameraAzimuth = INITIAL_EARTH_VIEW_ANGLE_RAD - earthOrbitAngle

  return [
    horizontalDistance * Math.sin(cameraAzimuth),
    cameraY,
    horizontalDistance * Math.cos(cameraAzimuth),
  ]
}

/**
 * Returns an earth-centric teaching camera position for explainer events.
 * Both kinds use fixed world-space directions so the projected axis keeps a
 * consistent teaching orientation. Directions are defined relative to the
 * axial-tilt plane (the axis leans toward the TILT_DIRECTION_RAD azimuth):
 * solstice views look perpendicular to that plane, showing the tilt leaning
 * at its full angle; equinox views look along it, so the axis projects
 * perfectly vertical (Earth appears untilted) and the day/night terminator
 * reads side-on through both poles. The equinox sign follows the hemisphere
 * setting: viewed from opposite the lean the south pole tips toward the
 * viewer (the app's southern-hemisphere default), from along it the north.
 */
export function getSeasonExplainerCameraPosition(
  cameraKind: SeasonExplainerCameraKind,
  distance: number,
  hemisphere: Hemisphere,
): [number, number, number] {
  if (cameraKind === 'solstice-fixed') {
    _teachingDirection.set(0, 0, -1)
  } else {
    _teachingDirection.set(hemisphere === 'north' ? 1 : -1, 0, 0)
  }
  _teachingDirection.applyAxisAngle(_up.set(0, 1, 0), -TILT_DIRECTION_RAD).multiplyScalar(distance)
  return [_teachingDirection.x, _teachingDirection.y, _teachingDirection.z]
}
