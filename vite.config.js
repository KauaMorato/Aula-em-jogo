import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Aula-em-jogo/',
  root: './Front-End',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});