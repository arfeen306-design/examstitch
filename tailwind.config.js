/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#E8EAF0',
          100: '#C5CAD8',
          200: '#9EA7BF',
          300: '#7784A6',
          400: '#596993',
          500: '#3B4F80',
          600: '#354878',
          700: '#2D3F6D',
          800: '#263663',
          900: '#1A2B56',
          950: '#0F1A38',
        },
        gold: {
          50: '#FDF8EB',
          100: '#FAECC8',
          200: '#F5D98F',
          300: '#EFC656',
          400: '#E9B82E',
          500: '#D4AF37',
          600: '#B8922A',
          700: '#9A7523',
          800: '#7D5E1C',
          900: '#654B16',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
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
        pulseSubtle: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 175, 55, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(212, 175, 55, 0)' },
        },
      },
    },
  },
  plugins: [],
};
