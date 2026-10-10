/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fcfbf9',
          100: '#f7f4ed',
          200: '#efe9da',
          300: '#e5d9c2',
          400: '#d8c4a5',
          500: '#cbb08a',
          600: '#bc966a',
          700: '#9d7955',
          800: '#806248',
          900: '#68513d',
        },
        sage: {
          50: '#f4f6f4',
          100: '#e5ebe6',
          200: '#cbd7cc',
          300: '#a7bda9',
          400: '#819f84',
          500: '#628365',
          600: '#4c684f',
          700: '#3e5441',
          800: '#344537',
          900: '#2a392d',
        },
        ivory: '#fffff0',
        ink: {
          400: '#4a4a4a',
          500: '#2d3748',
          900: '#1a202c',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'polaroid': '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
      },
      backgroundImage: {
        'paper': "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
        'noise': "url('https://www.transparenttextures.com/patterns/stardust.png')",
      }
    },
  },
  plugins: [],
}
