/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    esmExternals: "loose",
    serverComponentsExternalPackages: ["mongoose"],
  },
  images: {
    domains: [
      "randomuser.me", // For mock data
      "images.unsplash.com",
      "cloudinary.com",
      "res.cloudinary.com",
      "www.resolutionlawng.com",
      "naijalandlord.com",
      "images.adsttc.com",
      "localhost",
      "ud6qd8lqw90591bz.public.blob.vercel-storage.com",
      "example.com",
      // Add CDN domains
      "imagedelivery.net",
      "topdial-cdn.azureedge.net",
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60, // Cache optimized images for 60 seconds
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async redirects() {
    return [
      {
        source: "/sign-in",
        destination: "/auth/sign-in",
        permanent: true,
      },
      {
        source: "/sign-up",
        destination: "/auth/sign-up",
        permanent: true,
      },
      {
        source: "/sign-out",
        destination: "/auth/sign-out",
        permanent: true,
      },
      {
        source: "/dashboard",
        destination: "/dashboard/user",
        permanent: false,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        os: false,
        path: false,
      };
    }

    if (
      config.module.rules.find((rule) => rule.test?.toString().includes("svg"))
    ) {
      return config;
    }

    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  // Add security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
        ],
      },
      {
        // Cache static assets including images
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable", // Cache for 1 year
          },
        ],
      },
      {
        // Cache fonts for better performance
        source: "/fonts/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Fix: Remove deprecated or unnecessary options
  swcMinify: true,

  // Enhance compiler options
  compiler: {
    // Only remove console in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Use source maps only in development
  productionBrowserSourceMaps: false,

  // Configure CORS and other security settings
  async rewrites() {
    return {
      beforeFiles: [
        // Example of API rewrite for improved security
        {
          source: "/api/:path*",
          has: [
            {
              type: "header",
              key: "x-topdial-api",
            },
          ],
          destination: "/api/:path*",
        },
      ],
    };
  },
};

module.exports = nextConfig;
