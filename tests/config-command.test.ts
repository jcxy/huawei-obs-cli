import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('config command', () => {
  let home: string;

  beforeEach(async () => {
    home = mkdtempSync(join(tmpdir(), 'obs-cli-cmdcfg-'));
    mkdirSync(join(home, '.obs-cli'), { recursive: true });
    process.env.HOME = home;
    process.env.USERPROFILE = home;
    for (const k of ['OBS_AK', 'OBS_SK', 'OBS_ENDPOINT', 'OBS_BUCKET']) delete process.env[k];
    const { setConfigHome } = await import('../src/config.js');
    setConfigHome(home);
  });

  afterEach(() => {
    rmSync(home, { recursive: true, force: true });
    delete process.env.HOME;
    delete process.env.USERPROFILE;
  });

  it('list prints all keys, masking sk', async () => {
    writeFileSync(join(home, '.obs-cli', 'config.json'), JSON.stringify({ ak: 'AK', sk: 'SECRETSECRET', endpoint: 'https://obs.example.com', bucket: 'b' }));
    const { runConfigCommand } = await import('../src/commands/config.js');
    const result = await runConfigCommand({ action: 'list', format: 'text' });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('ak=AK');
    expect(result.output).toContain('sk=****');
    expect(result.output).not.toContain('SECRETSECRET');
    expect(result.output).toContain('endpoint=https://obs.example.com');
    expect(result.output).toContain('bucket=b');
  });

  it('list in json format outputs full config without masking', async () => {
    writeFileSync(join(home, '.obs-cli', 'config.json'), JSON.stringify({ ak: 'AK' }));
    const { runConfigCommand } = await import('../src/commands/config.js');
    const result = await runConfigCommand({ action: 'list', format: 'json' });
    expect(JSON.parse(result.output)).toEqual({ ak: 'AK' });
  });

  it('set writes a key', async () => {
    const { runConfigCommand } = await import('../src/commands/config.js');
    const result = await runConfigCommand({ action: 'set', key: 'bucket', value: 'my-bucket', format: 'text' });
    expect(result.ok).toBe(true);
    const saved = JSON.parse(readFileSync(join(home, '.obs-cli', 'config.json'), 'utf-8'));
    expect(saved.bucket).toBe('my-bucket');
  });

  it('set rejects unknown keys', async () => {
    const { runConfigCommand } = await import('../src/commands/config.js');
    const result = await runConfigCommand({ action: 'set', key: 'bogus', value: 'x', format: 'text' });
    expect(result.ok).toBe(false);
    expect(result.output).toContain('bogus');
  });

  it('get prints a single value', async () => {
    writeFileSync(join(home, '.obs-cli', 'config.json'), JSON.stringify({ ak: 'AK' }));
    const { runConfigCommand } = await import('../src/commands/config.js');
    const result = await runConfigCommand({ action: 'get', key: 'ak', format: 'text' });
    expect(result.ok).toBe(true);
    expect(result.output).toBe('AK');
  });

  it('get on missing key fails with clear message', async () => {
    const { runConfigCommand } = await import('../src/commands/config.js');
    const result = await runConfigCommand({ action: 'get', key: 'ak', format: 'text' });
    expect(result.ok).toBe(false);
    expect(result.output.toLowerCase()).toContain('not set');
  });

  it('unset removes a key', async () => {
    writeFileSync(join(home, '.obs-cli', 'config.json'), JSON.stringify({ ak: 'AK', bucket: 'b' }));
    const { runConfigCommand } = await import('../src/commands/config.js');
    const result = await runConfigCommand({ action: 'unset', key: 'bucket', format: 'text' });
    expect(result.ok).toBe(true);
    const saved = JSON.parse(readFileSync(join(home, '.obs-cli', 'config.json'), 'utf-8'));
    expect(saved).toEqual({ ak: 'AK' });
  });
});

describe('init wizard', () => {
  let home: string;

  beforeEach(async () => {
    home = mkdtempSync(join(tmpdir(), 'obs-cli-init-'));
    mkdirSync(join(home, '.obs-cli'), { recursive: true });
    process.env.HOME = home;
    process.env.USERPROFILE = home;
    for (const k of ['OBS_AK', 'OBS_SK', 'OBS_ENDPOINT', 'OBS_BUCKET']) delete process.env[k];
    const { setConfigHome } = await import('../src/config.js');
    setConfigHome(home);
  });

  afterEach(() => {
    rmSync(home, { recursive: true, force: true });
    delete process.env.HOME;
    delete process.env.USERPROFILE;
  });

  it('asks ak/sk/endpoint/bucket and saves config', async () => {
    const { runInit } = await import('../src/commands/init.js');
    const answers: Record<string, string> = {
      'Access Key ID (AK)': 'AK',
      'Secret Access Key (SK)': 'SK',
      'Endpoint (e.g. https://obs.cn-north-4.myhuaweicloud.com)': 'https://obs.cn-north-4.myhuaweicloud.com',
      'Bucket (default bucket, optional)': 'my-bucket',
    };
    const ask = async (prompt: string) => answers[prompt] ?? '';
    const result = await runInit(ask);
    expect(result.ok).toBe(true);
    const saved = JSON.parse(readFileSync(join(home, '.obs-cli', 'config.json'), 'utf-8'));
    expect(saved).toEqual({ ak: 'AK', sk: 'SK', endpoint: 'https://obs.cn-north-4.myhuaweicloud.com', bucket: 'my-bucket' });
  });

  it('keeps existing value when answer is empty and default exists', async () => {
    writeFileSync(join(home, '.obs-cli', 'config.json'), JSON.stringify({ ak: 'old-ak', sk: 'old-sk', endpoint: 'old-e', bucket: 'old-b' }));
    const { runInit } = await import('../src/commands/init.js');
    const ask = async () => '';
    const result = await runInit(ask);
    expect(result.ok).toBe(true);
    const saved = JSON.parse(readFileSync(join(home, '.obs-cli', 'config.json'), 'utf-8'));
    expect(saved).toEqual({ ak: 'old-ak', sk: 'old-sk', endpoint: 'old-e', bucket: 'old-b' });
  });

  it('re-prompts when a required field has no answer and no default', async () => {
    const { runInit } = await import('../src/commands/init.js');
    const prompts: string[] = [];
    let akCalls = 0;
    const ask = async (prompt: string) => {
      prompts.push(prompt);
      if (prompt.startsWith('Access Key ID') && akCalls++ === 0) return '';
      if (prompt.startsWith('Access Key ID')) return 'AK';
      if (prompt.startsWith('Secret Access Key')) return 'SK';
      if (prompt.startsWith('Endpoint')) return 'https://e';
      return '';
    };
    const result = await runInit(ask);
    expect(result.ok).toBe(true);
    expect(prompts.filter((p) => p.startsWith('Access Key ID')).length).toBe(2);
    const saved = JSON.parse(readFileSync(join(home, '.obs-cli', 'config.json'), 'utf-8'));
    expect(saved.ak).toBe('AK');
  });
});
