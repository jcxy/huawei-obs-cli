import { existsSync } from 'node:fs';
import { ObsError, type CommandResult, type ObsClientLike } from '../obs.js';

export interface UploadOptions {
  file: string;
  key: string;
}

export async function runUpload(client: ObsClientLike, options: UploadOptions): Promise<CommandResult> {
  if (!existsSync(options.file)) {
    return { ok: false, output: `Local file not found: ${options.file}` };
  }
  try {
    await client.putObject(options.key, options.file);
  } catch (err) {
    if (err instanceof ObsError) {
      return { ok: false, output: `Upload failed for ${options.key}: ${err.status} ${err.code} — ${err.message}` };
    }
    return { ok: false, output: `Upload failed for ${options.key}: ${errorMessage(err)}` };
  }
  return { ok: true, output: `Uploaded ${options.file} -> ${options.key}` };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
