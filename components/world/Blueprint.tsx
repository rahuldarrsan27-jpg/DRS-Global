'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHAPTERS, clamp, smoothstep } from '@/lib/journey';
import { journey } from '@/lib/journeyState';
import { makeRng } from '@/lib/rng';
import { buildBoxEdges, applyBoxInstances, type BoxSpec } from '@/lib/geometry';
import { Particles } from './Particles';
import { District } from './District';

const CH = CHAPTERS[2];

/**
 * Scene III — the master blueprint, becoming real.
 *
 * The same set of volumes is rendered twice: once as glowing wireframe edges,
 * once as solid mass. Crossing the chapter, the wireframe dissolves as the
 * solid resolves — so the visitor watches the drawing turn into the thing it
 * describes, rather than being shown two different places.
 *
 * Both passes are single draw calls (one merged LineSegments, one InstancedMesh)
 * so the entire district costs two calls regardless of how many structures it
 * contains.
 */
export function Blueprint() {
  const solid = useRef<THREE.InstancedMesh>(null);
  const wire = useRef<THREE.LineSegments>(null);
  const grid = useRef<THREE.LineSegments>(null);

  const specs = useMemo<BoxSpec[]>(() => {
    const rng = makeRng(48213);
    const out: BoxSpec[] = [];

    // The camera runs roughly z:+20 → -170 through here. Structures line both
    // sides of the corridor with a clear channel down the middle.
    for (let z = 30; z > -200; z -= rng.range(9, 20)) {
      const side = rng.chance(0.5) ? 1 : -1;
      // Inner edge must clear the flight path allowing for the widest volume
      // placed here (~40 across), otherwise the camera flies through solid mass.
      const offset = side * rng.range(36, 92);
      const kind = rng.next();

      if (kind < 0.28) {
        // Process towers / stacks
        const h = rng.range(18, 46);
        out.push({
          pos: [offset, -34 + h / 2, z],
          size: [rng.range(4, 9), h, rng.range(4, 9)],
          rotY: rng.spread(0.4),
        });
      } else if (kind < 0.5) {
        // Plant halls
        const h = rng.range(8, 18);
        out.push({
          pos: [offset, -34 + h / 2, z],
          size: [rng.range(16, 34), h, rng.range(12, 26)],
          rotY: rng.spread(0.25),
        });
      } else if (kind < 0.7) {
        // Gantry / crane frames — verticals plus a boom
        const h = rng.range(20, 34);
        const legGap = rng.range(8, 16);
        out.push({ pos: [offset - legGap / 2, -34 + h / 2, z], size: [1.6, h, 1.6] });
        out.push({ pos: [offset + legGap / 2, -34 + h / 2, z], size: [1.6, h, 1.6] });
        out.push({
          pos: [offset + rng.range(-6, 6), -34 + h, z],
          size: [rng.range(22, 38), 1.4, 2.2],
          rotY: rng.spread(0.3),
        });
      } else if (kind < 0.86) {
        // Transmission pylons
        const h = rng.range(26, 40);
        out.push({ pos: [offset, -34 + h / 2, z], size: [2, h, 2] });
        out.push({ pos: [offset, -34 + h * 0.82, z], size: [rng.range(12, 18), 0.8, 1] });
        out.push({ pos: [offset, -34 + h * 0.62, z], size: [rng.range(9, 14), 0.8, 1] });
      } else {
        // Low sheds / terminals
        out.push({
          pos: [offset, -31, z],
          size: [rng.range(20, 40), 6, rng.range(14, 24)],
          rotY: rng.spread(0.2),
        });
      }
    }

    return out;
  }, []);

  const wireGeometry = useMemo(() => buildBoxEdges(specs), [specs]);

  const gridGeometry = useMemo(() => {
    // Ground plane grid, drawn as one LineSegments.
    const pos: number[] = [];
    const half = 150;
    const step = 10;
    const y = -34.2;
    for (let i = -half; i <= half; i += step) {
      pos.push(-half, y, i, half, y, i);
      pos.push(i, y, -half - 60, i, y, half);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(pos), 3)
    );
    g.computeBoundingSphere();
    return g;
  }, []);

  useEffect(() => {
    if (solid.current) applyBoxInstances(solid.current, specs);
  }, [specs]);

  useFrame(() => {
    const t = journey.t;

    // Reality resolves across the back half of the chapter.
    const real = smoothstep(CH.start + 0.045, CH.end + 0.015, t);

    if (wire.current) {
      const m = wire.current.material as THREE.LineBasicMaterial;
      m.opacity = clamp(1 - real) * 0.85;
      wire.current.visible = m.opacity > 0.004;
    }
    if (grid.current) {
      const m = grid.current.material as THREE.LineBasicMaterial;
      m.opacity = clamp(1 - real * 0.85) * 0.3;
    }
    if (solid.current) {
      const m = solid.current.material as THREE.MeshStandardMaterial;
      m.opacity = real;
      solid.current.visible = real > 0.004;
    }
  });

  return (
    <District chapter={CH} margin={0.1}>
      <group position={[0, 0, -70]}>
        <group position={[0, 0, 70]}>
          <lineSegments ref={wire} geometry={wireGeometry} frustumCulled={false}>
            <lineBasicMaterial
              color="#4d9bff"
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </lineSegments>

          <lineSegments ref={grid} geometry={gridGeometry} frustumCulled={false}>
            <lineBasicMaterial
              color="#2f6fd0"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </lineSegments>

          <instancedMesh
            ref={solid}
            args={[undefined, undefined, specs.length]}
            frustumCulled={false}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color="#6a7180"
              metalness={0.7}
              roughness={0.55}
              transparent
              opacity={0}
            />
          </instancedMesh>
        </group>

        <Particles
          count={800}
          bounds={[70, 30, 110]}
          color="#6fb4ff"
          size={2.6}
          opacity={0.4}
          drift={2.4}
          rise={0.3}
          falloff={0.013}
          position={[0, -18, 0]}
          seed={17}
        />
      </group>
    </District>
  );
}
