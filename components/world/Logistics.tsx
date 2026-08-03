'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CHAPTERS } from '@/lib/journey';
import { tierScale } from '@/lib/journeyState';
import { makeRng } from '@/lib/rng';
import { applyBoxInstances, type BoxSpec } from '@/lib/geometry';
import { Particles } from './Particles';
import { District } from './District';

const CH = CHAPTERS[6];

// Real container livery — muted, oxidised, never saturated.
const LIVERY = [
  '#7d3b2e', '#2f4d63', '#3d5a45', '#6b6a66',
  '#8a5b28', '#40404a', '#5d6b74', '#93331f',
];

/**
 * Division VII — Logistics.
 *
 * The stacks are the district. Thousands of containers in a single instanced
 * draw, coloured from a deliberately desaturated livery palette — bright primary
 * containers are the fastest way to make a port look like a toy.
 *
 * At the end of the run the camera passes through the interior of one container,
 * built from four planes so both ends stay open.
 */
export function Logistics() {
  const containers = useRef<THREE.InstancedMesh>(null);
  const cranes = useRef<THREE.InstancedMesh>(null);
  const hull = useRef<THREE.InstancedMesh>(null);

  const { containerSpecs, craneSpecs, hullSpecs } = useMemo(() => {
    const rng = makeRng(606060);
    const s = tierScale();
    const containerSpecs: BoxSpec[] = [];
    const craneSpecs: BoxSpec[] = [];
    const hullSpecs: BoxSpec[] = [];

    const base = -8;
    const zStart = -675;
    const zEnd = -800;

    // Container blocks: rows of stacks, aligned like a real terminal yard.
    const blocks = Math.floor(22 * s);
    for (let b = 0; b < blocks; b++) {
      // Camera runs out to x:-14 and each block grows inward by up to ~14, so
      // the block origin has to start well clear of the quay centre line.
      const bx = (rng.chance(0.5) ? 1 : -1) * rng.range(36, 96);
      const bz = rng.range(zEnd, zStart);
      const rows = rng.int(2, 5);
      const cols = rng.int(3, 7);
      const high = rng.int(2, 6);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Stacks are uneven — a perfectly flat yard looks generated.
          const h = Math.max(1, high - rng.int(0, 2));
          for (let y = 0; y < h; y++) {
            containerSpecs.push({
              pos: [
                bx + r * 2.7 + rng.spread(0.05),
                base + 1.3 + y * 2.6,
                bz + c * 6.4 + rng.spread(0.08),
              ],
              size: [2.5, 2.5, 6.1],
              rotY: 0,
            });
          }
        }
      }
    }

    // Ship-to-shore gantry cranes straddling the quay.
    const craneCount = Math.floor(6 * s);
    for (let i = 0; i < craneCount; i++) {
      const z = zStart - (i / Math.max(craneCount, 1)) * (zStart - zEnd);
      const x = rng.chance(0.5) ? 46 : -46;
      const h = rng.range(44, 62);
      craneSpecs.push({ pos: [x - 14, base + h / 2, z], size: [3, h, 3] });
      craneSpecs.push({ pos: [x + 14, base + h / 2, z], size: [3, h, 3] });
      craneSpecs.push({ pos: [x, base + h, z], size: [3, 3, 76], rotY: 0 });
      craneSpecs.push({ pos: [x, base + h - 9, z], size: [30, 2.4, 3] });
    }

    // Vessel hulls beyond the quay line.
    for (let i = 0; i < 3; i++) {
      hullSpecs.push({
        pos: [rng.chance(0.5) ? 104 : -104, base + 6, rng.range(zEnd, zStart)],
        size: [26, 16, rng.range(120, 190)],
        rotY: rng.spread(0.04),
      });
    }

    return { containerSpecs, craneSpecs, hullSpecs };
  }, []);

  useEffect(() => {
    if (containers.current) {
      applyBoxInstances(containers.current, containerSpecs);
      const rng = makeRng(818181);
      const c = new THREE.Color();
      for (let i = 0; i < containerSpecs.length; i++) {
        c.set(rng.pick(LIVERY));
        // Per-unit weathering so identical boxes don't read as clones.
        c.multiplyScalar(rng.range(0.72, 1.12));
        containers.current.setColorAt(i, c);
      }
      if (containers.current.instanceColor) {
        containers.current.instanceColor.needsUpdate = true;
      }
    }
    if (cranes.current) applyBoxInstances(cranes.current, craneSpecs);
    if (hull.current) applyBoxInstances(hull.current, hullSpecs);
  }, [containerSpecs, craneSpecs, hullSpecs]);

  // The container the camera travels through. Four planes, both ends open.
  const tunnel = useMemo(() => {
    const cx = -12;
    const cy = 6;
    const cz = -812;
    const w = 7.5;
    const h = 6.5;
    const len = 52;
    return { cx, cy, cz, w, h, len };
  }, []);

  return (
    <District chapter={CH} margin={0.09}>
      <group>
        <instancedMesh
          ref={containers}
          args={[undefined, undefined, containerSpecs.length]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#ffffff"
            metalness={0.62}
            roughness={0.72}
          />
        </instancedMesh>

        <instancedMesh
          ref={cranes}
          args={[undefined, undefined, craneSpecs.length]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#4e5964" metalness={0.8} roughness={0.5} />
        </instancedMesh>

        <instancedMesh
          ref={hull}
          args={[undefined, undefined, hullSpecs.length]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#232a33" metalness={0.7} roughness={0.6} />
        </instancedMesh>

        {/* Interior of the container the camera flies through */}
        <group position={[tunnel.cx, tunnel.cy, tunnel.cz]}>
          <mesh position={[0, tunnel.h, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[tunnel.w * 2, tunnel.len]} />
            <meshStandardMaterial color="#5e2f24" metalness={0.6} roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -tunnel.h, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[tunnel.w * 2, tunnel.len]} />
            <meshStandardMaterial color="#4a2a20" metalness={0.6} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-tunnel.w, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[tunnel.len, tunnel.h * 2]} />
            <meshStandardMaterial color="#633326" metalness={0.6} roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[tunnel.w, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[tunnel.len, tunnel.h * 2]} />
            <meshStandardMaterial color="#5a2e22" metalness={0.6} roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Quay */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, -745]}>
          <planeGeometry args={[440, 340]} />
          <meshStandardMaterial color="#161c22" metalness={0.45} roughness={0.88} />
        </mesh>

        {/* Sea haze */}
        <Particles
          count={700}
          bounds={[90, 26, 100]}
          color="#a8c8e0"
          size={3.2}
          opacity={0.26}
          drift={4.2}
          rise={0.18}
          falloff={0.013}
          position={[0, 2, -745]}
          seed={53}
        />
      </group>
    </District>
  );
}
