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
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 10px 30px -14px rgba(0,0,0,0.65)',
        lift: '0 16px 40px -16px rgba(240,147,15,0.45)',
      },
      backgroundImage: {
        flame: 'linear-gradient(135deg, #ffcf7d 0%, #f5a623 42%, #e2481c 100%)',
        aurora:
          'radial-gradient(120% 140% at 10% -20%, rgba(240,147,15,0.22) 0%, transparent 55%), radial-gradient(100% 120% at 100% 0%, rgba(109,94,252,0.18) 0%, transparent 50%), linear-gradient(160deg, #1b202e 0%, #12151d 100%)',
        surface: 'linear-gradient(160deg, #1b202e 0%, #12151d 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(52,211,153,0.45)' },
          '50%': { boxShadow: '0 0 0 6px rgba(52,211,153,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s linear infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-glow': 'pulse-glow 2.2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
