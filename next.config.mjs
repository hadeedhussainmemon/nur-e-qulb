import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  fallbacks: {
    document: '/~offline',
  },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.aladhan\.com\/v1\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'aladhan-api-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
        },
      },
      {
        urlPattern: /^https:\/\/api\.alquran\.cloud\/v1\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'alquran-api-cache',
          expiration: {
            maxEntries: 120, // Cache up to 120 requests (Surahs)
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
      {
        urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/gh\/fawazahmed0\/hadith-api@1\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'hadith-api-cache',
          expiration: {
            maxEntries: 10, // Cache up to 10 endpoints
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
      {
        urlPattern: /^https:\/\/everyayah\.com\/data\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'everyayah-audio-cache',
          expiration: {
            maxEntries: 500, // Cache up to 500 audio files
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
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
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.aladhan.com https://api.alquran.cloud https://everyayah.com https://cdn.jsdelivr.net; frame-src 'self' https://vercel.live;",
          },
        ],
      },
    ];
  },
  turbopack: {},
};

export default withPWA(nextConfig);
