import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/',
  root: 'Front-End',
  envDir: '../',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'Front-End/index.html'),
        documentos: resolve(__dirname, 'Front-End/documentos.html') // Adicione esta linha
      }
    }
  }
});