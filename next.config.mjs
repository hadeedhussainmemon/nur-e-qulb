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
  turbopack: {},
};

export default withPWA(nextConfig);
