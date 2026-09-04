import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadScaffolds } from "../src/scaffolds.js";

describe("scaffold catalog", () => {
  it("pins full immutable commits", () => {
    const catalog = loadScaffolds(resolve(__dirname, "../config/scaffolds.json"));
    for (const definition of Object.values(catalog.techAdapter)) {
      expect(definition.commit).toMatch(/^[a-f0-9]{40}$/);
      expect(definition.url).toMatch(/^https:\/\//);
      expect(definition.requiredPaths.length).toBeGreaterThan(0);
    }
  });
});
