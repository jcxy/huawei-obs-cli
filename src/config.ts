import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface ObsConfig {
  ak?: string;
  sk?: string;
  endpoint?: string;
  bucket?: string;
}

/** Keys whose values come from environment variables, mapped to config keys. */
const ENV_KEYS: Record<keyof ObsConfig, string> = {
  ak: 'OBS_AK',
  sk: 'OBS_SK',
  endpoint: 'OBS_ENDPOINT',
  bucket: 'OBS_BUCKET',
};

/** Override the base directory for config storage (used by tests). */
let configHome: string | undefined;

export function setConfigHome(home: string): void {
  configHome = home;
}

export function configPath(): string {
  const base = configHome ?? homedir();
  const dir = join(base, '.obs-cli');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return join(dir, 'config.json');
}

export function loadConfig(): ObsConfig {
  const path = configPath();
  let file: ObsConfig = {};
  if (existsSync(path)) {
    try {
      file = JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      // Corrupted config file: treat as empty rather than crash.
      file = {};
    }
  }
  const merged: ObsConfig = { ...file };
  for (const key of Object.keys(ENV_KEYS) as (keyof ObsConfig)[]) {
    const envValue = process.env[ENV_KEYS[key]];
    if (envValue !== undefined && envValue !== '') {
      merged[key] = envValue;
    }
  }
  return merged;
}

export function saveConfig(values: ObsConfig): void {
  const path = configPath();
  const existing = existsSync(path)
    ? (() => {
        try {
          return JSON.parse(readFileSync(path, 'utf-8')) as ObsConfig;
        } catch {
          return {};
        }
      })()
    : {};
  writeConfig({ ...existing, ...values });
}

/** Overwrite the config file wholesale (drops keys absent from `config`). */
export function writeConfig(config: ObsConfig): void {
  writeFileSync(configPath(), JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
}

/**
 * Returns the list of missing required credential keys. Bucket is NOT checked
 * here: it is resolved against --bucket by the command layer.
 */
export function validateCredentials(config: ObsConfig): string[] {
  const missing: string[] = [];
  for (const key of ['ak', 'sk', 'endpoint'] as const) {
    if (!config[key]) missing.push(key);
  }
  return missing;
}
