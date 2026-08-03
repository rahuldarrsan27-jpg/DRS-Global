'use client';

/**
 * Masked per-line reveal.
 *
 * Each line sits in its own overflow-hidden box and rises into it, staggered.
 * The difference from fading a headline in as one block is not subtlety — it is
 * the difference between text appearing and text *arriving*. It gives a headline
 * a reading order and a sense of being set rather than switched on.
 *
 * Driven entirely by CSS off the panel's `data-visible` attribute, which the
 * overlay's rAF loop already maintains. No JavaScript runs per frame for this,
 * and it reverses correctly when the visitor scrolls back up.
 *
 * Descenders are the classic trap here: an overflow-hidden line box at display
 * line-height clips the tails of g, y and p. The inner span carries padding and
 * an equal negative margin so the mask sits below the baseline without moving
 * the type.
 */
export function RevealLines({
  text,
  className = '',
  as: Tag = 'span',
  delay = 0,
  step = 90,
}: {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'p' | 'span';
  /** Milliseconds before the first line moves. */
  delay?: number;
  /** Milliseconds between lines. */
  step?: number;
}) {
  const lines = text.split('\n');
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <span key={i} className="reveal-line">
          <span style={{ transitionDelay: `${delay + i * step}ms` }}>{line}</span>
        </span>
      ))}
    </Tag>
  );
}
