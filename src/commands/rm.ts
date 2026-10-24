import { ObsError, type CommandResult, type ObsClientLike, type OutputFormat } from '../obs.js';

export interface RmOptions {
  key: string;
  format: OutputFormat;
  /** Report the delete that would run instead of performing it. */
  dryRun?: boolean;
}

export async function runRm(client: ObsClientLike, options: RmOptions): Promise<CommandResult> {
  if (options.dryRun) {
    return {
      ok: true,
      output:
        options.format === 'json'
          ? JSON.stringify({ dryRun: true, action: 'delete', key: options.key })
          : `Would delete ${options.key}`,
    };
  }
  try {
    await client.deleteObject(options.key);
  } catch (err) {
    if (err instanceof ObsError) {
      return {
        ok: false,
        output: `Delete failed for ${options.key}: ${err.status} ${err.code} — ${err.message}`,
      };
    }
    return { ok: false, output: `Delete failed for ${options.key}: ${errorMessage(err)}` };
  }
  return { ok: true, output: `Deleted ${options.key}` };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
