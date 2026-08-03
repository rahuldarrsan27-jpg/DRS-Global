'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { pathCurve, focusCurve, clamp } from '@/lib/journey';
import { journey } from '@/lib/journeyState';

const EPS = 0.0012;

/**
 * Drives the camera along the journey.
 *
 * Position and focus are sampled from their own splines, then damped. On top of
 * that sit three things that make the move read as *photographed* rather than
 * interpolated:
 *
 *  - banking: the rig rolls into lateral turns, like a crane arm carrying weight
 *  - breathing: a slow, tiny handheld drift so no frame is ever perfectly still
 *  - FOV response: the lens widens fractionally with scroll speed
 *
 * All three collapse to zero under prefers-reduced-motion.
 */
export function CameraRig() {
  const { camera } = useThree();

  const v = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      focus: new THREE.Vector3(),
      ahead: new THREE.Vector3(),
      behind: new THREE.Vector3(),
      tangentA: new THREE.Vector3(),
      tangentB: new THREE.Vector3(),
      cross: new THREE.Vector3(),
      up: new THREE.Vector3(0, 1, 0),
      smoothPos: new THREE.Vector3(0, 2.5, 14),
      smoothFocus: new THREE.Vector3(0, 2.5, 0),
      m: new THREE.Matrix4(),
      q: new THREE.Quaternion(),
    }),
    []
  );

  const roll = useRef(0);
  const fov = useRef(52);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    elapsed.current += dt;

    const t = clamp(journey.t);
    const reduced = journey.reducedMotion;

    pathCurve.getPointAt(t, v.pos);
    focusCurve.getPointAt(t, v.focus);

    // --- handheld breathing -------------------------------------------------
    if (!reduced) {
      const e = elapsed.current;
      v.pos.x += Math.sin(e * 0.31) * 0.16 + Math.sin(e * 0.73) * 0.06;
      v.pos.y += Math.cos(e * 0.27) * 0.13 + Math.sin(e * 0.61) * 0.05;
      v.focus.x += Math.sin(e * 0.19) * 0.1;
      v.focus.y += Math.cos(e * 0.23) * 0.08;
    }

    // --- damping ------------------------------------------------------------
    const k = reduced ? 1 : 1 - Math.pow(0.0009, dt);
    v.smoothPos.lerp(v.pos, k);
    v.smoothFocus.lerp(v.focus, k);

    camera.position.copy(v.smoothPos);

    // --- banking ------------------------------------------------------------
    // Compare tangents just ahead and just behind to get turn direction, then
    // roll into it proportionally to how fast we're travelling.
    let targetRoll = 0;
    if (!reduced) {
      pathCurve.getPointAt(clamp(t + EPS), v.ahead);
      pathCurve.getPointAt(clamp(t - EPS), v.behind);
      v.tangentA.subVectors(v.ahead, v.smoothPos).normalize();
      v.tangentB.subVectors(v.smoothPos, v.behind).normalize();
      v.cross.crossVectors(v.tangentB, v.tangentA);
      targetRoll = clamp(v.cross.y * 14, -1, 1) * 0.13;
      targetRoll += journey.velocity * 0.035;
    }
    roll.current += (targetRoll - roll.current) * (1 - Math.pow(0.02, dt));

    // Orient: look at focus, then apply roll about the view axis.
    v.m.lookAt(v.smoothPos, v.smoothFocus, v.up);
    v.q.setFromRotationMatrix(v.m);
    camera.quaternion.copy(v.q);
    camera.rotateZ(roll.current);

    // --- lens ---------------------------------------------------------------
    const targetFov = reduced ? 52 : 52 + Math.abs(journey.velocity) * 7;
    fov.current += (targetFov - fov.current) * (1 - Math.pow(0.05, dt));
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - fov.current) > 0.01) {
      cam.fov = fov.current;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
