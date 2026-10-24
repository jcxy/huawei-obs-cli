import { ObsError, type CommandResult, type ObsClientLike, type OutputFormat } from '../obs.js';

export interface CopyOptions {
  srcKey: string;
  destKey: string;
  format: OutputFormat;
  /** Report the copy that would run instead of performing it. */
  dryRun?: boolean;
}

export async function runCopy(client: ObsClientLike, options: CopyOptions): Promise<CommandResult> {
  if (options.dryRun) {
    return {
      ok: true,
      output:
        options.format === 'json'
          ? JSON.stringify({
              dryRun: true,
              action: 'copy',
              source: options.srcKey,
              destination: options.destKey,
            })
          : `Would copy ${options.srcKey} -> ${options.destKey}`,
    };
  }
  try {
    await client.copyObject(options.srcKey, options.destKey);
  } catch (err) {
    if (err instanceof ObsError) {
      return {
        ok: false,
        output: `Copy failed ${options.srcKey} -> ${options.destKey}: ${err.status} ${err.code} — ${err.message}`,
      };
    }
    return { ok: false, output: `Copy failed ${options.srcKey} -> ${options.destKey}: ${errorMessage(err)}` };
  }
  return { ok: true, output: `Copied ${options.srcKey} -> ${options.destKey}` };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
