/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif']
      },
      colors: {
        // Paleta clara, inspirada en tiendas del Caribe colombiano: marfil, teal y mango
        cream: '#FBF6EC',
        surface: '#FFFFFF',
        ink: '#1C3438',
        inkmuted: '#6B7D7F',
        teal: { DEFAULT: '#0F8B8D', dark: '#0B6567', light: '#E4F3F2' },
        mango: { DEFAULT: '#FF7A33', dark: '#E5601A', light: '#FFE9DC' },
        sun: { DEFAULT: '#FFC845', light: '#FFF6DE' }
      },
      borderRadius: {
        blob: '2rem 1rem 2rem 1rem'
      }
    }
  },
  plugins: []
}
