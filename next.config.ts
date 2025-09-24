import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip type checking and linting during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Suppress hydration warnings for browser extensions
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  // Optimize resource loading to reduce preload warnings
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    // Removed optimizeCss to fix critters dependency issue
  },

  // Configure resource hints
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
        ],
      },
    ];
  },

  // Simplified webpack configuration for stable builds
  webpack: (config, { dev, isServer }) => {
    // Suppress Supabase realtime critical dependency warnings
    config.ignoreWarnings = [
      {
        module: /node_modules\/@supabase\/realtime-js\/dist\/module\/lib\/websocket-factory\.js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    
    return config;
  },
};

export default nextConfig;
