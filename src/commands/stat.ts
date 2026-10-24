import {
  ObsError,
  type CommandResult,
  type ObsClientLike,
  type ObsObjectMeta,
  type OutputFormat,
} from '../obs.js';

export interface StatOptions {
  key: string;
  format: OutputFormat;
}

export async function runStat(client: ObsClientLike, options: StatOptions): Promise<CommandResult> {
  let meta: ObsObjectMeta;
  try {
    meta = await client.headObject(options.key);
  } catch (err) {
    if (err instanceof ObsError && err.status === 404) {
      return { ok: false, output: `No such object: ${options.key}` };
    }
    if (err instanceof ObsError) {
      return {
        ok: false,
        output: `Stat failed for ${options.key}: ${err.status} ${err.code} — ${err.message}`,
      };
    }
    return { ok: false, output: `Stat failed for ${options.key}: ${errorMessage(err)}` };
  }
  if (options.format === 'json') {
    return { ok: true, output: JSON.stringify(meta) };
  }
  return { ok: true, output: `${meta.key}\t${meta.size}\t${meta.etag}\t${meta.lastModified}` };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
