import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileApi } from './server/fileApi.js';

// TESSERA_ROOT (set by the `tessera` CLI) points the file API at the app repo you
// run it in; without it, the tool edits its own tokens/ (or examples/tokens).
const rootDir = process.env.TESSERA_ROOT || import.meta.dirname;

export default defineConfig({
  // fileApi reads tessera.config.json from rootDir for tokensDir + structure,
  // falling back to examples/tokens so a fresh clone runs out of the box.
  plugins: [react(), tailwindcss(), fileApi({ rootDir })],
  server: {
    port: Number(process.env.TESSERA_PORT) || 5180,
    // Token JSON lives under the Vite root; without this, every save retriggers
    // the file watcher and forces a full page reload (losing editor state).
    watch: { ignored: ['**/tokens/**', '**/examples/**'] },
  },
});
