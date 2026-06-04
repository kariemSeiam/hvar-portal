import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Customer Management System - HVAR
// Optimized configuration for customer-centric application
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-router-dom': 'react-router-dom'
    }
  },
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'framer-motion']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true,
    open: true
  }
});
