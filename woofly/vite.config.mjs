import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";
import { compression } from 'vite-plugin-compression2';

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
        manualChunks: {
          // Séparer les grosses librairies
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', 'framer-motion'],
          'vendor-charts': ['recharts', 'd3'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-forms': ['react-hook-form'],
        },
        // Noms de fichiers optimisés
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    // ✅ OPTIMISATION 4 : Sourcemaps désactivés en production
    sourcemap: false,
    
    // ✅ OPTIMISATION 5 : Target moderne
    target: 'es2015',
    
    // ✅ OPTIMISATION 6 : CSS code splitting
    cssCodeSplit: true,
  },
  
  // ✅ OPTIMISATION 7 : Plugins optimisés
  plugins: [
    tsconfigPaths(),
    react({
      // Optimisation React
      babel: {
        plugins: [
          // Supprimer PropTypes en production
          ['transform-react-remove-prop-types', { removeImport: true }],
        ],
      },
    }),
    tagger(),
    
    // ✅ OPTIMISATION 8 : Compression Gzip
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Compresser les fichiers > 10KB
      deleteOriginFile: false,
    }),
    
    // ✅ OPTIMISATION 9 : Compression Brotli (meilleure que Gzip)
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
  ],
  
  // ✅ OPTIMISATION 10 : Optimisation des dépendances
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
  
  // ✅ OPTIMISATION 11 : Server config (inchangé)
  server: {
    port: "4028",
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: ['.amazonaws.com', '.builtwithrocket.new'],
  },
  
  // ✅ OPTIMISATION 12 : Preview config pour production
  preview: {
    port: 4028,
    host: "0.0.0.0",
  },
});
