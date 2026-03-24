'use client'

import { useState, useEffect, useCallback } from 'react'
import { useOfflineStatus } from '@/lib/useOfflineStatus'

const DISMISSED_KEY = 'solstice_modal_dismissed'

export function InfoModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [offlineChecked, setOfflineChecked] = useState(false)
  const { isCached, cacheProgress, triggerCache } = useOfflineStatus()
  const [showProgress, setShowProgress] = useState(false)

  // Show modal on first visit
  useEffect(() => {
    if (!localStorage.getItem(DISMISSED_KEY)) {
      requestAnimationFrame(() => {
        setIsOpen(true)
        requestAnimationFrame(() => setIsVisible(true))
      })
    }
  }, [])

  const openModal = useCallback(() => {
    setIsOpen(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setIsVisible(true)))
  }, [])

  const closeModal = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => {
      setIsOpen(false)
      localStorage.setItem(DISMISSED_KEY, '1')
    }, 300)
  }, [])

  const handleGetStarted = useCallback(() => {
    if (offlineChecked && !isCached) {
      triggerCache()
      setShowProgress(true)
    }
    closeModal()
  }, [offlineChecked, isCached, triggerCache, closeModal])

  return (
    <>
      {/* Info button — persistent top-left */}
      <button
        onClick={openModal}
        className="fixed top-4 left-4 z-50 w-8 h-8 flex items-center justify-center
          text-white/40 hover:text-white/80 transition-opacity text-lg select-none cursor-pointer"
        aria-label="About Solstice"
      >
        &#9432;
      </button>

      {/* Cache progress bar — top of viewport, outside modal */}
      {showProgress && !isCached && cacheProgress < 100 && (
        <div className="fixed top-0 left-0 right-0 z-40 h-0.5 bg-white/10">
          <div
            className="h-full bg-blue-400/60 transition-all duration-300"
            style={{ width: `${cacheProgress}%` }}
          />
        </div>
      )}

      {/* Cache complete toast */}
      {showProgress && isCached && <CacheCompleteToast onDone={() => setShowProgress(false)} />}

      {/* Modal overlay */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300
            ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />

          {/* Content */}
          <div
            className={`relative max-w-md w-full mx-4 bg-gray-950/95 border border-white/10
              rounded-xl p-8 shadow-2xl transition-all duration-300
              ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
          >
            <h1 className="text-2xl font-light tracking-wide text-white mb-2">Solstice</h1>
            <p className="text-sm text-white/60 leading-relaxed mb-1">
              An interactive visualisation of Earth&apos;s orbit around the Sun, exploring the
              solstices, equinoxes, and the seasons.
            </p>
            <p className="text-xs text-white/40 mb-6">
              Defaults to the southern hemisphere perspective.
            </p>

            <hr className="border-white/10 mb-6" />

            <h2 className="text-xs uppercase tracking-widest text-white/50 mb-3">How to use</h2>
            <ul className="text-sm text-white/60 space-y-1.5 mb-6">
              <li>Drag to orbit the camera</li>
              <li>Scroll to zoom</li>
              <li>Use the timeline to scrub through the year</li>
              <li>Adjust orbit and rotation speeds with the HUD sliders</li>
              <li>Switch between southern and northern hemisphere perspectives</li>
            </ul>

            <hr className="border-white/10 mb-6" />

            <label className="flex items-start gap-3 mb-6 cursor-pointer group">
              <input
                type="checkbox"
                checked={offlineChecked || isCached}
                disabled={isCached}
                onChange={(e) => setOfflineChecked(e.target.checked)}
                className="mt-0.5 accent-blue-400"
              />
              <div>
                <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                  {isCached ? 'Available offline' : 'Make available offline'}
                </span>
                <p className="text-xs text-white/40 mt-0.5">
                  {isCached
                    ? 'Textures and assets are cached for offline use.'
                    : 'Downloads textures and assets (~2MB) so the app works without an internet connection.'}
                </p>
              </div>
            </label>

            <button
              onClick={handleGetStarted}
              className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/15
                text-sm text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              Get started
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function CacheCompleteToast({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 2700)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div
      className={`fixed top-2 left-1/2 -translate-x-1/2 z-40
        text-xs text-white/60 bg-gray-900/90 border border-white/10
        rounded-full px-4 py-1.5 transition-opacity duration-300
        ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      Available offline
    </div>
  )
}
