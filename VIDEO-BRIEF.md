# DRS GLOBAL — Google Flow Shot Brief

Everything needed to generate the cinematic plates in Google Flow and drop them
into the site. No code changes required — filenames are already wired.

---

## 1. The strategy (read this first)

**The plates carry the environment.** Ten of them, one per chapter, running at
full strength and crossfading into each other. This is the opposite of the
original plan and it was arrived at the hard way.

The site began as a fully modelled 3D world with video layered over it as faint
atmosphere. That fought itself: modelled shards drifting over filmed shards, a
modelled port behind a filmed port. Two literal descriptions of the same subject
do not add up to depth — they add up to noise. The modelled districts are still
in the codebase, disabled behind `RENDER_DISTRICT_GEOMETRY` in `lib/journey.ts`.

What the real-time layer does now is what footage cannot: scroll-velocity light
streaks, and the camera spline that drives the typography and crossfade timing.
The photographic finish — grain, vignette — is CSS over the whole frame.

**What this means for generating clips:**

- Each plate must stand on its own as a full frame. It is not a light overlay any
  more; it is the shot.
- Camera motion must match the spline tangent at that point in the journey. The
  direction notes on each shot below are derived from the actual control points
  in `lib/journey.ts`, not chosen for variety. A plate drifting against the live
  camera reads as wrong instantly.
- **You do not need to frame-chain between shots.** Adjacent plates are 25–40 %
  of the journey apart and never share a frame; the crossfade handles the seam.
  Chain only when extending a single shot past one generation.

---

## 2. Global settings

| Setting | Value |
|---|---|
| Aspect ratio | **16:9** |
| Resolution | **1080p** |
| Duration | **8 s** per clip |
| Model | **Veo — Quality** tier (not Fast; these are hero plates) |
| Audio | Ignore it. Veo generates audio; the site mutes every video element regardless, because browsers block sound-on autoplay. |

**Always append this to every prompt** (Veo hallucinates garbled signage and
mangled logos otherwise, which is the single most common way AI footage reads as
cheap):

> No text, no letters, no numbers, no signage, no logos, no watermarks, no people, no faces, no hands. No cuts, no edits, no transitions. One continuous take. Slow deliberate camera movement.

---

## 2b. The opening

`forge-plate.mp4` opens the film directly, holding at full strength from the
very first frame.

An earlier plan put a separate fire-sparks clip in front of it, chained by using
forge-plate's own first frame as the sparks clip's end frame. That was dropped —
the forge plate opens strongly enough on its own, and it was the only place in
the whole film where frame-chaining would have mattered. Every other pair of
plates is 25-40 % of the journey apart and never shares a frame.

If it is ever revisited, the extractor is at `scripts/extractframe.swift`:

```bash
swift scripts/extractframe.swift public/video/forge-plate.mp4 ~/Downloads/first-frame.png 0.0
```

---

## 3. The four core plates

Generate these first. They are the whole job.

---

### SHOT 01 — `forge-plate.mp4`
**Lands at** journey 0.00 → 0.075 (the opening, behind the logo)
**Flow tool** Text to Video
**Camera must feel like** a slow *pull backward* — the site's camera is dollying
away from the forging logo at this moment. Backward motion in the plate matches
it. Forward motion will fight it.

```
Extreme close macro in near-total darkness. Molten steel fragments and glowing
orange metal shards drift weightlessly in a black void, slowly rotating.
Incandescent edges cool from white-hot through amber to deep ember red. Fine
industrial dust and drifting sparks catch a single thin shaft of volumetric
light. Camera dollies slowly backward, revealing more fragments converging
toward the centre of frame. Vast negative space, deep black background.
Anamorphic lens, shallow depth of field, single low-angle key light. Shot on
ARRI Alexa, 40mm, fine film grain. Ultra-slow, heavy, deliberate motion.
```

---

### SHOT 02 — `industrial-heat.mp4`
**Lands at** journey 0.385 → 0.46 (Division V, the plant)
**Flow tool** Text to Video
**Camera must feel like** a slow forward push drifting *right* — the spline
travels from x=−14 to x=0 across this stretch.

```
Interior of a vast, dark steel foundry. Cascading orange sparks fall in slow
motion from an unseen overhead pour. Thick smoke and visible heat haze distort
the air. Distant furnace glow rim-lights the silhouettes of heavy gantry
structures and industrial machinery. Camera pushes slowly forward with a gentle
drift to the right. Hard volumetric god rays cut diagonally through the smoke.
Extreme contrast, deep crushed blacks, molten amber highlights, enormous sense
of scale. Shot on ARRI Alexa, 32mm anamorphic, fine film grain.
```

---

### SHOT 03 — `energy-goldenhour.mp4`
**Lands at** journey 0.67 → 0.75 (Division VIII, the array)
**Flow tool** Text to Video
**Camera must feel like** low forward drift, left to right — the spline runs
x=−8 to x=+10 here. This is the one shot where getting direction right really
sells the composite.

```
Golden hour over an endless ground-mounted solar array stretching to a flat
horizon. A low sun flares across the panel glass in long horizontal anamorphic
streaks. Fine dust hangs suspended in the warm still air. Camera drifts slowly
forward and to the right, low to the ground, panel rows passing in strong
parallax. Distant wind turbines rotate almost imperceptibly in the haze. Warm
amber and pale gold palette, soft atmospheric perspective, long shadows. Shot on
ARRI Alexa, 50mm anamorphic, gentle lens flare, fine film grain.
```

---

### SHOT 04 — `ascent-sky.mp4`
**Lands at** journey 0.90 → 1.00 (the final rise — the last thing anyone sees)
**Flow tool** Text to Video
**Camera must feel like** a vertical boom *up*. The site's camera climbs from
y=10 to y=260 across this stretch. Upward motion is non-negotiable here.

```
Boom up vertically through a layered cloud deck at sunrise. Camera rises
continuously, breaking through soft stratus into clear golden light. The sun sits
low on the horizon, casting long warm rays across the tops of the clouds.
Volumetric god rays, gentle atmospheric haze, immense scale and absolute
stillness. Slow, continuous, unbroken upward movement. Shot on ARRI Alexa, 35mm,
cinematic sunrise grade, subtle film grain.
```

---

## 4. The remaining six — full coverage

These complete the set so every chapter of the journey carries a plate. Same
global settings, same mandatory suffix.

**SHOT 05 — `descent-fracture.mp4`** · II · camera plunges straight **down** · x2

```
Falling vertically down a deep molten fracture in dark rock and steel. Camera
plunges straight downward at speed, walls of cracked black stone rushing past on
all sides, veins of glowing orange magma threading through them. Embers and
sparks streak upward past the lens. Heat haze, deep shadow, volumetric glow from
below. Extreme sense of depth and vertical drop. Shot on ARRI Alexa, 24mm, fine
film grain.
```

**SHOT 06 — `blueprint-grid.mp4`** · III · forward, slight rise · x2

```
Travelling forward through an infinite dark void filled with glowing cyan
technical wireframe lines that draw themselves into existence as the camera
passes. Architectural blueprint geometry, precise engineering linework, grid
planes receding into darkness, faint holographic depth. Camera moves steadily
forward and rises very slightly. Pure black background, luminous blue-cyan lines
only, subtle particle drift. Shot on ARRI Alexa, 35mm, fine film grain.
```

**SHOT 07 — `digital-city.mp4`** · IV · forward, rising, drifting **left** · x1

```
Drifting forward and upward through a dark futuristic city of black glass towers
at night, camera gently panning to the left. Cool cyan and deep blue holographic
light, luminous horizontal window bands, faint floating data particles between
the buildings. Wet reflective surfaces, heavy atmospheric haze, deep shadow.
Restrained and cinematic, almost no colour except blue. Shot on ARRI Alexa, 28mm
anamorphic, subtle lens flare, fine film grain.
```

**SHOT 08 — `construction-rise.mp4`** · VI · forward and **climbing** · x1

```
Rising slowly through an active high-rise construction site at late afternoon.
Camera moves forward and climbs. Fine concrete dust and aggregate haze hangs in
low golden sunlight. Exposed steel reinforcement, raw concrete floor slabs, tower
crane silhouettes against a pale sky. Warm grey and dusty ochre palette, long
soft shadows, strong atmospheric depth. Shot on ARRI Alexa, 35mm, fine film
grain.
```

**SHOT 09 — `logistics-port.mp4`** · VII · forward, descending, drifting **left** · x2

```
Cold blue dawn fog rolling through an enormous container terminal. Camera moves
forward, descends gently and drifts to the left between towering stacks of
weathered shipping containers. Silhouetted gantry cranes loom in the mist, still
black water beyond the quay. Desaturated steel blue and slate grey, heavy
atmospheric haze, almost monochrome. Shot on ARRI Alexa, 40mm anamorphic, fine
film grain.
```

**SHOT 10 — `engineering-tunnel.mp4`** · IX · forward, descending, drifting **left** · x2

```
Travelling forward down a long underground electrical service tunnel, camera
descending gently and drifting to the left. Rows of small cyan indicator lights
recede into darkness, heavy cable trays run along damp concrete walls, occasional
amber warning lamps. Thin volumetric light shafts cut through cool haze. Deep
shadow, cold blue-cyan palette, industrial and precise. Shot on ARRI Alexa, 24mm,
fine film grain.
```

### Why camera direction matters

Each plate's motion is matched to the actual spline tangent at that point in
`lib/journey.ts`. A plate drifting against the live camera reads as wrong
immediately, even to viewers who cannot articulate why. The directions above are
derived from the control points, not chosen for variety.

---

## 5. Extending a shot past 8 seconds

Only if you want a longer plate. In Flow:

1. Select the finished clip.
2. Use **Extend** — Flow continues from that clip's own final frames, which is
   exactly the seamless-handoff rule, handled natively.
3. Give the extension a prompt that describes *where the motion goes next*, not a
   restatement of the original. "The camera continues backward as the fragments
   settle and cool to dark red."

Alternative if you want tighter control: download the clip, take its final frame,
and use **Frames to Video** with that image as the start frame.

---

## 6. Download, compress, install

1. Download each clip as **MP4** from Flow.
2. **Compress before adding to the repo.** A raw 1080p Veo clip is 10–25 MB.
   Four of those would destroy the Lighthouse target the rest of the build is
   engineered to hit.
   **Target: under 2.5 MB per clip.**
   `ffmpeg` is not installed on this machine. Either install it —
   ```bash
   brew install ffmpeg
   ```
   then
   ```bash
   ffmpeg -i in.mp4 -vcodec libx264 -crf 30 -preset slow -an -movflags +faststart out.mp4
   ```
   — or use HandBrake / CloudConvert with H.264, CRF ~30, **audio stripped**.
3. Drop the files into `public/video/`.
4. Open `lib/content.ts` and set the matching `src`:
   ```ts
   { id: 'forge-plate', src: '/video/forge-plate.mp4', ... }
   ```
   That is the only edit. The layer handles lazy-loading, decode scheduling,
   blend mode and opacity ramping automatically.

Any cue left at `src: null` stays purely real-time — the site is complete and
shippable with zero video files present.

---

## 7. Before this goes on a client site

Two checks that are real, not formalities:

- **Commercial use.** Confirm your Google AI tier's terms permit commercial
  deployment of Veo output.
- **Watermarking.** Veo output carries an invisible SynthID watermark, and some
  tiers add a *visible* one. Check a downloaded file at full screen before
  shipping.
