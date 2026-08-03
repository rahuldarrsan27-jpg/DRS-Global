'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHAPTERS } from '@/lib/journey';
import { journey, tierScale } from '@/lib/journeyState';
import { makeRng } from '@/lib/rng';
import { applyBoxInstances, type BoxSpec } from '@/lib/geometry';
import { Particles } from './Particles';
import { District } from './District';

const CH = CHAPTERS[7];

/**
 * Division VIII — Renewable Energy.
 *
 * The array is the hero: several thousand panels on a strict grid, one draw
 * call, all tilted to a common axis so the low sun rakes across every face at
 * once. Regularity is the point here — unlike the container yard, a solar farm
 * that looks hand-scattered looks wrong.
 */
export function Energy() {
  const panels = useRef<THREE.InstancedMesh>(null);
  const posts = useRef<THREE.InstancedMesh>(null);
  const pylons = useRef<THREE.InstancedMesh>(null);
  const rotors = useRef<THREE.Group>(null);

  const { panelSpecs, postSpecs, pylonSpecs, turbines } = useMemo(() => {
    const rng = makeRng(220220);
    const s = tierScale();
    const panelSpecs: BoxSpec[] = [];
    const postSpecs: BoxSpec[] = [];
    const pylonSpecs: BoxSpec[] = [];

    const base = -6;
    const zStart = -845;
    const zEnd = -975;

    // Panel rows. Cols run along Z, rows across X, with a clear corridor for
    // the camera line.
    const rowStep = 7.5;
    const colStep = 4.6;
    const rows = Math.floor(26 * s);
    const cols = Math.floor(30 * s);

    for (let r = 0; r < rows; r++) {
      const x = -95 + r * rowStep + (r > rows / 2 ? 14 : 0);
      if (Math.abs(x - 2) < 11) continue; // keep the flight path clear
      for (let c = 0; c < cols; c++) {
        const z = zStart - c * ((zStart - zEnd) / cols);
        panelSpecs.push({
          pos: [x, base + 2.1, z],
          size: [6.4, 0.16, 3.6],
          rotY: 0,
        });
        if (c % 2 === 0) {
          postSpecs.push({ pos: [x, base + 1, z], size: [0.28, 2.2, 0.28] });
        }
      }
    }

    // Transmission line marching to the horizon.
    for (let i = 0; i < Math.floor(11 * s); i++) {
      const z = zStart - i * 13;
      const x = 74;
      const h = 26;
      pylonSpecs.push({ pos: [x, base + h / 2, z], size: [1.6, h, 1.6] });
      pylonSpecs.push({ pos: [x, base + h * 0.86, z], size: [13, 0.7, 0.9] });
      pylonSpecs.push({ pos: [x, base + h * 0.66, z], size: [10, 0.7, 0.9] });
    }

    const turbines = Array.from({ length: Math.max(3, Math.floor(7 * s)) }, () => ({
      x: (rng.chance(0.5) ? 1 : -1) * rng.range(58, 130),
      z: rng.range(zEnd - 60, zStart),
      h: rng.range(42, 68),
      speed: rng.range(0.18, 0.34),
      phase: rng.range(0, Math.PI * 2),
    }));

    return { panelSpecs, postSpecs, pylonSpecs, turbines };
  }, []);

  useEffect(() => {
    // Panels share one tilt — instanced with a fixed X rotation.
    if (panels.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < panelSpecs.length; i++) {
        const p = panelSpecs[i];
        dummy.position.set(...p.pos);
        dummy.rotation.set(-0.52, 0, 0);
        dummy.scale.set(p.size[0], p.size[1], p.size[2]);
        dummy.updateMatrix();
        panels.current.setMatrixAt(i, dummy.matrix);
      }
      panels.current.instanceMatrix.needsUpdate = true;
      panels.current.computeBoundingSphere();
    }
    if (posts.current) applyBoxInstances(posts.current, postSpecs);
    if (pylons.current) applyBoxInstances(pylons.current, pylonSpecs);
  }, [panelSpecs, postSpecs, pylonSpecs]);

  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (journey.reducedMotion || !rotors.current) return;
    elapsed.current += Math.min(delta, 0.05);
    rotors.current.children.forEach((rotor, i) => {
      rotor.rotation.z = elapsed.current * turbines[i].speed + turbines[i].phase;
    });
  });

  return (
    <District chapter={CH} margin={0.09}>
      <group>
        <instancedMesh
          ref={panels}
          args={[undefined, undefined, panelSpecs.length]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#101b33"
            metalness={0.94}
            roughness={0.11}
          />
        </instancedMesh>

        <instancedMesh
          ref={posts}
          args={[undefined, undefined, Math.max(postSpecs.length, 1)]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#6b6455" metalness={0.7} roughness={0.6} />
        </instancedMesh>

        <instancedMesh
          ref={pylons}
          args={[undefined, undefined, pylonSpecs.length]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#7a7d82" metalness={0.8} roughness={0.5} />
        </instancedMesh>

        {/* Wind turbines */}
        <group>
          {turbines.map((t, i) => (
            <group key={i} position={[t.x, -6, t.z]}>
              <mesh position={[0, t.h / 2, 0]}>
                <cylinderGeometry args={[0.8, 1.5, t.h, 12]} />
                <meshStandardMaterial color="#d8d4cb" metalness={0.5} roughness={0.55} />
              </mesh>
              <mesh position={[0, t.h, 1.2]}>
                <boxGeometry args={[1.6, 1.6, 4]} />
                <meshStandardMaterial color="#cfcbc2" metalness={0.6} roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Rotors kept in a flat group so one loop can spin them all */}
        <group ref={rotors}>
          {turbines.map((t, i) => (
            <group key={i} position={[t.x, t.h - 6, t.z + 3.4]}>
              {[0, 1, 2].map((b) => (
                // Blades radiate from the hub: rotate the arm, then offset the
                // mesh outward along it.
                <group key={b} rotation={[0, 0, (b * Math.PI * 2) / 3]}>
                  <mesh position={[0, 13, 0]}>
                    <boxGeometry args={[1.1, 26, 0.35]} />
                    <meshStandardMaterial
                      color="#e6e2d8"
                      metalness={0.35}
                      roughness={0.65}
                    />
                  </mesh>
                </group>
              ))}
            </group>
          ))}
        </group>

        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6.05, -905]}>
          <planeGeometry args={[600, 420]} />
          <meshStandardMaterial color="#4a3a22" metalness={0.1} roughness={0.98} />
        </mesh>

        <Particles
          count={800}
          bounds={[110, 24, 110]}
          color="#ffd9a0"
          size={2.4}
          opacity={0.4}
          drift={4.5}
          rise={0.35}
          falloff={0.011}
          position={[0, 8, -905]}
          seed={67}
        />
      </group>
    </District>
  );
}
