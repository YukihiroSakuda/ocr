import path from 'node:path';
import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';
const repoName = 'ocr'; // GitHub repository name

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true
  },
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      fs: false,
      path: false,
      crypto: false
    };
    return config;
  },
  outputFileTracingRoot: path.join(__dirname, '..')
};

export default nextConfig;
