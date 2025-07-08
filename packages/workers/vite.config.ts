import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    minify: true,
    rollupOptions: {
      input: './src/index.ts',
      output: {
        format: 'es',
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
