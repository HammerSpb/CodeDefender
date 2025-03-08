import swc from 'unplugin-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [swc.vite()],
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
});
