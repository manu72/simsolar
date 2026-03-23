'use client'

import { useRef, useContext, useMemo, useState, useEffect, useCallback } from 'react'
import { SimulationContext } from '@/components/canvas/SimulationContext'
import { useAppStore } from '@/store/useAppStore'
import { dateToJulianDay, julianDayToDate, getSolsticeEquinoxEvents } from '@/lib/orbitalMechanics'

const POLL_INTERVAL_MS = 250

function getYearBounds() {
  const year = new Date().getUTCFullYear()
  const min = dateToJulianDay(new Date(Date.UTC(year, 0, 1)))
  const max = dateToJulianDay(new Date(Date.UTC(year, 11, 31)))
  return { min, max, year }
}

export function TimelineSlider() {
  const clock        = useContext(SimulationContext)
  const setIsPlaying = useAppStore(s => s.setIsPlaying)

  // Local display date — polled from the mutable clock ref on an interval,
  // completely decoupled from R3F's useFrame loop (avoids rAF → Zustand → React DOM cascade).
  const [displayDate, setDisplayDate] = useState(() => julianDayToDate(clock.julianDay))

  useEffect(() => {
    const id = setInterval(() => {
      setDisplayDate(prev => {
        const next = julianDayToDate(clock.julianDay)
        return prev.getTime() === next.getTime() ? prev : next
      })
    }, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [clock])

  const updateDisplayDateFromClock = useCallback(() => {
    setDisplayDate(julianDayToDate(clock.julianDay))
  }, [clock])

  const preScrubPlayingRef = useRef(useAppStore.getState().isPlaying)
  const { min, max } = getYearBounds()

  const events = useMemo(() => getSolsticeEquinoxEvents(), [])

  const sliderValue = Math.max(min, Math.min(max, clock.julianDay))

  const formattedDate = displayDate.toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })

  // Compute season bands from event positions
  // events is sorted: March, June, September, December
  const marchPct  = (events[0].jd - min) / (max - min) * 100
  const junePct   = (events[1].jd - min) / (max - min) * 100
  const septPct   = (events[2].jd - min) / (max - min) * 100
  const decPct    = (events[3].jd - min) / (max - min) * 100

  const seasonBands = [
    // Summer continues from Jan 1 (0%) to March Equinox
    { label: 'Summer', color: 'rgba(255,140,0,0.25)',  left: 0,        width: marchPct },
    // Autumn: March Equinox to June Solstice
    { label: 'Autumn', color: 'rgba(160,100,40,0.25)', left: marchPct, width: junePct - marchPct },
    // Winter: June Solstice to September Equinox
    { label: 'Winter', color: 'rgba(50,100,180,0.25)', left: junePct,  width: septPct - junePct },
    // Spring: September Equinox to December Solstice
    { label: 'Spring', color: 'rgba(60,160,80,0.25)',  left: septPct,  width: decPct - septPct },
    // Summer starts again at December Solstice through Dec 31
    { label: 'Summer', color: 'rgba(255,140,0,0.2)',   left: decPct,   width: 100 - decPct },
  ]

  return (
    <div className="w-full">
      {/* Label row */}
      <div className="flex justify-between mb-1.5">
        <span className="text-xs uppercase tracking-wider text-gray-500">Timeline</span>
        <span className="text-xs text-gray-400">{formattedDate}</span>
      </div>

      {/* Slider track with season bands */}
      <div className="relative">
        {/* Season colour bands */}
        <div className="absolute inset-0 h-2 rounded overflow-hidden pointer-events-none">
          {seasonBands.map((band, i) => (
            <div
              key={i}
              className="absolute top-0 h-full"
              style={{
                left: `${band.left}%`,
                width: `${band.width}%`,
                backgroundColor: band.color,
              }}
            />
          ))}
          {/* Solstice/equinox tick marks */}
          {events.map(event => {
            const tickPct = (event.jd - min) / (max - min) * 100
            return (
              <div
                key={event.label}
                className="absolute top-0 h-full w-px bg-white/20"
                style={{ left: `${tickPct}%` }}
              />
            )
          })}
        </div>

        {/* Range input */}
        <input
          type="range"
          min={min}
          max={max}
          step={0.01}
          value={sliderValue}
          onPointerDown={() => {
            preScrubPlayingRef.current = useAppStore.getState().isPlaying
            setIsPlaying(false)
          }}
          onInput={e => {
            const newJD = parseFloat((e.target as HTMLInputElement).value)
            clock.julianDay = newJD
            updateDisplayDateFromClock()
          }}
          onPointerUp={() => {
            setIsPlaying(preScrubPlayingRef.current)
          }}
          className="relative w-full h-2 bg-transparent rounded appearance-none cursor-pointer z-10
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-3
                     [&::-webkit-slider-thumb]:h-3
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-blue-300
                     [&::-webkit-slider-thumb]:cursor-grab"
        />
      </div>

      {/* Tick labels */}
      <div className="relative flex justify-between mt-0.5 px-0.5">
        <span className="text-[10px] text-gray-600">Jan</span>
        {events.map(event => {
          const tickPct = (event.jd - min) / (max - min) * 100
          return (
            <span
              key={event.label}
              className="text-[10px] text-gray-500 absolute transform -translate-x-1/2"
              style={{ left: `${tickPct}%` }}
            >
              {event.date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
            </span>
          )
        })}
        <span className="text-[10px] text-gray-600">Dec</span>
      </div>
    </div>
  )
}
