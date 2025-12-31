import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false // Don't open browser in production
  },
  build: {
    // Optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
      },
    },
    rollupOptions: {
      output: {
        // Split chunks for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'lucide': ['lucide-react'],
        },
      },
    },
    // Optimize chunk size for Telegram Web App
    chunkSizeWarningLimit: 500,
  },
  // Optimize for Telegram Web App
  define: {
    'process.env.VITE_APP_TITLE': JSON.stringify('K-Cover Dance Life'),
  },
})
