'use client'

import { useAppStore } from '@/store/useAppStore'

export function HemisphereControl() {
  const hemisphere = useAppStore(s => s.hemisphere)
  const setHemisphere = useAppStore(s => s.setHemisphere)

  return (
    <div className="flex flex-col gap-1 flex-shrink-0">
      <span className="text-xs uppercase tracking-wider text-gray-500">Hemisphere</span>
      <div className="flex bg-black/60 border border-white/10 rounded overflow-hidden">
        <button
          onClick={() => setHemisphere('south')}
          className={`px-3 py-1 text-xs transition-colors ${
            hemisphere === 'south'
              ? 'bg-blue-900/50 text-blue-300'
              : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          S
        </button>
        <button
          onClick={() => setHemisphere('north')}
          className={`px-3 py-1 text-xs transition-colors border-l border-white/10 ${
            hemisphere === 'north'
              ? 'bg-blue-900/50 text-blue-300'
              : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          N
        </button>
      </div>
    </div>
  )
}
