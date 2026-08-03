'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHAPTERS } from '@/lib/journey';
import { journey, tierScale, subscribeChapter } from '@/lib/journeyState';
import { makeRng } from '@/lib/rng';

/**
 * THE DEPTH LAYER
 *
 * Once the cinematic plates carry the environment, modelling that same
 * environment again in geometry is not depth — it is duplication, and two
 * literal descriptions of a foundry or a port visibly fight each other.
 *
 * What remains is the one thing the footage genuinely cannot do: express the
 * visitor's own velocity. Light streaks stretch with scroll speed and vanish
 * completely at rest, tinted by the active chapter so they agree with the plate
 * rather than competing with it.
 *
 * Everything else that was tried here — parallax particle strata — is gone.
 * Composited over photographic footage it read as bubbles rather than depth.
 * The cinematic finish is now done photographically instead, in CSS: grain and
 * vignette, which belong over film in a way that geometry does not.
 */

const STREAK_COUNT = 220;

export function DepthField() {
  const rig = useRef<THREE.Group>(null);
  const streaks = useRef<THREE.InstancedMesh>(null);
  const streakMat = useRef<THREE.MeshBasicMaterial>(null);

  /*
    Tint is React state driven by discrete chapter changes — ten updates across
    the whole film, not one per frame. Particles smooths the actual colour
    transition internally, so the step change never shows.
  */
  const [tint, setTint] = useState(CHAPTERS[0].light);
  useEffect(() => subscribeChapter((c) => setTint(c.light)), []);

  const streakData = useMemo(() => {
    const rng = makeRng(515151);
    const s = tierScale();
    const count = Math.max(60, Math.floor(STREAK_COUNT * s));
    return Array.from({ length: count }, () => ({
      // Distributed through a volume ahead of the lens, never on it.
      x: rng.spread(46),
      y: rng.spread(30),
      z: rng.range(-70, -6),
      len: rng.range(1.4, 5.5),
      thin: rng.range(0.012, 0.05),
      seed: rng.range(0, Math.PI * 2),
    }));
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tintColor = useMemo(() => new THREE.Color(CHAPTERS[0].light), []);
  const tintTarget = useMemo(() => new THREE.Color(tint), [tint]);
  const elapsed = useRef(0);
  const smoothVel = useRef(0);

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    elapsed.current += dt;

    // The field rides with the camera so it is always present, and always
    // parallaxing against a backdrop that does not move with it.
    if (rig.current) {
      rig.current.position.copy(camera.position);
      rig.current.quaternion.copy(camera.quaternion);
    }

    tintColor.lerp(tintTarget, 1 - Math.pow(0.04, dt));

    // Streaks answer to scroll speed and disappear the moment it stops.
    const targetVel = journey.reducedMotion ? 0 : Math.abs(journey.velocity);
    smoothVel.current += (targetVel - smoothVel.current) * (1 - Math.pow(0.015, dt));
    const v = smoothVel.current;

    if (streakMat.current) {
      streakMat.current.opacity = Math.min(v * 0.55, 0.4);
      streakMat.current.color.copy(tintColor);
    }

    const mesh = streaks.current;
    if (mesh) {
      const on = v > 0.012;
      mesh.visible = on;
      if (on) {
        for (let i = 0; i < streakData.length; i++) {
          const d = streakData[i];
          const drift = journey.reducedMotion
            ? 0
            : Math.sin(elapsed.current * 0.4 + d.seed) * 0.8;
          dummy.position.set(d.x, d.y + drift, d.z);
          // Stretch along view depth — the classic light-trail read.
          dummy.scale.set(d.thin, d.thin, d.len * (1 + v * 14));
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <group ref={rig}>
      {/*
        The particle strata that used to live here are gone.

        Round soft sprites composited over photographic footage do not read as
        atmosphere — they read as bubbles, or as dirt on the lens, and they bury
        an image that cost real money to generate. No amount of tuning opacity
        fixed the shape of the problem.

        What survives is the one effect that is genuinely motivated: streaks that
        exist only while the visitor is scrolling. They are absent at rest, so
        they can never sit on top of a held frame, and their whole job is to
        express velocity — something the footage cannot do on its own.
      */}
      <instancedMesh
        ref={streaks}
        args={[undefined, undefined, streakData.length]}
        frustumCulled={false}
        visible={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          ref={streakMat}
          color="#ffffff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
