'use client';

import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Chapter } from '@/lib/journey';
import { journey } from '@/lib/journeyState';

/**
 * Visibility gate for a district.
 *
 * Districts are *not* cross-faded with material opacity — that would force every
 * one of them into the transparent render pass and cost sorting on thousands of
 * instances. Instead the atmosphere does the blending: fog density is tuned so
 * that a district is already buried in haze before this gate cuts it, and the
 * gate window is deliberately wider than the chapter so nothing ever pops
 * inside the view frustum.
 *
 * The result is that only one or two districts are submitted to the GPU at any
 * moment, while the transition still reads as continuous air.
 */
export function District({
  chapter,
  margin = 0.1,
  children,
}: {
  chapter: Chapter;
  margin?: number;
  children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current) return;
    const t = journey.t;
    const visible = t > chapter.start - margin && t < chapter.end + margin;
    if (group.current.visible !== visible) group.current.visible = visible;
  });

  return <group ref={group}>{children}</group>;
}
