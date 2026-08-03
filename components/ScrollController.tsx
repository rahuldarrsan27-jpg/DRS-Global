'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import {
  journey,
  commitJourney,
  emitProgress,
  detectTier,
  registerScroller,
} from '@/lib/journeyState';
import { clamp } from '@/lib/journey';

/**
 * Owns scroll. Lenis smooths the input; a second-order damp on top gives the
 * camera mass, so a violent flick of the wheel reads as a heavy dolly catching
 * up rather than a teleport. That damping is the difference between "scroll-
 * jacked website" and "camera move".
 */
export function ScrollController() {
  useEffect(() => {
    journey.tier = detectTier();

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    journey.reducedMotion = motionQuery.matches;
    const onMotionChange = () => {
      journey.reducedMotion = motionQuery.matches;
    };
    motionQuery.addEventListener('change', onMotionChange);

    const lenis = new Lenis({
      duration: 1.15,
      easing: (x: number) => 1 - Math.pow(1 - x, 3),
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
      syncTouch: false,
    });

    // Hand the engine to anything that needs to move the page.
    registerScroller({
      scrollTo: (target, opts) =>
        lenis.scrollTo(target, { duration: opts?.duration ?? 2.4 }),
    });

    let smoothed = 0;
    let lastRaw = 0;
    let rafId = 0;
    let lastTime = performance.now();

    const frame = (time: number) => {
      lenis.raf(time);

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const raw = max > 0 ? clamp(window.scrollY / max) : 0;

      // Critically-damped-ish follow. Reduced motion goes 1:1 — no lag, no float.
      const stiffness = journey.reducedMotion ? 1 : 1 - Math.pow(0.0016, dt);
      smoothed += (raw - smoothed) * stiffness;

      const velocity = clamp((raw - lastRaw) / Math.max(dt, 0.0001) / 1.4, -1, 1);
      lastRaw = raw;

      commitJourney(smoothed, raw, velocity);
      emitProgress(smoothed);

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      motionQuery.removeEventListener('change', onMotionChange);
      registerScroller(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
