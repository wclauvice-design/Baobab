/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0b0e14',
          900: '#11151f',
          800: '#171c29',
          700: '#232a3b',
        },
        amber: {
          400: '#f5a623',
          500: '#f0930f',
          600: '#d97e06',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
        },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Sora', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        glow: '0 0 24px 0 rgba(245, 166, 35, 0.25)',
        'glow-emerald': '0 0 24px 0 rgba(52, 211, 153, 0.25)',
      },
    },
  },
  plugins: [],
};
