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
        // Paleta tomada del logo/material de marca real de Llano Lácteos (llanero: verde potrero,
        // rojo del sello circular, dorado del sol, cuero café) — no una paleta genérica.
        crema: '#f7f0dd',
        verde: {
          oscuro: '#1f4d2c',
          DEFAULT: '#4c8c3c',
          claro: '#7cb342',
        },
        cafe: '#7a4a21',
        dorado: '#e0a814',
        rojo: '#d4291f',
      },
      boxShadow: {
        panel: '0 2px 12px rgba(31, 77, 44, 0.1)',
      },
    },
  },
  plugins: [],
};
