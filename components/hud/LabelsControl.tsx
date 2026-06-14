'use client'

import { useAppStore } from '@/store/useAppStore'

export function LabelsControl() {
  const showOrbitalLabels = useAppStore(s => s.showOrbitalLabels)
  const setShowOrbitalLabels = useAppStore(s => s.setShowOrbitalLabels)

  return (
    <div className="flex flex-col gap-1 flex-shrink-0">
      <span className="text-xs uppercase tracking-wider text-gray-500">Labels</span>
      <div className="flex bg-black/60 border border-white/10 rounded overflow-hidden">
        <button
          type="button"
          onClick={() => setShowOrbitalLabels(true)}
          aria-pressed={showOrbitalLabels}
          className={`px-3 py-1 text-xs transition-colors ${
            showOrbitalLabels
              ? 'bg-blue-900/50 text-blue-300'
              : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          On
        </button>
        <button
          type="button"
          onClick={() => setShowOrbitalLabels(false)}
          aria-pressed={!showOrbitalLabels}
          className={`px-3 py-1 text-xs transition-colors border-l border-white/10 ${
            !showOrbitalLabels
              ? 'bg-blue-900/50 text-blue-300'
              : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          Off
        </button>
      </div>
    </div>
  )
}
