'use client';

import { CHAPTERS, activeChapter, clamp, type Chapter } from './journey';

/**
 * Frame-rate state lives outside React on purpose.
 *
 * The camera reads journey position 60–120 times a second. Routing that through
 * useState would re-render the tree every frame and stall the main thread. So
 * the hot value is a plain mutable object that useFrame reads directly, and
 * React is only notified on genuinely discrete events — chapter changes, which
 * happen ten times across the entire film.
 */

export interface JourneyState {
  /** Smoothed journey position, 0..1. What the camera actually follows. */
  t: number;
  /** Unsmoothed scroll position, 0..1. */
  raw: number;
  /** Signed, normalised scroll velocity. Drives motion-blur and lean. */
  velocity: number;
  /** True once the preloader has handed off. */
  ready: boolean;
  /** Honours prefers-reduced-motion. */
  reducedMotion: boolean;
  /** Device tier, set once on mount. Gates postprocessing and instance counts. */
  tier: 'low' | 'mid' | 'high';
}

export const journey: JourneyState = {
  t: 0,
  raw: 0,
  velocity: 0,
  ready: false,
  reducedMotion: false,
  tier: 'high',
};

// --- discrete chapter subscription ------------------------------------------

type ChapterListener = (c: Chapter, index: number) => void;
const chapterListeners = new Set<ChapterListener>();
let lastChapterId = CHAPTERS[0].id;

export const subscribeChapter = (fn: ChapterListener) => {
  chapterListeners.add(fn);
  // Returns void, not the Set's boolean — this is used directly as a React
  // effect cleanup, which must not return a value.
  return () => {
    chapterListeners.delete(fn);
  };
};

/** Called once per frame by the scroll controller. Cheap when nothing changed. */
export const commitJourney = (t: number, raw: number, velocity: number) => {
  journey.t = t;
  journey.raw = raw;
  journey.velocity = velocity;

  const c = activeChapter(t);
  if (c.id !== lastChapterId) {
    lastChapterId = c.id;
    const i = CHAPTERS.indexOf(c);
    chapterListeners.forEach((fn) => fn(c, i));
  }
};

// --- progress subscription (throttled, for the HUD rail) ---------------------

type ProgressListener = (t: number) => void;
const progressListeners = new Set<ProgressListener>();
let lastEmitted = -1;

export const subscribeProgress = (fn: ProgressListener) => {
  progressListeners.add(fn);
  return () => {
    progressListeners.delete(fn);
  };
};

/**
 * Emits at most ~0.25% granularity so the progress rail updates smoothly
 * without asking React to reconcile on every animation frame.
 */
export const emitProgress = (t: number) => {
  if (Math.abs(t - lastEmitted) < 0.0025) return;
  lastEmitted = t;
  progressListeners.forEach((fn) => fn(t));
};

// --- device capability -------------------------------------------------------

export const detectTier = (): JourneyState['tier'] => {
  if (typeof window === 'undefined') return 'high';

  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.innerWidth < 900;

  if (mem <= 4 || cores <= 4 || (coarse && narrow)) return 'low';
  if (mem <= 8 || cores <= 8 || coarse) return 'mid';
  return 'high';
};

let cachedTier: JourneyState['tier'] | null = null;

/** Memoised tier. Safe to call from render — resolves once, then reads a cache. */
export const getTier = (): JourneyState['tier'] => {
  if (cachedTier) return cachedTier;
  cachedTier = detectTier();
  journey.tier = cachedTier;
  return cachedTier;
};

/**
 * Multiplier applied to every instance count in the world.
 *
 * The composition of each district is designed at 1.0 and thins out
 * proportionally — a weaker device gets a sparser city, never a different one.
 */
export const tierScale = () => {
  const t = getTier();
  return t === 'low' ? 0.4 : t === 'mid' ? 0.7 : 1;
};

/**
 * The smooth-scroll engine, registered by ScrollController.
 *
 * Lenis drives scroll position from its own animation loop, which means a bare
 * `window.scrollTo` gets overwritten on the very next frame — navigation would
 * silently do nothing. Anything that wants to move the page has to go through
 * the engine that owns it.
 */
interface Scroller {
  scrollTo: (target: number, opts?: { duration?: number }) => void;
}

let scroller: Scroller | null = null;

export const registerScroller = (s: Scroller | null) => {
  scroller = s;
};

/** Scroll to a chapter by index — used by the nav and the progress rail. */
export const scrollToChapter = (index: number) => {
  const c = CHAPTERS[Math.min(Math.max(index, 0), CHAPTERS.length - 1)];
  if (!c) return;
  const doc = document.documentElement;
  const total = doc.scrollHeight - window.innerHeight;
  // Aim slightly past the chapter opening so its content is already composed.
  const target = (c.start + (c.end - c.start) * 0.25) * total;

  if (scroller) scroller.scrollTo(target, { duration: 2.4 });
  else window.scrollTo({ top: target, behavior: 'smooth' });
};
