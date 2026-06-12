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
          forest:         '#0D3B2E',
          'forest-light': '#1a5c3e',
          'forest-dark':  '#081f18',
          mint:           '#2ECC8E',
          'mint-light':   '#5dd9a8',
          'mint-dark':    '#22a370',
          'mint-tint':    '#F8FAF3',
          ink:            '#111111',
          warm:           '#F7F5F0',
          white:          '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
}
