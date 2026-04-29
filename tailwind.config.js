/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        enterprise: {
          50: '#f6f7f9',
          100: '#eceff3',
          200: '#d6dce5',
          600: '#3c5f8a',
          700: '#2f4d71',
          800: '#233a55',
        },
      },
    },
  },
  plugins: [],
}
