/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Poppins', 'ui-sans-serif', 'system-ui'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        crema: '#f5f1e6',
        verde: {
          oscuro: '#23402d',
          DEFAULT: '#3e6b4d',
          claro: '#6fa37e',
        },
        cafe: '#8a5a34',
        dorado: '#c99b3f',
        rojo: '#b5533f',
        azul: '#3a5a8a',
      },
      boxShadow: {
        panel: '0 2px 12px rgba(35, 64, 45, 0.08)',
      },
    },
  },
  plugins: [],
};
