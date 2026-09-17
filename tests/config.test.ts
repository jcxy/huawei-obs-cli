import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('config', () => {
  let home: string;
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(async () => {
    home = mkdtempSync(join(tmpdir(), 'obs-cli-test-'));
    process.env.HOME = home;
    process.env.USERPROFILE = home;
    for (const k of ['OBS_AK', 'OBS_SK', 'OBS_ENDPOINT', 'OBS_BUCKET']) delete process.env[k];
    const { setConfigHome } = await import('../src/config.js');
    setConfigHome(home);
    mkdirSync(join(home, '.obs-cli'), { recursive: true });
  });

  afterEach(() => {
    rmSync(home, { recursive: true, force: true });
    process.env = { ...ORIGINAL_ENV };
  });

  describe('loadConfig', () => {
    it('returns empty config when no file exists', async () => {
      const { loadConfig } = await import('../src/config.js');
      expect(loadConfig()).toEqual({});
    });

    it('reads config from ~/.obs-cli/config.json', async () => {
      writeFileSync(join(home, '.obs-cli', 'config.json'), JSON.stringify({ ak: 'AK', sk: 'SK', endpoint: 'https://obs.cn-north-4.myhuaweicloud.com', bucket: 'mybucket' }));
      const { loadConfig } = await import('../src/config.js');
      expect(loadConfig()).toEqual({ ak: 'AK', sk: 'SK', endpoint: 'https://obs.cn-north-4.myhuaweicloud.com', bucket: 'mybucket' });
    });

    it('env vars override file values', async () => {
      writeFileSync(join(home, '.obs-cli', 'config.json'), JSON.stringify({ ak: 'file-ak', sk: 'file-sk', bucket: 'file-bucket' }));
      process.env.OBS_AK = 'env-ak';
      process.env.OBS_BUCKET = 'env-bucket';
      const { loadConfig } = await import('../src/config.js');
      expect(loadConfig()).toEqual({ ak: 'env-ak', sk: 'file-sk', bucket: 'env-bucket' });
    });

    it('ignores empty-string env vars', async () => {
      writeFileSync(join(home, '.obs-cli', 'config.json'), JSON.stringify({ ak: 'file-ak' }));
      process.env.OBS_AK = '';
      const { loadConfig } = await import('../src/config.js');
      expect(loadConfig().ak).toBe('file-ak');
    });
  });

  describe('saveConfig', () => {
    it('writes config, creating the directory', async () => {
      const { saveConfig } = await import('../src/config.js');
      saveConfig({ ak: 'AK', sk: 'SK', endpoint: 'e', bucket: 'b' });
      const raw = readFileSync(join(home, '.obs-cli', 'config.json'), 'utf-8');
      expect(JSON.parse(raw)).toEqual({ ak: 'AK', sk: 'SK', endpoint: 'e', bucket: 'b' });
    });

    it('merges into existing config', async () => {
      const { saveConfig } = await import('../src/config.js');
      saveConfig({ ak: 'AK', sk: 'SK' });
      saveConfig({ bucket: 'b' });
      const raw = readFileSync(join(home, '.obs-cli', 'config.json'), 'utf-8');
      expect(JSON.parse(raw)).toEqual({ ak: 'AK', sk: 'SK', bucket: 'b' });
    });
  });

  describe('validateCredentials', () => {
    it('lists missing required keys', async () => {
      const { validateCredentials } = await import('../src/config.js');
      expect(validateCredentials({ ak: 'a' })).toEqual(['sk', 'endpoint']);
    });

    it('returns empty array when ak/sk/endpoint present', async () => {
      const { validateCredentials } = await import('../src/config.js');
      expect(validateCredentials({ ak: 'a', sk: 's', endpoint: 'e' })).toEqual([]);
    });

    it('does not check bucket — bucket is resolved (config vs --bucket) by the command layer', async () => {
      const { validateCredentials } = await import('../src/config.js');
      expect(validateCredentials({})).toEqual(['ak', 'sk', 'endpoint']);
    });
  });

  describe('config file uses default home when setConfigHome not called', () => {
    it('configPath points into home/.obs-cli', async () => {
      const { configPath } = await import('../src/config.js');
      expect(configPath()).toBe(join(home, '.obs-cli', 'config.json'));
      expect(existsSync(join(home, '.obs-cli'))).toBe(true);
    });
  });
});
