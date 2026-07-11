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
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        primary: '#1F2E2B',
        secondary: '#4C7A5E',
        'bg-base': '#EDF1EA',
        surface: {
          DEFAULT: '#FBF9F8',
          dim: '#DBDAD8',
          container: '#EFEDEC',
          'container-low': '#F5F3F2',
          'container-high': '#EAE8E7',
        },
        onsurface: '#1B1C1B',
        'onsurface-variant': '#424846',
        outline: '#D4D9CC',
        'outline-variant': '#C2C8C5',
        invest: '#2D6A4F',
        pass: '#9B2C2C',
        watch: '#B7791F',
        error: '#BA1A1A',
      },
      borderRadius: {
        DEFAULT: '4px',
        lg: '8px',
        xl: '12px',
      },
      spacing: {
        gutter: '24px',
      },
      fontSize: {
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        'display-lg': ['40px', { lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-md': ['28px', { lineHeight: '36px', fontWeight: '500' }],
        'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '26px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'verdict-text': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'mono-data': ['13px', { lineHeight: '18px', fontWeight: '500' }],
      },
      animation: {
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
