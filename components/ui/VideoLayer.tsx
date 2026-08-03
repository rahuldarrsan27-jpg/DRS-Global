'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { VIDEO_CUES, type VideoCue } from '@/lib/content';
import { clamp, smoothstep } from '@/lib/journey';
import { journey } from '@/lib/journeyState';
import { pointer } from '@/lib/pointer';
import { useIsMobile } from '@/lib/useIsMobile';

/**
 * Cinematic plates composited over the live world.
 *
 * Design rules that keep this from wrecking performance:
 *  - `preload="none"` until the journey approaches the cue, so nothing is
 *    fetched for a plate the visitor may never scroll to
 *  - playback is started and stopped at the range edges — an off-screen video
 *    element that keeps decoding is a silent battery and main-thread cost
 *  - opacity is written straight to style, never through React state, so the
 *    ramp costs nothing per frame
 *  - every element is muted and playsInline; autoplay with sound is blocked by
 *    browsers regardless of what the source contains
 *
 * With no video files present this renders nothing at all and the site is
 * complete without it.
 */
/**
 * Watermark mask.
 *
 * Every generated plate carries a small glyph near the bottom-right of its
 * frame. Because the layer composites in `screen`, a masked-out region
 * contributes nothing at all — zero alpha behaves exactly like black, which is
 * the identity value for that blend. So this removes the glyph without
 * darkening anything or leaving a patch: the live 3D world simply shows through
 * unmodified there.
 *
 * The subtlety is WHERE to put it. The video is `object-fit: cover`, so its
 * intrinsic frame is scaled and cropped differently at every viewport aspect
 * ratio — a mask pinned to element percentages sits over the glyph only on an
 * exactly 16:9 screen, and drifts to cut a visible hole in empty frame
 * everywhere else. So the position is derived from the actual cover mapping and
 * recomputed on resize, keeping it locked to the glyph in *video-frame* space.
 */
const VIDEO_ASPECT = 16 / 9;

/** Glyph centre and mask radii, as fractions of the source frame. */
const GLYPH = { u: 0.908, v: 0.832, ru: 0.055, rv: 0.075 };

const buildMask = (w: number, h: number) => {
  if (w <= 0 || h <= 0) return 'none';

  // Replicate object-fit: cover — the larger scale wins, the excess is cropped.
  const containerAspect = w / h;
  const drawnW = containerAspect > VIDEO_ASPECT ? w : h * VIDEO_ASPECT;
  const drawnH = containerAspect > VIDEO_ASPECT ? w / VIDEO_ASPECT : h;
  const offsetX = (drawnW - w) / 2;
  const offsetY = (drawnH - h) / 2;

  const cx = ((GLYPH.u * drawnW - offsetX) / w) * 100;
  const cy = ((GLYPH.v * drawnH - offsetY) / h) * 100;
  const rx = ((GLYPH.ru * drawnW) / w) * 100;
  const ry = ((GLYPH.rv * drawnH) / h) * 100;

  return `radial-gradient(ellipse ${rx.toFixed(2)}% ${ry.toFixed(2)}% at ${cx.toFixed(2)}% ${cy.toFixed(2)}%, transparent 0%, transparent 55%, black 100%)`;
};

/**
 * Mobile policy.
 *
 * Two separate problems, both of which read to a visitor as "the video is slow
 * and out of sync":
 *
 *  1. Bytes. An 8 MB 720p plate over cellular is a long wait for a background.
 *     A 640-wide variant of every clip lives alongside the originals and is
 *     substituted wholesale — 44 MB of plates becomes 25 MB.
 *
 *  2. Decoders. Mobile browsers cap how many videos can decode at once — iOS
 *     historically at one. Mounting three and playing two guarantees contention:
 *     clips stall, start late, and drift out of step with the scroll. On a phone
 *     only the dominant plate is ever allowed to play; the incoming one holds a
 *     still frame until it takes over. The crossfade survives, the contention
 *     does not.
 */
// Shared with Experience — see lib/useIsMobile.ts

const mobileSrc = (src: string) => src.replace('/video/', '/video/mobile/');

/*
  Poster frame — roughly 30 kB against a 2.7 MB clip.

  It paints the moment the plate is needed, so a slow connection shows the
  right image immediately and the video simply takes over when it arrives,
  instead of holding a black frame for the length of a download.
*/
const posterFor = (src: string) =>
  src.replace('/video/', '/video/poster/').replace(/\.mp4$/, '.jpg');

/** Recomputes the mask whenever the viewport changes shape. */
const useGlyphMask = () => {
  const [mask, setMask] = useState('none');

  useEffect(() => {
    const update = () => setMask(buildMask(window.innerWidth, window.innerHeight));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return mask;
};

interface Window {
  inFrom: number;
  inTo: number;
  outFrom: number;
  outTo: number;
}

/**
 * Complementary crossfade windows.
 *
 * Each plate fades out across exactly the span its successor fades in across,
 * so at any instant the pair sums to roughly one plate's worth of light.
 *
 * The alternative — giving every plate its own symmetric ramp — looks correct in
 * isolation and is wrong in practice: with overlapping ranges, both plates sit
 * at FULL strength through the middle of the overlap and screen-blend on top of
 * each other into a washed-out double exposure. The handoff has to be derived
 * from the neighbours, not from each cue alone.
 *
 * Computed over the cues that actually have a file, so an unfilled slot never
 * opens a hole — and the first available plate holds from the very first frame,
 * since there is no scroll yet to fade it in.
 */
const buildWindows = (cues: VideoCue[]): Map<string, Window> =>
  new Map(
    cues.map((cue, i) => {
      const prev = cues[i - 1];
      const next = cues[i + 1];
      return [
        cue.id,
        {
          inFrom: prev ? cue.start : 0,
          inTo: prev ? Math.min(prev.end, cue.end) : 0,
          outFrom: next ? Math.max(next.start, cue.start) : cue.end,
          outTo: cue.end,
        },
      ];
    })
  );

/**
 * Which plates are mounted right now.
 *
 * Mounting all ten is the obvious approach and it is quietly ruinous: a video
 * element is a composited layer whether or not it is playing, so ten of them at
 * full viewport size means the compositor maintains ten full-screen surfaces for
 * the entire visit. It was heavy enough to stall frame capture on a desktop,
 * which is a fair warning about what it does to a phone.
 *
 * A sliding window of three — previous, current, next — is all a crossfade can
 * ever need. The index only changes nine times across the whole journey, and
 * setting state to an unchanged value does not re-render, so this costs nothing
 * per frame.
 */
const useCueWindow = (cues: VideoCue[]) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const t = journey.t;
      let idx = 0;
      for (let i = 0; i < cues.length; i++) {
        if (t >= cues[i].start) idx = i;
      }
      setIndex((prev) => (prev === idx ? prev : idx));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cues]);

  return index;
};

export function VideoLayer() {
  const mask = useGlyphMask();
  const isMobile = useIsMobile();
  const active = useMemo(() => VIDEO_CUES.filter((c) => c.src), []);
  const windows = useMemo(() => buildWindows(active), [active]);
  const index = useCueWindow(active);

  if (active.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[2] overflow-hidden">
      {active.map((cue, i) => {
        /*
          The previous plate stays mounted, on every device.

          Dropping it to save a decoder was a false economy: unmounting destroys
          the element and everything it had buffered, so scrolling back up meant
          refetching the whole clip from zero — the division you had just watched
          took as long to return as it did the first time.

          A paused element is cheap; it is *playing* two at once that starves a
          mobile decoder, and that is handled separately by the play threshold
          below.
        */
        if (Math.abs(i - index) > 1) return null;
        return (
          <Plate
            key={cue.id}
            cue={cue}
            mask={mask}
            window={windows.get(cue.id)!}
            isMobile={isMobile}
          />
        );
      })}
    </div>
  );
}

/*
  Plates play at their own constant rate.

  Tying playback speed to scroll velocity was tried and removed: it makes the
  footage lurch and stall with every wheel tick, which reads as a stutter rather
  than as responsiveness. Scroll already drives the camera, the crossfades and
  the depth layer — the footage itself is better left to run at its own pace.
*/
function Plate({
  cue,
  mask,
  window: win,
  isMobile,
}: {
  cue: VideoCue;
  mask: string;
  window: Window;
  isMobile: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const loaded = useRef(false);
  const playing = useRef(false);
  const lastPlayAttempt = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;

    /*
      Fetching is gated on the page being past its own load.

      The opening plate sits at journey position zero, so a naive "load when
      near" rule would put a multi-megabyte video in direct contention with the
      first paint — the one moment where bytes cost the most. Waiting for the
      preloader to hand off and then for an idle frame keeps the critical path
      clear. The world is already complete without the plate; it simply joins
      once it is ready.
    */
    let gateOpen = false;
    const openGate = () => {
      gateOpen = true;
    };
    const hasIdle = typeof window.requestIdleCallback === 'function';
    const idleId = hasIdle
      ? window.requestIdleCallback(openGate, { timeout: 2500 })
      : null;
    const timerId = hasIdle ? null : window.setTimeout(openGate, 1200);

    const tick = () => {
      const t = journey.t;

      /*
        Start fetching once we're near the cue — and actually start it.

        Raising `preload` alone is not enough. Mobile Safari largely ignores a
        preload attribute changed after the element has rendered, so the download
        only ever began at play() — which on a phone is gated until the plate is
        already the one being looked at. The fetch therefore started at the exact
        moment the frame was needed, which is why the next division took forever
        to appear.

        load() is safe HERE and nowhere else: this runs once, before playback has
        ever been requested for this element, so there is no in-flight play() for
        it to abort. Calling load() after play() is what previously stranded
        plates frozen on their first frame, hence the explicit guard.
      */
      const near = t > win.inFrom - 0.1 && t < cue.end + 0.1;
      if (near && gateOpen && journey.ready && !loaded.current) {
        loaded.current = true;
        el.preload = 'auto';
        if (!playing.current) el.load();
      }

      // Degenerate windows mean "no fade on this side" — the first plate is
      // already up when the journey starts, the last never hands off.
      const fadeIn = win.inTo > win.inFrom ? smoothstep(win.inFrom, win.inTo, t) : 1;
      const fadeOut =
        win.outTo > win.outFrom ? 1 - smoothstep(win.outFrom, win.outTo, t) : 1;

      const inRange = t >= win.inFrom - 0.001 && t <= cue.end + 0.001;
      const opacity = inRange ? clamp(fadeIn * fadeOut) * cue.peak : 0;

      el.style.opacity = opacity.toFixed(3);

      /*
        Pointer parallax.

        The plate is scaled slightly so there is margin to move into — without
        it, translating the frame exposes the page background at the edges. The
        overlay typography moves the same way but far less, and that difference
        in rate is the whole effect: two planes at different depths rather than
        text sitting on a picture.
      */
      if (pointer.enabled) {
        const px = (-pointer.x * 16).toFixed(2);
        const py = (-pointer.y * 11).toFixed(2);
        el.style.transform = `scale(1.07) translate3d(${px}px, ${py}px, 0)`;
      }

      /*
        Hold playback until the fetch gate has opened, so a plate never starts
        pulling bytes ahead of first paint.

        On a phone the bar is much higher: only the plate currently carrying the
        frame is allowed to decode. Two clips decoding at once on a mobile GPU is
        what makes them start late and drift out of step with the scroll — the
        incoming plate simply holds its last frame through the crossfade and
        starts once it is the one being looked at.
      */
      const threshold = isMobile ? cue.peak * 0.5 : 0.01;
      const shouldPlay = opacity > threshold && loaded.current;

      /*
        Retries are rate-limited.

        A browser can refuse playback for reasons the page cannot fix — iOS Low
        Power Mode blocks autoplay outright, even for muted inline video, and a
        backgrounded document is paused the instant it starts. Without a floor
        between attempts this becomes a hot loop calling play() on every frame
        for the entire visit, which burns battery precisely on the devices least
        able to spare it.

        Backing off to a few attempts a second still recovers within a frame or
        two of conditions changing, and the poster keeps the right image on
        screen in the meantime, so a refusal degrades to a still rather than to
        black.
      */
      const now = performance.now();
      if (shouldPlay && el.paused && now - lastPlayAttempt.current > 260) {
        lastPlayAttempt.current = now;
        playing.current = true;
        void el.play().catch(() => {
          playing.current = false;
        });
      } else if (!shouldPlay && playing.current) {
        playing.current = false;
        el.pause();
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (idleId !== null) window.cancelIdleCallback(idleId);
      if (timerId !== null) window.clearTimeout(timerId);
      el.pause();
      /*
        Clearing the flag is what makes the cleanup survivable.

        `playing` is a ref, so it outlives the effect — but the pause above does
        not. StrictMode's mount/cleanup/remount in development therefore leaves
        the element paused while the flag still claims it is playing, and the
        `!playing.current` guard then blocks play() from ever being re-issued.
        The plate stays frozen on a still frame for the entire visit. The
        element's real state and the flag have to be reset together.
      */
      playing.current = false;
    };
  }, [cue, isMobile]);

  return (
    <video
      ref={ref}
      src={isMobile && cue.src ? mobileSrc(cue.src) : (cue.src ?? undefined)}
      poster={cue.src ? posterFor(cue.src) : undefined}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      className="absolute inset-0 h-full w-full object-cover opacity-0"
      style={{
        mixBlendMode: cue.blend === 'screen' ? 'screen' : 'normal',
        willChange: 'opacity',
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}
