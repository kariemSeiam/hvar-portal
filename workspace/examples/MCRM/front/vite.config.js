import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Only load VITE_ prefixed variables to avoid conflicts
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  
  // Get API URL for proxy configuration
  // In development mode, use VITE_APP_API_URL_DEV
  // In production builds, proxy is not used (Flask serves both frontend and API)
  const apiUrl = mode === 'development' 
    ? (env.VITE_APP_API_URL_DEV || '') 
    : '';
  
  // Logging removed for production builds
  
  return {
  plugins: [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    }),
    {
      name: 'arabic-optimizer',
      configResolved(config) {
        // Optimize for Arabic content - removed manualChunks conflict
        // manualChunks are already defined in rollupOptions below
      }
    },
    // Bundle analyzer for development
    process.env.ANALYZE && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@assets': resolve(__dirname, './src/assets'),
      '@contexts': resolve(__dirname, './src/contexts'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@hooks': resolve(__dirname, './src/hooks'),
      // Ensure single React instance to prevent "Invalid hook call" errors
      'react': resolve(__dirname, './node_modules/react'),
      'react-dom': resolve(__dirname, './node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom']
  },
  build: {
    // Build to project root dist folder (backend serves from here)
    // This ensures Flask backend can serve the frontend from dist/
    outDir: '../dist',
    // Always empty output directory before building
    emptyOutDir: true,
    // Ensure assets are served from root (not relative paths)
    // This is important for CyberPanel/LiteSpeed deployment
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: 'terser',
    terserOptions: {
      compress: {
        // Drop all console methods in production (except console.error)
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn', 'console.group', 'console.groupEnd', 'console.table'],
        // Prevent TDZ issues by ensuring proper variable initialization order
        passes: 2,
        unsafe: false,
        unsafe_comps: false,
        unsafe_math: false,
        unsafe_methods: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // App chunks removed: call-center, hub, service-modals, service-actions, stock
          // — caused TDZ / circular dependency errors when split

          // Vendor UI + React (must be same chunk: framer-motion/lucide-react use React.forwardRef)
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/framer-motion') ||
              id.includes('node_modules/lucide-react')) {
            return 'vendor-ui';
          }

          if (id.includes('node_modules/date-fns') ||
              id.includes('node_modules/axios')) {
            return 'vendor-utils';
          }

          // Heavy libraries
          if (id.includes('node_modules/exceljs')) {
            return 'exceljs';
          }

          if (id.includes('node_modules/qr-scanner')) {
            return 'scanner';
          }

          if (id.includes('node_modules/leaflet') ||
              id.includes('node_modules/react-leaflet')) {
            return 'maps';
          }

          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    reportCompressedSize: false,
    target: 'esnext',
    modulePreload: {
      polyfill: false
    }
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: false,
    cors: true,
    proxy: apiUrl ? {
      '/api': {
        target: apiUrl,
        changeOrigin: true,
        secure: false,
      }
    } : undefined
  },
  preview: {
    port: 5000,
    open: false,
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `$rtl: true;`
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __RTL_SUPPORT__: JSON.stringify(true),
    __ARABIC_THEME__: JSON.stringify(true),
  },
  // Optimize for Arabic content
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'framer-motion'
    ],
    // Ensure React is deduplicated during optimization
    esbuildOptions: {
      resolveExtensions: ['.jsx', '.js', '.tsx', '.ts']
    }
  },
  test: {
    environment: 'node',
    include: ['**/*.test.js', '**/*.test.jsx'],
    globals: false,
  }
  };
});
