import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@/store/useAppStore'
import {
  DEFAULT_ORBIT_SPEED,
  DEFAULT_ROTATION_SPEED,
  MAX_ORBIT_SPEED,
  MAX_ROTATION_SPEED,
  MIN_ZOOM_DISTANCE,
  MAX_ZOOM_DISTANCE,
  DEFAULT_ZOOM_DISTANCE,
  MIN_EARTH_SCALE,
  MAX_EARTH_SCALE,
  DEFAULT_EARTH_SCALE,
} from '@/lib/constants'

// Default initial state — data fields only (no setters; Zustand merge overwrites them if included)
const DEFAULT_DATA = {
  isPlaying: true,
  orbitSpeed: DEFAULT_ORBIT_SPEED,
  rotationSpeed: DEFAULT_ROTATION_SPEED,
  hemisphere: 'south' as const,
  zoomDistance: DEFAULT_ZOOM_DISTANCE,
  earthScale: DEFAULT_EARTH_SCALE,
  focusTarget: 'sun' as const,
  activeSeasonExplainer: null,
  showOrbitalLabels: true,
}

// Reset store to defaults before each test for isolation.
function resetStore() {
  useAppStore.setState({
    isPlaying: DEFAULT_DATA.isPlaying,
    orbitSpeed: DEFAULT_DATA.orbitSpeed,
    rotationSpeed: DEFAULT_DATA.rotationSpeed,
    hemisphere: DEFAULT_DATA.hemisphere,
    zoomDistance: DEFAULT_DATA.zoomDistance,
    earthScale: DEFAULT_DATA.earthScale,
    focusTarget: DEFAULT_DATA.focusTarget,
    activeSeasonExplainer: DEFAULT_DATA.activeSeasonExplainer,
    showOrbitalLabels: DEFAULT_DATA.showOrbitalLabels,
  })
}

// ---------------------------------------------------------------------------
// Default state matches constants
// ---------------------------------------------------------------------------

describe('default store state', () => {
  beforeEach(resetStore)

  it('has isPlaying = true by default', () => {
    expect(useAppStore.getState().isPlaying).toBe(true)
  })

  it('orbits at DEFAULT_ORBIT_SPEED', () => {
    expect(useAppStore.getState().orbitSpeed).toBe(DEFAULT_ORBIT_SPEED)
  })

  it('rotates at DEFAULT_ROTATION_SPEED', () => {
    expect(useAppStore.getState().rotationSpeed).toBe(DEFAULT_ROTATION_SPEED)
  })

  it('defaults to south hemisphere', () => {
    expect(useAppStore.getState().hemisphere).toBe('south')
  })

  it('zooms at DEFAULT_ZOOM_DISTANCE', () => {
    expect(useAppStore.getState().zoomDistance).toBe(DEFAULT_ZOOM_DISTANCE)
  })

  it('earth scale at DEFAULT_EARTH_SCALE', () => {
    expect(useAppStore.getState().earthScale).toBe(DEFAULT_EARTH_SCALE)
  })

  it('focus target starts at sun', () => {
    expect(useAppStore.getState().focusTarget).toBe('sun')
  })

  it('no season explainer active by default', () => {
    expect(useAppStore.getState().activeSeasonExplainer).toBeNull()
  })

  it('orbital labels enabled by default', () => {
    expect(useAppStore.getState().showOrbitalLabels).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// setIsPlaying
// ---------------------------------------------------------------------------

describe('setIsPlaying', () => {
  beforeEach(resetStore)

  it('toggles from true to false', () => {
    useAppStore.getState().setIsPlaying(false)
    expect(useAppStore.getState().isPlaying).toBe(false)
  })

  it('toggles from false back to true', () => {
    useAppStore.getState().setIsPlaying(false)
    useAppStore.getState().setIsPlaying(true)
    expect(useAppStore.getState().isPlaying).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// setOrbitSpeed — clamping validation
// ---------------------------------------------------------------------------

describe('setOrbitSpeed', () => {
  beforeEach(resetStore)

  it('accepts a value within bounds (5)', () => {
    useAppStore.getState().setOrbitSpeed(5)
    expect(useAppStore.getState().orbitSpeed).toBe(5)
  })

  it('clamps negative values to 0', () => {
    useAppStore.getState().setOrbitSpeed(-10)
    expect(useAppStore.getState().orbitSpeed).toBe(0)
  })

  it('clamps values above MAX_ORBIT_SPEED to MAX', () => {
    useAppStore.getState().setOrbitSpeed(MAX_ORBIT_SPEED + 100)
    expect(useAppStore.getState().orbitSpeed).toBe(MAX_ORBIT_SPEED)
  })

  it('accepts exactly MIN (0)', () => {
    useAppStore.getState().setOrbitSpeed(0)
    expect(useAppStore.getState().orbitSpeed).toBe(0)
  })

  it('accepts exactly MAX', () => {
    useAppStore.getState().setOrbitSpeed(MAX_ORBIT_SPEED)
    expect(useAppStore.getState().orbitSpeed).toBe(MAX_ORBIT_SPEED)
  })
})

// ---------------------------------------------------------------------------
// setRotationSpeed — clamping validation
// ---------------------------------------------------------------------------

describe('setRotationSpeed', () => {
  beforeEach(resetStore)

  it('accepts a value within bounds (1000)', () => {
    useAppStore.getState().setRotationSpeed(1000)
    expect(useAppStore.getState().rotationSpeed).toBe(1000)
  })

  it('clamps negative values to 0', () => {
    useAppStore.getState().setRotationSpeed(-1)
    expect(useAppStore.getState().rotationSpeed).toBe(0)
  })

  it('clamps values above MAX_ROTATION_SPEED to MAX', () => {
    useAppStore.getState().setRotationSpeed(MAX_ROTATION_SPEED + 500)
    expect(useAppStore.getState().rotationSpeed).toBe(MAX_ROTATION_SPEED)
  })

  it('accepts exactly 0', () => {
    useAppStore.getState().setRotationSpeed(0)
    expect(useAppStore.getState().rotationSpeed).toBe(0)
  })

  it('accepts exactly MAX_ROTATION_SPEED', () => {
    useAppStore.getState().setRotationSpeed(MAX_ROTATION_SPEED)
    expect(useAppStore.getState().rotationSpeed).toBe(MAX_ROTATION_SPEED)
  })
})

// ---------------------------------------------------------------------------
// setZoomDistance — clamping validation
// ---------------------------------------------------------------------------

describe('setZoomDistance', () => {
  beforeEach(resetStore)

  it('accepts a value within bounds (300)', () => {
    useAppStore.getState().setZoomDistance(300)
    expect(useAppStore.getState().zoomDistance).toBe(300)
  })

  it('clamps below MIN_ZOOM_DISTANCE to MIN', () => {
    useAppStore.getState().setZoomDistance(MIN_ZOOM_DISTANCE - 100)
    expect(useAppStore.getState().zoomDistance).toBe(MIN_ZOOM_DISTANCE)
  })

  it('clamps above MAX_ZOOM_DISTANCE to MAX', () => {
    useAppStore.getState().setZoomDistance(MAX_ZOOM_DISTANCE + 200)
    expect(useAppStore.getState().zoomDistance).toBe(MAX_ZOOM_DISTANCE)
  })

  it('accepts exactly MIN_ZOOM_DISTANCE', () => {
    useAppStore.getState().setZoomDistance(MIN_ZOOM_DISTANCE)
    expect(useAppStore.getState().zoomDistance).toBe(MIN_ZOOM_DISTANCE)
  })

  it('accepts exactly MAX_ZOOM_DISTANCE', () => {
    useAppStore.getState().setZoomDistance(MAX_ZOOM_DISTANCE)
    expect(useAppStore.getState().zoomDistance).toBe(MAX_ZOOM_DISTANCE)
  })
})

// ---------------------------------------------------------------------------
// setEarthScale — clamping validation
// ---------------------------------------------------------------------------

describe('setEarthScale', () => {
  beforeEach(resetStore)

  it('accepts a value within bounds (5)', () => {
    useAppStore.getState().setEarthScale(5)
    expect(useAppStore.getState().earthScale).toBe(5)
  })

  it('clamps below MIN_EARTH_SCALE to MIN', () => {
    useAppStore.getState().setEarthScale(MIN_EARTH_SCALE - 1)
    expect(useAppStore.getState().earthScale).toBe(MIN_EARTH_SCALE)
  })

  it('clamps above MAX_EARTH_SCALE to MAX', () => {
    useAppStore.getState().setEarthScale(MAX_EARTH_SCALE + 5)
    expect(useAppStore.getState().earthScale).toBe(MAX_EARTH_SCALE)
  })

  it('accepts exactly MIN_EARTH_SCALE', () => {
    useAppStore.getState().setEarthScale(MIN_EARTH_SCALE)
    expect(useAppStore.getState().earthScale).toBe(MIN_EARTH_SCALE)
  })

  it('accepts exactly MAX_EARTH_SCALE', () => {
    useAppStore.getState().setEarthScale(MAX_EARTH_SCALE)
    expect(useAppStore.getState().earthScale).toBe(MAX_EARTH_SCALE)
  })
})

// ---------------------------------------------------------------------------
// setHemisphere — toggles north/south
// ---------------------------------------------------------------------------

describe('setHemisphere', () => {
  beforeEach(resetStore)

  it('toggles from south to north', () => {
    useAppStore.getState().setHemisphere('north')
    expect(useAppStore.getState().hemisphere).toBe('north')
  })

  it('toggles from north to south', () => {
    useAppStore.getState().setHemisphere('north')
    useAppStore.getState().setHemisphere('south')
    expect(useAppStore.getState().hemisphere).toBe('south')
  })
})

// ---------------------------------------------------------------------------
// setFocusTarget — idempotency (critical design decision per WORKING_MEMORY)
// ---------------------------------------------------------------------------

describe('setFocusTarget — idempotency', () => {
  beforeEach(resetStore)

  it('is a no-op when setting the already-focused target (sun → sun)', () => {
    const before = useAppStore.getState().focusTarget
    useAppStore.getState().setFocusTarget('sun')
    expect(useAppStore.getState().focusTarget).toBe(before)
  })

  it('changes target when switching from sun to earth', () => {
    useAppStore.getState().setFocusTarget('earth')
    expect(useAppStore.getState().focusTarget).toBe('earth')
  })

  it('changes target when switching from earth to moon', () => {
    useAppStore.getState().setFocusTarget('earth')
    useAppStore.getState().setFocusTarget('moon')
    expect(useAppStore.getState().focusTarget).toBe('moon')
  })

  it('changes target when switching from moon back to sun', () => {
    useAppStore.getState().setFocusTarget('moon')
    useAppStore.getState().setFocusTarget('sun')
    expect(useAppStore.getState().focusTarget).toBe('sun')
  })

  it('is a no-op when setting the already-focused target (earth → earth)', () => {
    useAppStore.getState().setFocusTarget('earth')
    const before = useAppStore.getState().focusTarget
    useAppStore.getState().setFocusTarget('earth')
    expect(useAppStore.getState().focusTarget).toBe(before)
  })

  it('is a no-op when setting the already-focused target (moon → moon)', () => {
    useAppStore.getState().setFocusTarget('moon')
    const before = useAppStore.getState().focusTarget
    useAppStore.getState().setFocusTarget('moon')
    expect(useAppStore.getState().focusTarget).toBe(before)
  })
})

// ---------------------------------------------------------------------------
// setActiveSeasonExplainer / clearActiveSeasonExplainer
// ---------------------------------------------------------------------------

describe('season explainer state transitions', () => {
  beforeEach(resetStore)

  it('starts as null', () => {
    expect(useAppStore.getState().activeSeasonExplainer).toBeNull()
  })

  it('sets the explainer when active', () => {
    useAppStore.getState().setActiveSeasonExplainer({ mode: 'solstice' as const, eventLabel: 'June Solstice' })
    expect(useAppStore.getState().activeSeasonExplainer).toEqual({ mode: 'solstice', eventLabel: 'June Solstice' })
  })

  it('clears the explainer to null', () => {
    useAppStore.getState().setActiveSeasonExplainer({ mode: 'equinox' as const, eventLabel: 'March Equinox' })
    useAppStore.getState().clearActiveSeasonExplainer()
    expect(useAppStore.getState().activeSeasonExplainer).toBeNull()
  })

  it('overwrites an existing explainer with a new one', () => {
    useAppStore.getState().setActiveSeasonExplainer({ mode: 'solstice' as const, eventLabel: 'June Solstice' })
    useAppStore.getState().setActiveSeasonExplainer({ mode: 'equinox' as const, eventLabel: 'September Equinox' })
    expect(useAppStore.getState().activeSeasonExplainer).toEqual({ mode: 'equinox', eventLabel: 'September Equinox' })
  })

  it('clearing is idempotent (clearing null again does nothing)', () => {
    useAppStore.getState().clearActiveSeasonExplainer()
    useAppStore.getState().clearActiveSeasonExplainer()
    expect(useAppStore.getState().activeSeasonExplainer).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// setShowOrbitalLabels
// ---------------------------------------------------------------------------

describe('setShowOrbitalLabels', () => {
  beforeEach(resetStore)

  it('toggles from true to false', () => {
    useAppStore.getState().setShowOrbitalLabels(false)
    expect(useAppStore.getState().showOrbitalLabels).toBe(false)
  })

  it('toggles from false back to true', () => {
    useAppStore.getState().setShowOrbitalLabels(false)
    useAppStore.getState().setShowOrbitalLabels(true)
    expect(useAppStore.getState().showOrbitalLabels).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Constants relationship validation (regression guard)
// ---------------------------------------------------------------------------

describe('constants relationships', () => {
  it('MIN_ZOOM_DISTANCE < DEFAULT_ZOOM_DISTANCE < MAX_ZOOM_DISTANCE', () => {
    expect(MIN_ZOOM_DISTANCE).toBeLessThan(DEFAULT_ZOOM_DISTANCE)
    expect(DEFAULT_ZOOM_DISTANCE).toBeLessThan(MAX_ZOOM_DISTANCE)
  })

  it('MIN_EARTH_SCALE < DEFAULT_EARTH_SCALE < MAX_EARTH_SCALE', () => {
    expect(MIN_EARTH_SCALE).toBeLessThan(DEFAULT_EARTH_SCALE)
    expect(DEFAULT_EARTH_SCALE).toBeLessThan(MAX_EARTH_SCALE)
  })

  it('DEFAULT_ORBIT_SPEED is within [0, MAX_ORBIT_SPEED]', () => {
    expect(DEFAULT_ORBIT_SPEED).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_ORBIT_SPEED).toBeLessThanOrEqual(MAX_ORBIT_SPEED)
  })

  it('DEFAULT_ROTATION_SPEED is within [0, MAX_ROTATION_SPEED]', () => {
    expect(DEFAULT_ROTATION_SPEED).toBeGreaterThanOrEqual(0)
    expect(DEFAULT_ROTATION_SPEED).toBeLessThanOrEqual(MAX_ROTATION_SPEED)
  })

  it('MAX_ORBIT_SPEED > 0', () => {
    expect(MAX_ORBIT_SPEED).toBeGreaterThan(0)
  })

  it('MAX_ROTATION_SPEED > DEFAULT_ROTATION_SPEED', () => {
    expect(MAX_ROTATION_SPEED).toBeGreaterThan(DEFAULT_ROTATION_SPEED)
  })
})