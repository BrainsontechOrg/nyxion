import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  vite: {
    plugins: [tailwindcss()],
    resolve: { alias: { '@': '/src' } },
  },
});
