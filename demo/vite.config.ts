import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

import { fileURLToPath, URL } from "node:url";

import svgLoader from "vite-svg-loader";

export default defineConfig({
  plugins: [vue(), svgLoader({ defaultImport: "component" })],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  css: {
    modules: {
      generateScopedName: "[hash:base64:5]",
      scopeBehaviour: "local",
      localsConvention: "camelCaseOnly",
    },
    preprocessorOptions: {
      scss: {
        additionalData: `
            @use "@/assets/scss/app.core" as *;
            @use "@/assets/scss/app.extends" as *;
          `,
      },
    },
  },
});
