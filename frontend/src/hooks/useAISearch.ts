/**
 * AI検索フック
 */

import { useState, useCallback } from 'react';
import { chatSearch } from '@/lib/api';
import type { ChatSearchResponse, SearchResultItem } from '@/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  results?: SearchResultItem[];
  timestamp: Date;
}

export interface UseAISearchReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  clearMessages: () => void;
  highlightedShopIds: string[];
}

export function useAISearch(): UseAISearchReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedShopIds, setHighlightedShopIds] = useState<string[]>([]);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;

    // ユーザーメッセージを追加
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response: ChatSearchResponse = await chatSearch({
        query,
        limit: 5,
      });

      // アシスタントメッセージを追加
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        results: response.results,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // 検索結果の店舗をハイライト
      const shopIds = response.results.map((r) => r.shop_id);
      setHighlightedShopIds(shopIds);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '検索に失敗しました';
      setError(errorMessage);

      // エラーメッセージを追加
      const errorResponse: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `エラー: ${errorMessage}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setHighlightedShopIds([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    search,
    clearMessages,
    highlightedShopIds,
  };
}
