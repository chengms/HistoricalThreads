/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a237e',
          light: '#534bae',
          dark: '#000051',
        },
        accent: {
          DEFAULT: '#ffa000',
          light: '#ffd149',
          dark: '#c67100',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Microsoft YaHei', 'sans-serif'],
        serif: ['Source Han Serif', 'SimSun', 'serif'],
      },
    },
  },
  plugins: [],
}

