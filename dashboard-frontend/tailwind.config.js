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
        // Neumorfismo: el fondo y las "tarjetas" comparten casi el mismo tono — la profundidad la
        // da la sombra doble (clara + oscura), no el contraste de color ni bordes. Acentos
        // desaturados (mismo hue de marca — verde/rojo/dorado/café — pero sólidos, no encendidos).
        base: '#e7e4dd',
        'base-alt': '#f1efe8',
        texto: '#3d3a34',
        'texto-suave': '#8c8678',
        verde: '#748f6a',
        rojo: '#b56b5d',
        dorado: '#c9a25c',
        cafe: '#8a715a',
      },
      boxShadow: {
        neu: '9px 9px 18px #c7c4bc, -9px -9px 18px #ffffff',
        'neu-sm': '5px 5px 10px #c7c4bc, -5px -5px 10px #ffffff',
        'neu-inset': 'inset 3px 3px 7px #c7c4bc, inset -3px -3px 7px #ffffff',
      },
    },
  },
  plugins: [],
};
