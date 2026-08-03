'use client';

import { useEffect, useState } from 'react';
import { BRAND } from '@/lib/content';
import { CHAPTERS } from '@/lib/journey';
import { subscribeChapter, scrollToChapter } from '@/lib/journeyState';

/**
 * Persistent chrome. Deliberately almost nothing: a wordmark, the division you
 * are currently inside, and one way to make contact.
 *
 * The division indicator is the only element that changes, and it changes ten
 * times across the entire experience — so it subscribes to discrete chapter
 * events rather than to scroll position.
 */
export function Nav() {
  const [chapter, setChapter] = useState(CHAPTERS[0]);

  useEffect(() => subscribeChapter((c) => setChapter(c)), []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between px-[6vw] py-7">
      {/* The chrome sits over unpredictable footage — a sunrise sky will erase
          white type entirely without this. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32"
        style={{
          background:
            'linear-gradient(to bottom, rgba(5,6,10,0.72) 0%, rgba(5,6,10,0.34) 45%, rgba(5,6,10,0) 100%)',
        }}
      />
      <button
        type="button"
        onClick={() => scrollToChapter(0)}
        data-cursor="hover"
        className="pointer-events-auto text-left"
        aria-label={`${BRAND.name} — return to the beginning`}
      >
        <span className="block font-display text-[15px] font-medium tracking-[0.34em] text-[color:var(--paper)]">
          DRS
        </span>
        <span className="mt-1 block font-mono text-[9px] tracking-[0.3em] text-[color:var(--faint)]">
          GLOBAL
        </span>

        {/* On a phone the division indicator cannot share the top row with
            CONTACT, and the progress rail is desktop-only — so without this a
            visitor has no idea where they are in a fifteen-screen scroll. */}
        <span
          className="mt-3 block font-mono text-[9px] tracking-[0.24em] text-[color:var(--muted)] sm:hidden"
          aria-live="polite"
        >
          <span className="text-[color:var(--accent)]">{chapter.numeral}</span>
          <span className="mx-1.5 text-[color:var(--faint)]">/</span>
          {chapter.label.toUpperCase()}
        </span>
      </button>

      <div className="flex items-start gap-8">
        <p
          className="hidden text-right font-mono text-[10px] tracking-[0.26em] text-[color:var(--muted)] sm:block"
          aria-live="polite"
        >
          <span className="text-[color:var(--accent)]">{chapter.numeral}</span>
          <span className="mx-2 text-[color:var(--faint)]">/</span>
          {chapter.label.toUpperCase()}
        </p>

        <a
          href="#contact"
          data-cursor="hover"
          onClick={(e) => {
            e.preventDefault();
            scrollToChapter(CHAPTERS.length - 1);
          }}
          className="pointer-events-auto font-mono text-[10px] tracking-[0.26em] text-[color:var(--paper)] underline-offset-8 hover:underline"
        >
          CONTACT
        </a>
      </div>
    </header>
  );
}
