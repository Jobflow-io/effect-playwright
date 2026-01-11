import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/experimental/index.ts"],
  exports: true,
  dts: true,
  define: {
    "import.meta.vitest": "undefined",
  },
});
