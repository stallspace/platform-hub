/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0A1F44',
          'navy-light': '#132a5e',
          'navy-dark': '#060f22',
          black: '#000000',
          white: '#FFFFFF',
          accent: '#1D4ED8',
          'accent-light': '#3b6ef0',
          'accent-dark': '#1640b0',
        },
      },
    },
  },
  plugins: [],
}
