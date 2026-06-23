import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow cross-origin requests to IBKR Gateway (localhost:5000)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH' },
          { key: 'Access-Control-Allow-Headers', value: '*' },
        ],
      },
    ];
  },
};

export default nextConfig;
