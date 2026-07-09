import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.aladhan.com https://api.alquran.cloud https://everyayah.com https://cdn.jsdelivr.net https://accounts.google.com https://nominatim.openstreetmap.org https://overpass-api.de https://fcm.googleapis.com https://android.googleapis.com https://updates.push.services.mozilla.com https://*.push.apple.com https://*.notify.windows.com; frame-src 'self' https://vercel.live; form-action 'self' https://accounts.google.com;",
          },
        ],
      },
    ];
  },
  turbopack: {},
};

export default withPWA(nextConfig);
