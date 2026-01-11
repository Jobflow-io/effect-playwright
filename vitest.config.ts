import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    includeSource: ["src/**/*.ts"],
    alias: {
      "@jobflow/effect-playwright": "src/index.ts",
      "@jobflow/effect-playwright/experimental": "src/experimental/index.ts",
    },
    sequence: {
      concurrent: true,
    },
  },
});
