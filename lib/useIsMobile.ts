'use client';

import { useEffect, useState } from 'react';

/**
 * Phone-class device.
 *
 * Deliberately matches on pointer type as well as width, because the things
 * gated on this — video decoder pressure, WebGL cost, hover affordances — track
 * the device, not the window size.
 *
 * Starts false so the server render and the first client render agree; a phone
 * flips to true on mount.
 */
export const useIsMobile = () => {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const q = window.matchMedia('(max-width: 820px), (pointer: coarse)');
    const update = () => setMobile(q.matches);
    update();
    q.addEventListener('change', update);
    return () => q.removeEventListener('change', update);
  }, []);

  return mobile;
};
