import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hitel00000.github.io',
  base: '/dialogues',
  integrations: [sitemap()],
});