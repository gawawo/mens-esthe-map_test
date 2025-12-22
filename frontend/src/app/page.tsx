import { ClientPage } from '@/components/ClientPage';
import type { Shop } from '@/types';

// サーバー側でバックエンドAPIを直接呼び出し
async function getInitialShops(): Promise<Shop[]> {
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';

  try {
    const res = await fetch(`${backendUrl}/api/v1/shops?per_page=500`, {
      next: { revalidate: 60 }, // 60秒キャッシュ
    });

    if (!res.ok) {
      console.error('Failed to fetch initial shops:', res.status);
      return [];
    }

    const data = await res.json();
    return data.shops || [];
  } catch (error) {
    console.error('Error fetching initial shops:', error);
    return [];
  }
}

export default async function Home() {
  const initialShops = await getInitialShops();

  return <ClientPage initialShops={initialShops} />;
}
