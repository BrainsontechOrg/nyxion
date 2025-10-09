import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import vercel from '@astrojs/vercel';
import critters from 'astro-critters';

export default defineConfig({
  output: 'server',
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
    resolve: { alias: { '@': '/src' } },
    build: {
      cssCodeSplit: false
    }
  },
  site: process.env.PUBLIC_SITE_URL,
  integrations: [sitemap(), critters({
    preload: 'swap',
    pruneSource: true,
  }),],
  server: {
    'Access-Control-Allow-Origin': '*',

    // Seguridad general
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Protección XSS
    'X-XSS-Protection': '1; mode=block',

    // Política de permisos (limita acceso a hardware)
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), interest-cohort=()',

    // Política de seguridad de contenido
    'Content-Security-Policy': [
      "default-src 'self';",
      "img-src 'self' data: https:;",
      "font-src 'self' data: https://fonts.gstatic.com;",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
      "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com;",
      "connect-src 'self' https://api.resend.com https://challenges.cloudflare.com;",
      "frame-src 'self' https://challenges.cloudflare.com;",
    ].join(' '),

    // Cacheo
    'Cache-Control': 'public, max-age=31536000, immutable',
  }
});
