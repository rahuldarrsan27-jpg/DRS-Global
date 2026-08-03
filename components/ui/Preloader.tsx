'use client';

import { useEffect, useRef, useState } from 'react';
import { journey } from '@/lib/journeyState';

/**
 * Embers thrown from the leading edge. Fixed, hand-picked values rather than
 * random ones so the pattern is identical on every load — a masthead animation
 * that reshuffles itself looks accidental.
 */
const EMBERS = [
  { left: '-1px', size: '2px', delay: '0s', drift: '5px' },
  { left: '-3px', size: '1.5px', delay: '0.42s', drift: '-4px' },
  { left: '1px', size: '2.5px', delay: '0.83s', drift: '7px' },
  { left: '-2px', size: '1.5px', delay: '1.21s', drift: '-2px' },
  { left: '0px', size: '2px', delay: '1.58s', drift: '3px' },
] as const;

/**
 * The threshold.
 *
 * This does real work, not theatre: it holds the first frame while fonts settle
 * and the GPU compiles the scene's shaders. Dropping a visitor straight into an
 * uncompiled WebGL scene produces a visible stall on the very first scroll —
 * the worst possible moment for it.
 *
 * It resolves on whichever comes last: window load, or a minimum beat so the
 * count never flickers past too fast to read. It also self-releases on a timeout
 * so a stalled asset can never trap anyone behind a black screen.
 */
export function Preloader() {
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const MIN_MS = 1400;
    const MAX_MS = 6000;
    const t0 = performance.now();
    let loaded = document.readyState === 'complete';
    let raf = 0;
    let released = false;

    const onLoad = () => {
      loaded = true;
    };
    window.addEventListener('load', onLoad);

    const release = () => {
      if (released) return;
      released = true;
      setPct(100);
      setLeaving(true);
      journey.ready = true;
      // Match the CSS transition before removing from the tree.
      window.setTimeout(() => setGone(true), 900);
    };

    const tick = () => {
      const elapsed = performance.now() - t0;

      // Progress eases toward 100 but only *reaches* it on release, so the
      // number never sits at 100 while the visitor waits.
      const timeShare = Math.min(elapsed / MIN_MS, 1);
      const target = loaded ? 100 : 92;
      setPct((p) => Math.min(target, p + (target * timeShare - p) * 0.14 + 0.4));

      if ((loaded && elapsed > MIN_MS) || elapsed > MAX_MS) {
        release();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('load', onLoad);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink transition-opacity duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ opacity: leaving ? 0 : 1, pointerEvents: leaving ? 'none' : 'auto' }}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center">
        <span className="font-display text-[13px] tracking-[0.44em] text-[color:var(--paper)]">
          DRS
        </span>
        <span className="mt-2 font-mono text-[9px] tracking-[0.34em] text-[color:var(--faint)]">
          GLOBAL
        </span>

        {/*
          The progress is a seam of metal being worked: cooling dark at the tail,
          white-hot at the leading edge, throwing embers as it advances. Overflow
          is deliberately NOT clipped so the glow and embers can spill past the
          track — a bar that contains its own light reads as a widget, not heat.
        */}
        <div className="relative mt-10 h-[2px] w-[min(280px,52vw)] rounded-full bg-white/[0.07]">
          <div
            className="molten-fill absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${pct}%` }}
          />

          <div
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: `${pct}%` }}
          >
            <span className="molten-tip block h-[3px] w-[3px] -translate-x-1/2 rounded-full" />

            {EMBERS.map((e, i) => (
              <span
                key={i}
                className="ember"
                style={
                  {
                    left: e.left,
                    bottom: 0,
                    width: e.size,
                    height: e.size,
                    opacity: 0,
                    animationDelay: e.delay,
                    '--ember-x': e.drift,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </div>

        <span
          className="mt-6 font-mono text-[11px] tracking-[0.24em] tabular-nums"
          style={{
            color: '#ffcf9a',
            textShadow: '0 0 14px rgba(255,120,35,0.45)',
          }}
        >
          {String(Math.floor(pct)).padStart(3, '0')}
        </span>
      </div>
    </div>
  );
}
