import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: "/rick-and-morty-explorer/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
  resolve: {
    alias: {
      // Alias principal para la carpeta src
      "@": resolve(__dirname, "./src"),

      // Alias específicos para Sass
      "@sass": resolve(__dirname, "./src/sass"),
      "@abstracts": resolve(__dirname, "./src/sass/abstracts"),
      "@components": resolve(__dirname, "./src/sass/components"),
      "@layout": resolve(__dirname, "./src/sass/layout"),
      "@themes": resolve(__dirname, "./src/sass/themes"),
      "@base": resolve(__dirname, "./src/sass/base"),
      "@pages": resolve(__dirname, "./src/sass/pages"),
      "@vendors": resolve(__dirname, "./src/sass/vendors"),
    },
  },
  css: {
    devSourcemap: true, // Facilita la depuración de Sass
    preprocessorOptions: {
      scss: {
        includePaths: [
          resolve(__dirname, "./src/sass"),
          resolve(__dirname, "./src/sass/abstracts"),
          resolve(__dirname, "./src/sass/components"),
          resolve(__dirname, "./src/sass/layout"),
          resolve(__dirname, "./src/sass/base"),
          resolve(__dirname, "./src/sass/pages"),
          resolve(__dirname, "./src/sass/themes"),
          resolve(__dirname, "./src/sass/vendors"),
        ],
      },
    },
  },
});