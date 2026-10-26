/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        videplast: {
          brand: 'var(--color-videplast-brand)',
          primary: 'var(--color-videplast-primary)',
          'primary-hover': 'var(--color-videplast-primary-hover)',
          secondary: 'var(--color-videplast-secondary)',
          warning: 'var(--color-videplast-warning)',
          success: 'var(--color-videplast-success)',
          dark: 'var(--color-videplast-dark)',
          bg: 'var(--color-videplast-bg)',
          card: 'var(--color-videplast-card)',
          border: 'var(--color-videplast-border)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'videplast': '0 2px 6px rgba(0, 0, 0, 0.05)',
        'videplast-lg': '0 8px 24px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'corp': '8px',
      }
    },
  },
  plugins: [],
};
