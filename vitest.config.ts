import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    includeSource: ["src/**/*.ts"],
    alias: {
      "effect-playwright": "src/index.ts",
      "effect-playwright/experimental": "src/experimental/index.ts",
    },
    sequence: {
      concurrent: true,
    },
  },
});
