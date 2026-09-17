import { ObsError, type CommandResult, type ObsClientLike } from '../obs.js';

export interface LsOptions {
  prefix: string;
  format: 'text' | 'json';
}

export async function runLs(client: ObsClientLike, options: LsOptions): Promise<CommandResult> {
  let objects;
  try {
    objects = await client.listObjects(options.prefix);
  } catch (err) {
    if (err instanceof ObsError) {
      return { ok: false, output: `List failed for prefix '${options.prefix}': ${err.status} ${err.code} — ${err.message}` };
    }
    return { ok: false, output: `List failed for prefix '${options.prefix}': ${errorMessage(err)}` };
  }
  objects.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  if (options.format === 'json') {
    return { ok: true, output: JSON.stringify(objects) };
  }
  return {
    ok: true,
    output: objects.map((o) => `${o.key}\t${o.size}\t${o.lastModified}`).join('\n'),
  };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
