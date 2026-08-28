import { defineConfig } from "tsup";

export default defineConfig({
  entry: { setup: ".witboost/toolkit/src/setup/index.ts" },
  outDir: ".witboost/toolkit",
  format: "cjs",
  target: "node18",
  platform: "node",
  bundle: true,
  minify: false,
  sourcemap: true,
  clean: false,
  noExternal: [/.*/],
});
