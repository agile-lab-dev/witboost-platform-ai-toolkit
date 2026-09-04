import { existsSync, readFileSync } from "node:fs";

export type TechAdapterLanguage = "java" | "python";

export interface ScaffoldDefinition {
  url: string;
  commit: string;
  requiredPaths: string[];
}

interface ScaffoldCatalog {
  schemaVersion: number;
  techAdapter: Record<TechAdapterLanguage, ScaffoldDefinition>;
}

export function loadScaffolds(path: string): ScaffoldCatalog {
  if (!existsSync(path)) throw new Error(`Scaffold catalog not found: ${path}`);
  const catalog = JSON.parse(readFileSync(path, "utf8")) as ScaffoldCatalog;
  if (catalog.schemaVersion !== 1) {
    throw new Error(`Unsupported scaffold catalog schema: ${catalog.schemaVersion}`);
  }
  return catalog;
}
