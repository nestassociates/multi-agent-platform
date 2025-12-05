import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
// NOTE: During production builds, the build system pre-generates site-data.json
// and the data loader will use that instead of API calls.
// Server mode is used in dev for simpler dynamic routing.
export default defineConfig({
  integrations: [
    tailwind(),
    react(), // For interactive components like contact forms
  ],
  // Server mode allows dynamic routes to work in dev without getStaticPaths()
  // Production builds are handled by the build-system package which generates
  // pre-built static HTML from the site data JSON
  output: 'server',
  build: {
    assets: 'assets',
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
  vite: {
    ssr: {
      noExternal: ['@nest/shared-types'],
    },
  },
});
