import { existsSync } from 'node:fs';
import { ObsError, type CommandResult, type ObsClientLike, type OutputFormat } from '../obs.js';

export interface UploadOptions {
  file: string;
  key: string;
  format: OutputFormat;
  /** Report the upload that would run instead of performing it. */
  dryRun?: boolean;
}

export async function runUpload(client: ObsClientLike, options: UploadOptions): Promise<CommandResult> {
  if (!existsSync(options.file)) {
    return { ok: false, output: `Local file not found: ${options.file}` };
  }
  if (options.dryRun) {
    return {
      ok: true,
      output: dryRunOutput(options.format, {
        action: 'upload',
        file: options.file,
        key: options.key,
      }),
    };
  }
  try {
    await client.putObject(options.key, options.file);
  } catch (err) {
    if (err instanceof ObsError) {
      return {
        ok: false,
        output: `Upload failed for ${options.key}: ${err.status} ${err.code} — ${err.message}`,
      };
    }
    return { ok: false, output: `Upload failed for ${options.key}: ${errorMessage(err)}` };
  }
  return { ok: true, output: `Uploaded ${options.file} -> ${options.key}` };
}

function dryRunOutput(format: OutputFormat, body: Record<string, string>): string {
  return format === 'json'
    ? JSON.stringify({ dryRun: true, ...body })
    : `Would upload ${body.file} -> ${body.key}`;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
