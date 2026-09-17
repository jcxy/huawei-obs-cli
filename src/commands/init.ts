import { loadConfig, saveConfig, type ObsConfig } from '../config.js';
import type { CommandResult } from '../obs.js';

export type Ask = (prompt: string) => Promise<string>;

interface Field {
  key: keyof ObsConfig;
  prompt: string;
  required: boolean;
}

const FIELDS: Field[] = [
  { key: 'ak', prompt: 'Access Key ID (AK)', required: true },
  { key: 'sk', prompt: 'Secret Access Key (SK)', required: true },
  { key: 'endpoint', prompt: 'Endpoint (e.g. https://obs.cn-north-4.myhuaweicloud.com)', required: true },
  { key: 'bucket', prompt: 'Bucket (default bucket, optional)', required: false },
];

/**
 * Interactive init wizard. `ask` prompts the user and returns their answer;
 * empty answers keep the existing (default) value.
 */
export async function runInit(ask: Ask): Promise<CommandResult> {
  const current = loadConfig();
  const result: ObsConfig = {};
  for (const field of FIELDS) {
    let value = await ask(field.prompt);
    if (value === '') {
      value = current[field.key] ?? '';
    }
    while (value === '' && field.required) {
      value = await ask(`${field.prompt} (required)`);
    }
    if (value !== '') {
      result[field.key] = value;
    }
  }
  saveConfig(result);
  const lines = [
    'Configuration saved:',
    `  ak=${result.ak ?? ''}`,
    `  sk=****`,
    `  endpoint=${result.endpoint ?? ''}`,
    `  bucket=${result.bucket ?? '(none — pass --bucket per command)'}`,
  ];
  return { ok: true, output: lines.join('\n') };
}
