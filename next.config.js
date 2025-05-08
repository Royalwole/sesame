/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // External packages
  serverExternalPackages: ["mongoose"],

  experimental: {},

  // Update image configuration to use remotePatterns instead of domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "www.resolutionlawng.com",
      },
      {
        protocol: "https",
        hostname: "naijalandlord.com",
      },
      {
        protocol: "https",
        hostname: "images.adsttc.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "ud6qd8lqw90591bz.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "example.com",
      },
      {
        protocol: "https",
        hostname: "imagedelivery.net",
      },
      {
        protocol: "https",
        hostname: "topdial-cdn.azureedge.net",
      },
      // Add Firebase storage URL for image optimization
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60, // Cache optimized images for 60 seconds
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Keep redirects configuration
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

  // Enhanced webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Add polyfills and fallbacks
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

    // Fix for Firebase imports
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'firebase/app': 'firebase/app/dist/esm/index.esm.js',
        'firebase/storage': 'firebase/storage/dist/esm/index.esm.js',
      };
    }

    // Handle SVG files with SVGR
    const fileLoaderRule = config.module.rules.find((rule) => 
      rule.test?.test?.('.svg')
    );
    
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/;
    }

    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    // Improved handling of large module imports
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      splitChunks: {
        cacheGroups: {
          vendor: {
            name: "vendor",
            test: /[\\/]node_modules[\\/]/,
            chunks: "all",
            priority: 10,
          },
          firebase: {
            name: "firebase-vendor",
            test: /[\\/]node_modules[\\/](firebase|@firebase)/,
            chunks: "all",
            priority: 20,
          },
          common: {
            name: "common",
            minChunks: 2,
            chunks: "async",
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    };

    return config;
  },

  // Keep security headers
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

  // Keep compiler options
  compiler: {
    // Only remove console in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Keep source maps configuration
  productionBrowserSourceMaps: false,

  // Keep CORS configuration
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
