'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeRng } from '@/lib/rng';
import { journey } from '@/lib/journeyState';

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uDrift;
  uniform float uRise;
  uniform vec3  uBounds;
  uniform float uPixelRatio;

  attribute float aSeed;
  attribute float aScale;

  varying float vTwinkle;
  varying float vDepth;

  void main() {
    vec3 p = position;

    float s = aSeed * 6.2831853;

    // Slow turbulent drift. Cheap, but enough decorrelation between axes that
    // the field never reads as a single sheet sliding past.
    p.x += sin(uTime * 0.28 + s) * uDrift;
    p.z += cos(uTime * 0.23 + s * 1.7) * uDrift;

    // Vertical travel wraps within the volume so the field is infinite.
    float rise = uRise * uTime + aSeed * uBounds.y * 2.0;
    p.y = mod(p.y + rise + uBounds.y, uBounds.y * 2.0) - uBounds.y;
    p.y += sin(uTime * 0.5 + s) * uDrift * 0.35;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;

    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPixelRatio * (60.0 / max(vDepth, 1.0));

    vTwinkle = 0.55 + 0.45 * sin(uTime * 1.6 + s * 3.1);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;

  uniform vec3  uColor;
  uniform float uOpacity;
  uniform float uFalloff;

  varying float vTwinkle;
  varying float vDepth;

  void main() {
    // Round sprite with a soft core — no texture fetch needed.
    vec2 uv = gl_PointCoord - 0.5;
    float d = dot(uv, uv);
    if (d > 0.25) discard;

    float alpha = smoothstep(0.25, 0.0, d);
    alpha *= alpha;

    // Distance fade so particles dissolve into the fog instead of clipping.
    float fog = exp(-vDepth * uFalloff);

    gl_FragColor = vec4(uColor, alpha * uOpacity * vTwinkle * fog);
    #include <colorspace_fragment>
  }
`;

export interface ParticlesProps {
  count?: number;
  /** Half-extents of the volume the field fills. */
  bounds?: [number, number, number];
  color?: string;
  size?: number;
  opacity?: number;
  /** Horizontal wander amplitude. */
  drift?: number;
  /** Vertical speed. Negative falls, positive rises (embers rise). */
  rise?: number;
  /** Higher = dissolves closer to camera. */
  falloff?: number;
  position?: [number, number, number];
  seed?: number;
}

/**
 * One draw call for an entire volume of dust, embers or ash.
 *
 * Everything is animated on the GPU from a static buffer — no per-frame CPU
 * writes, so raising the count costs fill rate rather than main-thread time.
 */
export function Particles({
  count = 900,
  bounds = [60, 40, 60],
  color = '#ffa76b',
  size = 5,
  opacity = 0.7,
  drift = 2.2,
  rise = 0.6,
  falloff = 0.008,
  position = [0, 0, 0],
  seed = 1,
}: ParticlesProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  // Density scales with device tier — the look survives, the fill rate doesn't
  // sink a phone.
  const resolved = useMemo(() => {
    const tier = journey.tier;
    const factor = tier === 'low' ? 0.3 : tier === 'mid' ? 0.6 : 1;
    return Math.max(60, Math.floor(count * factor));
  }, [count]);

  const geometry = useMemo(() => {
    const rng = makeRng(seed * 7919 + 13);
    const pos = new Float32Array(resolved * 3);
    const seeds = new Float32Array(resolved);
    const scales = new Float32Array(resolved);

    for (let i = 0; i < resolved; i++) {
      pos[i * 3] = rng.spread(bounds[0]);
      pos[i * 3 + 1] = rng.spread(bounds[1]);
      pos[i * 3 + 2] = rng.spread(bounds[2]);
      seeds[i] = rng.next();
      // Heavy skew toward small motes with a few bright ones — matches how
      // real airborne debris reads on camera.
      scales[i] = 0.35 + Math.pow(rng.next(), 3) * 2.4;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    g.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    g.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(),
      Math.max(bounds[0], bounds[1], bounds[2]) * 1.8
    );
    return g;
  }, [resolved, bounds, seed]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: size },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uDrift: { value: drift },
      uRise: { value: rise },
      uFalloff: { value: falloff },
      uBounds: { value: new THREE.Vector3(...bounds) },
      uPixelRatio: {
        value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1,
      },
    }),
    // Uniform object is created once; values are updated imperatively below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Colour is driven imperatively so the field can be tinted by the active
  // chapter without rebuilding the material every time the tint moves.
  const target = useMemo(() => new THREE.Color(color), [color]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    uniforms.uColor.value.lerp(target, 1 - Math.pow(0.05, dt));
    uniforms.uOpacity.value += (opacity - uniforms.uOpacity.value) * (1 - Math.pow(0.1, dt));

    // Reduced motion freezes the field rather than removing it — the texture of
    // the scene survives, the movement doesn't.
    if (journey.reducedMotion) return;
    uniforms.uTime.value += dt;
  });

  return (
    <points geometry={geometry} position={position} frustumCulled>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
