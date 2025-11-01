const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nest/ui', '@nest/shared-types', '@nest/validation'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@nest/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
      '@nest/ui': path.resolve(__dirname, '../../packages/ui/components'),
      '@nest/validation': path.resolve(__dirname, '../../packages/validation/src'),
      '@nest/database': path.resolve(__dirname, '../../packages/database/lib'),
    };
    return config;
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
};

module.exports = nextConfig;
