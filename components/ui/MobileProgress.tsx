'use client';

import { useEffect, useRef } from 'react';
import { subscribeProgress } from '@/lib/journeyState';

/**
 * Orientation on small screens.
 *
 * The progress rail is desktop-only — ten hover-labelled ticks cannot work on a
 * touch screen — which left phones with no sense of position at all. In a
 * fifteen-screen scroll with no page boundaries, that is genuinely
 * disorienting: there is nothing to tell a visitor whether they are near the
 * start, the middle, or the end.
 *
 * This is the minimum that fixes it: a hairline fill across the top and the
 * current division named beside it. The fill is written straight to style from
 * the throttled progress subscription; only the chapter name goes through React,
 * and that changes ten times in the whole journey.
 */
export function MobileProgress() {
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeProgress((t) => {
    if (fill.current) fill.current.style.transform = `scaleX(${t.toFixed(4)})`;
  }), []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40 h-px bg-[color:var(--hairline)] md:hidden"
      aria-hidden="true"
    >
      <div
        ref={fill}
        className="h-px w-full origin-left bg-[color:var(--accent)]"
        style={{ transform: 'scaleX(0)', willChange: 'transform' }}
      />
    </div>
  );
}
