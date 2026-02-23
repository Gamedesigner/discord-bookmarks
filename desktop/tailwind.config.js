/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          dark: '#36393f',
          darker: '#2f3136',
          darkest: '#202225',
          blurple: '#5865f2',
          green: '#3ba55c',
          yellow: '#faa61a',
          red: '#ed4245',
          text: '#dcddde',
          muted: '#72767d'
        }
      }
    },
  },
  plugins: [],
}
