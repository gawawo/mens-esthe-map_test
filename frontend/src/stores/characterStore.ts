import { create } from 'zustand';
import type { CharacterMood, CharacterState } from '@/types/character';
import type { RiskLevel } from '@/types/shop';
import { RISK_REACTIONS } from '@/types/character';

interface CharacterStore extends CharacterState {
  // Actions
  setMood: (mood: CharacterMood) => void;
  setMessage: (message: string) => void;
  setTyping: (isTyping: boolean) => void;
  setShowParticles: (show: boolean) => void;

  // Complex actions
  startSearching: () => void;
  showGreeting: () => void;
  reactToRisk: (riskLevel: RiskLevel) => void;
  resetToIdle: () => void;
  typeMessage: (message: string, callback?: () => void) => void;
}

// ランダムメッセージを選択
const getRandomMessage = (messages: string[]): string => {
  return messages[Math.floor(Math.random() * messages.length)];
};

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  // Initial state
  mood: 'greeting',
  message: 'ようこそ！Lucky の占い検索へ🔮',
  isTyping: false,
  showParticles: false,

  // Basic setters
  setMood: (mood) => set({ mood }),
  setMessage: (message) => set({ message }),
  setTyping: (isTyping) => set({ isTyping }),
  setShowParticles: (show) => set({ showParticles: show }),

  // Start searching state
  startSearching: () => {
    set({
      mood: 'searching',
      message: '運命を占っています...',
      isTyping: true,
      showParticles: false,
    });
  },

  // Show greeting
  showGreeting: () => {
    const greetings = [
      'ようこそ！Lucky の占い検索へ🔮',
      'どんな運命をお探しですか？',
      'Lucky があなたの店探しをお手伝いします',
      '今日の運勢を占いましょう',
    ];
    set({
      mood: 'greeting',
      message: getRandomMessage(greetings),
      isTyping: false,
      showParticles: false,
    });
  },

  // React to risk level
  reactToRisk: (riskLevel) => {
    const reaction = RISK_REACTIONS[riskLevel];
    const message = getRandomMessage(reaction.messages);

    set({
      mood: reaction.mood,
      message,
      isTyping: false,
      showParticles: reaction.celebrationType !== 'none',
    });

    // パーティクルを数秒後にオフ
    if (reaction.celebrationType !== 'none') {
      setTimeout(() => {
        set({ showParticles: false });
      }, 3000);
    }
  },

  // Reset to idle
  resetToIdle: () => {
    set({
      mood: 'idle',
      message: '何かお探しですか？',
      isTyping: false,
      showParticles: false,
    });
  },

  // Type message with animation
  typeMessage: (message, callback) => {
    set({ isTyping: true, message: '' });

    let index = 0;
    const interval = setInterval(() => {
      if (index < message.length) {
        set({ message: message.slice(0, index + 1) });
        index++;
      } else {
        clearInterval(interval);
        set({ isTyping: false });
        callback?.();
      }
    }, 30);
  },
}));
