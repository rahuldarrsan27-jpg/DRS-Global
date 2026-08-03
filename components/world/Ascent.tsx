'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHAPTERS, smoothstep } from '@/lib/journey';
import { journey, tierScale } from '@/lib/journeyState';
import { makeRng } from '@/lib/rng';
import { applyBoxInstances, type BoxSpec } from '@/lib/geometry';
import { District } from './District';

const CH = CHAPTERS[9];

const CLOUD_VERT = /* glsl */ `
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const CLOUD_FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3  uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vDepth;

  void main() {
    // Soft disc with a long tail — reads as vapour rather than a plate.
    vec2 p = vUv - 0.5;
    float d = length(p) * 2.0;
    float a = smoothstep(1.0, 0.05, d);
    a = pow(a, 1.7);

    // Fade out very close to the lens so passing through a deck doesn't flash.
    float near = smoothstep(0.0, 60.0, vDepth);

    gl_FragColor = vec4(uColor, a * uOpacity * near);
    #include <colorspace_fragment>
  }
`;

/**
 * Scene X — the ecosystem, from altitude.
 *
 * Everything the visitor has travelled through is restated at once: the city
 * spread below, the divisions linked by light, and a sunrise resolving as the
 * camera clears the cloud deck. The connective lines are the argument the whole
 * site is making — six divisions, one group — stated visually before the copy
 * says it.
 */
export function Ascent() {
  const city = useRef<THREE.InstancedMesh>(null);
  const clouds = useRef<THREE.Group>(null);
  const sun = useRef<THREE.Mesh>(null);
  const links = useRef<THREE.LineSegments>(null);

  const citySpecs = useMemo<BoxSpec[]>(() => {
    const rng = makeRng(31337);
    const s = tierScale();
    const out: BoxSpec[] = [];
    const count = Math.floor(520 * s);

    for (let i = 0; i < count; i++) {
      // Density falls off from the centre — a skyline, not a slab.
      const a = rng.range(0, Math.PI * 2);
      const r = Math.pow(rng.next(), 0.65) * 300;
      const x = Math.cos(a) * r;
      const z = -1230 + Math.sin(a) * r;
      const h = rng.range(6, 70) * (1 - r / 420);
      out.push({
        pos: [x, -30 + h / 2, z],
        size: [rng.range(6, 18), Math.max(h, 4), rng.range(6, 18)],
        rotY: rng.spread(0.6),
      });
    }
    return out;
  }, []);

  const linkGeom = useMemo(() => {
    // Six nodes — one per division — wired into a single network.
    const rng = makeRng(2024);
    const nodes: THREE.Vector3[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      const r = 150 + rng.range(-30, 40);
      nodes.push(
        new THREE.Vector3(Math.cos(a) * r, -22 + rng.range(0, 26), -1230 + Math.sin(a) * r)
      );
    }

    const pos: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        pos.push(nodes[i].x, nodes[i].y, nodes[i].z);
        pos.push(nodes[j].x, nodes[j].y, nodes[j].z);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.computeBoundingSphere();
    return g;
  }, []);

  const cloudData = useMemo(() => {
    const rng = makeRng(8080);
    const s = tierScale();
    return Array.from({ length: Math.floor(46 * s) }, () => ({
      x: rng.spread(340),
      y: rng.range(74, 186),
      z: -1230 + rng.spread(340),
      r: rng.range(46, 130),
      o: rng.range(0.14, 0.42),
      drift: rng.range(-0.5, 0.5),
    }));
  }, []);

  useEffect(() => {
    if (city.current) {
      applyBoxInstances(city.current, citySpecs);
      const rng = makeRng(4242);
      const c = new THREE.Color();
      for (let i = 0; i < citySpecs.length; i++) {
        c.setHSL(0.08 + rng.spread(0.03), 0.22, rng.range(0.1, 0.26));
        city.current.setColorAt(i, c);
      }
      if (city.current.instanceColor) city.current.instanceColor.needsUpdate = true;
    }
  }, [citySpecs]);

  const elapsed = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!journey.reducedMotion) elapsed.current += dt;
    const e = elapsed.current;
    const t = journey.t;

    // Sunrise resolves across the final stretch.
    const dawn = smoothstep(CH.start + 0.02, 1.0, t);

    if (sun.current) {
      // Sits far enough out, and small enough, to read as a sun on the horizon.
      // At the original 150-unit radius and 400 units out it subtended most of
      // the frame and looked like a grey wall rather than a sunrise.
      sun.current.position.set(0, -30 + dawn * 105, -2250);
      const m = sun.current.material as THREE.MeshBasicMaterial;
      m.opacity = dawn * 0.85;
      sun.current.scale.setScalar(1 + dawn * 0.3);
    }

    if (links.current) {
      const m = links.current.material as THREE.LineBasicMaterial;
      m.opacity = smoothstep(CH.start, CH.start + 0.07, t) * 0.5 * (0.72 + Math.sin(e * 1.1) * 0.28);
    }

    if (clouds.current && !journey.reducedMotion) {
      clouds.current.children.forEach((c, i) => {
        c.position.x += cloudData[i].drift * dt;
      });
    }
  });

  return (
    <District chapter={CH} margin={0.12}>
      <group>
        {/* The city, entire */}
        <instancedMesh
          ref={city}
          args={[undefined, undefined, citySpecs.length]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ffffff" metalness={0.6} roughness={0.62} />
        </instancedMesh>

        {/* Six divisions, one network */}
        <lineSegments ref={links} geometry={linkGeom} frustumCulled={false}>
          <lineBasicMaterial
            color="#ffcf8a"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>

        {/* Cloud deck the camera climbs through */}
        <group ref={clouds}>
          {cloudData.map((c, i) => (
            <mesh key={i} position={[c.x, c.y, c.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[c.r * 2, c.r * 2]} />
              <shaderMaterial
                vertexShader={CLOUD_VERT}
                fragmentShader={CLOUD_FRAG}
                uniforms={{
                  uColor: { value: new THREE.Color('#ffd9b0') },
                  uOpacity: { value: c.o },
                }}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
        </group>

        {/* Sun */}
        <mesh ref={sun} position={[0, -30, -2250]}>
          <circleGeometry args={[58, 64]} />
          <meshBasicMaterial
            color="#ffcf92"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* Ground haze plane far below */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -32, -1230]}>
          <planeGeometry args={[900, 900]} />
          <meshStandardMaterial color="#241a12" metalness={0.2} roughness={0.95} />
        </mesh>
      </group>
    </District>
  );
}
