import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { configDefaults } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
  },
});
