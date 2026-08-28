import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { type RawConfigFile, type WitboostConfig, buildConfig } from "./schema.js";

/**
 * Load configuration from `.witboost/config.yml` (if present), falling back
 * to built-in defaults. There is no environment/API layer here — unlike
 * witboost-ai-toolkit, this toolkit does not call any platform API.
 */
export function loadConfig(configPath?: string): WitboostConfig {
  const filePath = configPath ?? resolve(process.cwd(), ".witboost", "config.yml");

  let fileConfig: RawConfigFile = {};
  if (existsSync(filePath)) {
    const raw = readFileSync(filePath, "utf-8");
    fileConfig = (parseYaml(raw) as RawConfigFile) ?? {};
  }

  return buildConfig(fileConfig);
}
