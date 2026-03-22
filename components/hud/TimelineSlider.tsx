'use client'

import { useRef, useContext } from 'react'
import { SimulationContext } from '@/components/canvas/SimulationContext'
import { useAppStore } from '@/store/useAppStore'
import { dateToJulianDay, julianDayToDate, getSolsticeEquinoxEvents } from '@/lib/orbitalMechanics'

function getYearBounds() {
  const year = new Date().getUTCFullYear()
  const min = dateToJulianDay(new Date(Date.UTC(year, 0, 1)))
  const max = dateToJulianDay(new Date(Date.UTC(year, 11, 31)))
  return { min, max, year }
}

export function TimelineSlider() {
  const clock          = useContext(SimulationContext)
  const displayDate    = useAppStore(s => s.displayDate)
  const setIsPlaying   = useAppStore(s => s.setIsPlaying)
  const setDisplayDate = useAppStore(s => s.setDisplayDate)

  const preScrubPlayingRef = useRef(true)
  const { min, max } = getYearBounds()

  const events = getSolsticeEquinoxEvents()

  const sliderValue = Math.max(min, Math.min(max, clock.julianDay))

  const formattedDate = displayDate.toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })

  // Season band positions (approximate % along the year for southern seasons)
  // Summer wraps: Dec 1–Dec 31 is at end, Jan 1–Mar 1 is at start
  const seasonBands = [
    { label: 'Summer',  color: 'rgba(255,140,0,0.25)',   left: 0,     width: 16.4 }, // Jan 1–Mar 1
    { label: 'Autumn',  color: 'rgba(160,100,40,0.25)',  left: 16.4,  width: 25.2 }, // Mar 1–Jun 1
    { label: 'Winter',  color: 'rgba(50,100,180,0.25)',  left: 41.6,  width: 24.9 }, // Jun 1–Sep 1
    { label: 'Spring',  color: 'rgba(60,160,80,0.25)',   left: 66.5,  width: 16.9 }, // Sep 1–Dec 1
    { label: 'Summer',  color: 'rgba(255,140,0,0.2)',    left: 83.4,  width: 16.6 }, // Dec 1–Dec 31
  ]

  return (
    <div className="w-full">
      {/* Label row */}
      <div className="flex justify-between mb-1.5">
        <span className="text-[8px] uppercase tracking-wider text-gray-500">Timeline</span>
        <span className="text-[9px] text-gray-400">{formattedDate}</span>
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
            setDisplayDate(julianDayToDate(newJD))
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
        <span className="text-[7px] text-gray-600">Jan</span>
        {events.map(event => {
          const tickPct = (event.jd - min) / (max - min) * 100
          return (
            <span
              key={event.label}
              className="text-[7px] text-gray-500 absolute transform -translate-x-1/2"
              style={{ left: `${tickPct}%` }}
            >
              {event.date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
            </span>
          )
        })}
        <span className="text-[7px] text-gray-600">Dec</span>
      </div>
    </div>
  )
}
