/** @type {import('tailwindcss').Config} */

/**
 * Dark Forest & Beach palette — single brand source of truth.
 *
 *   primary     = #0B201D  Dark Forest Green  (chrome / app shell)
 *   secondary   = #16302B  Medium Forest      (cards, surfaces)
 *   accent      = #E6D5B8  Deep Beach / Sand  (CTAs, highlights)
 *   highlight   = #F5F1E3  Light Beach / Cream(body text, soft surfaces)
 *
 * The existing codebase had hundreds of hard-coded `slate-*`, `blue-*`,
 * `indigo-*`, `purple-*`, `violet-*` classes scattered across components.
 * Rather than rewrite every file we override those Tailwind palettes here
 * so each class re-paints to the new brand automatically:
 *
 *   slate-{50..950}  → forest scale (light cream … dark forest)
 *   blue-* / indigo-* / purple-* / violet-*  → beach scale
 *
 * Gradient compositions ("from-slate-900 to-indigo-600") survive — they
 * now read forest → beach, which suits the brand. Hover pairings stay
 * coherent because both stops shift together.
 */

const forest = {
  50:  '#F5F1E3',
  100: '#E2E7E3',
  200: '#C9D5CD',
  300: '#A8BBB0',
  400: '#809C8F',
  500: '#5C7E70',
  600: '#3C6356',
  700: '#2A5044',
  800: '#1B3D35',
  900: '#16302B',
  950: '#0B201D',
};

const beach = {
  50:  '#FAF7EC',
  100: '#F5F1E3',
  200: '#ECDFC8',
  300: '#E6D5B8',
  400: '#D4BE9B',
  500: '#B59E7B',
  600: '#8F7C5E',
  700: '#5E5340',
  800: '#4A3F2A',
  900: '#3F392C',
  950: '#2E2410',
};

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Semantic tokens (CSS-variable-backed so they switch with theme) ──
        // RGB channel syntax keeps Tailwind opacity modifiers working —
        // `bg-primary/40`, `text-accent/80`, etc. all resolve correctly.
        // The variables themselves are defined in globals.css per data-theme.
        primary:   'rgb(var(--brand-primary-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--brand-secondary-rgb) / <alpha-value>)',
        accent:    'rgb(var(--brand-accent-rgb) / <alpha-value>)',
        highlight: 'rgb(var(--brand-highlight-rgb) / <alpha-value>)',

        // ── Palette remapping ─────────────────────────────────────────
        // Every existing `bg-slate-*` / `text-blue-*` class now resolves
        // to a forest/beach shade. Component code is untouched.
        slate:  forest,
        blue:   beach,
        indigo: beach,
        purple: beach,
        violet: beach,

        // ── Preserved brand palettes ──────────────────────────────────
        // Navy and gold are subject-identity markers (Math / Scholar)
        // and tonally align with the new forest+beach scheme.
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(230, 213, 184, 0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(230, 213, 184, 0)' },
        },
      },
    },
  },
  plugins: [
    /** Admin grid toggles — visible track/thumb on cream-light rows. */
    function adminToggleComponents({ addComponents }) {
      addComponents({
        '.admin-toggle-track': {
          '@apply border border-secondary bg-secondary/70 dark:border-secondary dark:bg-primary': {},
        },
        '.admin-toggle-thumb': {
          '@apply bg-accent shadow-sm dark:bg-highlight': {},
        },
      });
    },
  ],
};
