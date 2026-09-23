import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Configuración de Vite: React + PWA (funciona offline y se instala como app nativa)
export default defineConfig({
  server: {
    host: true,
    allowedHosts: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'MiTienda Cloud',
        short_name: 'MiTienda',
        description: 'Gestión de inventario, ventas y fiados para tiendas de barrio',
        theme_color: '#16A34A',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        // Cachea assets estáticos para que la app cargue sin internet
        globPatterns: ['**/*.{js,css,html,png,svg,ico}']
      }
    })
  ]
})
