/**
 * AIチャット検索コンポーネント - カジノテーマ
 */

'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAISearch, ChatMessage } from '@/hooks/useAISearch';
import { RiskBadge } from '@/components/Shop/RiskBadge';
import type { SearchResultItem, RiskLevel } from '@/types';

interface AIChatProps {
  onShopSelect?: (shopId: string) => void;
  className?: string;
}

export function AIChat({ onShopSelect, className = '' }: AIChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, search, clearMessages } = useAISearch();

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input.trim();
    setInput('');
    await search(query);
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    inputRef.current?.focus();
  };

  const examples = [
    '静かで落ち着いた雰囲気の店',
    '技術力が高くて評判の良い店',
    '清潔感があって衛生的な店',
    '初心者におすすめの安心な店',
  ];

  return (
    <div className={`flex flex-col bg-transparent ${className}`}>
      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gold/30 scrollbar-track-transparent">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-6"
            >
              <span className="text-4xl mb-3 block">
                🔮
              </span>
              <p className="text-white/60 mb-4 text-sm">
                どんな運命をお探しですか？
              </p>
              <div className="space-y-2">
                {examples.map((example, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handleExampleClick(example)}
                    className="block w-full text-left px-4 py-2.5 text-sm
                               bg-casino-velvet/50 border border-gold/20 rounded-xl
                               text-white/70 hover:text-gold hover:border-gold/40
                               transition-all duration-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    「{example}」
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MessageBubble
                  message={message}
                  onShopSelect={onShopSelect}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-2"
          >
            <LoadingDots />
            <span className="text-sm text-gold/70">占い中...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gold/10">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="どんな運命をお探しですか？"
            className="flex-1 px-4 py-2.5 bg-casino-black/50 border border-gold/30 rounded-xl
                       text-white placeholder-white/40
                       focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50
                       transition-all duration-200"
            disabled={isLoading}
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-2.5 min-w-[70px] whitespace-nowrap bg-gradient-to-r from-purple-600 to-pink-500
                       text-white font-medium rounded-xl
                       hover:from-purple-500 hover:to-pink-400
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-300"
            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(139,92,246,0.5)' }}
            whileTap={{ scale: 0.95 }}
          >
            占う
          </motion.button>
        </div>

        {/* クリアボタン */}
        {messages.length > 0 && (
          <motion.button
            type="button"
            onClick={clearMessages}
            className="mt-2 text-xs text-white/40 hover:text-gold/70 transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            履歴をクリア
          </motion.button>
        )}
      </form>
    </div>
  );
}

// メッセージバブル
interface MessageBubbleProps {
  message: ChatMessage;
  onShopSelect?: (shopId: string) => void;
}

function MessageBubble({ message, onShopSelect }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <motion.div
        className={`max-w-[90%] rounded-2xl p-3 ${
          isUser
            ? 'bg-gradient-to-r from-purple-600/30 to-pink-500/30 border border-purple-500/50 text-white rounded-br-md'
            : 'bg-casino-velvet/80 border border-gold/20 text-white rounded-bl-md'
        }`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {/* AIアイコン */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 text-gold/80">
            <span className="text-sm">🔮</span>
            <span className="text-xs font-medium">Lucky</span>
          </div>
        )}

        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>

        {/* 検索結果 */}
        {message.results && message.results.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.results.map((result) => (
              <SearchResultCard
                key={result.shop_id}
                result={result}
                onSelect={onShopSelect}
              />
            ))}
          </div>
        )}

        <p className="text-[10px] text-white/40 mt-2">
          {message.timestamp.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </motion.div>
    </div>
  );
}

// 検索結果カード
interface SearchResultCardProps {
  result: SearchResultItem;
  onSelect?: (shopId: string) => void;
}

function SearchResultCard({ result, onSelect }: SearchResultCardProps) {
  const handleClick = () => {
    onSelect?.(result.shop_id);
  };

  return (
    <motion.button
      onClick={handleClick}
      className="w-full text-left bg-casino-black/60 border border-gold/20 rounded-xl p-3
                 hover:border-gold/40 transition-all duration-200"
      whileHover={{ scale: 1.02, boxShadow: '0 0 10px rgba(255,215,0,0.2)' }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white truncate text-sm">
            {result.shop_name}
          </h4>
          <p className="text-xs text-gold/60 mt-1">
            関連度: {(result.relevance_score * 100).toFixed(0)}%
          </p>
        </div>
        {result.analytics?.risk_level && (
          <RiskBadge
            level={result.analytics.risk_level as RiskLevel}
            size="sm"
          />
        )}
      </div>

      {/* マッチしたレビュー抜粋 */}
      {result.matched_reviews.length > 0 && (
        <div className="mt-2 text-xs text-white/50">
          <p className="line-clamp-2">
            &ldquo;{result.matched_reviews[0].text.slice(0, 80)}...&rdquo;
          </p>
        </div>
      )}

      {/* リスク情報 */}
      {result.analytics?.risk_summary && (
        <p className="mt-2 text-xs text-white/40 line-clamp-1">
          {result.analytics.risk_summary}
        </p>
      )}
    </motion.button>
  );
}

// ローディングドット
function LoadingDots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-gold rounded-full"
          animate={{
            y: [0, -6, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}
