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
        // iOS-style: fondo gris cálido claro, tarjetas blancas limpias (contraste plano, no
        // relieve). Acentos desaturados (mismo hue de marca — verde/rojo/dorado/café).
        fondo: '#edeae3',
        tarjeta: '#ffffff',
        texto: '#3d3a34',
        'texto-suave': '#8c8678',
        verde: '#748f6a',
        rojo: '#b56b5d',
        dorado: '#c9a25c',
        cafe: '#8a715a',
      },
      boxShadow: {
        card: '0 1px 2px rgba(61, 58, 52, 0.05), 0 6px 16px rgba(61, 58, 52, 0.07)',
        'card-sm': '0 1px 3px rgba(61, 58, 52, 0.1)',
      },
    },
  },
  plugins: [],
};
