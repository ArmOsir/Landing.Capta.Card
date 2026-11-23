import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  // Direcciones anteriores de las páginas legales
  redirects: {
    "/legal/une-y-aclaraciones": "/legal/aclaraciones",
    "/legal/politica-de-cookies": "/legal/aviso-de-privacidad",
  },
});
