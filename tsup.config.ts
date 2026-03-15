import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli/index.ts'],
  format: ['cjs'],
  target: 'node18',
  dts: true,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  define: {
    PKG_VERSION: JSON.stringify(require('./package.json').version),
  },
});
