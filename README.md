# DRS GLOBAL

One continuous cinematic journey through a single real-time 3D world.

```bash
npm install && npm run dev
```

---

## The core idea

The site is **not** a sequence of pages, sections, or scenes. It is one camera
move.

Two splines in [`lib/journey.ts`](lib/journey.ts) define everything:

- `pathCurve` — where the camera **is**
- `focusCurve` — where the camera **looks**

Scroll position 0→1 is arc-length position along `pathCurve`. Because both
curves are C1-continuous, **a cut is not representable** — the camera physically
cannot teleport. The "one unbroken shot" requirement is satisfied by
construction rather than by hiding transitions.

Decoupling position from focus is what buys real cinematography: the camera can
dolly backwards away from the forging logo while still holding it in frame, then
let the gaze swing forward into the direction of travel — without ever cutting.

## Architecture

| File | Responsibility |
|---|---|
| `lib/journey.ts` | The two splines, the ten chapters, all easing maths. Single source of truth. |
| `lib/journeyState.ts` | Frame-rate state **outside React**. Hot values are a mutable object read directly in `useFrame`. |
| `lib/content.ts` | Every word of copy, plus the video cue table. |
| `lib/geometry.ts` | Batching helpers — merges hundreds of volumes into one draw call. |
| `lib/rng.ts` | Seeded RNG, so the world is byte-identical on every load. |
| `components/world/*` | One component per chapter. |
| `components/ui/*` | Typography, cursor, nav, progress rail, video layer. |

### Why state lives outside React

The camera reads journey position 60–120 times per second. Routing that through
`useState` would reconcile the tree every frame and stall the main thread while
the GPU is already busy. So the hot value is a plain object, and React is only
notified of genuinely discrete events — chapter changes, which happen ten times
across the entire experience.

### Why the world is one long draw-call budget

Districts hold hundreds to thousands of objects. Every one of them is an
`InstancedMesh` or a single merged `LineSegments`. A district costs 2–5 draw
calls no matter how much is in it.

Districts are gated by **visibility**, never by mounting — rebuilding thousands
of instances mid-scroll would hitch exactly when the visitor is moving fastest.
Memory is spent up front so the journey never stutters.

### Why cross-fades are done with fog

Districts are not blended with material opacity — that would force everything
into the transparent render pass and cost sorting on thousands of instances.
Instead the *atmosphere* does the blending: fog density is tuned so a district is
already buried in haze before its visibility gate cuts it.

One consequence worth knowing: GPU particles carry their **own** distance
falloff, independent of scene fog. Those two have to be tuned against each other
or a district's embers punch through haze that is already hiding its geometry.

## Performance

- Device tier detected once (`getTier`); instance counts, DPR and postprocessing
  all scale from it. A weaker device gets a **sparser** world, never a different
  one.
- Bloom and vignette are dropped entirely on low-tier rather than run cheaply.
- Every per-frame DOM write is `opacity` / `transform` only — compositor
  properties, so the overlay animates without layout or paint.
- Production build is statically prerendered.

## Accessibility

- `prefers-reduced-motion` collapses camera breathing, banking, lens response,
  magnetic buttons and particle motion. The world remains; the movement stops.
- Headlines are real DOM, not 3D text — crisp at any DPR, selectable, indexable.
- Panels leave the accessibility tree and stop catching clicks when not visible.
- A linear `sr-only` capabilities index in `app/page.tsx` gives crawlers and
  screen readers a conventional document, since a scroll-driven canvas is not a
  traversable structure.
- Focus rings are restyled, never removed.

## Video

Optional. **The site is complete and shippable with zero video files present.**

Plates are composited over the live world in `screen` blend — they add light and
atmosphere rather than replacing the frame. See
[`VIDEO-BRIEF.md`](VIDEO-BRIEF.md) for the full shot list, prompts, and install
steps.

To add one: drop the MP4 in `public/video/` and set its `src` in the
`VIDEO_CUES` table in `lib/content.ts`. That is the only edit — lazy loading,
decode scheduling, blend mode and opacity ramping are handled.

## Deploy

Vercel, auto-deploy from `main`. No config file is needed — Next.js is detected
automatically. Every push to `main` ships; every branch gets a preview URL.

First-time setup (the `gh` binary is unpacked in `~/Downloads` but not on PATH):

```bash
~/Downloads/gh_2.96.0_macOS_amd64/bin/gh auth login
```

```bash
~/Downloads/gh_2.96.0_macOS_amd64/bin/gh repo create drs-global --private --source=. --remote=origin --push
```

Then import the repo at **vercel.com/new**. Framework preset: Next.js. No build
settings to change, no environment variables.

### Bandwidth is the thing to watch

`public/video/` is **44 MB**. On Vercel's Hobby tier (100 GB/month) that is
roughly 2,300 full scroll-throughs before the cap — fewer if visitors reload.

Two things already soften this: nothing is fetched until the preloader releases
and an idle frame passes, and each plate loads only as the journey approaches
it, so a visitor who bounces early pulls ~8 MB rather than 44 MB.

If traffic grows, move `public/video/` to an object store with cheap egress
(Cloudflare R2, Bunny) and point the `src` values in `lib/content.ts` at the CDN
URLs. Nothing else has to change — that table is the only place the paths live.

## Copy rules

`lib/content.ts` contains **capability claims only**. No invented statistics,
clients, certifications, awards, project values, years of experience, office
locations or completed-project counts appear anywhere in this project. Keep it
that way.
