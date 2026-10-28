import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'WESTZONE — Marketplace Afrique de l\'Ouest',
        short_name: 'WESTZONE',
        description:
          'Marketplace et conciergerie d\'achat pour l\'Afrique de l\'Ouest : sourcing, devis transparents, fret et suivi.',
        lang: 'fr',
        categories: ['shopping', 'business'],
        theme_color: '#0C2238',
        background_color: '#FBF7EF',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // Cache images (Supabase, local uploads, static webp/jpg/png)
            urlPattern: ({ request, url }) =>
              request.destination === 'image' ||
              url.pathname.includes('/storage/v1/object/public/') ||
              /\.(?:png|jpg|jpeg|svg|webp|gif)$/i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'westzone-images',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache catalog and listings endpoints for offline / slow 3G browsing
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/api/catalog') ||
              url.pathname.startsWith('/api/concierge/universes') ||
              url.pathname.startsWith('/api/concierge/home'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'westzone-catalog-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60, // 24 heures
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Real-time operations and auth stay NetworkOnly
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
