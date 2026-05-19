/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF3F7',
          100: '#DCE5EC',
          200: '#B7C7D5',
          300: '#90A8BE',
          400: '#6784A5',
          500: '#1B2A3B', // Azul acero
          600: '#243648',
          700: '#2E4460', // Azul marino
          800: '#223147',
          900: '#172231',
          DEFAULT: '#1B2A3B',
        },
        secondary: {
          500: '#E8500A',
          DEFAULT: '#E8500A',
        },
        action: {
          50: '#FFF1E9',
          100: '#FFDCC8',
          200: '#FFBF98',
          300: '#FFA067',
          400: '#F97B34',
          500: '#E8500A', // Naranja mecánico
          600: '#CC4708',
          700: '#B03E07',
          DEFAULT: '#E8500A',
        },
        alert: {
          500: '#F4A63A', // Ámbar alerta
          DEFAULT: '#F4A63A',
        },
        background: '#F4F6F8', // Fondo general
        card: '#FFFFFF', // Fondo de cards
        sidebar: '#2E4460',
        navbar: '#1B2A3B',
        text: {
          main: '#0F172A',
          secondary: '#64748B',
        },
        border: '#E2E8F0',
        muted: '#E2E8F0',
        // Estados del sistema
        state: {
          pending: '#E2E8EF',
          review: '#FFF3CD',
          repair: '#F4A63A',
          completed: '#D4EDDA',
          cancelled: '#F8D7DA',
        },
        // Legacy/compatibilidad
        success: '#D4EDDA',
        warning: '#F4A63A',
        error: '#F8D7DA',
        info: '#FFF3CD',
        dark: '#0F172A',
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 32px 0 rgba(27, 42, 59, 0.12)',
        'card': '0 2px 16px 0 rgba(27, 42, 59, 0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      transitionProperty: {
        'spacing': 'margin, padding',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-in',
      },
    },
  },
  plugins: [],
}