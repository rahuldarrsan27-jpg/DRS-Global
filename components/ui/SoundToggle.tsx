'use client';

import { useEffect, useState } from 'react';
import { toggleAudio, setAudioChapter, subscribeAudio, disposeAudio } from '@/lib/audio';
import { subscribeChapter } from '@/lib/journeyState';

/**
 * The sound control.
 *
 * Off by default and unmistakably a control rather than an indicator. Ambient
 * audio is a large part of why an immersive site feels finished, and also the
 * fastest way to make someone close the tab — so it is offered, never imposed.
 *
 * The first press doubles as the user gesture browsers require before any
 * AudioContext may make a sound, which is why the context is not built until
 * this is clicked.
 */
export function SoundToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => subscribeAudio(setOn), []);

  // The drone follows the journey whether or not it is currently audible, so
  // switching it on mid-scroll lands on the right tone rather than sliding to it.
  useEffect(() => subscribeChapter((_, i) => setAudioChapter(i)), []);

  useEffect(() => () => disposeAudio(), []);

  return (
    <button
      type="button"
      onClick={() => void toggleAudio()}
      data-cursor="hover"
      aria-pressed={on}
      aria-label={on ? 'Turn ambient sound off' : 'Turn ambient sound on'}
      className="pointer-events-auto fixed bottom-7 left-[6vw] z-40 flex items-center gap-3 py-2"
    >
      <span className="flex h-3 items-end gap-[3px]" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={on ? 'eq-bar' : ''}
            style={{
              display: 'block',
              width: '1px',
              height: '100%',
              background: on ? 'var(--accent)' : 'var(--faint)',
              transformOrigin: 'bottom',
              transform: on ? undefined : `scaleY(${[0.35, 0.6, 0.45, 0.25][i]})`,
              animationDelay: `${i * 0.13}s`,
              transition: 'background 0.5s ease',
            }}
          />
        ))}
      </span>

      <span className="font-mono text-[9px] tracking-[0.28em] text-[color:var(--muted)]">
        {on ? 'SOUND ON' : 'SOUND'}
      </span>
    </button>
  );
}
