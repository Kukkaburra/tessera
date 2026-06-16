import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileApi } from './server/fileApi.js';

export default defineConfig({
  // fileApi reads tessera.config.json from rootDir for tokensDir + structure,
  // falling back to examples/tokens so a fresh clone runs out of the box.
  plugins: [react(), tailwindcss(), fileApi({ rootDir: import.meta.dirname })],
  server: {
    port: 5180,
    // Token JSON lives under the Vite root; without this, every save retriggers
    // the file watcher and forces a full page reload (losing editor state).
    watch: { ignored: ['**/tokens/**', '**/examples/**'] },
  },
});
