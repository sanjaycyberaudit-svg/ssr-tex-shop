"use client";

import Autoplay from "embla-carousel-autoplay";
import { useMemo } from "react";

export type EmblaAutoplayOptions = {
  delayMs?: number;
  /** Pause while hovered; resumes on mouse leave when interaction resume is enabled. */
  stopOnMouseEnter?: boolean;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Stable Embla autoplay plugin — industry-standard behavior:
 * - Auto-rotates on load
 * - Pauses on hover/focus, resumes after
 * - Resumes after swipe/tap (does not permanently stop)
 * - Pauses when the browser tab is hidden
 * - Disabled when the user prefers reduced motion
 */
export function useEmblaAutoplayPlugin({
  delayMs = 5000,
  stopOnMouseEnter = true,
}: EmblaAutoplayOptions = {}) {
  const reducedMotion = prefersReducedMotion();

  return useMemo(
    () =>
      Autoplay({
        delay: delayMs,
        active: !reducedMotion,
        playOnInit: true,
        stopOnInteraction: false,
        stopOnMouseEnter,
        stopOnFocusIn: true,
      }),
    [delayMs, reducedMotion, stopOnMouseEnter],
  );
}
