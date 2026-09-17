import { loadConfig, saveConfig, writeConfig, type ObsConfig } from '../config.js';
import type { CommandResult } from '../obs.js';

export type ConfigAction = 'list' | 'set' | 'get' | 'unset';

export interface ConfigCommandOptions {
  action: ConfigAction;
  format: 'text' | 'json';
  key?: string;
  value?: string;
}

const VALID_KEYS = ['ak', 'sk', 'endpoint', 'bucket'] as const;

export async function runConfigCommand(options: ConfigCommandOptions): Promise<CommandResult> {
  switch (options.action) {
    case 'list':
      return list(options.format);
    case 'set':
      return set(options.key, options.value);
    case 'get':
      return get(options.key);
    case 'unset':
      return unset(options.key);
  }
}

function list(format: 'text' | 'json'): CommandResult {
  const config = loadConfig();
  if (format === 'json') {
    return { ok: true, output: JSON.stringify(config) };
  }
  const lines = VALID_KEYS.map((key) => {
    const value = config[key];
    if (value === undefined) return `${key}=`;
    return `${key}=${key === 'sk' ? '****' : value}`;
  });
  return { ok: true, output: lines.join('\n') };
}

function set(key: string | undefined, value: string | undefined): CommandResult {
  if (!isValidKey(key)) {
    return { ok: false, output: `Unknown config key: ${key ?? '(none)'}. Valid keys: ${VALID_KEYS.join(', ')}` };
  }
  if (value === undefined) {
    return { ok: false, output: 'Usage: obs-cli config set <key> <value>' };
  }
  saveConfig({ [key]: value } as ObsConfig);
  return { ok: true, output: `Set ${key}=${value}` };
}

function get(key: string | undefined): CommandResult {
  if (!isValidKey(key)) {
    return { ok: false, output: `Unknown config key: ${key ?? '(none)'}. Valid keys: ${VALID_KEYS.join(', ')}` };
  }
  const value = loadConfig()[key];
  if (value === undefined) {
    return { ok: false, output: `${key} is not set. Run \`obs-cli init\` or use \`obs-cli config set ${key} <value>\`.` };
  }
  return { ok: true, output: value };
}

function unset(key: string | undefined): CommandResult {
  if (!isValidKey(key)) {
    return { ok: false, output: `Unknown config key: ${key ?? '(none)'}. Valid keys: ${VALID_KEYS.join(', ')}` };
  }
  const config = loadConfig();
  delete config[key];
  writeConfig(config);
  return { ok: true, output: `Unset ${key}` };
}

function isValidKey(key: string | undefined): key is (typeof VALID_KEYS)[number] {
  return key !== undefined && (VALID_KEYS as readonly string[]).includes(key);
}
