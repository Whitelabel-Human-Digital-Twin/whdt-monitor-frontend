import type { NextConfig } from 'next';

const creationServiceUrl =
  process.env.CREATION_SERVICE_URL || 'http://localhost:8080';
const persistenceServiceUrl =
  process.env.PERSISTENCE_SERVICE_URL || 'http://localhost:8081';

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [
      {
        source: '/api/creation/:path*',
        destination: `${creationServiceUrl}/api/:path*`,
      },
      {
        source: '/api/persistence/:path*',
        destination: `${persistenceServiceUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
