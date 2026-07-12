"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getFocusableElements } from "@/components/ui/InfoModal";
import { getSeasonDiagramConfigForEvent } from "@/lib/seasonDiagram";
import type { Hemisphere, SolarEventLabel } from "@/lib/seasonExplainer";

const SeasonDiagram = dynamic(() => import("./SeasonDiagram").then((m) => m.SeasonDiagram), { ssr: false });

interface SeasonDiagramModalProps {
  eventLabel: SolarEventLabel;
  hemisphere: Hemisphere;
}

export function SeasonDiagramModal({ eventLabel, hemisphere }: SeasonDiagramModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const config = getSeasonDiagramConfigForEvent(eventLabel, hemisphere);

  const openModal = useCallback(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    previousFocusRef.current?.focus();
    previousFocusRef.current = null;
  }, []);

  // Focus trap + Escape, following the InfoModal conventions.
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

  // Pause the SVG animations whenever the page is not visible.
  useEffect(() => {
    if (!isOpen) return;
    const onVisibility = () => setPageHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-(--color-explainer-accent)/50
          bg-(--color-explainer-accent-soft) px-3 py-2.5 text-sm font-semibold text-white transition-colors
          hover:bg-(--color-explainer-accent-soft)/70 focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-(--color-explainer-focus) motion-reduce:transition-none"
      >
        <TriggerIcon />
        See how it works
      </button>

      {/* Portal escapes the explainer panel, whose backdrop-filter would otherwise
          turn it into the containing block for this fixed overlay. */}
      {isOpen &&
        createPortal(
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} aria-hidden="true" />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="season-diagram-title"
            aria-describedby="season-diagram-caption"
            tabIndex={-1}
            className="sd-modal-panel relative flex max-h-[94dvh] w-full max-w-md flex-col overflow-y-auto rounded-t-3xl
              border border-(--color-explainer-border) bg-(--color-explainer-surface) p-5 pb-6 shadow-2xl
              shadow-black/50 backdrop-blur-md sm:mx-4 sm:rounded-2xl"
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-2 top-2 rounded-full p-3 text-lg leading-none text-(--color-explainer-muted)
                transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2
                focus-visible:outline-offset-2 focus-visible:outline-(--color-explainer-focus) motion-reduce:transition-none"
              aria-label="Close diagram"
            >
              ×
            </button>

            <h2 id="season-diagram-title" className="mb-2 pr-10 text-lg font-semibold leading-tight text-white">
              {config.title}
            </h2>
            <p id="season-diagram-caption" className="mb-3 text-sm leading-6 text-(--color-explainer-text)">
              {config.caption}
            </p>

            <div className="season-diagram mx-auto w-full max-w-sm" data-paused={pageHidden ? "true" : undefined}>
              <SeasonDiagram variant={config.variant} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function TriggerIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" aria-hidden="true">
      <circle cx="6" cy="10" r="3.5" fill="#fcd34d" />
      <g stroke="#fcd34d" strokeWidth="1.2" strokeLinecap="round">
        <line x1="6" y1="4.2" x2="6" y2="2.8" />
        <line x1="6" y1="15.8" x2="6" y2="17.2" />
        <line x1="1.8" y1="10" x2="0.6" y2="10" />
        <line x1="10.2" y1="5.8" x2="11.1" y2="4.9" />
        <line x1="10.2" y1="14.2" x2="11.1" y2="15.1" />
      </g>
      <circle cx="15" cy="10" r="3" fill="#3b82f6" />
      <line x1="13.2" y1="6.4" x2="16.8" y2="13.6" stroke="#e2e8f0" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
