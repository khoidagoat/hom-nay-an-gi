import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bistro: {
          cream: '#FAF7F2',       // Warm Cream Paper (nền chính)
          paper: '#FFFFFF',       // Card background
          border: '#E6DFD3',      // Viền mảnh
          ink: '#1C1917',         // Warm Charcoal (chữ chính, viền đậm)
          muted: '#6B655E',       // Text phụ
          sriracha: '#E84A27',    // Primary CTA (Đỏ cam Sriracha)
          herb: '#2A7B56',        // Secondary / Success Green (Xanh thảo mộc)
          mustard: '#F4B942',     // Highlight / Sticker Tag (Vàng mù tạt)
        }
      },
      fontFamily: {
        display: ['var(--font-bricolage)', 'sans-serif'],
        sans: ['var(--font-vietnam)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        'tactile': '3px 3px 0px #1C1917',
        'tactile-sm': '2px 2px 0px #1C1917',
        'tactile-lg': '5px 5px 0px #1C1917',
        'tactile-herb': '3px 3px 0px #2A7B56',
        'tactile-sriracha': '3px 3px 0px #B33418',
      },
      borderRadius: {
        'tactile': '14px',
      }
    },
  },
  plugins: [],
}

export default config
