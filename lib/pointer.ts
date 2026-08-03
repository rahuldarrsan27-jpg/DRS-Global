'use client';

/**
 * Smoothed pointer position, normalised to -1..1 from the centre of the screen.
 *
 * This is the cheapest dimensionality the site can buy. A cinematic plate is a
 * flat rectangle; moving it fractionally against the typography as the visitor
 * moves the mouse separates the two into planes, and the frame stops reading as
 * a video playing behind text and starts reading as a space with depth in it.
 *
 * Like the journey position, this lives outside React and is written by a single
 * loop — the one already running in ScrollController — so nothing re-renders and
 * there is no second rAF competing with it.
 *
 * Disabled outright for coarse pointers (there is no hover to track) and under
 * prefers-reduced-motion.
 */
export const pointer = {
  /** Smoothed, -1..1. What consumers should read. */
  x: 0,
  y: 0,
  /** Raw target, -1..1. */
  tx: 0,
  ty: 0,
  enabled: false,
};

export const initPointer = () => {
  if (typeof window === 'undefined') return () => {};

  const fine = window.matchMedia('(pointer: fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  pointer.enabled = fine && !reduced;

  if (!pointer.enabled) return () => {};

  const onMove = (e: PointerEvent) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };

  // Recentre when the cursor leaves, so the composition settles rather than
  // staying stuck at whatever offset it held when the pointer left the window.
  const onLeave = () => {
    pointer.tx = 0;
    pointer.ty = 0;
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);

  return () => {
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    pointer.enabled = false;
  };
};

/** Called once per frame by the scroll controller. */
export const advancePointer = (dt: number) => {
  if (!pointer.enabled) return;
  // Heavy damping. A rigid follow feels twitchy and cheap; lag gives the planes
  // apparent mass, matching the camera's own inertia.
  const k = 1 - Math.pow(0.0025, dt);
  pointer.x += (pointer.tx - pointer.x) * k;
  pointer.y += (pointer.ty - pointer.y) * k;
};
