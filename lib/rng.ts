/**
 * Deterministic RNG.
 *
 * The world must be identical on every load and on every machine — a city that
 * reshuffles itself between server render and hydration is a bug you can see.
 * Every scattered element in this project draws from a seeded stream.
 */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Seeded helper bundle for building a district. */
export const makeRng = (seed: number) => {
  const r = mulberry32(seed);
  return {
    next: r,
    /** Uniform in [min, max). */
    range: (min: number, max: number) => min + r() * (max - min),
    /** Integer in [min, max]. */
    int: (min: number, max: number) => Math.floor(min + r() * (max - min + 1)),
    /** True with probability p. */
    chance: (p: number) => r() < p,
    pick: <T,>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)],
    /** Signed value in [-a, a], biased toward the centre. */
    spread: (a: number) => (r() + r() - 1) * a,
  };
};

export type Rng = ReturnType<typeof makeRng>;
