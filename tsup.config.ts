import { defineConfig } from "tsup";

export default defineConfig({
  entry: { cli: "src/cli.ts" },
  outDir: "dist",
  format: "esm",
  target: "node20",
  platform: "node",
  bundle: true,
  minify: false,
  sourcemap: true,
  clean: true,
});
