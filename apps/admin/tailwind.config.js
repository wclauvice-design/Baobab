/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        amber: { 500: '#D9A441', 600: '#B07C22' },
        emerald: { 500: '#2F8F6C' },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Sora', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
