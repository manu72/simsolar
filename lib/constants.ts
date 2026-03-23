export const ECCENTRICITY = 0.0167
export const AXIAL_TILT_DEG = 23.5
export const AXIAL_TILT_RAD = (23.5 * Math.PI) / 180

// Scene scale (Three.js world units)
export const SEMI_MAJOR_AXIS = 200
export const SUN_RADIUS = 12
export const EARTH_RADIUS = 3
export const EARTH_AXIS_LENGTH = 7

// Orbital timing
export const ORBITAL_PERIOD_DAYS = 365.25 // Julian year approximation (tropical year = 365.2422 d)
export const SIDEREAL_DAY_DAYS = 0.99726958    // one sidereal day in Julian days
export const SIDEREAL_DAY_SECONDS = 86164.1    // one sidereal day in seconds
export const TWO_PI_PER_SIDEREAL_SECOND = (2 * Math.PI) / SIDEREAL_DAY_SECONDS

// Julian day of perihelion for J2000.0 epoch (Jan 3, 2000)
export const PERIHELION_JD_2000 = 2451547.5 // Jan 3 2000 00:00 UTC (perihelion was ~05:18 UTC — midnight approximation)

// Base: days of simulation time per real second at orbitSpeed = 1
export const DAYS_PER_SECOND_BASE = 1

// Default control values
export const DEFAULT_ORBIT_SPEED = 10
export const DEFAULT_ROTATION_SPEED = 20
export const MAX_ORBIT_SPEED = 50
export const MAX_ROTATION_SPEED = 1000

// Zoom (camera distance from origin)
export const MIN_ZOOM_DISTANCE = 50
export const MAX_ZOOM_DISTANCE = 600
export const DEFAULT_ZOOM_DISTANCE = 305  // ~sqrt(120² + 280²), matches initial camera pos

// Orbit path geometry (semi-minor axis)
// b = a * sqrt(1 - e^2)
export const SEMI_MINOR_AXIS = SEMI_MAJOR_AXIS * Math.sqrt(1 - ECCENTRICITY ** 2) // ≈ 199.972
