import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const MANIFEST_SCHEMA_VERSION = 1;
export const MANIFEST_PATH = ".witboost-toolkit/manifest.json";

export interface WorkspaceManifest {
  schemaVersion: number;
  toolkitVersion: string;
  updatedAt: string;
  managedDirectories: string[];
  scaffoldsDigest: string;
}

function isWorkspaceManifest(value: unknown): value is WorkspaceManifest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<WorkspaceManifest>;
  return (
    candidate.schemaVersion === MANIFEST_SCHEMA_VERSION &&
    typeof candidate.toolkitVersion === "string" &&
    typeof candidate.updatedAt === "string" &&
    Array.isArray(candidate.managedDirectories) &&
    candidate.managedDirectories.every((entry) => typeof entry === "string") &&
    typeof candidate.scaffoldsDigest === "string"
  );
}

export function digest(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function readManifest(workspace: string): WorkspaceManifest | undefined {
  const path = join(workspace, MANIFEST_PATH);
  if (!existsSync(path)) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error(`Invalid workspace manifest JSON: ${path}`);
  }
  if (!isWorkspaceManifest(parsed)) throw new Error(`Invalid workspace manifest: ${path}`);
  return parsed;
}

export function writeManifest(workspace: string, manifest: WorkspaceManifest): void {
  const path = join(workspace, MANIFEST_PATH);
  const temporaryPath = `${path}.tmp`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  renameSync(temporaryPath, path);
}
