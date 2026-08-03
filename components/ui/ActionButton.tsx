'use client';

import type { ReactNode } from 'react';

/**
 * The primary controls.
 *
 * Replaces an earlier magnetic button that physically leaned toward the cursor.
 * That effect fought the page: it displaced controls out from under the pointer,
 * made neighbours collide, and on a slow frame read as a glitch rather than as
 * polish. A control that moves away from you is a worse control, however
 * impressive the physics.
 *
 * What is here instead is quieter and holds up: a fill that wipes across from
 * the left on an expressive-decelerate curve, and an arrow that steps forward.
 * Nothing moves that the visitor is trying to click.
 */
export function ActionButton({
  href,
  primary = false,
  children,
}: {
  href: string;
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      data-cursor="hover"
      className={[
        'group relative inline-flex items-center gap-3 overflow-hidden rounded-full',
        'px-8 py-4 font-mono text-[11px] uppercase tracking-[0.2em]',
        'transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
        primary
          ? 'bg-[color:var(--accent)] text-ink'
          : 'border border-[color:var(--hairline)] text-[color:var(--paper)] hover:border-[color:var(--accent)]',
      ].join(' ')}
    >
      {/* Wipe. Scaled from the left edge so it reads as a sweep, not a fade. */}
      {!primary && (
        <span
          aria-hidden="true"
          className="absolute inset-0 origin-left scale-x-0 bg-[color:var(--accent)] transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
        />
      )}

      <span
        className={[
          'relative z-10 transition-colors duration-500',
          primary ? '' : 'group-hover:text-ink',
        ].join(' ')}
      >
        {children}
      </span>

      <span
        aria-hidden="true"
        className={[
          'relative z-10 -mr-1 translate-x-0 text-[13px] leading-none transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1',
          primary ? '' : 'group-hover:text-ink',
        ].join(' ')}
      >
        →
      </span>
    </a>
  );
}
