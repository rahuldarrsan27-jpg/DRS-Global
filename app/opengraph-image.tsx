import { ImageResponse } from 'next/og';

/**
 * Share card.
 *
 * The site is a canvas-driven scroll experience, so a crawler or a chat client
 * unfurling the link has literally nothing to show — every frame lives inside a
 * video element or a WebGL context. Without this, the link previews as a blank
 * rectangle everywhere it is shared, which for a studio-grade build is the first
 * impression most people actually get.
 *
 * Rendered at build time, so it costs nothing at request time.
 */

export const alt =
  'DRS Global — Engineering Industries. Connecting Markets. Enabling Growth.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '92px',
          background:
            'radial-gradient(1100px 620px at 74% 22%, #3d1d08 0%, transparent 60%), linear-gradient(145deg, #0a0b10 0%, #16100c 52%, #241408 100%)',
        }}
      >
        {/* Molten seam — the same mark as the favicon and the preloader */}
        <div
          style={{
            display: 'flex',
            width: '188px',
            height: '5px',
            borderRadius: '3px',
            marginBottom: '54px',
            background: 'linear-gradient(90deg, #5c1a00 0%, #c23c02 45%, #ff8c25 82%, #ffe6c2 100%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            fontSize: 26,
            letterSpacing: '0.34em',
            color: '#ff8c25',
            marginBottom: '30px',
          }}
        >
          MULTI-SECTOR ENGINEERING
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 138,
            letterSpacing: '-0.05em',
            color: '#eef0f3',
            lineHeight: 1,
          }}
        >
          DRS GLOBAL
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: '44px',
            fontSize: 33,
            letterSpacing: '-0.01em',
            color: 'rgba(238,240,243,0.62)',
          }}
        >
          Engineering Industries. Connecting Markets. Enabling Growth.
        </div>
      </div>
    ),
    { ...size }
  );
}
