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

const CH = CHAPTERS[4];

/**
 * Division V — Industrial Solutions.
 *
 * The brief asks for scale, so scale is what this district is built to deliver:
 * the structures are sized so the camera passes *beneath* gantries and *between*
 * silos rather than looking at them from outside. Nothing communicates industrial
 * mass like having to travel through it.
 */
export function Industrial() {
  const halls = useRef<THREE.InstancedMesh>(null);
  const vessels = useRef<THREE.InstancedMesh>(null);
  const pipes = useRef<THREE.InstancedMesh>(null);
  const furnaces = useRef<THREE.InstancedMesh>(null);

  const specs = useMemo(() => {
    const rng = makeRng(770077);
    const s = tierScale();
    const halls: BoxSpec[] = [];
    const vessels: BoxSpec[] = [];
    const pipes: BoxSpec[] = [];
    const furnaces: BoxSpec[] = [];

    const base = -14;
    const zStart = -360;
    const zEnd = -495;

    // Plant halls and overhead gantries lining the route.
    const hallCount = Math.floor(30 * s);
    for (let i = 0; i < hallCount; i++) {
      const z = rng.range(zEnd, zStart);
      const side = rng.chance(0.5) ? 1 : -1;
      // Camera swings out to x:-14 here and halls are up to 40 across.
      const x = side * rng.range(44, 96);
      const h = rng.range(14, 34);
      halls.push({
        pos: [x, base + h / 2, z],
        size: [rng.range(18, 40), h, rng.range(16, 34)],
        rotY: rng.spread(0.2),
      });
    }

    // Overhead gantry beams spanning the corridor — the camera flies under these.
    const gantryCount = Math.floor(14 * s);
    for (let i = 0; i < gantryCount; i++) {
      const z = zStart - (i / gantryCount) * (zStart - zEnd);
      // Raised so the camera (y:6..12 through here) passes cleanly beneath the
      // span rather than clipping it.
      const y = base + rng.range(32, 42);
      halls.push({ pos: [0, y, z], size: [rng.range(90, 130), 2.2, 3], rotY: 0 });
      halls.push({ pos: [-38, base + 12, z], size: [3, 26, 3] });
      halls.push({ pos: [38, base + 12, z], size: [3, 26, 3] });
    }

    // Pressure vessels and silos.
    const vesselCount = Math.floor(34 * s);
    for (let i = 0; i < vesselCount; i++) {
      const z = rng.range(zEnd, zStart);
      const side = rng.chance(0.5) ? 1 : -1;
      const h = rng.range(16, 42);
      vessels.push({
        pos: [side * rng.range(34, 84), base + h / 2, z],
        size: [rng.range(4, 11), h, rng.range(4, 11)],
      });
    }

    // Pipe runs — long horizontals threading the whole district.
    const pipeCount = Math.floor(26 * s);
    for (let i = 0; i < pipeCount; i++) {
      const z = rng.range(zEnd, zStart);
      const y = base + rng.range(4, 30);
      const side = rng.chance(0.5) ? 1 : -1;
      pipes.push({
        pos: [side * rng.range(30, 72), y, z],
        size: [rng.range(0.5, 1.4), rng.range(30, 90), rng.range(0.5, 1.4)],
        rotY: 0,
      });
    }

    // Furnace mouths — the light source that gives the district its colour.
    const furnaceCount = Math.floor(16 * s);
    for (let i = 0; i < furnaceCount; i++) {
      const z = rng.range(zEnd, zStart);
      const side = rng.chance(0.5) ? 1 : -1;
      furnaces.push({
        pos: [side * rng.range(30, 62), base + rng.range(3, 16), z],
        size: [rng.range(3, 8), rng.range(2, 6), 1],
        rotY: rng.spread(0.5),
      });
    }

    return { halls, vessels, pipes, furnaces };
  }, []);

  useEffect(() => {
    if (halls.current) applyBoxInstances(halls.current, specs.halls);
    if (vessels.current) applyBoxInstances(vessels.current, specs.vessels);
    if (furnaces.current) applyBoxInstances(furnaces.current, specs.furnaces);

    // Pipes are cylinders laid horizontally: rotate the instance onto Z.
    if (pipes.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < specs.pipes.length; i++) {
        const p = specs.pipes[i];
        dummy.position.set(...p.pos);
        dummy.rotation.set(Math.PI / 2, 0, 0);
        dummy.scale.set(p.size[0], p.size[1], p.size[2]);
        dummy.updateMatrix();
        pipes.current.setMatrixAt(i, dummy.matrix);
      }
      pipes.current.instanceMatrix.needsUpdate = true;
      pipes.current.computeBoundingSphere();
    }
  }, [specs]);

  const flickerRef = useRef<THREE.MeshBasicMaterial>(null);
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (journey.reducedMotion || !flickerRef.current) return;
    elapsed.current += Math.min(delta, 0.05);
    const e = elapsed.current;
    // Furnace light is never steady — irregular flicker sells the heat.
    const f =
      0.72 +
      Math.sin(e * 7.3) * 0.11 +
      Math.sin(e * 13.7) * 0.07 +
      Math.sin(e * 2.1) * 0.1;
    flickerRef.current.opacity = f;
  });

  return (
    <District chapter={CH} margin={0.09}>
      <group>
        <instancedMesh
          ref={halls}
          args={[undefined, undefined, specs.halls.length]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#3a3630" metalness={0.85} roughness={0.62} />
        </instancedMesh>

        <instancedMesh
          ref={vessels}
          args={[undefined, undefined, specs.vessels.length]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[1, 1, 1, 16]} />
          <meshStandardMaterial color="#4a453d" metalness={0.92} roughness={0.45} />
        </instancedMesh>

        <instancedMesh
          ref={pipes}
          args={[undefined, undefined, specs.pipes.length]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[1, 1, 1, 10]} />
          <meshStandardMaterial color="#55504a" metalness={0.9} roughness={0.5} />
        </instancedMesh>

        <instancedMesh
          ref={furnaces}
          args={[undefined, undefined, specs.furnaces.length]}
          frustumCulled={false}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={flickerRef}
            color="#ff7420"
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </instancedMesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -14, -425]}>
          <planeGeometry args={[400, 300]} />
          <meshStandardMaterial color="#141009" metalness={0.6} roughness={0.8} />
        </mesh>

        <Particles
          count={900}
          bounds={[70, 30, 80]}
          color="#ff9038"
          size={3.4}
          opacity={0.6}
          drift={2.6}
          rise={1.1}
          // Falloff is tuned against the chapter's fog density, not chosen for
          // looks in isolation: particles carry their own distance fade, and a
          // weaker one than the fog lets a district's embers punch through haze
          // that is already hiding its geometry — warm dust drifting through the
          // neighbouring blue district.
          falloff={0.019}
          position={[0, 6, -425]}
          seed={31}
        />
      </group>
    </District>
  );
}
