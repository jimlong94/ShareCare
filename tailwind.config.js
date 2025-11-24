/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // The Co-Care Palette
        slate: {
          50: '#f8fafc', // bg-main
          100: '#f1f5f9',
          200: '#e2e8f0',
          500: '#64748b', // text-muted
          900: '#0f172a', // text-main
        },
        teal: {
          50: '#f0fdfa', // primary-light
          600: '#0d9488', // primary
          800: '#115e59', // primary-hover
        },
        amber: {
          500: '#f59e0b', // accent
        },
        rose: {
          400: '#fb7185', // danger
        }
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}