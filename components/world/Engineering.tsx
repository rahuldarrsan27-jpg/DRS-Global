'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHAPTERS, pathCurve } from '@/lib/journey';
import { journey, tierScale } from '@/lib/journeyState';
import { makeRng } from '@/lib/rng';
import { applyBoxInstances, type BoxSpec } from '@/lib/geometry';
import { Particles } from './Particles';
import { District } from './District';

const CH = CHAPTERS[8];

/**
 * Division IX — Engineering.
 *
 * The tunnel is generated from the camera's own spline.
 *
 * Sampling the journey curve across this chapter and lofting a tube along it
 * guarantees the tunnel bends exactly where the camera bends — no hand-placed
 * segment can drift out of alignment, and the walls stay a constant distance
 * from the lens for the whole descent. The world is derived from the camera
 * move rather than the camera being threaded through the world.
 */
export function Engineering() {
  const cabinets = useRef<THREE.InstancedMesh>(null);
  const trays = useRef<THREE.InstancedMesh>(null);
  const lamps = useRef<THREE.InstancedMesh>(null);

  const tunnelGeom = useMemo(() => {
    // Sample the real camera path across this chapter, padded either side so
    // the tunnel mouth is already around the lens before the chapter opens.
    const from = CH.start - 0.035;
    const to = CH.end + 0.03;
    const segments = 90;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = from + (to - from) * (i / segments);
      pts.push(pathCurve.getPointAt(Math.min(Math.max(t, 0), 1)));
    }
    const spine = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
    return new THREE.TubeGeometry(spine, 140, 15, 20, false);
  }, []);

  const { cabinetSpecs, traySpecs, lampSpecs } = useMemo(() => {
    const rng = makeRng(909090);
    const s = tierScale();
    const cabinetSpecs: BoxSpec[] = [];
    const traySpecs: BoxSpec[] = [];
    const lampSpecs: BoxSpec[] = [];

    // Fixtures are placed relative to the same spine, offset to the tunnel wall.
    const from = CH.start - 0.02;
    const to = CH.end + 0.01;
    const count = Math.floor(64 * s);
    const up = new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3();
    const side = new THREE.Vector3();
    const p = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      const t = from + (to - from) * (i / count);
      const ct = Math.min(Math.max(t, 0), 1);
      pathCurve.getPointAt(ct, p);
      pathCurve.getTangentAt(ct, tangent);
      side.crossVectors(tangent, up).normalize();

      const dir = i % 2 === 0 ? 1 : -1;
      const wall = 11.5;

      // Switchgear cabinets against the wall
      if (i % 2 === 0) {
        cabinetSpecs.push({
          pos: [
            p.x + side.x * wall * dir,
            p.y - 8,
            p.z + side.z * wall * dir,
          ],
          size: [2.4, 5.2, 1.4],
          rotY: Math.atan2(tangent.x, tangent.z),
        });
      }

      // Cable trays running the length of both walls
      traySpecs.push({
        pos: [
          p.x + side.x * wall * dir,
          p.y + rng.range(2, 6),
          p.z + side.z * wall * dir,
        ],
        size: [0.9, 0.35, 9],
        rotY: Math.atan2(tangent.x, tangent.z),
      });

      // Indicator lamps
      lampSpecs.push({
        pos: [
          p.x + side.x * (wall - 0.6) * dir,
          p.y + rng.range(-6, 7),
          p.z + side.z * (wall - 0.6) * dir,
        ],
        size: [0.5, 0.5, 0.5],
        rotY: 0,
      });
    }

    return { cabinetSpecs, traySpecs, lampSpecs };
  }, []);

  useEffect(() => {
    if (cabinets.current) applyBoxInstances(cabinets.current, cabinetSpecs);
    if (trays.current) applyBoxInstances(trays.current, traySpecs);
    if (lamps.current) {
      applyBoxInstances(lamps.current, lampSpecs);
      const rng = makeRng(454545);
      const c = new THREE.Color();
      for (let i = 0; i < lampSpecs.length; i++) {
        // Mostly cyan status, occasional amber warning.
        if (rng.chance(0.18)) c.set('#ffa53d');
        else c.set('#5fd8ff');
        lamps.current.setColorAt(i, c);
      }
      if (lamps.current.instanceColor) lamps.current.instanceColor.needsUpdate = true;
    }
  }, [cabinetSpecs, traySpecs, lampSpecs]);

  const lampMat = useRef<THREE.MeshBasicMaterial>(null);
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (journey.reducedMotion || !lampMat.current) return;
    elapsed.current += Math.min(delta, 0.05);
    // Slow collective breathing across the indicator field.
    lampMat.current.opacity = 0.72 + Math.sin(elapsed.current * 1.7) * 0.18;
  });

  return (
    <District chapter={CH} margin={0.08}>
      <group>
        {/* Tunnel bore — rendered from the inside */}
        <mesh geometry={tunnelGeom} frustumCulled={false}>
          <meshStandardMaterial
            color="#1a1f24"
            metalness={0.55}
            roughness={0.85}
            side={THREE.BackSide}
          />
        </mesh>

        <instancedMesh
          ref={cabinets}
          args={[undefined, undefined, Math.max(cabinetSpecs.length, 1)]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#33393f" metalness={0.85} roughness={0.45} />
        </instancedMesh>

        <instancedMesh
          ref={trays}
          args={[undefined, undefined, Math.max(traySpecs.length, 1)]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#4a5158" metalness={0.9} roughness={0.4} />
        </instancedMesh>

        <instancedMesh
          ref={lamps}
          args={[undefined, undefined, Math.max(lampSpecs.length, 1)]}
          frustumCulled={false}
        >
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial
            ref={lampMat}
            color="#ffffff"
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </instancedMesh>

        <Particles
          count={500}
          bounds={[14, 14, 90]}
          color="#7fe4ff"
          size={2.2}
          opacity={0.35}
          drift={1.2}
          rise={0.4}
          falloff={0.014}
          position={[2, -16, -1060]}
          seed={79}
        />
      </group>
    </District>
  );
}
