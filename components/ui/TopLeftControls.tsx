'use client'

import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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

const PANEL_MIN_HEIGHT = 192
const PANEL_DEFAULT_MAX_HEIGHT = 448

function readHudHeight(): number {
  if (typeof document === 'undefined') return 140
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hud-height')) || 140
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 639px)').matches
}

function calcExplainerMaxHeight(panelEl: HTMLDivElement | null): number {
  if (typeof window === 'undefined') return PANEL_DEFAULT_MAX_HEIGHT

  const viewportHeight = window.visualViewport?.height ?? window.innerHeight
  const hudHeight = readHudHeight()
  const spacing = 16

  if (isMobileViewport()) {
    const topGap = 12
    const bottomGap = 12
    return Math.max(PANEL_MIN_HEIGHT, viewportHeight - hudHeight - topGap - bottomGap)
  }

  const panelTop = panelEl?.getBoundingClientRect().top ?? 16
  return Math.max(PANEL_MIN_HEIGHT, viewportHeight - panelTop - hudHeight - spacing)
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
    clock.rotationAngle = event.viewPreset.rotationAngle
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

  // ── Panel ref + max-height calculation ──────────────────────────────
  const panelRef = useRef<HTMLDivElement>(null)
  const panelMaxHeightRef = useRef(PANEL_DEFAULT_MAX_HEIGHT)
  const [panelMaxHeight, setPanelMaxHeight] = useState<number | undefined>(undefined)
  const [panelHeight, setPanelHeight] = useState<number | undefined>(undefined)
  const dragStartY = useRef(0)
  const dragStartH = useRef(0)

  const recalcPanelBounds = useCallback(() => {
    const nextMax = calcExplainerMaxHeight(panelRef.current)
    const mobile = isMobileViewport()
    panelMaxHeightRef.current = nextMax
    setPanelMaxHeight(prev => (prev === nextMax ? prev : nextMax))
    setPanelHeight(prev => {
      if (mobile) return undefined
      if (prev === undefined) return prev
      const clamped = Math.min(prev, nextMax)
      return prev === clamped ? prev : clamped
    })
  }, [])

  useEffect(() => {
    if (!activeExplainer) {
      setPanelMaxHeight(undefined)
      setPanelHeight(undefined)
    }
  }, [activeExplainer])

  useLayoutEffect(() => {
    if (!activeExplainer) return

    recalcPanelBounds()
    const frame = requestAnimationFrame(recalcPanelBounds)

    window.addEventListener('resize', recalcPanelBounds)
    document.addEventListener('solar:hud-height', recalcPanelBounds)

    const visualViewport = window.visualViewport
    visualViewport?.addEventListener('resize', recalcPanelBounds)
    visualViewport?.addEventListener('scroll', recalcPanelBounds)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', recalcPanelBounds)
      document.removeEventListener('solar:hud-height', recalcPanelBounds)
      visualViewport?.removeEventListener('resize', recalcPanelBounds)
      visualViewport?.removeEventListener('scroll', recalcPanelBounds)
    }
  }, [activeExplainer, recalcPanelBounds])

  const startResize = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragStartY.current = e.clientY
    dragStartH.current = panelRef.current?.clientHeight ?? 320

    const onMove = (moveEvent: PointerEvent) => {
      const maxH = panelMaxHeightRef.current
      const delta = dragStartY.current - moveEvent.clientY
      const nextHeight = Math.max(PANEL_MIN_HEIGHT, Math.min(dragStartH.current + delta, maxH))
      setPanelHeight(nextHeight)
    }

    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [])

  // ── Mobile panel classes ────────────────────────────────────────────
  const mobilePanelClasses = selectedEvent
    ? 'fixed inset-x-3 top-3 bottom-[calc(var(--hud-height,8rem)+0.75rem)] z-60 rounded-t-2xl w-auto sm:relative sm:top-auto sm:bottom-auto sm:left-auto sm:right-auto sm:z-50 sm:w-[min(23rem,calc(100vw-1.5rem))]'
    : ''

  // Button visibility when drawer is open on mobile — only wrap buttons, not the panel
  const buttonGroupOpacity = selectedEvent ? 'opacity-0 pointer-events-none' : ''

  return (
    <aside
      className="fixed left-3 top-3 z-50 flex max-w-[calc(100vw-1.5rem)] flex-col items-start gap-2 sm:left-4 sm:top-4"
      aria-label="SolarSim learning controls"
    >
      {/* Button group — opacity fades when panel is open */}
      <div className={buttonGroupOpacity}>
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
      </div>

      {selectedEvent && (
        // Scrim overlay for mobile drawer
        <>
          <div
            className="fixed inset-0 bg-black/40 z-55 sm:hidden"
            onClick={closeExplainer}
            aria-hidden="true"
          />
          {/* Panel */}
          <div
            ref={panelRef}
            className={`mt-1 relative flex flex-col min-h-0 overflow-hidden w-[min(23rem,calc(100vw-1.5rem))] rounded-2xl border border-(--color-explainer-border)
              bg-(--color-explainer-surface) text-(--color-explainer-text) shadow-2xl shadow-black/40
              backdrop-blur-md sm:p-5 ${mobilePanelClasses}`}
            aria-labelledby="season-explainer-title"
            style={{
              maxHeight: panelMaxHeight,
              height: panelHeight,
            }}
          >
            {/* Header — shrink-0 */}
            <div className="shrink-0 relative p-4 pt-5 sm:px-5 sm:pt-5">
              <button
                type="button"
                onClick={closeExplainer}
                className="absolute top-4 right-3 z-10 p-1 rounded-full text-(--color-explainer-muted)/60 hover:text-(--color-explainer-text)
                  hover:bg-white/10 transition-colors focus-visible:outline-2
                  focus-visible:outline-offset-2 focus-visible:outline-(--color-explainer-focus)"
                aria-label="Close explainer"
              >
                ×
              </button>
              <div className="mb-0 flex flex-wrap gap-2" role="group" aria-label="Choose event to compare">
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
            </div>

            {/* Scrollable body */}
            <div
              className="flex-1 overflow-y-auto overscroll-y-contain min-h-0 px-4 pb-0 sm:px-5 season-explainer-body"
              aria-label="Season explainer details"
            >
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
            </div>

            {/* Desktop drag handle */}
            <div
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize explainer panel"
              tabIndex={0}
              className="hidden sm:flex shrink-0 justify-center cursor-row-resize py-1.5 hover:bg-white/5 transition-colors
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-explainer-focus)"
              style={{ touchAction: 'none' }}
              onPointerDown={startResize}
            >
              <div className="w-10 h-1 rounded-full bg-white/30" aria-hidden="true" />
            </div>

            {/* Footer — shrink-0 */}
            <div className="shrink-0 mt-4 flex flex-wrap gap-2 border-t border-(--color-explainer-border)/30 p-4 pt-3 sm:px-5 sm:pt-3">
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
          </div>
        </>
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
