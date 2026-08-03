'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHAPTERS, clamp, smoothstep } from '@/lib/journey';
import { journey } from '@/lib/journeyState';
import { makeRng } from '@/lib/rng';
import { rectFramePoints } from '@/lib/geometry';
import { Particles } from './Particles';
import { District } from './District';

const FORGE = CHAPTERS[0];
const DESCENT = CHAPTERS[1];

const SHARD_COUNT = 240;
const FRAME_W = 17;
const FRAME_H = 11;

/**
 * Scene I — steel assembling itself into a portal, then the floor giving way.
 *
 * The wordmark is deliberately NOT 3D text. Real HTML typography sits over this
 * in the overlay: it stays crisp at any DPR, it is selectable, it is the
 * document's actual <h1> for search and screen readers, and it costs nothing to
 * render. The 3D supplies the forge; the DOM supplies the word.
 */
export function Forge() {
  const shards = useRef<THREE.InstancedMesh>(null);
  const cracks = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const data = useMemo(() => {
    const rng = makeRng(20260802);
    const targets = rectFramePoints(SHARD_COUNT, FRAME_W, FRAME_H, 1.5, rng.next);

    const origins: THREE.Vector3[] = [];
    const spin: THREE.Vector3[] = [];
    const settle: THREE.Euler[] = [];
    const scales: THREE.Vector3[] = [];
    const phase: number[] = [];

    for (let i = 0; i < SHARD_COUNT; i++) {
      // Scattered start: a wide shell around the eventual portal.
      const theta = rng.range(0, Math.PI * 2);
      const r = rng.range(26, 62);
      origins.push(
        new THREE.Vector3(
          Math.cos(theta) * r,
          rng.range(-16, 30),
          Math.sin(theta) * r * 0.7 + rng.range(-14, 14)
        )
      );
      spin.push(
        new THREE.Vector3(rng.spread(1.4), rng.spread(1.4), rng.spread(1.4))
      );
      settle.push(
        new THREE.Euler(rng.spread(0.32), rng.spread(0.5), rng.spread(0.32))
      );
      // Long thin slabs read as forged plate rather than gravel.
      scales.push(
        new THREE.Vector3(
          rng.range(0.7, 2.9),
          rng.range(0.16, 0.44),
          rng.range(0.5, 1.5)
        )
      );
      // Staggered arrival — the frame assembles progressively, not all at once.
      phase.push(rng.range(0, 0.55));
    }

    return { targets, origins, spin, settle, scales, phase };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += Math.min(delta, 0.05);
    const e = elapsed.current;
    const t = journey.t;

    // Assembly runs across the forge chapter.
    const assemble = smoothstep(0.004, 0.072, t);

    const mesh = shards.current;
    if (mesh) {
      for (let i = 0; i < SHARD_COUNT; i++) {
        const p = clamp((assemble - data.phase[i]) / (1 - data.phase[i]));
        // Ease-out-quart: fragments decelerate hard as they lock into place,
        // which is what gives the assembly its sense of mass.
        const k = 1 - Math.pow(1 - p, 4);

        tmp.copy(data.origins[i]).lerp(data.targets[i], k);

        // Residual float before lock, fading to nothing as k → 1.
        const wobble = (1 - k) * 1.5;
        if (!journey.reducedMotion && wobble > 0.001) {
          tmp.x += Math.sin(e * 0.7 + i) * wobble * 0.4;
          tmp.y += Math.cos(e * 0.55 + i * 1.3) * wobble * 0.4;
        }

        dummy.position.copy(tmp);
        dummy.rotation.set(
          data.settle[i].x + data.spin[i].x * (1 - k) * 5,
          data.settle[i].y + data.spin[i].y * (1 - k) * 5,
          data.settle[i].z + data.spin[i].z * (1 - k) * 5
        );
        dummy.scale.copy(data.scales[i]).multiplyScalar(0.35 + k * 0.65);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Steel cools as it locks — white-hot scatter to dark forged plate.
    if (matRef.current) {
      const heat = 1 - smoothstep(0.01, 0.085, t);
      matRef.current.emissiveIntensity = 0.12 + heat * 2.6;
    }

    // The floor opens during the descent chapter.
    if (cracks.current) {
      const open = smoothstep(DESCENT.start - 0.02, DESCENT.end - 0.01, t);
      cracks.current.scale.setScalar(0.02 + open * 1.6);
      cracks.current.visible = open > 0.001;
      const m = cracks.current.children[0] as THREE.Mesh | undefined;
      if (m && m.material instanceof THREE.MeshBasicMaterial) {
        m.material.opacity = open * 0.9;
      }
    }
  });

  const crackGeometry = useMemo(() => {
    // Radial fracture: thin wedges fanning out from the portal's footing.
    const rng = makeRng(7717);
    const positions: number[] = [];

    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + rng.spread(0.1);
      const len = rng.range(6, 22);
      const w = rng.range(0.06, 0.3);
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const nx = -sin * w;
      const nz = cos * w;
      // Two triangles forming a tapered sliver.
      positions.push(
        nx, 0, nz,
        -nx, 0, -nz,
        cos * len, 0, sin * len
      );
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(positions), 3)
    );
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }, []);

  return (
    <District chapter={FORGE} margin={0.14}>
      <group position={FORGE.anchor}>
        {/* Forged steel */}
        <instancedMesh
          ref={shards}
          args={[undefined, undefined, SHARD_COUNT]}
          frustumCulled={false}
          castShadow={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            ref={matRef}
            color="#4a4e57"
            metalness={0.96}
            roughness={0.34}
            emissive="#ff5a1a"
            emissiveIntensity={2.4}
          />
        </instancedMesh>

        {/* Molten fracture in the floor */}
        <group ref={cracks} position={[0, -2.48, 0]}>
          <mesh geometry={crackGeometry}>
            <meshBasicMaterial
              color="#ff6a24"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* Foundry floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
          <circleGeometry args={[120, 48]} />
          {/*
            Rough, not mirrored. A polished metal floor this large turns the key
            light into one enormous specular hotspot that bloom then amplifies
            into a blown-out blob — it reads as a rendering error rather than as
            a foundry floor.
          */}
          <meshStandardMaterial
            color="#0a0a0d"
            metalness={0.45}
            roughness={0.82}
          />
        </mesh>

        {/* Rising embers + suspended industrial dust */}
        <Particles
          count={700}
          bounds={[34, 26, 34]}
          color="#ff9a4d"
          size={4.5}
          opacity={0.85}
          drift={1.8}
          rise={1.6}
          falloff={0.012}
          position={[0, 6, 0]}
          seed={3}
        />
        <Particles
          count={500}
          bounds={[46, 30, 46]}
          color="#8b97ab"
          size={2.4}
          opacity={0.28}
          drift={2.6}
          rise={0.22}
          falloff={0.01}
          position={[0, 8, 0]}
          seed={9}
        />
      </group>
    </District>
  );
}
