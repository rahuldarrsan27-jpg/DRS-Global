'use client';

import { useEffect, useRef } from 'react';
import { CHAPTERS, clamp, smoothstep } from '@/lib/journey';
import { journey } from '@/lib/journeyState';
import { COPY, BRAND, CTA, CONTACT, ABOUT } from '@/lib/content';
import { ActionButton } from './ActionButton';
import { RevealLines } from './RevealLines';

/**
 * Scroll-synced typography.
 *
 * Text is real DOM, not 3D — crisp at every DPR, selectable, indexable, and
 * readable by assistive technology. It is driven from the same journey position
 * as the camera, so a headline resolves exactly as its plate composes.
 *
 * Every per-frame write here is `opacity` and `transform` only. Both are
 * compositor properties, so the entire overlay animates without a single layout
 * or paint on the main thread while the GPU is busy with the world.
 *
 * Panels are keyed to an explicit journey RANGE rather than to a chapter, which
 * is what lets the closing chapter play as three sequential beats inside its own
 * span instead of one overloaded frame.
 */

interface PanelRange {
  start: number;
  end: number;
  /** Full strength from the very first frame — the opening has no scroll to ramp from. */
  holdIn?: boolean;
  /** Never exits — the ending must survive the visitor reaching the bottom. */
  holdOut?: boolean;
}

interface PanelState {
  el: HTMLDivElement;
  range: PanelRange;
}

const panelPose = (p: number, reveal: number, range: PanelRange) => {
  const enter = range.holdIn ? reveal : smoothstep(0.0, 0.2, p);
  const exit = range.holdOut ? 1 : 1 - smoothstep(0.74, 0.97, p);
  const opacity = clamp(enter * exit);
  // Content rises through the frame: below on entry, above on exit.
  const y = (1 - enter) * 46 - (1 - exit) * 46;
  return { opacity, y };
};

// --- the closing chapter, divided into beats ---------------------------------
const FINAL = CHAPTERS[CHAPTERS.length - 1];
const FINAL_SPAN = FINAL.end - FINAL.start;
const beat = (a: number, b: number, holdOut = false): PanelRange => ({
  start: FINAL.start + FINAL_SPAN * a,
  end: FINAL.start + FINAL_SPAN * b,
  holdOut,
});

const BEAT_CLOSE = beat(0, 0.36);
const BEAT_ABOUT = beat(0.32, 0.68);
const BEAT_CONTACT = beat(0.64, 1, true);

export function Overlay() {
  const panels = useRef<PanelState[]>([]);
  const seen = useRef(new Set<string>());

  const register = (key: string, range: PanelRange) => (el: HTMLDivElement | null) => {
    if (!el) return;
    if (seen.current.has(key)) {
      const existing = panels.current.find((p) => p.el.dataset.key === key);
      if (existing) existing.el = el;
      return;
    }
    seen.current.add(key);
    el.dataset.key = key;
    panels.current.push({ el, range });
  };

  useEffect(() => {
    let raf = 0;
    let lastAccent = '';
    let readyAt: number | null = null;

    const tick = () => {
      const t = journey.t;

      // The hero fades up once the preloader hands off, not on scroll.
      if (journey.ready && readyAt === null) readyAt = performance.now();
      const reveal = readyAt === null ? 0 : clamp((performance.now() - readyAt) / 1200);

      for (const { el, range } of panels.current) {
        const p = clamp((t - range.start) / (range.end - range.start));
        const inRange = t > range.start - 0.05 && t < range.end + 0.05;
        const { opacity, y } = inRange
          ? panelPose(p, reveal, range)
          : { opacity: 0, y: 46 };

        const visible = opacity > 0.015;
        el.style.opacity = opacity.toFixed(3);
        el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;

        // Hidden panels leave the accessibility tree and stop catching clicks.
        if (visible !== (el.dataset.visible === 'true')) {
          el.dataset.visible = String(visible);
          el.style.visibility = visible ? 'visible' : 'hidden';
          el.setAttribute('aria-hidden', String(!visible));
        }
      }

      // The interface accent tracks the world's key light.
      let accent = CHAPTERS[0].light;
      for (const c of CHAPTERS) {
        if (t >= c.start && t < c.end) {
          accent = c.light;
          break;
        }
      }
      if (accent !== lastAccent) {
        lastAccent = accent;
        document.documentElement.style.setProperty('--accent', accent);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 select-none">
      {/* ---------------------------------------------------------------- I */}
      <Panel
        panelRef={register('forge', { ...CHAPTERS[0], holdIn: true })}
        className="items-center justify-center text-center"
      >
        {/* Heavily tracked uppercase at 45 characters cannot fit a 375px screen
            at any usable size — it orphans "SOLUTIONS" onto its own line. The
            phone gets the short form rather than a bad line break. */}
        <p className="eyebrow reveal-item mb-7">
          <span className="sm:hidden">Multi-Sector Engineering</span>
          <span className="hidden sm:inline">{COPY.forge.eyebrow}</span>
        </p>

        <RevealLines as="h1" text={BRAND.name} className="display mb-8" delay={120} />

        <div
          className="hairline reveal-item mb-8 w-[min(560px,70vw)]"
          style={{ transitionDelay: '420ms' }}
        />

        {/* Three phrases: stacked on a phone, one dotted line on a wider screen.
            Left to wrap naturally it broke between "CONNECTING" and "MARKETS",
            splitting a phrase across lines. */}
        <p
          className="reveal-item flex flex-col items-center gap-1.5 font-mono text-[clamp(10px,0.9vw,13px)] uppercase tracking-[0.22em] text-[color:var(--muted)] sm:block sm:gap-0"
          style={{ transitionDelay: '540ms' }}
        >
          <span>Engineering Industries</span>
          <span className="mx-3 hidden text-[color:var(--accent)] sm:inline">·</span>
          <span>Connecting Markets</span>
          <span className="mx-3 hidden text-[color:var(--accent)] sm:inline">·</span>
          <span>Enabling Growth</span>
        </p>
      </Panel>

      {/* --------------------------------------------------------------- II */}
      <Panel
        panelRef={register('descent', CHAPTERS[1])}
        className="items-center justify-center text-center"
      >
        <p className="eyebrow reveal-item mb-6">{COPY.descent.eyebrow}</p>
        <RevealLines as="h2" text={COPY.descent.title ?? ''} className="display-sm" delay={100} />
      </Panel>

      {/* -------------------------------------------------------------- III */}
      <Panel
        panelRef={register('blueprint', CHAPTERS[2])}
        scrim="bottom"
        className="items-start justify-end pb-[14vh]"
      >
        <div className="max-w-[min(760px,88vw)]">
          <p className="eyebrow reveal-item mb-6">{COPY.blueprint.eyebrow}</p>
          <RevealLines
            as="h2"
            text={COPY.blueprint.title ?? ''}
            className="display-sm mb-7"
            delay={100}
          />
          <p className="lede reveal-item" style={{ transitionDelay: '300ms' }}>
            {COPY.blueprint.body}
          </p>
        </div>
      </Panel>

      {/* ----------------------------------------------------- IV … IX ---- */}
      {(['digital', 'industrial', 'construction', 'logistics', 'energy', 'engineering'] as const).map(
        (id) => {
          const chapter = CHAPTERS.find((c) => c.id === id)!;
          const copy = COPY[id];
          return (
            <Panel
              key={id}
              panelRef={register(id, chapter)}
              scrim="bottom"
              className="items-start justify-end pb-[12vh]"
            >
              <div className="grid w-full grid-cols-1 items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                <div>
                  <div className="mb-6 flex items-baseline gap-4">
                    <span className="numeral">{chapter.numeral}</span>
                    <p className="eyebrow">{copy.eyebrow}</p>
                  </div>
                  <RevealLines as="h2" text={copy.title ?? ''} className="display mb-7" />
                  <p className="lede reveal-item" style={{ transitionDelay: '260ms' }}>
                    {copy.body}
                  </p>
                </div>

                {copy.services && (
                  <ul className="grid grid-cols-2 gap-x-8 sm:grid-cols-2">
                    {copy.services.map((s, i) => (
                      <li
                        key={s}
                        className="service-item reveal-item"
                        // Cascade down the list. Capped so a thirteen-item
                        // division does not still be arriving after the visitor
                        // has scrolled past it.
                        style={{ transitionDelay: `${360 + Math.min(i, 12) * 42}ms` }}
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>
          );
        }
      )}

      {/* ------------------------------------------------- X · beat 1 ----- */}
      <Panel
        panelRef={register('close', BEAT_CLOSE)}
        className="items-center justify-center text-center"
      >
        <p className="eyebrow reveal-item mb-7">{COPY.ascent.eyebrow}</p>
        <RevealLines as="h2" text={COPY.ascent.title ?? ''} className="display mb-8" delay={120} />
        <div
          className="hairline reveal-item mb-8 w-[min(560px,70vw)]"
          style={{ transitionDelay: '440ms' }}
        />
        <p className="lede reveal-item mx-auto text-center" style={{ transitionDelay: '560ms' }}>
          {COPY.ascent.body}
        </p>
      </Panel>

      {/* ------------------------------------------------- X · beat 2 ----- */}
      <Panel
        panelRef={register('about', BEAT_ABOUT)}
        scrim="bottom"
        className="items-start justify-end pb-[12vh]"
      >
        {/* Editorial split: the statement on the left, the substance on the
            right, so neither column runs to an unreadable measure. */}
        <div className="grid w-full grid-cols-1 items-end gap-x-14 gap-y-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="eyebrow reveal-item mb-6">{ABOUT.eyebrow}</p>
            <RevealLines as="h2" text={ABOUT.title} className="display-sm" delay={100} />
          </div>

          <div>
            <p className="lede reveal-item mb-4 max-w-none" style={{ transitionDelay: '320ms' }}>
              {ABOUT.body}
            </p>
            <p className="lede reveal-item max-w-none" style={{ transitionDelay: '440ms' }}>
              {ABOUT.body2}
            </p>
          </div>
        </div>
      </Panel>

      {/* ------------------------------------------------- X · beat 3 ----- */}
      <Panel
        panelRef={register('contact', BEAT_CONTACT)}
        scrim="bottom"
        /* Tightest panel in the film — the only one at risk of meeting the nav
           on a short phone, so its rhythm compresses below sm. */
        className="items-start justify-end pb-[8vh] sm:pb-[12vh]"
      >
        <div className="w-full">
          <div className="mb-5 flex items-baseline gap-4 sm:mb-6">
            <span className="numeral">{FINAL.numeral}</span>
            <p className="eyebrow">{CTA.prompt}</p>
          </div>

          <div className="grid grid-cols-1 items-end gap-x-14 gap-y-7 sm:gap-y-10 lg:grid-cols-[1.1fr_0.9fr]">
            {/* The ask */}
            <div>
              <RevealLines
                as="h2"
                text={CTA.headline}
                className="display-sm mb-4 sm:mb-6"
                delay={100}
              />
              <p className="lede reveal-item mb-6 sm:mb-9" style={{ transitionDelay: '300ms' }}>
                {CTA.intro}
              </p>
              <div
                className="reveal-item pointer-events-auto flex flex-wrap items-center gap-3"
                style={{ transitionDelay: '440ms' }}
              >
                {CTA.actions.map((a) => (
                  <ActionButton key={a.label} href={a.href} primary={a.primary}>
                    {a.label}
                  </ActionButton>
                ))}
              </div>
            </div>

            {/*
              The details, spelled out. A visitor on a desktop with no mail
              client still has to be able to read and copy an address, and a
              phone number belongs on the page rather than hidden inside a
              button labelled "call".
            */}
            <div className="pointer-events-auto grid grid-cols-2 gap-x-8 gap-y-5 sm:gap-y-7">
              <div>
                <p className="contact-label">Email</p>
                <a href={`mailto:${CONTACT.email}`} data-cursor="hover" className="contact-value">
                  {CONTACT.email}
                </a>
              </div>
              <div>
                <p className="contact-label">Domain</p>
                <a
                  href={CONTACT.domainHref}
                  data-cursor="hover"
                  className="contact-value"
                  rel="noopener"
                >
                  {CONTACT.domain}
                </a>
              </div>
              {CONTACT.founders.map((f) => (
                <div key={f.name}>
                  <p className="contact-label">{f.name}</p>
                  <a href={`tel:${f.tel}`} data-cursor="hover" className="contact-value">
                    {f.display}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/**
 * Scrims.
 *
 * With a cinematic plate under every chapter, white type can land on a bright
 * patch of footage and lose contrast — the plates are generated, so their
 * luminance in any given region is not something the design can rely on.
 *
 * A soft gradient shaped to where the text actually sits guarantees legibility
 * without reading as a box: it is how titles have always been laid over film.
 * Tuned to stay invisible on a dark frame and only do work on a bright one.
 */
const SCRIMS = {
  center:
    'radial-gradient(ellipse 72% 58% at 50% 50%, rgba(5,6,10,0.66) 0%, rgba(5,6,10,0.34) 52%, rgba(5,6,10,0) 78%)',
  /*
    Reaches high enough for a tall panel.

    An earlier, shallower ramp was tuned against short two-line headlines and
    left anything taller — the closing beat especially — sitting in the weak
    part of the gradient, white on a bright cloud deck. The plates run at full
    opacity and their luminance is not predictable, so the scrim has to cover
    the whole area type can occupy, not just the last few lines.
  */
  bottom:
    'linear-gradient(to top, rgba(5,6,10,0.93) 0%, rgba(5,6,10,0.8) 28%, rgba(5,6,10,0.5) 58%, rgba(5,6,10,0.16) 82%, rgba(5,6,10,0) 100%)',
} as const;

/**
 * `ref` is deliberately NOT the prop name here.
 *
 * React treats `ref` specially, so passing a callback under that name to a
 * component does not reliably arrive as an ordinary prop — the registration
 * silently never runs and every panel stays frozen at its initial style. Naming
 * it `panelRef` makes it an unambiguous plain prop.
 */
const Panel = ({
  panelRef,
  className = '',
  scrim = 'center',
  children,
}: {
  panelRef: (el: HTMLDivElement | null) => void;
  className?: string;
  scrim?: keyof typeof SCRIMS;
  children: React.ReactNode;
}) => (
  <div
    ref={panelRef}
    aria-hidden="true"
    data-visible="false"
    style={{ opacity: 0, visibility: 'hidden', willChange: 'opacity, transform' }}
    className={`absolute inset-0 flex flex-col px-[6vw] ${className}`}
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
      style={{ background: SCRIMS[scrim] }}
    />
    {children}
  </div>
);
