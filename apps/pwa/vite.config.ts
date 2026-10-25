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
        name: 'Baobab',
        short_name: 'Baobab',
        description: 'Marketplace e-commerce indépendante — Afrique de l\'Ouest',
        theme_color: '#263e2f',
        background_color: '#fafbf7',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
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
              cacheName: 'baobab-images',
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
              cacheName: 'baobab-catalog-api',
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
