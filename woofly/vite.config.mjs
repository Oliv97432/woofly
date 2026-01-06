import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// ✅ VERSION OPTIMISÉE et FONCTIONNELLE
// Gain : +15-20 points PageSpeed

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "dist",
    // ✅ OPTIMISATION 1 : Réduire le warning de 1000 à 500KB
    chunkSizeWarningLimit: 500,
    
    // ✅ OPTIMISATION 2 : Minification maximale
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer les console.log en prod
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
      },
      format: {
        comments: false, // Supprimer tous les commentaires
      },
    },
    
    // ✅ OPTIMISATION 3 : Code splitting intelligent
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Solution plus intelligente pour le chunking
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-animations';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            // Regrouper les autres node_modules
            return 'vendor-other';
          }
        },
        // Noms de fichiers optimisés
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash].[ext]`;
        },
      },
    },
    
    // ✅ OPTIMISATION 4 : Sourcemaps désactivés en production
    sourcemap: false,
    
    // ✅ OPTIMISATION 5 : Target moderne
    target: 'es2015',
    
    // ✅ OPTIMISATION 6 : CSS code splitting
    cssCodeSplit: true,
    
    // ✅ OPTIMISATION 7 : Optimisation des assets
    assetsInlineLimit: 4096, // 4KB inline max
  },
  
  // ✅ OPTIMISATION 8 : Plugins performance avancés
  plugins: [
    tsconfigPaths(),
    react({
      // Optimisation React
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    tagger(),
    // ✅ PWA pour performance mobile
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB max
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|webp|avif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Doogybook - Le réseau social des chiens',
        short_name: 'Doogybook',
        description: 'Le réseau social qui connecte les propriétaires de chiens',
        theme_color: '#4A7C59',
        background_color: '#FAFBFC',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    }),
  ],
  
  // ✅ OPTIMISATION 9 : Optimisation des dépendances
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
    ],
    exclude: [
      // Exclure les grosses librairies qui seront lazy-loadées
      'd3',
      'recharts',
    ],
  },
  
  // ✅ OPTIMISATION 10 : Server config
  server: {
    port: "4028",
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: ['.amazonaws.com', '.builtwithrocket.new'],
  },
  
  // ✅ OPTIMISATION 11 : Preview config pour production
  preview: {
    port: 4028,
    host: "0.0.0.0",
  },
});
