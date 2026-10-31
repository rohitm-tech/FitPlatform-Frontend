/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        fp: {
          accent: 'rgb(var(--fp-accent-rgb) / <alpha-value>)',
          danger: '#ef4444',
          warn: '#f59e0b',
          ok: '#22c55e',
        },
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      },
    },
  },
  plugins: [],
};
