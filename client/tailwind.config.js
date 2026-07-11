/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9ecff',
          200: '#bce0ff',
          300: '#8eccff',
          400: '#59aeff',
          500: '#3b8bff',
          600: '#1e6bf5',
          700: '#1755e1',
          800: '#1945b6',
          900: '#1a3d8f',
        },
        surface: {
          900: '#0b0f19',
          800: '#0f172a',
          700: '#1e293b',
          600: '#27364b',
          500: '#334155',
          400: '#475569',
        },
        invest: '#10b981',
        pass: '#ef4444',
        watch: '#f59e0b',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
