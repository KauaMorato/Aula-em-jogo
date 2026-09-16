import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  root: 'Front-End',
  envDir: '../', // <--- Adicione esta linha
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});