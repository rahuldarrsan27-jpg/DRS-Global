'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CHAPTERS,
  clamp,
  chapterInfluence,
  RENDER_DISTRICT_GEOMETRY,
} from '@/lib/journey';
import { journey } from '@/lib/journeyState';

/**
 * Light and air.
 *
 * Fog colour, fog density, key-light colour and ambient level are all blended
 * continuously across chapters using the same influence curve the districts use
 * to fade their geometry. That shared curve is why the world never "switches"
 * environments — the air changes before you notice the architecture has.
 */
export function Atmosphere() {
  const { scene } = useThree();

  const keyRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);

  const state = useMemo(
    () => ({
      fog: new THREE.FogExp2('#05060a', 0.028),
      colour: new THREE.Color('#05060a'),
      target: new THREE.Color(),
      lightColour: new THREE.Color('#ff7a2f'),
      lightTarget: new THREE.Color(),
      scratch: new THREE.Color(),
    }),
    []
  );

  /*
    Fog and background belong to the modelled world. With the plates carrying
    the environment the canvas has to stay transparent — an opaque background
    would simply hide the footage, and fog would tint the depth layer toward a
    colour that is no longer behind anything.
  */
  useMemo(() => {
    if (RENDER_DISTRICT_GEOMETRY) {
      scene.fog = state.fog;
      scene.background = state.colour;
    } else {
      scene.fog = null;
      scene.background = null;
    }
  }, [scene, state]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clamp(journey.t);

    // Weighted blend across every chapter that has any influence right now.
    let wSum = 0;
    let density = 0;
    let ambient = 0;
    state.target.setRGB(0, 0, 0);
    state.lightTarget.setRGB(0, 0, 0);

    for (const c of CHAPTERS) {
      const w = chapterInfluence(t, c, 0.05);
      if (w <= 0.0001) continue;
      wSum += w;
      density += c.fogDensity * w;
      ambient += c.ambient * w;
      state.target.add(state.scratch.set(c.fog).multiplyScalar(w));
      state.lightTarget.add(state.scratch.set(c.light).multiplyScalar(w));
    }

    if (wSum > 0.0001) {
      state.target.multiplyScalar(1 / wSum);
      state.lightTarget.multiplyScalar(1 / wSum);
      density /= wSum;
      ambient /= wSum;
    } else {
      state.target.set('#05060a');
      state.lightTarget.set('#ff7a2f');
      density = 0.02;
      ambient = 0.2;
    }

    const k = 1 - Math.pow(0.02, dt);
    state.colour.lerp(state.target, k);
    state.fog.color.copy(state.colour);
    state.fog.density += (density - state.fog.density) * k;
    state.lightColour.lerp(state.lightTarget, k);

    if (ambientRef.current) {
      ambientRef.current.intensity +=
        (ambient - ambientRef.current.intensity) * k;
      ambientRef.current.color.copy(state.lightColour);
    }
    if (keyRef.current) {
      keyRef.current.color.copy(state.lightColour);
      // Sun climbs as the film ends — the ascent is a sunrise.
      const sun = clamp((t - 0.86) / 0.14);
      keyRef.current.position.set(
        60,
        30 + sun * 120,
        -200 - t * 1000
      );
      keyRef.current.intensity = 0.7 + sun * 1.6;
    }
    if (rimRef.current) {
      rimRef.current.color.copy(state.lightColour);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.06} />
      <directionalLight
        ref={keyRef}
        position={[60, 30, -200]}
        intensity={0.7}
        color="#ff7a2f"
      />
      <directionalLight
        ref={rimRef}
        position={[-80, 20, 120]}
        intensity={0.35}
        color="#3d7dff"
      />
      <hemisphereLight args={['#33507a', '#0a0a0c', 0.35]} />
    </>
  );
}
