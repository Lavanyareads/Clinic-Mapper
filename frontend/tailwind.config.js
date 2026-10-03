/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0ea5e9',
          light: '#38bdf8',
          dark: '#0284c7',
        },
        accent: {
          DEFAULT: '#14b8a6',
          light: '#2dd4bf',
          dark: '#0d9488',
        }
      }
    },
  },
  plugins: [],
}
