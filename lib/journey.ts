import * as THREE from 'three';

/**
 * THE JOURNEY
 *
 * The entire site is one continuous camera move through one persistent world.
 * There are no pages, no scenes to swap, no transitions to hide.
 *
 * Two splines drive everything:
 *   PATH  — where the camera *is*
 *   FOCUS — where the camera *looks*
 *
 * Decoupling them is what buys real cinematography: we can dolly backwards away
 * from the logo while still holding it in frame, then let the focus swing
 * forward into the direction of travel without the camera itself ever cutting.
 *
 * Scroll progress (0..1) is arc-length position on PATH. Because both curves are
 * C1-continuous, a cut is not representable — the camera physically cannot
 * teleport. That is the "1917" requirement solved by construction.
 */

// ---------------------------------------------------------------------------
// Control points. Index i of PATH corresponds to index i of FOCUS.
// ---------------------------------------------------------------------------

const PATH_POINTS: [number, number, number][] = [
  // I. THE FORGE — camera dollies back from the assembling logo
  [0, 2.5, 14],
  [0, 3.2, 30],
  [0.5, 4.5, 52],

  // II. DESCENT — the floor splits, the camera sinks
  [0.5, -6, 50],
  [0, -22, 40],

  // III. BLUEPRINT — underground, wireframe, travelling forward again
  [0, -28, 10],
  [-4, -26, -40],
  [0, -20, -95],
  [6, -10, -150],

  // IV. DIGITAL — surfacing into the glass city
  [8, 6, -205],
  [4, 16, -260],
  [-6, 20, -315],

  // V. INDUSTRIAL — dropping into the plant
  [-14, 12, -370],
  [-10, 6, -425],
  [0, 8, -478],

  // VI. CONSTRUCTION — climbing the rising skyline
  [10, 16, -530],
  [16, 26, -585],
  [10, 20, -638],

  // VII. LOGISTICS — down to quay level, into the container
  [0, 10, -690],
  [-10, 6, -745],
  [-14, 5, -798],

  // VIII. RENEWABLE ENERGY — the doors open onto the array
  [-8, 9, -852],
  [2, 12, -905],
  [10, 8, -958],

  // IX. ENGINEERING — diving below grade
  [8, -8, -1008],
  [2, -20, -1060],
  [-4, -18, -1112],

  // X. ASCENT — everything rises, sunrise, the whole ecosystem
  [-2, 10, -1160],
  [2, 70, -1200],
  [0, 170, -1240],
  [0, 260, -1275],
];

const FOCUS_POINTS: [number, number, number][] = [
  // I. holding on the logo as we pull away from it
  [0, 2.5, 0],
  [0, 2.5, 0],
  [0, 2.4, 0],

  // II. the gaze drops into the fracture
  [0, -14, 44],
  [0, -30, 20],

  // III. forward through the blueprint
  [0, -30, -30],
  [-2, -26, -85],
  [2, -18, -140],
  [8, 0, -195],

  // IV.
  [6, 12, -250],
  [0, 18, -305],
  [-10, 16, -360],

  // V.
  [-14, 8, -415],
  [-6, 6, -468],
  [4, 12, -520],

  // VI.
  [14, 22, -575],
  [14, 22, -628],
  [6, 14, -680],

  // VII.
  [-6, 8, -735],
  [-14, 5, -788],
  [-12, 6, -842],

  // VIII.
  [-4, 10, -895],
  [6, 10, -948],
  [10, 0, -998],

  // IX.
  [6, -16, -1050],
  [0, -20, -1102],
  [-4, -6, -1150],

  // X. the gaze lifts to the horizon
  [0, 40, -1210],
  [0, 120, -1250],
  [0, 200, -1300],
  [0, 250, -1330],
];

const toVec = (p: [number, number, number][]) =>
  p.map(([x, y, z]) => new THREE.Vector3(x, y, z));

export const pathCurve = new THREE.CatmullRomCurve3(
  toVec(PATH_POINTS),
  false,
  'centripetal',
  0.5
);

export const focusCurve = new THREE.CatmullRomCurve3(
  toVec(FOCUS_POINTS),
  false,
  'centripetal',
  0.5
);

// ---------------------------------------------------------------------------
// Chapters
// ---------------------------------------------------------------------------

export type ChapterId =
  | 'forge'
  | 'descent'
  | 'blueprint'
  | 'digital'
  | 'industrial'
  | 'construction'
  | 'logistics'
  | 'energy'
  | 'engineering'
  | 'ascent';

export interface Chapter {
  id: ChapterId;
  /** Roman numeral shown in the HUD. */
  numeral: string;
  /** Short name shown in the progress rail. */
  label: string;
  start: number;
  end: number;
  /** World-space centre the district geometry is built around. */
  anchor: [number, number, number];
  /** Fog colour while this chapter owns the frame. */
  fog: string;
  /** Fog density — how far you can see. Tight fog underground, open at altitude. */
  fogDensity: number;
  /** Key light colour. */
  light: string;
  /** Ambient intensity. */
  ambient: number;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'forge',
    numeral: 'I',
    label: 'The Forge',
    start: 0.0,
    end: 0.085,
    anchor: [0, 2.5, 0],
    fog: '#05060a',
    fogDensity: 0.028,
    light: '#ff7a2f',
    ambient: 0.06,
  },
  {
    id: 'descent',
    numeral: 'II',
    label: 'Descent',
    start: 0.085,
    end: 0.15,
    anchor: [0, -18, 45],
    fog: '#07080d',
    fogDensity: 0.032,
    light: '#ff8a3d',
    ambient: 0.08,
  },
  {
    id: 'blueprint',
    numeral: 'III',
    label: 'Blueprint',
    start: 0.15,
    end: 0.275,
    anchor: [0, -24, -70],
    fog: '#020814',
    fogDensity: 0.018,
    light: '#3d7dff',
    ambient: 0.22,
  },
  {
    id: 'digital',
    numeral: 'IV',
    label: 'Digital Transformation',
    start: 0.275,
    end: 0.375,
    anchor: [2, 12, -260],
    fog: '#060a18',
    fogDensity: 0.012,
    light: '#4da3ff',
    ambient: 0.28,
  },
  {
    id: 'industrial',
    numeral: 'V',
    label: 'Industrial Solutions',
    start: 0.375,
    end: 0.47,
    anchor: [-8, 8, -425],
    fog: '#0d0906',
    fogDensity: 0.016,
    light: '#ff9c42',
    ambient: 0.2,
  },
  {
    id: 'construction',
    numeral: 'VI',
    label: 'Construction',
    start: 0.47,
    end: 0.565,
    anchor: [12, 18, -585],
    fog: '#141310',
    fogDensity: 0.011,
    light: '#ffc27a',
    ambient: 0.34,
  },
  {
    id: 'logistics',
    numeral: 'VII',
    label: 'Logistics',
    start: 0.565,
    end: 0.66,
    anchor: [-8, 6, -745],
    fog: '#0a1016',
    fogDensity: 0.013,
    light: '#8fb8d8',
    ambient: 0.3,
  },
  {
    id: 'energy',
    numeral: 'VIII',
    label: 'Renewable Energy',
    start: 0.66,
    end: 0.76,
    anchor: [2, 10, -905],
    fog: '#1d1206',
    fogDensity: 0.009,
    light: '#ffb054',
    ambient: 0.45,
  },
  {
    id: 'engineering',
    numeral: 'IX',
    label: 'Engineering',
    start: 0.76,
    end: 0.87,
    anchor: [2, -16, -1060],
    fog: '#04070a',
    fogDensity: 0.022,
    light: '#5fd8ff',
    ambient: 0.18,
  },
  {
    id: 'ascent',
    numeral: 'X',
    label: 'One Group',
    start: 0.87,
    end: 1.0,
    anchor: [0, 60, -1220],
    fog: '#16233a',
    fogDensity: 0.004,
    light: '#ffd9a0',
    ambient: 0.6,
  },
];

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/** 0..1 progress *within* a chapter, clamped outside it. */
export const chapterProgress = (t: number, c: Chapter) =>
  clamp((t - c.start) / (c.end - c.start));

/**
 * How much a chapter "owns" the frame right now (0..1), with soft crossfades
 * into its neighbours. Districts use this to fade their geometry in and out so
 * we never render the whole world at once.
 */
export const chapterInfluence = (t: number, c: Chapter, feather = 0.045) => {
  const rise = smoothstep(c.start - feather, c.start + feather, t);
  const fall = 1 - smoothstep(c.end - feather, c.end + feather, t);
  return rise * fall;
};

/** The chapter that currently owns the frame. */
export const activeChapter = (t: number): Chapter => {
  for (const c of CHAPTERS) if (t < c.end) return c;
  return CHAPTERS[CHAPTERS.length - 1];
};

/** Sample the camera pose at journey position t. */
export const sampleJourney = (
  t: number,
  outPos: THREE.Vector3,
  outFocus: THREE.Vector3
) => {
  const ct = clamp(t);
  pathCurve.getPointAt(ct, outPos);
  focusCurve.getPointAt(ct, outFocus);
};

/** Total scrollable height, in viewport multiples. Sets the pace of the film. */
export const JOURNEY_LENGTH_VH = 1500;

/**
 * Literal district geometry — the modelled towers, silos, containers, cranes and
 * solar arrays.
 *
 * OFF. Once every chapter carries a cinematic plate, that geometry is a second
 * literal depiction of the same subject, and the two visibly compete: modelled
 * shards drifting over filmed shards reads as noise, not as depth. The 3D layer
 * now does what film cannot — parallax, scroll-velocity response and chapter
 * light — via DepthField.
 *
 * The district components are intact. Flip this back to true to render them
 * (worth lowering the plate opacities in VIDEO_CUES at the same time, or they
 * will bury the geometry again).
 */
export const RENDER_DISTRICT_GEOMETRY = false;
