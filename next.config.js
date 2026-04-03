/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Compression & headers ──────────────────────────────────────────────────
  compress: true,
  poweredByHeader: false,

  // ── Bundle optimisation: tree-shake lucide-react icon imports ─────────────
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // ── Image domains (remote patterns preferred over deprecated `domains`) ────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 3600,
  },

  // ── HTTP response headers ──────────────────────────────────────────────────
  async headers() {
    return [
      // Static asset cache
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Image cache
      {
        source: '/_next/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      // ── Page security headers (HTML pages only, not API binary responses) ──
      // Use `has` to target only text/html responses, so binary endpoints like
      // /api/pdf/* don't inherit CSP that could confuse browsers.
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://img.youtube.com https://drive.google.com https://lh3.googleusercontent.com https://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com",
              "frame-src 'self' https://www.youtube.com https://youtube.com https://drive.google.com https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.youtube.com https://www.google-analytics.com https://www.googletagmanager.com",
              "media-src 'self' https://*.supabase.co",
              "object-src 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
