import { basename } from 'node:path';
import { ObsError, type CommandResult, type ObsClientLike } from '../obs.js';

export interface DownloadOptions {
  key: string;
  /** Local output path; defaults to the basename of the key. */
  output?: string;
}

export async function runDownload(client: ObsClientLike, options: DownloadOptions): Promise<CommandResult> {
  const target = options.output ?? basename(options.key);
  try {
    await client.getObject(options.key, target);
  } catch (err) {
    return failure(options.key, err);
  }
  return { ok: true, output: `Downloaded ${options.key} -> ${target}` };
}

export function failure(key: string, err: unknown): CommandResult {
  if (err instanceof ObsError) {
    return {
      ok: false,
      output: `Download failed for ${key}: ${err.status} ${err.code} — ${err.message}`,
    };
  }
  return { ok: false, output: `Download failed for ${key}: ${errorMessage(err)}` };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
