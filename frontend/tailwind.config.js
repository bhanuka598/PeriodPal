
/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48', // Rose 600 - Primary
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b', // Slate 800 - Sidebar
          900: '#0f172a',
        },
        accent: {
          DEFAULT: '#fbcfe8', // Soft pink
          dark: '#f472b6'
        },
        background: '#f8fafc', // Warm light gray
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'warm': '0 10px 25px -5px rgba(225, 29, 72, 0.1), 0 8px 10px -6px rgba(225, 29, 72, 0.1)',
      }
    },
  },
  plugins: [],
}
