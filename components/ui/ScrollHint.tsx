'use client';

import { useEffect, useRef } from 'react';
import { journey } from '@/lib/journeyState';

/** Fades out the moment the journey actually begins. */
export function ScrollHint() {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (el.current) {
        const o = Math.max(0, 1 - journey.t / 0.016);
        el.current.style.opacity = o.toFixed(3);
        el.current.style.visibility = o > 0.01 ? 'visible' : 'hidden';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={el}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-8 z-20 flex flex-col items-center gap-3 transition-none"
    >
      <span className="font-mono text-[9px] tracking-[0.34em] text-[color:var(--faint)]">
        SCROLL
      </span>
      <span className="relative block h-9 w-px overflow-hidden bg-[color:var(--hairline)]">
        <span className="trickle absolute inset-x-0 top-0 h-3 bg-[color:var(--accent)]" />
      </span>
    </div>
  );
}
