'use client';

import { useEffect, useRef } from 'react';

/**
 * Custom cursor: a precise dot, and a ring that lags behind it.
 *
 * The lag is the whole point — a ring that tracked the pointer exactly would be
 * indistinguishable from a native cursor. Trailing it by a few frames gives the
 * interface a sense of inertia that matches the camera's.
 *
 * Rendered only for fine pointers, and never a replacement for the real cursor's
 * job: the native cursor stays visible over text so selection and I-beam
 * feedback are preserved.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (!fine) return;

    const d = dot.current;
    const r = ring.current;
    if (!d || !r) return;

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let scale = 1;
    let targetScale = 1;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const onOver = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest?.(
        'a, button, [data-cursor="hover"]'
      );
      targetScale = el ? 2.15 : 1;
    };

    const tick = () => {
      // Dot is immediate; ring eases.
      d.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;

      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      scale += (targetScale - scale) * 0.14;

      r.style.transform = `translate3d(${rx.toFixed(2)}px, ${ry.toFixed(2)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      r.style.opacity = String(0.28 + (scale - 1) * 0.34);

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="cursor-layer pointer-events-none fixed inset-0 z-50" aria-hidden="true">
      <div
        ref={dot}
        className="absolute left-0 top-0 h-1 w-1 rounded-full bg-[color:var(--accent)]"
        style={{ willChange: 'transform' }}
      />
      <div
        ref={ring}
        className="absolute left-0 top-0 h-9 w-9 rounded-full border border-[color:var(--paper)] opacity-30"
        style={{ willChange: 'transform, opacity' }}
      />
    </div>
  );
}
