export interface RawConfigFile {
  harness?: {
    targets?: string[];
  };
  agents?: {
    includeCustom?: boolean;
  };
}

export interface WitboostConfig {
  harnessTargets: string[];
  includeCustom: boolean;
}

export function buildConfig(raw: RawConfigFile): WitboostConfig {
  return {
    harnessTargets: raw.harness?.targets ?? ["copilot"],
    includeCustom: raw.agents?.includeCustom ?? true,
  };
}
