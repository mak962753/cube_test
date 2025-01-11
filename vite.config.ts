import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
console.log(process.env.npm_package_version)
export default defineConfig({
  plugins: [vue(), svgLoader()],
  server:{
    port: 33333,
  },define: {
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});