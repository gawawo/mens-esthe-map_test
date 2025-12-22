/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // 環境変数をビルド時に明示的に設定
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_GOOGLE_MAP_ID: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID,
  },
  // Backend APIへのプロキシ設定
  async rewrites() {
    // Docker環境では backend サービス名を使用、ローカル開発では localhost
    let backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    // プロトコルがない場合は https:// を追加
    if (backendUrl && !backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
      backendUrl = 'https://' + backendUrl;
    }
    console.log('Rewrite destination:', backendUrl);
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
