import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// GitHub Pages serves a project site under /<repository>/.
export default defineConfig({
  base: '/dashboard-widgets-toolkit-vue-demo/',
  plugins: [vue(), tailwindcss()],
});
