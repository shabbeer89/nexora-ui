import type { NextConfig } from "next";

const NEXORA_BACKEND = process.env.NEXORA_BACKEND_URL || 'http://localhost:8888';

const nextConfig: NextConfig = {
  reactCompiler: false,
  output: "standalone",

  async rewrites() {
    return [
      // Proxy all /api/* HTTP calls → backend
      {
        source: '/api/:path*',
        destination: `${NEXORA_BACKEND}/api/:path*`,
      },
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
    ];
  },
};

export default nextConfig;
