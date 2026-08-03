'use client';

/**
 * Gesture-unlocked playback.
 *
 * Some refusals cannot be fixed by getting the markup right. iOS in Low Power
 * Mode blocks video autoplay outright — muted, inline, everything — and no
 * attribute combination changes that. What it does still permit is playback
 * started from a user gesture.
 *
 * So every touch, click and key press becomes a chance to start the plate that
 * should be running. play() is called synchronously inside the handler, because
 * the permission is tied to the gesture: deferring it to the next animation
 * frame loses the activation and the call is refused again.
 *
 * On a scroll-driven site this is close to free — the visitor cannot reach the
 * second division without touching the screen.
 */

const wanted = new Set<HTMLVideoElement>();
let listening = false;

/** The tick marks which element should currently be playing. */
export const setWantsPlayback = (el: HTMLVideoElement, on: boolean) => {
  if (on) wanted.add(el);
  else wanted.delete(el);
};

export const forgetPlayback = (el: HTMLVideoElement) => {
  wanted.delete(el);
};

const onGesture = () => {
  wanted.forEach((el) => {
    if (el.paused) {
      /*
        Re-asserted here rather than trusted from JSX. React applies `muted` as a
        DOM property and it does not always survive to the element as an
        attribute — a video iOS considers unmuted is refused outright, which
        presents exactly as "the poster shows and nothing ever plays".
      */
      el.muted = true;
      void el.play().catch(() => {
        /* still refused — the poster keeps the correct frame on screen */
      });
    }
  });
};

export const initPlaybackUnlock = () => {
  if (listening || typeof window === 'undefined') return () => {};
  listening = true;

  const opts = { passive: true } as const;
  window.addEventListener('pointerdown', onGesture, opts);
  window.addEventListener('touchstart', onGesture, opts);
  window.addEventListener('touchend', onGesture, opts);
  window.addEventListener('keydown', onGesture);
  // Not a gesture in the permission sense, but a cheap extra attempt on the
  // devices where a scroll does follow a real touch.
  window.addEventListener('scroll', onGesture, opts);

  return () => {
    window.removeEventListener('pointerdown', onGesture);
    window.removeEventListener('touchstart', onGesture);
    window.removeEventListener('touchend', onGesture);
    window.removeEventListener('keydown', onGesture);
    window.removeEventListener('scroll', onGesture);
    listening = false;
  };
};
