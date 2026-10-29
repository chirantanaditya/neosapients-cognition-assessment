import react from '@astrojs/react';
import {defineConfig} from 'astro/config';

export default defineConfig({
  output: 'static',
  build: {
    format: 'file',
  },
  integrations: [react()],
});
