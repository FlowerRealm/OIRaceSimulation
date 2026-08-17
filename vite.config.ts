import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // The app source lives under web/ so it stays clear of src/index.js, which is
  // the Cloudflare Worker and is bundled by wrangler, not by us.
  root: 'web',
  plugins: [react()],
  build: {
    // wrangler.jsonc serves this directory. It is generated, so it is gitignored
    // and must never be hand-edited.
    outDir: '../dist',
    emptyOutDir: true,
  },
});
