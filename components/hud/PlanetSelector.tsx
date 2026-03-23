'use client'

const PLANETS = [
  { name: 'Mercury', color: '#9e9e9e', size: 10, active: false },
  { name: 'Venus',   color: '#c2956c', size: 11, active: false },
  { name: 'Earth',   color: '#4a8fd4', size: 14, active: true  },
  { name: 'Mars',    color: '#c1440e', size: 11, active: false },
  { name: 'Jupiter', color: '#c88b3a', size: 13, active: false },
  { name: 'Saturn',  color: '#e8d5a3', size: 12, active: false },
  { name: 'Uranus',  color: '#7de8e8', size: 11, active: false },
  { name: 'Neptune', color: '#4169e1', size: 11, active: false },
]

export function PlanetSelector() {
  return (
    <div className="flex flex-col gap-1 flex-shrink-0">
      <span className="text-xs uppercase tracking-wider text-gray-500">Planets</span>
      <div className="flex items-center gap-1.5">
        {PLANETS.map(planet => (
          <button
            key={planet.name}
            title={planet.active ? planet.name : `${planet.name} — Coming in Phase 2`}
            disabled={!planet.active}
            className={`rounded-full transition-all ${
              planet.active
                ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-black cursor-pointer'
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
