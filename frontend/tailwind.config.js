/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#f8fafc',
        primary: {
          DEFAULT: '#0f172a',
          light: '#334155',
          dark: '#020617',
        },
        accent: {
          blue: '#0284c7',
          teal: '#0d9488',
          amber: '#d97706',
          rose: '#e11d48',
        }
      }
    },
  },
  plugins: [],
}
