import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.jsx'),
      name: 'FelanmalanWidget',
      formats: ['umd'],
      fileName: () => 'felanmalan-widget.js'
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        assetFileNames: 'felanmalan-widget.css'
      }
    },
    outDir: '../assets/js',
    emptyOutDir: false,
    cssCodeSplit: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
