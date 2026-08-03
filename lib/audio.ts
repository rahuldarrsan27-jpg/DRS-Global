'use client';

import { CHAPTERS } from './journey';

/**
 * The room tone — synthesised, never fetched.
 *
 * A drone built from three detuned oscillators and a band of filtered noise,
 * pushed through a low-pass whose cutoff drifts. Its fundamental and brightness
 * shift per chapter, so the underground chapters sit lower and darker than the
 * ones at altitude.
 *
 * Generated rather than streamed for two reasons: an ambient bed is exactly the
 * kind of asset that quietly adds megabytes to a page already carrying video,
 * and a synthesised one can follow the journey continuously instead of
 * crossfading between loops.
 *
 * Silent until the visitor asks for it. Browsers block audio before a gesture
 * anyway, and a site that makes noise uninvited is a site people close.
 */

interface Voice {
  ctx: AudioContext;
  master: GainNode;
  filter: BiquadFilterNode;
  oscs: OscillatorNode[];
  noiseGain: GainNode;
  lfo: OscillatorNode;
}

let voice: Voice | null = null;
let enabled = false;
const listeners = new Set<(on: boolean) => void>();

/** Fundamental and brightness per chapter — darker underground, open at altitude. */
const chapterTone = (index: number) => {
  const id = CHAPTERS[index]?.id ?? 'forge';
  switch (id) {
    case 'forge':
    case 'descent':
      return { base: 48, cutoff: 260 };
    case 'blueprint':
    case 'engineering':
      return { base: 41, cutoff: 210 };
    case 'digital':
      return { base: 55, cutoff: 420 };
    case 'industrial':
      return { base: 43, cutoff: 300 };
    case 'construction':
    case 'logistics':
      return { base: 49, cutoff: 340 };
    case 'energy':
      return { base: 58, cutoff: 520 };
    case 'ascent':
      return { base: 65, cutoff: 680 };
    default:
      return { base: 48, cutoff: 300 };
  }
};

const build = (): Voice | null => {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;

    const ctx = new Ctor();

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 280;
    filter.Q.value = 0.7;
    filter.connect(master);

    // Three voices: fundamental, a detuned twin for beating, and a fifth.
    const oscs: OscillatorNode[] = [];
    const specs: [OscillatorType, number, number][] = [
      ['triangle', 0, 0.5],
      ['triangle', 7, 0.35],
      ['sine', -1200 + 702, 0.22], // an octave down, then a fifth up
    ];
    for (const [type, detune, gain] of specs) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = 48;
      o.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = gain;
      o.connect(g).connect(filter);
      o.start();
      oscs.push(o);
    }

    // A breath of filtered noise so the bed is not purely tonal.
    const frames = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const noiseBand = ctx.createBiquadFilter();
    noiseBand.type = 'bandpass';
    noiseBand.frequency.value = 480;
    noiseBand.Q.value = 0.8;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.035;
    noise.connect(noiseBand).connect(noiseGain).connect(filter);
    noise.start();

    // Slow drift on the cutoff so the bed never sits perfectly still.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    return { ctx, master, filter, oscs, noiseGain, lfo };
  } catch {
    return null;
  }
};

export const isAudioOn = () => enabled;

export const subscribeAudio = (fn: (on: boolean) => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

/** Must be called from a user gesture the first time. */
export const toggleAudio = async () => {
  if (!voice) voice = build();
  if (!voice) return;

  if (voice.ctx.state === 'suspended') {
    try {
      await voice.ctx.resume();
    } catch {
      /* ignore — the toggle simply stays off */
    }
  }

  enabled = !enabled;
  const now = voice.ctx.currentTime;
  voice.master.gain.cancelScheduledValues(now);
  voice.master.gain.setValueAtTime(voice.master.gain.value, now);
  // Long ramps: an ambient bed that snaps on is startling.
  voice.master.gain.linearRampToValueAtTime(enabled ? 0.09 : 0, now + (enabled ? 2.4 : 1.1));

  listeners.forEach((fn) => fn(enabled));
};

/** Called on discrete chapter changes. */
export const setAudioChapter = (index: number) => {
  if (!voice) return;
  const { base, cutoff } = chapterTone(index);
  const now = voice.ctx.currentTime;
  // Glide rather than jump — the tone should move with the camera, not cut.
  voice.oscs.forEach((o, i) => {
    const mult = i === 2 ? 2 : 1;
    o.frequency.cancelScheduledValues(now);
    o.frequency.setValueAtTime(o.frequency.value, now);
    o.frequency.linearRampToValueAtTime(base * mult, now + 3.5);
  });
  voice.filter.frequency.cancelScheduledValues(now);
  voice.filter.frequency.setValueAtTime(voice.filter.frequency.value, now);
  voice.filter.frequency.linearRampToValueAtTime(cutoff, now + 3.5);
};

export const disposeAudio = () => {
  if (!voice) return;
  try {
    voice.oscs.forEach((o) => o.stop());
    voice.lfo.stop();
    void voice.ctx.close();
  } catch {
    /* already torn down */
  }
  voice = null;
  enabled = false;
};
