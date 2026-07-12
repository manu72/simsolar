export const ECCENTRICITY = 0.0167;
export const AXIAL_TILT_DEG = 23.44;
export const AXIAL_TILT_RAD = (AXIAL_TILT_DEG * Math.PI) / 180;
export const EARTH_PERIHELION_LONGITUDE_DEG = 102.94719;

// Earth's axis leans toward its December-solstice position, NOT toward
// perihelion (+X in the scene frame). The solstice sits at true anomaly
// 90° − ϖ ≈ −12.95°, ~13 days before perihelion (Dec 21 vs Jan 3). Without
// this offset the terminator misses the poles by ~5° on the equinoxes.
export const TILT_DIRECTION_RAD = ((90 - EARTH_PERIHELION_LONGITUDE_DEG) * Math.PI) / 180;

// Earth's spin-axis direction in world space (unit vector): +Y tilted by
// AXIAL_TILT toward the TILT_DIRECTION azimuth in the orbital (XZ) plane
export const EARTH_AXIS_WORLD: [number, number, number] = [
  Math.sin(AXIAL_TILT_RAD) * Math.cos(TILT_DIRECTION_RAD),
  Math.cos(AXIAL_TILT_RAD),
  Math.sin(AXIAL_TILT_RAD) * Math.sin(TILT_DIRECTION_RAD),
];

// Scene scale (Three.js world units)
export const SEMI_MAJOR_AXIS = 200;
export const SUN_RADIUS = 12;
export const EARTH_RADIUS = 3;
export const EARTH_AXIS_LENGTH = 7;

// Orbital timing
export const ORBITAL_PERIOD_DAYS = 365.25; // Julian year approximation (tropical year = 365.2422 d)
export const SIDEREAL_DAY_DAYS = 0.99726958; // one sidereal day in Julian days
export const SIDEREAL_DAY_SECONDS = 86164.1; // one sidereal day in seconds
export const TWO_PI_PER_SIDEREAL_SECOND = (2 * Math.PI) / SIDEREAL_DAY_SECONDS;

// Julian day of perihelion for J2000.0 epoch (Jan 3, 2000)
export const PERIHELION_JD_2000 = 2451547.5; // Jan 3 2000 00:00 UTC (perihelion was ~05:18 UTC — midnight approximation)

// Base: days of simulation time per real second at orbitSpeed = 1
export const DAYS_PER_SECOND_BASE = 1;

// Default control values
export const DEFAULT_ORBIT_SPEED = 2;
export const DEFAULT_ROTATION_SPEED = 5000;
export const MAX_ORBIT_SPEED = 50;
export const MAX_ROTATION_SPEED = 10000;

// Earth visual scale
export const MIN_EARTH_SCALE = 1;
export const MAX_EARTH_SCALE = 20;
export const DEFAULT_EARTH_SCALE = 5;

// Zoom (camera distance from origin)
export const MIN_ZOOM_DISTANCE = 50;
export const MAX_ZOOM_DISTANCE = 600;
export const DEFAULT_ZOOM_DISTANCE = 400;

// Inner planets — J2000 orbital elements (a in AU scaled to scene units where
// Earth's a = SEMI_MAJOR_AXIS, radii relative to EARTH_RADIUS)
// ponytail: orbital inclination omitted (Mercury 7°, Venus 3.4°) — all orbits
// render in the ecliptic plane like Earth's; add an inclination rotation if
// out-of-plane accuracy ever matters.
export const J2000_JD = 2451545.0; // Jan 1 2000 12:00 UTC

export const PLANET_DATA = {
  mercury: {
    semiMajorAxis: 0.38709893 * SEMI_MAJOR_AXIS,
    eccentricity: 0.20563069,
    periodDays: 87.969,
    radius: EARTH_RADIUS * 0.3829,
    meanLongitudeDeg: 252.25084,
    perihelionLongitudeDeg: 77.45645,
    rotationPeriodDays: 58.646,
    texture: "/textures/mercury.jpg",
  },
  venus: {
    semiMajorAxis: 0.72333199 * SEMI_MAJOR_AXIS,
    eccentricity: 0.00677323,
    periodDays: 224.701,
    radius: EARTH_RADIUS * 0.9499,
    meanLongitudeDeg: 181.97973,
    perihelionLongitudeDeg: 131.53298,
    rotationPeriodDays: -243.018, // retrograde
    texture: "/textures/venus.jpg",
  },
} as const;

export type InnerPlanet = keyof typeof PLANET_DATA;

// Moon
export const MOON_RADIUS = 0.27; // visually scaled to 0.41 for readability (real ratio ~27% of Earth)
export const MOON_ORBIT_RADIUS = 5; // compressed for visibility (real ≈ 60× Earth radius)
export const MOON_SIDEREAL_PERIOD_DAYS = 27.321; // sidereal orbital period in days
export const MOON_INCLINATION_DEG = 5.14;
export const MOON_INCLINATION_RAD = (5.14 * Math.PI) / 180;
export const MOON_AXIAL_TILT_DEG = 6.68;
export const MOON_AXIAL_TILT_RAD = (6.68 * Math.PI) / 180;
export const MOON_NODAL_PRECESSION_YEARS = 18.6; // full precession cycle of ascending node
