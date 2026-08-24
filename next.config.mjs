/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/icon-192.png',
        destination: '/api/icons/icon-192.png',
      },
      {
        source: '/icon-512.png',
        destination: '/api/icons/icon-512.png',
      },
      {
        source: '/apple-icon.png',
        destination: '/api/icons/apple-icon.png',
      },
      {
        source: '/favicon.ico',
        destination: '/api/icons/favicon.ico',
      },
      {
        source: '/icon.svg',
        destination: '/api/icons/icon.svg',
      },
      {
        source: '/launchericon-:size.png',
        destination: '/api/icons/launchericon-:size.png',
      },
      {
        source: '/screenshot-wide.png',
        destination: '/api/icons/screenshot-wide.png',
      },
      {
        source: '/screenshot-narrow.png',
        destination: '/api/icons/screenshot-narrow.png',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json; charset=utf-8',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        source: '/:path*.(png|jpg|jpeg|svg|webp|ico)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
