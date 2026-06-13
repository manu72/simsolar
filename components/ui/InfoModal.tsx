"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useOfflineStatus } from "@/lib/useOfflineStatus";

interface InfoModalProps {
  triggerClassName?: string;
  triggerLabel?: string;
}

const DEFAULT_TRIGGER_CLASS_NAME = `fixed top-4 left-4 z-50 rounded-full border border-white/10 bg-black/60 px-3 py-1.5
  text-xs uppercase tracking-wider text-white/60 transition-colors hover:text-white
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300
  motion-reduce:transition-none`;

export function InfoModal({ triggerClassName = DEFAULT_TRIGGER_CLASS_NAME, triggerLabel = "Info" }: InfoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [offlineChecked, setOfflineChecked] = useState(false);
  const { isCached, cacheProgress, cacheError, triggerCache } = useOfflineStatus();
  const [showProgress, setShowProgress] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideProgress = useCallback(() => setShowProgress(false), []);

  const openModal = useCallback(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIsOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setIsVisible(true)));
  }, []);

  const closeModal = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsVisible(false);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    }, 300);
  }, []);

  const handleGetStarted = useCallback(() => {
    if (offlineChecked && !isCached) {
      triggerCache();
      setShowProgress(true);
    }
    closeModal();
  }, [offlineChecked, isCached, triggerCache, closeModal]);

  useEffect(() => {
    if (!isOpen) return;

    const focusDialog = requestAnimationFrame(() => {
      getFocusableElements(dialogRef.current)[0]?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusDialog);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModal, isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={triggerClassName}
        aria-label="About SolarSim"
      >
        {triggerLabel}
      </button>

      {/* Cache progress bar — top of viewport, outside modal */}
      {showProgress && !isCached && !cacheError && cacheProgress < 100 && (
        <div className="fixed top-0 left-0 right-0 z-40 h-0.5 bg-white/10">
          <div className="h-full bg-blue-400/60 transition-all duration-300" style={{ width: `${cacheProgress}%` }} />
        </div>
      )}

      {/* Cache error toast */}
      {showProgress && cacheError && <CacheErrorToast message={cacheError} onDone={hideProgress} />}

      {/* Cache complete toast */}
      {showProgress && isCached && !cacheError && <CacheCompleteToast onDone={hideProgress} />}

      {/* Modal overlay */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300
            motion-reduce:transition-none ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />

          {/* Content */}
          <div
            ref={dialogRef}
            className={`relative max-w-md w-full mx-4 bg-gray-950/95 border border-white/10
              rounded-xl p-8 shadow-2xl transition-all duration-300
              motion-reduce:transition-none ${isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="solar-sim-info-title"
            tabIndex={-1}
          >
            <h1 id="solar-sim-info-title" className="text-2xl font-light tracking-wide text-white mb-2">
              SolarSim Interactive Solar System Simulator
            </h1>
            <p className="text-sm text-white/60 leading-relaxed mb-1">
              An interactive visualisation of Earth&apos;s orbit around the Sun.
            </p>
            <p className="text-xs text-white/40 mb-6">Adjust animation speed, zoom and scale.</p>

            <hr className="border-white/10 mb-6" />

            <h2 className="text-xs uppercase tracking-widest text-white/50 mb-3">How to use</h2>
            <ul className="text-sm text-white/60 space-y-1.5 mb-6">
              <li>Drag in space to orbit the camera</li>
              <li>Scroll to zoom</li>
              <li>Use the timeline slider to scrub through the year</li>
              <li>Adjust orbit and rotation speeds with the HUD sliders</li>
              <li>Click planets to select</li>
            </ul>

            <h2 className="text-xs uppercase tracking-widest text-white/50 mb-3">Why seasons happen</h2>
            <ul className="text-sm text-white/60 space-y-1.5 mb-6">
              <li>Earth orbits the Sun once each year</li>
              <li>Earth spins around a tilted axis</li>
              <li>The tilt changes how many daylight hours each hemisphere gets</li>
              <li>Summer is about tilt and daylight, not being closer to the Sun</li>
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
                  {isCached ? "Available offline" : "Make available offline"}
                </span>
                <p className="text-xs text-white/40 mt-0.5">
                  {isCached
                    ? "Textures and assets are cached for offline use."
                    : "Downloads textures and assets (~2MB) so the app works without an internet connection."}
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
  );
}

function CacheCompleteToast({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2700);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`fixed top-2 left-1/2 -translate-x-1/2 z-40
        text-xs text-white/60 bg-gray-900/90 border border-white/10
        rounded-full px-4 py-1.5 transition-opacity duration-300
        ${visible ? "opacity-100" : "opacity-0"}`}
    >
      Available offline
    </div>
  );
}

function CacheErrorToast({ message, onDone }: { message: string; onDone: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`fixed top-2 left-1/2 -translate-x-1/2 z-40
        text-xs text-red-300/80 bg-gray-900/90 border border-red-400/20
        rounded-full px-4 py-1.5 transition-opacity duration-300
        ${visible ? "opacity-100" : "opacity-0"}`}
      role="alert"
    >
      Offline caching failed{message ? `: ${message}` : ""}
    </div>
  );
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(element => !element.hasAttribute("disabled") && element.tabIndex !== -1);
}
