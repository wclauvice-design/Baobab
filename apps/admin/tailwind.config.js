/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        amber: { 500: '#f0930f', 600: '#d97e06' },
        emerald: { 500: '#10b981' },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Sora', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
