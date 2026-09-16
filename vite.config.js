import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  root: './Front-End',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});