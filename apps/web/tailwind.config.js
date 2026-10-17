/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          blue: '#E0F2FE',
          pink: '#FCE7F3',
          yellow: '#FEF08A',
          green: '#DCFCE7',
          purple: '#F3E8FF',
          orange: '#FFEDD5',
        },
        brand: {
          yellow: '#FBBF24',
          amber: '#F59E0B',
          sky: '#38BDF8',
          indigo: '#6366F1',
          coral: '#FB7185',
          mint: '#34D399',
        }
      },
      fontFamily: {
        comic: ['"Outfit"', 'Nunito', 'ui-rounded', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2.5s infinite',
        'pulse-gentle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      }
    },
  },
  plugins: [],
}
