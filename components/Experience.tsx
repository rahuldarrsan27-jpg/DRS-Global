'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { getTier } from '@/lib/journeyState';
import { RENDER_DISTRICT_GEOMETRY } from '@/lib/journey';

import { CameraRig } from './world/CameraRig';
import { Atmosphere } from './world/Atmosphere';
import { DepthField } from './world/DepthField';
import { Forge } from './world/Forge';
import { Blueprint } from './world/Blueprint';
import { Digital } from './world/Digital';
import { Industrial } from './world/Industrial';
import { Construction } from './world/Construction';
import { Logistics } from './world/Logistics';
import { Energy } from './world/Energy';
import { Engineering } from './world/Engineering';
import { Ascent } from './world/Ascent';

/**
 * The world.
 *
 * Every district mounts once and stays mounted — they are gated by visibility,
 * not by mounting and unmounting, because rebuilding several thousand instances
 * mid-scroll would stall the frame exactly when the visitor is moving fastest.
 * Memory is spent up front so the journey never hitches.
 */
export function Experience() {
  const tier = getTier();

  const gl = useMemo(
    () => ({
      antialias: tier === 'high',
      powerPreference: 'high-performance' as const,
      // Transparent: the canvas sits ABOVE the cinematic plates so the depth
      // layer composites over the footage. Behind them it would only be visible
      // in the dark areas of each shot and vanish entirely on bright ones.
      alpha: true,
      stencil: false,
      depth: true,
    }),
    [tier]
  );

  const dpr = useMemo<[number, number]>(
    () => (tier === 'high' ? [1, 2] : tier === 'mid' ? [1, 1.5] : [0.75, 1]),
    [tier]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[3]">
      <Canvas
        dpr={dpr}
        gl={gl}
        camera={{ fov: 52, near: 0.5, far: 2600, position: [0, 2.5, 14] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.setClearAlpha(0);
        }}
      >
        <Suspense fallback={null}>
          <Atmosphere />
          <CameraRig />

          {/*
            The depth layer. This is the 3D that survives alongside the plates —
            parallax strata and velocity streaks, the things footage cannot do.
          */}
          <DepthField />

          {RENDER_DISTRICT_GEOMETRY && (
            <>
              <Forge />
              <Blueprint />
              <Digital />
              <Industrial />
              <Construction />
              <Logistics />
              <Energy />
              <Engineering />
              <Ascent />
            </>
          )}

          {/*
            No postprocessing pass.

            Bloom and vignette earned their cost when this canvas held a modelled
            world. With the plates carrying the image and only velocity streaks
            left in 3D, a full-screen composite would run every frame to affect
            almost nothing. The vignette and grain now live in CSS over the whole
            frame — including the video, which a WebGL pass could never reach.
          */}
        </Suspense>
      </Canvas>
    </div>
  );
}
