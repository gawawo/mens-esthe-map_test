/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Backend APIへのプロキシ設定
  async rewrites() {
    // Docker環境では backend サービス名を使用、ローカル開発では localhost
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
