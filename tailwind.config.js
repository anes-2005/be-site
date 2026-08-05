/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand tokens — editing these updates the entire site
        primary: {
          DEFAULT: '#0F1C2E',
          50: '#E8ECF1',
          100: '#C9D2DD',
          200: '#9CAABD',
          300: '#6F829E',
          400: '#465974',
          500: '#1F3251',
          600: '#16263F',
          700: '#0F1C2E',
          800: '#0A1422',
          900: '#060E1A',
        },
        secondary: {
          DEFAULT: '#D9C5A1',
          50: '#FBF7EF',
          100: '#F5ECDA',
          200: '#EAD9B8',
          300: '#E0C996',
          400: '#D9C5A1',
          500: '#C9B282',
          600: '#B8995F',
          700: '#9A7E48',
          800: '#7C6537',
          900: '#5E4D2A',
        },
        bg: {
          DEFAULT: '#F8F5EF',
          50: '#FFFFFF',
          100: '#FBFAF7',
          200: '#F8F5EF',
          300: '#F1ECE1',
          400: '#E8E3D8',
        },
        ink: {
          DEFAULT: '#1C1C1C',
          50: '#F5F5F5',
          100: '#E0E0E0',
          200: '#BDBDBD',
          300: '#9A9A9A',
          400: '#6B6B6B',
          500: '#4A4A4A',
          600: '#2E2E2E',
          700: '#1C1C1C',
          800: '#111111',
          900: '#0A0A0A',
        },
        line: '#E8E3D8',
        success: '#3F6B4F',
        warning: '#B8893A',
        error: '#9A3B3B',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        arabic: ['"Noto Naskh Arabic"', 'Inter', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(3.5rem, 8vw, 8rem)', { lineHeight: '1.02', letterSpacing: '-0.02em' }],
        'hero': ['clamp(2.75rem, 6vw, 5.5rem)', { lineHeight: '1.05', letterSpacing: '-0.015em' }],
        'display-sm': ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      },
      maxWidth: {
        'shell': '1400px',
        'content': '1200px',
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '28px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
        '38': '9.5rem',
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(15, 28, 46, 0.04), 0 8px 24px -12px rgba(15, 28, 46, 0.08)',
        'card': '0 1px 2px rgba(15, 28, 46, 0.03), 0 18px 48px -24px rgba(15, 28, 46, 0.12)',
        'lift': '0 2px 6px rgba(15, 28, 46, 0.06), 0 30px 60px -28px rgba(15, 28, 46, 0.18)',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.8s ease both',
        'scale-in': 'scale-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
