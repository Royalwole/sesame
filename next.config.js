/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // External packages
  serverExternalPackages: ["mongoose"], // ESLint configuration
  eslint: {
    // Allow Next.js to use its built-in ESLint integration
    ignoreDuringBuilds: false,
    // Check all directories
    dirs: ["pages", "components", "lib", "contexts", "hooks"],
  },

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

  // Keep webpack configuration
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
  // Enhanced webpack configuration for better module resolution and handling of server-only modules
  webpack: (config, { isServer }) => {
    // Prioritize JSX extensions in module resolution
    if (config.resolve && config.resolve.extensions) {
      // Make sure .jsx is before .js to prioritize it
      const extensions = config.resolve.extensions;
      const hasJsx = extensions.includes(".jsx");

      // If .jsx is already there, move it to the front
      if (hasJsx) {
        const filteredExtensions = extensions.filter((ext) => ext !== ".jsx");
        config.resolve.extensions = [".jsx", ...filteredExtensions];
      } else {
        // Add .jsx at the front if not present
        config.resolve.extensions = [".jsx", ...extensions];
      }
    }

    // Handle Node.js modules differently in client vs server
    if (!isServer) {
      // Replace Node.js modules with empty modules on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        util: false,
        net: false,
        tls: false,
        child_process: false,
        dns: false,
        dgram: false,
        constants: false,
        module: false,
        timers: false,
        console: false,
        dotenv: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
