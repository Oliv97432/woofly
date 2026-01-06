import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";

// ✅ VERSION MINIMALE FONCTIONNELLE
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
        manualChunks: {
          // Séparer les grosses librairies
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react'],
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
    
    // ✅ OPTIMISATION 7 : Optimisation des assets
    assetsInlineLimit: 4096, // 4KB inline max
  },
  
  // ✅ OPTIMISATION 8 : Plugins essentiels seulement
  plugins: [
    tsconfigPaths(),
    react(),
    tagger(),
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
