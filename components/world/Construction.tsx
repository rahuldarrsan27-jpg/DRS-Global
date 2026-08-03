'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHAPTERS, smoothstep } from '@/lib/journey';
import { journey, tierScale } from '@/lib/journeyState';
import { makeRng } from '@/lib/rng';
import { applyBoxInstances, buildBoxEdges, type BoxSpec } from '@/lib/geometry';
import { Particles } from './Particles';
import { District } from './District';

const CH = CHAPTERS[5];

/**
 * Division VI — Construction.
 *
 * Towers are deliberately half-built: solid up to a cut line, wireframe above
 * it. That reuses the blueprint language from Scene III forty seconds later in
 * the film, so the city reads as still being drawn — the same idea returning
 * rather than a new one being introduced.
 */
export function Construction() {
  const solid = useRef<THREE.InstancedMesh>(null);
  const cranes = useRef<THREE.InstancedMesh>(null);
  const silos = useRef<THREE.InstancedMesh>(null);
  const rebar = useRef<THREE.InstancedMesh>(null);

  const { solidSpecs, craneSpecs, siloSpecs, rebarSpecs, wireGeom } = useMemo(() => {
    const rng = makeRng(11235);
    const s = tierScale();
    const solidSpecs: BoxSpec[] = [];
    const wireSpecs: BoxSpec[] = [];
    const craneSpecs: BoxSpec[] = [];
    const siloSpecs: BoxSpec[] = [];
    const rebarSpecs: BoxSpec[] = [];

    const base = -12;
    const zStart = -515;
    const zEnd = -655;

    const buildings = Math.floor(30 * s);
    for (let i = 0; i < buildings; i++) {
      const z = rng.range(zEnd, zStart);
      const side = rng.chance(0.5) ? 1 : -1;
      // Camera climbs the x:10..16 side of this district — towers must clear it.
      const x = side * rng.range(38, 96);
      const w = rng.range(10, 22);
      const d = rng.range(10, 22);
      const floors = rng.int(6, 20);
      const floorH = 3.4;
      // Where construction has reached on this particular tower.
      const done = rng.int(2, floors);

      for (let f = 0; f < floors; f++) {
        const y = base + f * floorH + floorH / 2;
        const spec: BoxSpec = { pos: [x, y, z], size: [w, floorH * 0.86, d] };
        if (f < done) solidSpecs.push(spec);
        else wireSpecs.push(spec);
      }
    }

    // Tower cranes: mast, jib, counter-jib.
    const craneCount = Math.floor(9 * s);
    for (let i = 0; i < craneCount; i++) {
      const z = rng.range(zEnd, zStart);
      const x = (rng.chance(0.5) ? 1 : -1) * rng.range(38, 86);
      const h = rng.range(46, 82);
      craneSpecs.push({ pos: [x, base + h / 2, z], size: [2.2, h, 2.2] });
      const jibRot = rng.range(0, Math.PI * 2);
      craneSpecs.push({
        pos: [x, base + h, z],
        size: [rng.range(40, 68), 1.6, 1.8],
        rotY: jibRot,
      });
      craneSpecs.push({
        pos: [
          x - Math.cos(jibRot) * 13,
          base + h + 3,
          z - Math.sin(jibRot) * 13,
        ],
        size: [10, 3.2, 2.4],
        rotY: jibRot,
      });
    }

    // Cement silos.
    const siloCount = Math.floor(16 * s);
    for (let i = 0; i < siloCount; i++) {
      const h = rng.range(12, 26);
      siloSpecs.push({
        pos: [
          (rng.chance(0.5) ? 1 : -1) * rng.range(36, 84),
          base + h / 2,
          rng.range(zEnd, zStart),
        ],
        size: [rng.range(3.5, 7), h, rng.range(3.5, 7)],
      });
    }

    // Iron rod and steel bundles stacked at grade.
    const rebarCount = Math.floor(120 * s);
    for (let i = 0; i < rebarCount; i++) {
      const gx = (rng.chance(0.5) ? 1 : -1) * rng.range(32, 74);
      const gz = rng.range(zEnd, zStart);
      rebarSpecs.push({
        pos: [gx + rng.spread(3), base + rng.range(0.3, 2.4), gz + rng.spread(3)],
        size: [rng.range(0.35, 0.8), rng.range(11, 20), rng.range(0.35, 0.8)],
        rotY: rng.spread(0.5),
      });
    }

    return {
      solidSpecs,
      craneSpecs,
      siloSpecs,
      rebarSpecs,
      wireGeom: buildBoxEdges(wireSpecs),
    };
  }, []);

  useEffect(() => {
    if (solid.current) applyBoxInstances(solid.current, solidSpecs);
    if (cranes.current) applyBoxInstances(cranes.current, craneSpecs);
    if (silos.current) applyBoxInstances(silos.current, siloSpecs);
    if (rebar.current) {
      // Rod bundles lie flat — rotate onto Z like the pipes.
      const dummy = new THREE.Object3D();
      for (let i = 0; i < rebarSpecs.length; i++) {
        const p = rebarSpecs[i];
        dummy.position.set(...p.pos);
        dummy.rotation.set(Math.PI / 2, p.rotY ?? 0, 0);
        dummy.scale.set(p.size[0], p.size[1], p.size[2]);
        dummy.updateMatrix();
        rebar.current.setMatrixAt(i, dummy.matrix);
      }
      rebar.current.instanceMatrix.needsUpdate = true;
      rebar.current.computeBoundingSphere();
    }
  }, [solidSpecs, craneSpecs, siloSpecs, rebarSpecs]);

  const wireRef = useRef<THREE.LineSegments>(null);
  useFrame(() => {
    if (!wireRef.current) return;
    // Unbuilt floors pulse gently — the drawing is still live.
    const m = wireRef.current.material as THREE.LineBasicMaterial;
    const enter = smoothstep(CH.start - 0.04, CH.start + 0.05, journey.t);
    m.opacity = 0.55 * enter;
  });

  return (
    <District chapter={CH} margin={0.09}>
      <group>
        <instancedMesh
          ref={solid}
          args={[undefined, undefined, solidSpecs.length]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#8a8378" metalness={0.35} roughness={0.82} />
        </instancedMesh>

        <lineSegments ref={wireRef} geometry={wireGeom} frustumCulled={false}>
          <lineBasicMaterial
            color="#ffc98a"
            transparent
            opacity={0.55}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>

        <instancedMesh
          ref={cranes}
          args={[undefined, undefined, craneSpecs.length]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#c4761f" metalness={0.6} roughness={0.55} />
        </instancedMesh>

        <instancedMesh
          ref={silos}
          args={[undefined, undefined, siloSpecs.length]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[1, 1, 1, 14]} />
          <meshStandardMaterial color="#9a9184" metalness={0.5} roughness={0.7} />
        </instancedMesh>

        <instancedMesh
          ref={rebar}
          args={[undefined, undefined, rebarSpecs.length]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[1, 1, 1, 6]} />
          <meshStandardMaterial color="#6b5c4a" metalness={0.85} roughness={0.6} />
        </instancedMesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -12, -585]}>
          <planeGeometry args={[420, 320]} />
          <meshStandardMaterial color="#241f19" metalness={0.2} roughness={0.95} />
        </mesh>

        {/* Cement and aggregate dust */}
        <Particles
          count={800}
          bounds={[80, 40, 90]}
          color="#e8d3b0"
          size={2.6}
          opacity={0.3}
          drift={3.4}
          rise={0.5}
          falloff={0.014}
          position={[0, 8, -585]}
          seed={41}
        />
      </group>
    </District>
  );
}
