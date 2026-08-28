import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [".witboost/toolkit/tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [".witboost/toolkit/src/**/*.ts"],
      exclude: [".witboost/toolkit/src/setup/index.ts"],
    },
  },
  resolve: {
    alias: {
      "@": "./.witboost/toolkit/src",
    },
  },
});
