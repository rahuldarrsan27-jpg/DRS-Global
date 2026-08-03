/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Plates are content-addressed by filename and never mutate in place —
  // regenerating a shot means a new file. So they can be cached hard.
  async headers() {
    return [
      {
        source: '/video/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
