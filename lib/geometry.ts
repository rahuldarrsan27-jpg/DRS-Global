import * as THREE from 'three';

export interface BoxSpec {
  pos: [number, number, number];
  size: [number, number, number];
  rotY?: number;
}

const UNIT_EDGES: [number, number, number][][] = (() => {
  const c: [number, number, number][] = [
    [-0.5, -0.5, -0.5],
    [0.5, -0.5, -0.5],
    [0.5, -0.5, 0.5],
    [-0.5, -0.5, 0.5],
    [-0.5, 0.5, -0.5],
    [0.5, 0.5, -0.5],
    [0.5, 0.5, 0.5],
    [-0.5, 0.5, 0.5],
  ];
  const pairs: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  return pairs.map(([a, b]) => [c[a], c[b]]);
})();

/**
 * Collapses an arbitrary number of boxes into ONE LineSegments geometry.
 *
 * Building wireframes the obvious way — an EdgesGeometry per mesh — costs a
 * draw call per structure, which is ruinous for a blueprint city of several
 * hundred volumes. Writing the transformed edge vertices directly into a single
 * buffer renders the whole district in one call.
 */
export const buildBoxEdges = (specs: BoxSpec[]): THREE.BufferGeometry => {
  const positions = new Float32Array(specs.length * 12 * 2 * 3);
  let o = 0;

  for (const s of specs) {
    const [px, py, pz] = s.pos;
    const [sx, sy, sz] = s.size;
    const rot = s.rotY ?? 0;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    for (const [a, b] of UNIT_EDGES) {
      for (const v of [a, b]) {
        const lx = v[0] * sx;
        const ly = v[1] * sy;
        const lz = v[2] * sz;
        positions[o++] = px + lx * cos - lz * sin;
        positions[o++] = py + ly;
        positions[o++] = pz + lx * sin + lz * cos;
      }
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  g.computeBoundingSphere();
  return g;
};

/** Writes box specs into an InstancedMesh's matrix buffer. */
export const applyBoxInstances = (
  mesh: THREE.InstancedMesh,
  specs: BoxSpec[]
) => {
  const dummy = new THREE.Object3D();
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    dummy.position.set(...s.pos);
    dummy.scale.set(...s.size);
    dummy.rotation.set(0, s.rotY ?? 0, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
};

/** Perimeter points of a rectangular frame — used to forge the portal. */
export const rectFramePoints = (
  count: number,
  width: number,
  height: number,
  thickness: number,
  rand: () => number
): THREE.Vector3[] => {
  const pts: THREE.Vector3[] = [];
  const perim = (width + height) * 2;

  for (let i = 0; i < count; i++) {
    let d = (i / count) * perim + rand() * (perim / count) * 0.8;
    let x = 0;
    let y = 0;

    if (d < width) {
      x = -width / 2 + d;
      y = -height / 2;
    } else if ((d -= width) < height) {
      x = width / 2;
      y = -height / 2 + d;
    } else if ((d -= height) < width) {
      x = width / 2 - d;
      y = height / 2;
    } else {
      d -= width;
      x = -width / 2;
      y = height / 2 - d;
    }

    // Give the frame real depth so it catches light from several angles.
    const jx = (rand() - 0.5) * thickness;
    const jy = (rand() - 0.5) * thickness;
    const jz = (rand() - 0.5) * thickness * 1.6;

    pts.push(new THREE.Vector3(x + jx, y + jy + height / 2, jz));
  }

  return pts;
};
