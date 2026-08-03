'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHAPTERS, chapterInfluence } from '@/lib/journey';
import { journey } from '@/lib/journeyState';
import { pointer } from '@/lib/pointer';

/**
 * THE SIGNATURE MOMENT — the visitor drafts the blueprint.
 *
 * Through chapter III the cursor leaves a line behind it, and that line is
 * *drafted*: positions snap to a grid and every move resolves as an orthogonal
 * run — across, then up — the way a drawing is set out, never as a freehand
 * scribble. The trail decays from the tail so it is always being drawn and
 * always being erased.
 *
 * It is deliberately the one thing on the site that answers to the visitor
 * rather than to the scroll. The chapter's whole claim is that every capability
 * starts as a drawing; letting someone draw it is the argument made playable
 * instead of stated.
 *
 * Existence is bounded: it only has geometry while chapter III owns the frame,
 * it fades with that chapter's influence, and it never appears for a coarse
 * pointer or under reduced motion.
 */

const BLUEPRINT = CHAPTERS[2];
const MAX_POINTS = 160;
/** Grid divisions across the half-width of the drawing plane. */
const GRID_DIVISIONS = 14;
/** Distance in front of the camera the plane sits at. */
const PLANE_DISTANCE = 26;

export function CursorDraw() {
  const rig = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.Line>(null);
  const matRef = useRef<THREE.LineBasicMaterial>(null);

  const state = useMemo(
    () => ({
      pts: [] as { x: number; y: number; born: number }[],
      lastCell: null as { cx: number; cy: number } | null,
      positions: new Float32Array(MAX_POINTS * 3),
      colors: new Float32Array(MAX_POINTS * 3),
      elapsed: 0,
    }),
    []
  );

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(state.positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(state.colors, 3));
    g.setDrawRange(0, 0);
    // The geometry lives in camera-local space and is rebuilt constantly, so a
    // computed bounding sphere would be wrong the moment it is calculated.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    return g;
  }, [state]);

  const tint = useMemo(() => new THREE.Color('#5fd0ff'), []);

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    state.elapsed += dt;

    const influence = chapterInfluence(journey.t, BLUEPRINT, 0.05);
    const live = influence > 0.01 && pointer.enabled && !journey.reducedMotion;

    if (matRef.current) matRef.current.opacity = influence * 0.85;
    if (lineRef.current) lineRef.current.visible = live && state.pts.length > 1;

    if (rig.current) {
      rig.current.position.copy(camera.position);
      rig.current.quaternion.copy(camera.quaternion);
    }

    if (!live) {
      if (state.pts.length) {
        state.pts.length = 0;
        state.lastCell = null;
        geometry.setDrawRange(0, 0);
      }
      return;
    }

    // Pointer NDC -> a plane a fixed distance in front of the lens.
    const cam = camera as THREE.PerspectiveCamera;
    const halfH = Math.tan((cam.fov * Math.PI) / 360) * PLANE_DISTANCE;
    const halfW = halfH * cam.aspect;
    const step = halfW / GRID_DIVISIONS;

    const px = pointer.x * halfW;
    const py = -pointer.y * halfH;

    const cx = Math.round(px / step);
    const cy = Math.round(py / step);

    if (!state.lastCell) {
      state.lastCell = { cx, cy };
      state.pts.push({ x: cx * step, y: cy * step, born: state.elapsed });
    } else if (cx !== state.lastCell.cx || cy !== state.lastCell.cy) {
      /*
        Orthogonal routing: travel in x, then in y, inserting the corner. This
        is the whole character of the effect — a diagonal would read as a
        scribble, an elbow reads as draughting.
      */
      const prev = state.lastCell;
      if (cx !== prev.cx) {
        state.pts.push({ x: cx * step, y: prev.cy * step, born: state.elapsed });
      }
      if (cy !== prev.cy) {
        state.pts.push({ x: cx * step, y: cy * step, born: state.elapsed });
      }
      state.lastCell = { cx, cy };
    }

    // Retire from the tail, by age and by cap.
    const LIFETIME = 2.6;
    while (
      state.pts.length > MAX_POINTS ||
      (state.pts.length > 1 && state.elapsed - state.pts[0].born > LIFETIME)
    ) {
      state.pts.shift();
    }

    const n = state.pts.length;
    for (let i = 0; i < n; i++) {
      const p = state.pts[i];
      state.positions[i * 3] = p.x;
      state.positions[i * 3 + 1] = p.y;
      state.positions[i * 3 + 2] = -PLANE_DISTANCE;

      // Bright at the cursor, dissolving toward the tail.
      const age = (state.elapsed - p.born) / LIFETIME;
      const life = Math.max(0, 1 - age);
      const head = i / Math.max(n - 1, 1);
      const b = life * (0.25 + head * 0.75);
      state.colors[i * 3] = tint.r * b;
      state.colors[i * 3 + 1] = tint.g * b;
      state.colors[i * 3 + 2] = tint.b * b;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.setDrawRange(0, n);
  });

  return (
    <group ref={rig}>
      {/* @ts-expect-error -- three's Line intrinsic collides with SVG's in JSX */}
      <line ref={lineRef} geometry={geometry} frustumCulled={false}>
        <lineBasicMaterial
          ref={matRef}
          vertexColors
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </line>
    </group>
  );
}
