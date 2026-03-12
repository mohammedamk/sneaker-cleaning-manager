import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    watch: {},
    outDir: "../extensions/sneaker-cleaning-manager/assets",
    rollupOptions: {
      input: '/src/main.jsx',
      output: {
        entryFileNames: `sneakerCleaningExt.js`,
        chunkFileNames: `sneakerCleaningExt.js`,
        assetFileNames: (chunkInfo) => {
          if (chunkInfo.name && chunkInfo.name.endsWith('.css')) {
            return `sneakerCleaningExt.css`;
          }
          return `[name].[ext]`;
        }
      }
    }
  },
})
