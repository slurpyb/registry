import { defineConfig, passthroughImageService } from 'astro/config';
import sitemap from "@astrojs/sitemap";
import tailwindcss from '@tailwindcss/vite';
import react from "@astrojs/react";
import { SITE_URL } from "./src/site.config.js";

export default defineConfig({
  image: {
    service: passthroughImageService(),
  },
  vite: {
    plugins: [tailwindcss()],
  },
  site: SITE_URL,
  integrations: [sitemap(), react()]
});
