import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ObsClientLike, ObsObject } from '../src/obs.js';

let workDir: string;
beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), 'obs-cli-cmd-'));
  writeFileSync(join(workDir, '模版.xlsx'), 'dummy');
});
afterAll(() => rmSync(workDir, { recursive: true, force: true }));

function fakeClient(objects: ObsObject[] = []): ObsClientLike & { calls: Record<string, unknown[][]> } {
  const calls: Record<string, unknown[][]> = {};
  const record = (name: string, args: unknown[]) => {
    (calls[name] ??= []).push(args);
  };
  return {
    calls,
    listObjects: vi.fn(async (prefix: string) => {
      record('listObjects', [prefix]);
      return objects.filter((o) => o.key.startsWith(prefix));
    }),
    putObject: vi.fn(async (key: string, filePath: string) => {
      record('putObject', [key, filePath]);
    }),
    getObject: vi.fn(async (key: string, filePath: string) => {
      record('getObject', [key, filePath]);
    }),
    copyObject: vi.fn(async (srcKey: string, destKey: string) => {
      record('copyObject', [srcKey, destKey]);
    }),
    deleteObject: vi.fn(async (key: string) => {
      record('deleteObject', [key]);
    }),
  };
}

const OBJ = (key: string, size = 1024, lastModified = '2026-09-01T10:00:00.000Z'): ObsObject => ({ key, size, lastModified });

describe('ls', () => {
  it('outputs key<TAB>size<TAB>modified lines, sorted by key', async () => {
    const { runLs } = await import('../src/commands/ls.js');
    const client = fakeClient([OBJ('b.xlsx'), OBJ('a/dev/模版.xlsx', 2048)]);
    const result = await runLs(client, { prefix: '', format: 'text' });
    expect(result.ok).toBe(true);
    expect(result.output).toBe(
      'a/dev/模版.xlsx\t2048\t2026-09-01T10:00:00.000Z\nb.xlsx\t1024\t2026-09-01T10:00:00.000Z',
    );
    expect(client.calls.listObjects).toEqual([['']]);
  });

  it('passes prefix through', async () => {
    const { runLs } = await import('../src/commands/ls.js');
    const client = fakeClient([OBJ('dev/a.xlsx'), OBJ('prod/b.xlsx')]);
    await runLs(client, { prefix: 'prod/', format: 'text' });
    expect(client.calls.listObjects).toEqual([['prod/']]);
  });

  it('json format outputs a JSON array of objects', async () => {
    const { runLs } = await import('../src/commands/ls.js');
    const client = fakeClient([OBJ('a.xlsx')]);
    const result = await runLs(client, { prefix: '', format: 'json' });
    expect(result.ok).toBe(true);
    expect(JSON.parse(result.output)).toEqual([{ key: 'a.xlsx', size: 1024, lastModified: '2026-09-01T10:00:00.000Z' }]);
  });

  it('empty listing outputs nothing in text mode, empty array in json mode', async () => {
    const { runLs } = await import('../src/commands/ls.js');
    const client = fakeClient();
    expect((await runLs(client, { prefix: '', format: 'text' })).output).toBe('');
    expect(JSON.parse((await runLs(client, { prefix: '', format: 'json' })).output)).toEqual([]);
  });

  it('reports ObsError as failed result', async () => {
    const { runLs } = await import('../src/commands/ls.js');
    const { ObsError } = await import('../src/obs.js');
    const client = fakeClient();
    client.listObjects = vi.fn(async () => {
      throw new ObsError(403, 'AccessDenied', 'Access denied.');
    });
    const result = await runLs(client, { prefix: 'dev/', format: 'text' });
    expect(result.ok).toBe(false);
    expect(result.output).toContain('dev/');
    expect(result.output).toContain('403');
  });
});

describe('download', () => {
  it('downloads to basename of key by default', async () => {
    const { runDownload } = await import('../src/commands/download.js');
    const client = fakeClient();
    const result = await runDownload(client, { key: 'dev/模版.xlsx', output: undefined });
    expect(result.ok).toBe(true);
    expect(client.calls.getObject).toEqual([['dev/模版.xlsx', '模版.xlsx']]);
    expect(result.output).toContain('dev/模版.xlsx');
    expect(result.output).toContain('模版.xlsx');
  });

  it('downloads to -o path when given', async () => {
    const { runDownload } = await import('../src/commands/download.js');
    const client = fakeClient();
    await runDownload(client, { key: 'a/b.txt', output: 'out/b.txt' });
    expect(client.calls.getObject).toEqual([['a/b.txt', 'out/b.txt']]);
  });

  it('reports ObsError as failed result', async () => {
    const { runDownload } = await import('../src/commands/download.js');
    const { ObsError } = await import('../src/obs.js');
    const client = fakeClient();
    client.getObject = vi.fn(async () => {
      throw new ObsError(404, 'NoSuchKey', 'The specified key does not exist.');
    });
    const result = await runDownload(client, { key: 'missing.txt', output: undefined });
    expect(result.ok).toBe(false);
    expect(result.output).toContain('missing.txt');
    expect(result.output.toLowerCase()).toContain('404');
  });
});

describe('upload', () => {
  it('uploads local file to key', async () => {
    const { runUpload } = await import('../src/commands/upload.js');
    const client = fakeClient();
    const result = await runUpload(client, { file: join(workDir, '模版.xlsx'), key: 'dev/模版.xlsx' });
    expect(result.ok).toBe(true);
    expect(client.calls.putObject).toEqual([['dev/模版.xlsx', join(workDir, '模版.xlsx')]]);
    expect(result.output).toContain('dev/模版.xlsx');
  });

  it('fails when local file does not exist', async () => {
    const { runUpload } = await import('../src/commands/upload.js');
    const client = fakeClient();
    const result = await runUpload(client, { file: 'no-such-file.bin', key: 'x.bin' });
    expect(result.ok).toBe(false);
    expect(client.calls.putObject).toBeUndefined();
    expect(result.output.toLowerCase()).toContain('no-such-file.bin');
  });
});

describe('copy', () => {
  it('copies source key to dest key server-side', async () => {
    const { runCopy } = await import('../src/commands/copy.js');
    const client = fakeClient();
    const result = await runCopy(client, { srcKey: 'dev/a.xlsx', destKey: 'prod/a.xlsx' });
    expect(result.ok).toBe(true);
    expect(client.calls.copyObject).toEqual([['dev/a.xlsx', 'prod/a.xlsx']]);
    expect(result.output).toContain('dev/a.xlsx');
    expect(result.output).toContain('prod/a.xlsx');
  });
});

describe('rm', () => {
  it('deletes the object and reports it', async () => {
    const { runRm } = await import('../src/commands/rm.js');
    const client = fakeClient();
    const result = await runRm(client, { key: 'dev/old.xlsx' });
    expect(result.ok).toBe(true);
    expect(client.calls.deleteObject).toEqual([['dev/old.xlsx']]);
    expect(result.output).toContain('dev/old.xlsx');
  });
});
