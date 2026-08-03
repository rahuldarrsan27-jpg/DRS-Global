'use client';

/**
 * Photographic finish.
 *
 * Grain and a vignette, applied over the whole frame.
 *
 * This is the cinematic pass that geometry kept failing to provide. Grain sits
 * over footage the way it sits over film — it unifies plates shot at different
 * exposures, hides banding in the dark gradients of the scrims, and reads as
 * texture rather than as objects. The vignette pulls the eye to centre frame.
 *
 * Both are pure CSS. They replace a full-screen WebGL postprocessing pass that,
 * once the particle field was removed, was compositing almost nothing at real
 * per-frame cost.
 *
 * The grain is an inline SVG turbulence — no network request, no image decode —
 * and it is stepped rather than smoothly animated, because real film grain
 * resamples per frame rather than sliding around.
 */

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`;

export function FilmGrain() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[4]" aria-hidden="true">
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 78% 72% at 50% 48%, rgba(5,6,10,0) 42%, rgba(5,6,10,0.28) 74%, rgba(5,6,10,0.62) 100%)',
        }}
      />

      {/*
        Grain, composited plainly.

        An earlier version used `mix-blend-mode: overlay`, which looks marginally
        richer and is disproportionately expensive: a full-screen blended layer
        forces the compositor to flatten the entire stacking context beneath it —
        ten video elements — into a buffer on every repaint. It was slow enough
        to stall screenshot capture on this machine, which is a fair proxy for
        what it does to a mid-range phone.

        Plain alpha over a dark palette is visually near-identical here and costs
        essentially nothing.
      */}
      <div
        className="film-grain absolute inset-[-60px]"
        style={{
          backgroundImage: GRAIN,
          backgroundRepeat: 'repeat',
          opacity: 0.07,
        }}
      />
    </div>
  );
}
