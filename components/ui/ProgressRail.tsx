'use client';

import { useEffect, useRef, useState } from 'react';
import { CHAPTERS } from '@/lib/journey';
import {
  subscribeProgress,
  subscribeChapter,
  scrollToChapter,
} from '@/lib/journeyState';

/**
 * The film strip.
 *
 * Ten marks, one per chapter, with a fill that tracks journey position. It is
 * also the primary navigation: a visitor who does not want to travel the whole
 * world can jump to a division directly.
 *
 * The fill is written straight to style from a throttled progress subscription;
 * only the active-chapter highlight goes through React.
 */
export function ProgressRail() {
  const fill = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const offProgress = subscribeProgress((t) => {
      if (fill.current) fill.current.style.transform = `scaleY(${t.toFixed(4)})`;
    });
    const offChapter = subscribeChapter((_, i) => setActive(i));
    return () => {
      offProgress();
      offChapter();
    };
  }, []);

  return (
    <nav
      aria-label="Journey"
      className="pointer-events-none fixed right-[max(1.6vw,14px)] top-1/2 z-30 hidden -translate-y-1/2 md:block"
    >
      <div className="relative flex flex-col items-end gap-0">
        {/* Track */}
        <div className="absolute right-[3px] top-0 h-full w-px bg-[color:var(--hairline)]" />
        {/* Fill */}
        <div
          ref={fill}
          className="absolute right-[3px] top-0 h-full w-px origin-top bg-[color:var(--accent)]"
          style={{ transform: 'scaleY(0)', willChange: 'transform' }}
        />

        {CHAPTERS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => scrollToChapter(i)}
            data-cursor="hover"
            aria-current={i === active ? 'true' : undefined}
            className="pointer-events-auto group flex items-center gap-3 py-[9px] pl-4"
          >
            <span
              className={[
                'whitespace-nowrap font-mono text-[9px] tracking-[0.22em] transition-all duration-500',
                i === active
                  ? 'text-[color:var(--paper)] opacity-100'
                  : 'text-[color:var(--faint)] opacity-0 group-hover:opacity-100',
              ].join(' ')}
            >
              {c.label.toUpperCase()}
            </span>
            <span
              className={[
                'block h-px transition-all duration-500',
                i === active
                  ? 'w-4 bg-[color:var(--accent)]'
                  : 'w-2 bg-[color:var(--faint)] group-hover:w-3.5 group-hover:bg-[color:var(--paper)]',
              ].join(' ')}
            />
          </button>
        ))}
      </div>
    </nav>
  );
}
