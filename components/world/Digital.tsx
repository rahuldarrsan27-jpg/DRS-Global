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

const CH = CHAPTERS[3];

/**
 * Division IV — Digital Transformation.
 *
 * A glass city. Towers are dark, near-black glass so the district reads by its
 * *light* rather than its mass: emissive window bands, holographic rings and
 * drifting data motes do all the visual work. Three instanced meshes carry
 * roughly fifteen hundred objects.
 */
export function Digital() {
  const towers = useRef<THREE.InstancedMesh>(null);
  const windows = useRef<THREE.InstancedMesh>(null);
  const rings = useRef<THREE.Group>(null);

  const { towerSpecs, windowSpecs } = useMemo(() => {
    const rng = makeRng(90210);
    const s = tierScale();
    const towerSpecs: BoxSpec[] = [];
    const windowSpecs: BoxSpec[] = [];

    const count = Math.floor(64 * s);
    for (let i = 0; i < count; i++) {
      // Corridor runs z:-200 → -330, camera climbs y:6 → 20.
      const z = -195 - rng.range(0, 145);
      const side = rng.chance(0.5) ? 1 : -1;
      // Camera runs x:-6..8 here; towers are up to 16 wide, so the centre line
      // has to sit at least 30 out to keep the corridor genuinely clear.
      const x = side * rng.range(30, 95);
      const h = rng.range(28, 96);
      const w = rng.range(7, 16);
      const d = rng.range(7, 16);
      const base = -22;

      towerSpecs.push({
        pos: [x, base + h / 2, z],
        size: [w, h, d],
        rotY: rng.spread(0.35),
      });

      // Horizontal light bands — far more architectural than punched windows,
      // and a fraction of the instances.
      const bands = Math.floor(h / rng.range(5, 9));
      for (let b = 0; b < bands; b++) {
        if (rng.chance(0.3)) continue;
        const by = base + 4 + (b / bands) * (h - 6);
        windowSpecs.push({
          pos: [x, by, z],
          size: [w * 1.012, rng.range(0.3, 0.75), d * 1.012],
          rotY: 0,
        });
      }
    }

    return { towerSpecs, windowSpecs };
  }, []);

  useEffect(() => {
    if (towers.current) {
      applyBoxInstances(towers.current, towerSpecs);
      // Subtle per-tower tint variation stops the glass reading as one material.
      const rng = makeRng(5150);
      const c = new THREE.Color();
      for (let i = 0; i < towerSpecs.length; i++) {
        c.setHSL(0.58 + rng.spread(0.04), 0.35, rng.range(0.05, 0.12));
        towers.current.setColorAt(i, c);
      }
      if (towers.current.instanceColor) {
        towers.current.instanceColor.needsUpdate = true;
      }
    }
    if (windows.current) {
      applyBoxInstances(windows.current, windowSpecs);
      const rng = makeRng(6160);
      const c = new THREE.Color();
      for (let i = 0; i < windowSpecs.length; i++) {
        // Mostly cool cyan with occasional warm interior light.
        if (rng.chance(0.12)) c.setHSL(0.09, 0.7, 0.62);
        else c.setHSL(0.55 + rng.spread(0.05), 0.85, rng.range(0.45, 0.68));
        windows.current.setColorAt(i, c);
      }
      if (windows.current.instanceColor) {
        windows.current.instanceColor.needsUpdate = true;
      }
    }
  }, [towerSpecs, windowSpecs]);

  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (journey.reducedMotion) return;
    elapsed.current += Math.min(delta, 0.05);
    const e = elapsed.current;
    if (rings.current) {
      rings.current.children.forEach((child, i) => {
        child.rotation.z = e * (0.06 + i * 0.017) * (i % 2 ? -1 : 1);
        child.rotation.x = Math.PI / 2 + Math.sin(e * 0.2 + i) * 0.14;
        child.position.y = 14 + Math.sin(e * 0.35 + i * 1.7) * 2.2;
      });
    }
  });

  const ringData = useMemo(() => {
    const rng = makeRng(3141);
    return Array.from({ length: 7 }, (_, i) => ({
      r: 7 + i * 3.4,
      z: -215 - i * 15,
      x: rng.spread(22),
      tube: rng.range(0.05, 0.16),
      color: i % 3 === 0 ? '#6ce6ff' : '#3b82f6',
    }));
  }, []);

  return (
    <District chapter={CH} margin={0.09}>
      <group>
        <instancedMesh
          ref={towers}
          args={[undefined, undefined, towerSpecs.length]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#ffffff"
            metalness={0.9}
            roughness={0.14}
          />
        </instancedMesh>

        <instancedMesh
          ref={windows}
          args={[undefined, undefined, Math.max(windowSpecs.length, 1)]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </instancedMesh>

        {/* Holographic data rings orbiting the towers */}
        <group ref={rings}>
          {ringData.map((r, i) => (
            <mesh key={i} position={[r.x, 14, r.z]}>
              <torusGeometry args={[r.r, r.tube, 8, 96]} />
              <meshBasicMaterial
                color={r.color}
                transparent
                opacity={0.5}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>

        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -22, -265]}>
          <planeGeometry args={[400, 400]} />
          <meshStandardMaterial color="#05070f" metalness={0.9} roughness={0.25} />
        </mesh>

        <Particles
          count={1100}
          bounds={[80, 44, 90]}
          color="#7dd8ff"
          size={2.8}
          opacity={0.5}
          drift={3.2}
          rise={0.9}
          falloff={0.012}
          position={[0, 12, -262]}
          seed={23}
        />
      </group>
    </District>
  );
}
