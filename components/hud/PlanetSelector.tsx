'use client'

import { useAppStore, type FocusTarget } from '@/store/useAppStore'

const PLANETS: { name: string; color: string; size: number; target: FocusTarget | null }[] = [
  { name: 'Mercury', color: '#9e9e9e', size: 10, target: 'mercury' },
  { name: 'Venus',   color: '#c2956c', size: 11, target: 'venus'   },
  { name: 'Earth',   color: '#4a8fd4', size: 14, target: 'earth'   },
  { name: 'Mars',    color: '#c1440e', size: 11, target: null },
  { name: 'Jupiter', color: '#c88b3a', size: 13, target: null },
  { name: 'Saturn',  color: '#e8d5a3', size: 12, target: null },
  { name: 'Uranus',  color: '#7de8e8', size: 11, target: null },
  { name: 'Neptune', color: '#4169e1', size: 11, target: null },
]

export function PlanetSelector() {
  const focusTarget = useAppStore(s => s.focusTarget)
  const setFocusTarget = useAppStore(s => s.setFocusTarget)

  return (
    <div className="flex flex-col gap-1 flex-shrink-0">
      <span className="text-xs uppercase tracking-wider text-gray-500">Planets</span>
      <div className="flex items-center gap-1.5">
        {PLANETS.map(planet => (
          <button
            key={planet.name}
            title={planet.target ? planet.name : `${planet.name} — Coming in Phase 2`}
            disabled={!planet.target}
            onClick={() => planet.target && setFocusTarget(planet.target)}
            className={`rounded-full transition-all ${
              planet.target === focusTarget
                ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-black cursor-pointer'
                : planet.target
                  ? 'cursor-pointer hover:ring-2 hover:ring-blue-400/50 hover:ring-offset-1 hover:ring-offset-black'
                  : 'opacity-30 cursor-not-allowed'
            }`}
            style={{
              width: planet.size,
              height: planet.size,
              backgroundColor: planet.color,
            }}
          />
        ))}
      </div>
    </div>
  )
}
