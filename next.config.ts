import type { NextConfig } from "next";

const NEXORA_BACKEND = process.env.NEXORA_BACKEND_URL || 'http://localhost:8888';

const nextConfig: NextConfig = {
  reactCompiler: false,
  output: "standalone",

  async rewrites() {
    return {
      // beforeFiles: routes checked before filesystem routes (pages/api routes)
      beforeFiles: [
        // Proxy root-level backend routes used by some components
        {
          source: '/health',
          destination: `${NEXORA_BACKEND}/health`,
        },
        {
          source: '/portfolio/:path*',
          destination: `${NEXORA_BACKEND}/portfolio/:path*`,
        },
        {
          source: '/market-data',
          destination: `${NEXORA_BACKEND}/market-data`,
        },
      ],
      // afterFiles: checked after filesystem routes — not used
      afterFiles: [],
      // fallback: only used when NO filesystem route matches
      // This ensures app/api/* route handlers take priority
      fallback: [
        {
          source: '/api/:path*',
          destination: `${NEXORA_BACKEND}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
