/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // カスタムフォント
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['Noto Sans JP', 'sans-serif'],
        score: ['Orbitron', 'monospace'],
      },
      colors: {
        // カジノベースカラー
        casino: {
          black: '#0a0a0f',
          velvet: '#12121a',
          felt: '#1a1f2e',
          midnight: '#1e1b2e',
        },
        // ネオンリスクカラー
        safe: {
          DEFAULT: '#00ff88',
          glow: 'rgba(0, 255, 136, 0.5)',
          dark: '#00cc6a',
          muted: '#00994d',
          light: '#86efac',
        },
        gamble: {
          DEFAULT: '#ffd700',
          glow: 'rgba(255, 215, 0, 0.5)',
          dark: '#cc9900',
          muted: '#997300',
          light: '#fde047',
        },
        mine: {
          DEFAULT: '#ff3366',
          glow: 'rgba(255, 51, 102, 0.5)',
          dark: '#cc1a4a',
          muted: '#991340',
          light: '#fca5a5',
        },
        fake: {
          DEFAULT: '#8b5cf6',
          glow: 'rgba(139, 92, 246, 0.5)',
          dark: '#6d28d9',
          muted: '#5b21b6',
          light: '#d1d5db',
        },
        // ゴールド/アクセント
        gold: {
          DEFAULT: '#ffd700',
          light: '#ffe44d',
          dark: '#cc9900',
          champagne: '#f5d742',
        },
        neon: {
          cyan: '#00f5ff',
          pink: '#ff1493',
          blue: '#0066ff',
          purple: '#9945ff',
        },
        chrome: {
          silver: '#c0c0c0',
          bronze: '#cd7f32',
        },
      },
      // ネオングローシャドウ
      boxShadow: {
        'neon-safe': '0 0 10px #00ff88, 0 0 20px rgba(0, 255, 136, 0.5), 0 0 30px rgba(0, 255, 136, 0.3)',
        'neon-gamble': '0 0 10px #ffd700, 0 0 20px rgba(255, 215, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.3)',
        'neon-mine': '0 0 10px #ff3366, 0 0 20px rgba(255, 51, 102, 0.5), 0 0 30px rgba(255, 51, 102, 0.3)',
        'neon-fake': '0 0 10px #8b5cf6, 0 0 20px rgba(139, 92, 246, 0.5), 0 0 30px rgba(139, 92, 246, 0.3)',
        'neon-gold': '0 0 10px #ffd700, 0 0 25px rgba(255, 215, 0, 0.6), 0 0 50px rgba(255, 215, 0, 0.4)',
        'neon-cyan': '0 0 10px #00f5ff, 0 0 20px rgba(0, 245, 255, 0.5)',
        'casino-card': '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 215, 0, 0.3)',
        'casino-card-hover': '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 215, 0, 0.2)',
        'slot-inset': 'inset 0 2px 10px rgba(0, 0, 0, 0.5)',
        'glow-safe': '0 0 20px rgba(0, 255, 136, 0.5)',
        'glow-gamble': '0 0 25px rgba(255, 215, 0, 0.5)',
        'glow-mine': '0 0 30px rgba(255, 51, 102, 0.6)',
      },
      // グラデーション
      backgroundImage: {
        'casino-gradient': 'linear-gradient(135deg, #1a1f2e 0%, #12121a 50%, #0a0a0f 100%)',
        'gold-gradient': 'linear-gradient(135deg, #ffd700 0%, #f5d742 50%, #cc9900 100%)',
        'neon-border-safe': 'linear-gradient(90deg, #00ff88, #00cc6a, #00ff88)',
        'neon-border-gamble': 'linear-gradient(90deg, #ffd700, #cc9900, #ffd700)',
        'neon-border-mine': 'linear-gradient(90deg, #ff3366, #cc1a4a, #ff3366)',
        'neon-border-fake': 'linear-gradient(90deg, #8b5cf6, #6d28d9, #8b5cf6)',
        'felt-pattern': 'radial-gradient(circle at 50% 50%, #1a2f1a 0%, #0f1a0f 100%)',
        'chip-pattern': 'repeating-conic-gradient(from 0deg, transparent 0deg 15deg, rgba(255,255,255,0.1) 15deg 30deg)',
      },
      // アニメーション
      animation: {
        'neon-flicker': 'neon-flicker 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'pulse-safe': 'pulse-safe 2s ease-in-out infinite',
        'pulse-gamble': 'pulse-gamble 1.5s ease-in-out infinite',
        'pulse-mine': 'pulse-mine 0.8s ease-in-out infinite',
        'pulse-fake': 'pulse-fake 3s ease-in-out infinite',
        'slot-spin': 'slot-spin 0.1s linear infinite',
        'slot-stop': 'slot-stop 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'card-flip': 'card-flip 0.6s ease-in-out',
        'card-deal': 'card-deal 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'chip-bounce': 'chip-bounce 0.5s ease-out',
        'jackpot-flash': 'jackpot-flash 0.5s ease-in-out 3',
        'reveal-up': 'reveal-up 0.5s ease-out',
        'dice-roll': 'dice-roll 0.8s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'shimmer-gold': 'shimmer-gold 2.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'float-delayed': 'float-delayed 4s ease-in-out infinite',
        'shake-warning': 'shake-warning 0.5s ease-in-out',
        'flash-danger': 'flash-danger 0.3s ease-in-out 3',
        'confetti-fall': 'confetti-fall 3s linear forwards',
        'coin-flip': 'coin-flip 0.6s ease-in-out',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'bounce-slow': 'bounce-slow 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
      },
      // キーフレーム
      keyframes: {
        'neon-flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
          '52%': { opacity: '1' },
          '54%': { opacity: '0.9' },
          '56%': { opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 10px currentColor, 0 0 20px currentColor',
          },
          '50%': {
            boxShadow: '0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor',
          },
        },
        'pulse-safe': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(0, 255, 136, 0.4)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 0 8px rgba(0, 255, 136, 0)',
            transform: 'scale(1.02)',
          },
        },
        'pulse-gamble': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(255, 215, 0, 0.5)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 0 10px rgba(255, 215, 0, 0)',
            transform: 'scale(1.05)',
          },
        },
        'pulse-mine': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(255, 51, 102, 0.6)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 0 12px rgba(255, 51, 102, 0)',
            transform: 'scale(1.08)',
          },
        },
        'pulse-fake': {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '0.4' },
        },
        'slot-spin': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-100%)' },
        },
        'slot-stop': {
          '0%': { transform: 'translateY(-20px)' },
          '40%': { transform: 'translateY(5px)' },
          '70%': { transform: 'translateY(-2px)' },
          '100%': { transform: 'translateY(0)' },
        },
        'card-flip': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        'card-deal': {
          '0%': {
            transform: 'translateX(-100px) translateY(-50px) rotate(-15deg) scale(0.5)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0) translateY(0) rotate(0deg) scale(1)',
            opacity: '1',
          },
        },
        'chip-bounce': {
          '0%': { transform: 'translateY(-100px) rotate(0deg)', opacity: '0' },
          '60%': { transform: 'translateY(10px) rotate(360deg)', opacity: '1' },
          '80%': { transform: 'translateY(-5px) rotate(380deg)' },
          '100%': { transform: 'translateY(0) rotate(360deg)' },
        },
        'jackpot-flash': {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(255, 215, 0, 0.3)' },
        },
        'reveal-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'dice-roll': {
          '0%': { transform: 'rotate(0deg) scale(0.5)', opacity: '0' },
          '50%': { transform: 'rotate(360deg) scale(1.2)' },
          '100%': { transform: 'rotate(720deg) scale(1)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'shimmer-gold': {
          '0%, 100%': { backgroundPosition: '-100% 0', filter: 'brightness(1)' },
          '50%': { backgroundPosition: '100% 0', filter: 'brightness(1.3)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-delayed': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-5px) rotate(2deg)' },
          '75%': { transform: 'translateY(-8px) rotate(-2deg)' },
        },
        'shake-warning': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        'flash-danger': {
          '0%, 100%': {
            backgroundColor: 'rgba(255, 51, 102, 0.1)',
            borderColor: 'rgba(255, 51, 102, 0.5)',
          },
          '50%': {
            backgroundColor: 'rgba(255, 51, 102, 0.3)',
            borderColor: 'rgba(255, 51, 102, 1)',
          },
        },
        'confetti-fall': {
          '0%': {
            transform: 'translateY(-100vh) rotate(0deg)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateY(100vh) rotate(720deg)',
            opacity: '0',
          },
        },
        'coin-flip': {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(1080deg)' },
        },
        'sparkle': {
          '0%, 100%': {
            transform: 'scale(0) rotate(0deg)',
            opacity: '0',
          },
          '50%': {
            transform: 'scale(1) rotate(180deg)',
            opacity: '1',
          },
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'spin-slow': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
      },
      // カスタムタイミング関数
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'bounce-out': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'casino-snap': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slot-ease': 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      // カスタムデュレーション
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      // ボーダー半径
      borderRadius: {
        'chip': '50%',
        'card': '12px',
      },
    },
  },
  plugins: [],
};
