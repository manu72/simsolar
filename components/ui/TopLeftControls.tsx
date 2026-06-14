'use client'

import { useCallback, useContext, useMemo, useRef, useState } from 'react'
import { SimulationContext } from '@/components/canvas/SimulationContext'
import { InfoModal } from '@/components/ui/InfoModal'
import { DEFAULT_EARTH_SCALE, DEFAULT_ZOOM_DISTANCE } from '@/lib/constants'
import {
  SEASON_EXPLAINER_SCENE_PRESET,
  getSeasonExplainerEvent,
  getSeasonExplainerEvents,
  getTodayAwareExplainerEvent,
  type SeasonExplainerEvent,
  type SeasonExplainerMode,
  type SolarEventLabel,
} from '@/lib/seasonExplainer'
import { getSiderealRotationAngle } from '@/lib/orbitalMechanics'
import { useAppStore } from '@/store/useAppStore'

interface SceneSnapshot {
  isPlaying: boolean
  orbitSpeed: number
  zoomDistance: number
  earthScale: number
  focusTarget: 'sun' | 'earth' | 'moon'
  julianDay: number
  rotationAngle: number
}

export function TopLeftControls() {
  const clock = useContext(SimulationContext)
  const activeExplainer = useAppStore(s => s.activeSeasonExplainer)
  const hemisphere = useAppStore(s => s.hemisphere)
  const clearActiveSeasonExplainer = useAppStore(s => s.clearActiveSeasonExplainer)
  const snapshotRef = useRef<SceneSnapshot | null>(null)
  const [selectedYear, setSelectedYear] = useState(() => new Date().getUTCFullYear())

  const activeMode = activeExplainer?.mode ?? null
  const selectedEvent = useMemo(() => {
    if (!activeExplainer) return null
    return getSeasonExplainerEvent(activeExplainer.eventLabel, hemisphere, selectedYear)
  }, [activeExplainer, hemisphere, selectedYear])

  const selectableEvents = useMemo(() => {
    if (!activeMode) return []
    return getSeasonExplainerEvents(activeMode, hemisphere, selectedYear)
  }, [activeMode, hemisphere, selectedYear])

  const captureSnapshot = useCallback(() => {
    if (snapshotRef.current) return
    const state = useAppStore.getState()
    snapshotRef.current = {
      isPlaying: state.isPlaying,
      orbitSpeed: state.orbitSpeed,
      zoomDistance: state.zoomDistance,
      earthScale: state.earthScale,
      focusTarget: state.focusTarget,
      julianDay: clock.julianDay,
      rotationAngle: clock.rotationAngle,
    }
  }, [clock])

  const applyEvent = useCallback((event: SeasonExplainerEvent) => {
    captureSnapshot()
    const store = useAppStore.getState()

    store.setIsPlaying(SEASON_EXPLAINER_SCENE_PRESET.isPlaying)
    store.setOrbitSpeed(SEASON_EXPLAINER_SCENE_PRESET.orbitSpeed)
    store.setFocusTarget(SEASON_EXPLAINER_SCENE_PRESET.focusTarget)
    store.setZoomDistance(SEASON_EXPLAINER_SCENE_PRESET.zoomDistance)
    store.setEarthScale(SEASON_EXPLAINER_SCENE_PRESET.earthScale)
    store.setActiveSeasonExplainer({ mode: event.mode, eventLabel: event.label })

    // SimulationClock is intentionally mutable shared state; see ClientRoot and Animator.
    /* eslint-disable react-hooks/immutability */
    clock.julianDay = event.jd
    clock.rotationAngle = getSiderealRotationAngle(event.jd)
    /* eslint-enable react-hooks/immutability */
    setSelectedYear(event.date.getUTCFullYear())
  }, [captureSnapshot, clock])

  const startExplainer = useCallback((mode: SeasonExplainerMode) => {
    const event = getTodayAwareExplainerEvent(mode, hemisphere)
    applyEvent(event)
  }, [applyEvent, hemisphere])

  const selectEvent = useCallback((eventLabel: SolarEventLabel) => {
    const event = getSeasonExplainerEvent(eventLabel, hemisphere, selectedYear)
    applyEvent(event)
  }, [applyEvent, hemisphere, selectedYear])

  const closeExplainer = useCallback(() => {
    const snapshot = snapshotRef.current
    if (snapshot) {
      const store = useAppStore.getState()
      store.setIsPlaying(snapshot.isPlaying)
      store.setOrbitSpeed(snapshot.orbitSpeed)
      store.setZoomDistance(snapshot.zoomDistance || DEFAULT_ZOOM_DISTANCE)
      store.setEarthScale(snapshot.earthScale || DEFAULT_EARTH_SCALE)
      store.setFocusTarget(snapshot.focusTarget)
      // Restore the same mutable clock fields that Animator advances per frame.
      /* eslint-disable react-hooks/immutability */
      clock.julianDay = snapshot.julianDay
      clock.rotationAngle = snapshot.rotationAngle
      /* eslint-enable react-hooks/immutability */
    }

    snapshotRef.current = null
    clearActiveSeasonExplainer()
  }, [clearActiveSeasonExplainer, clock])

  const selectComparisonEvent = useCallback(() => {
    if (!selectedEvent) return
    const otherEvent = selectableEvents.find(event => event.label !== selectedEvent.label)
    if (otherEvent) applyEvent(otherEvent)
  }, [applyEvent, selectableEvents, selectedEvent])

  return (
    <aside
      className="fixed left-3 top-3 z-50 flex max-w-[calc(100vw-1.5rem)] flex-col items-start gap-2 sm:left-4 sm:top-4"
      aria-label="SolarSim learning controls"
    >
      <InfoModal triggerClassName={getControlButtonClass(false)} />

      <button
        type="button"
        onClick={() => startExplainer('solstice')}
        className={getControlButtonClass(activeMode === 'solstice')}
        aria-pressed={activeMode === 'solstice'}
      >
        Solstice
      </button>

      <button
        type="button"
        onClick={() => startExplainer('equinox')}
        className={getControlButtonClass(activeMode === 'equinox')}
        aria-pressed={activeMode === 'equinox'}
      >
        Equinox
      </button>

      {selectedEvent && (
        <section
          className="mt-1 relative w-[min(23rem,calc(100vw-1.5rem))] rounded-2xl border border-(--color-explainer-border)
            bg-(--color-explainer-surface) p-4 text-(--color-explainer-text) shadow-2xl shadow-black/40
            backdrop-blur-md sm:p-5"
          aria-labelledby="season-explainer-title"
        >
          <button
            type="button"
            onClick={closeExplainer}
            className="absolute top-2 right-2 z-10 p-1 rounded-full text-(--color-explainer-muted)/60 hover:text-(--color-explainer-text)
              hover:bg-white/10 transition-colors focus-visible:outline-2
              focus-visible:outline-offset-2 focus-visible:outline-(--color-explainer-focus)"
            aria-label="Close explainer"
          >
            ×
          </button>
          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Choose event to compare">
            {selectableEvents.map(event => (
              <button
                key={event.label}
                type="button"
                onClick={() => selectEvent(event.label)}
                className={getEventButtonClass(event.label === selectedEvent.label)}
                aria-pressed={event.label === selectedEvent.label}
              >
                {event.selectorLabel}
              </button>
            ))}
          </div>

          <div aria-live="polite">
            <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-(--color-explainer-muted)">
              {formatDate(selectedEvent.date)} · {selectedEvent.seasonLabel}
            </p>

            <h2 id="season-explainer-title" className="mb-2 text-lg font-semibold leading-tight text-white">
              {selectedEvent.title}
            </h2>

            <p className="mb-4 text-sm leading-6 text-(--color-explainer-text)">
              {selectedEvent.summary}
            </p>

            <ol className="space-y-2 text-sm leading-5">
              <li>
                <span className="font-semibold text-white">1. Orbit:</span> {selectedEvent.orbitPrompt}
              </li>
              <li>
                <span className="font-semibold text-white">2. Tilt:</span> {selectedEvent.tiltPrompt}
              </li>
              <li>
                <span className="font-semibold text-white">3. Daylight:</span> {selectedEvent.daylightPrompt}
              </li>
            </ol>

            <p className="mt-4 rounded-xl border border-(--color-explainer-border) bg-black/30 px-3 py-2 text-xs leading-5 text-(--color-explainer-muted)">
              {selectedEvent.axisPrompt}
            </p>

            {selectedEvent.misconceptionPrompt && (
              <p className="mt-3 text-xs leading-5 text-(--color-explainer-muted)">
                {selectedEvent.misconceptionPrompt}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectComparisonEvent}
              className="rounded-full border border-(--color-explainer-border) bg-black/30 px-3 py-1.5 text-xs
                font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-2
                focus-visible:outline-offset-2 focus-visible:outline-(--color-explainer-focus) motion-reduce:transition-none"
            >
              {selectedEvent.comparisonLabel}
            </button>
            <button
              type="button"
              onClick={closeExplainer}
              className="rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-(--color-explainer-muted)
                transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2
                focus-visible:outline-(--color-explainer-focus) motion-reduce:transition-none"
            >
              Close explainer
            </button>
          </div>
        </section>
      )}
    </aside>
  )
}

function getControlButtonClass(active: boolean): string {
  const activeClass = active
    ? 'border-(--color-explainer-accent) bg-(--color-explainer-accent-soft) text-white'
    : 'border-(--color-explainer-border) bg-(--color-explainer-surface) text-(--color-explainer-muted) hover:text-white'

  return `rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]
    shadow-lg shadow-black/30 backdrop-blur-md transition-colors focus-visible:outline-2
    focus-visible:outline-offset-2 focus-visible:outline-(--color-explainer-focus) motion-reduce:transition-none ${activeClass}`
}

function getEventButtonClass(active: boolean): string {
  const activeClass = active
    ? 'border-(--color-explainer-accent) bg-(--color-explainer-accent) text-black'
    : 'border-(--color-explainer-border) bg-black/30 text-(--color-explainer-muted) hover:text-white'

  return `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors
    focus-visible:outline-2 focus-visible:outline-offset-2
    focus-visible:outline-(--color-explainer-focus) motion-reduce:transition-none ${activeClass}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
