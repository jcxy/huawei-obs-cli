import { ObsError, type CommandResult, type ObsClientLike } from '../obs.js';

export interface RmOptions {
  key: string;
}

export async function runRm(client: ObsClientLike, options: RmOptions): Promise<CommandResult> {
  try {
    await client.deleteObject(options.key);
  } catch (err) {
    if (err instanceof ObsError) {
      return { ok: false, output: `Delete failed for ${options.key}: ${err.status} ${err.code} — ${err.message}` };
    }
    return { ok: false, output: `Delete failed for ${options.key}: ${errorMessage(err)}` };
  }
  return { ok: true, output: `Deleted ${options.key}` };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
