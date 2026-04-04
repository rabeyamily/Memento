/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--text-color, #111111)',
        paper: 'var(--bg-color, #fafafa)',
        muted: {
          border: 'var(--border-muted, #e5e5e5)',
          fg: 'var(--text-muted, #737373)',
        },
        accent: '#f59e0b',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        splash: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      maxWidth: {
        content: '480px',
      },
    },
  },
  plugins: [],
};
