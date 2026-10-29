/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'SF Pro Text', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-dev': '0 0 16px -2px rgba(16, 185, 129, 0.25)',
        'glow-prd': '0 0 16px -2px rgba(244, 63, 94, 0.3)',
        'tactile': '0 2px 0 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
      }
    },
  },
  plugins: [],
}
