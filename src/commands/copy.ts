import { ObsError, type CommandResult, type ObsClientLike } from '../obs.js';

export interface CopyOptions {
  srcKey: string;
  destKey: string;
}

export async function runCopy(client: ObsClientLike, options: CopyOptions): Promise<CommandResult> {
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
