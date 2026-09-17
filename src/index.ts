#!/usr/bin/env node
import { Command } from 'commander';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { loadConfig, validateCredentials } from './config.js';
import { SdkObsClient } from './sdk-client.js';
import type { ObsClientLike } from './obs.js';
import { runLs } from './commands/ls.js';
import { runDownload } from './commands/download.js';
import { runUpload } from './commands/upload.js';
import { runCopy } from './commands/copy.js';
import { runRm } from './commands/rm.js';
import { runConfigCommand } from './commands/config.js';
import { runInit } from './commands/init.js';
import { CompletionScripts } from './completion.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function packageVersion(): string {
  // dist/index.js -> ../../package.json; src/index.ts -> ../package.json
  const here = fileURLToPath(new URL('.', import.meta.url));
  for (const base of [`${here}../package.json`, `${here}../../package.json`]) {
    try {
      return JSON.parse(readFileSync(base, 'utf-8')).version as string;
    } catch {
      // try next candidate
    }
  }
  return '0.0.0';
}

const program = new Command();

program
  .name('obs-cli')
  .description('Operate Huawei Cloud OBS (Object Storage Service) from the command line')
  .version(packageVersion())
  .option('--format <format>', 'output format: text or json', 'text')
  .option('--bucket <bucket>', 'override the configured default bucket');

type GlobalOptions = { format: string; bucket?: string };

function parsedFormat(options: GlobalOptions): 'text' | 'json' {
  if (options.format !== 'text' && options.format !== 'json') {
    console.error(`Invalid --format value: ${options.format}. Use 'text' or 'json'.`);
    process.exitCode = 1;
    process.exit(1);
  }
  return options.format;
}

/** Resolves config + --bucket into a connected client, or exits with a clear error. */
function createClient(options: GlobalOptions): SdkObsClient {
  const config = loadConfig();
  const missing = validateCredentials(config);
  if (missing.length > 0) {
    const lines = [
      `Missing required config: ${missing.join(', ')}.`,
      'Run `obs-cli init` to configure, or set env vars OBS_AK / OBS_SK / OBS_ENDPOINT.',
    ];
    const bucket = options.bucket ?? config.bucket;
    if (!bucket) {
      lines.push('Also set a default bucket (`obs-cli config set bucket <name>`) or pass --bucket <name>.');
    }
    console.error(lines.join('\n'));
    process.exit(1);
  }
  const bucket = options.bucket ?? config.bucket;
  if (!bucket) {
    console.error('No bucket: set a default bucket or pass --bucket <name>.');
    process.exit(1);
  }
  return new SdkObsClient({
    ak: config.ak!,
    sk: config.sk!,
    endpoint: config.endpoint!,
    bucket,
  });
}

async function finish(result: { ok: boolean; output: string }, client?: SdkObsClient): Promise<void> {
  client?.close();
  if (result.output !== '') {
    // Errors go to stderr so stdout stays parseable data (see SKILL.md).
    (result.ok ? console.log : console.error)(result.output);
  }
  if (!result.ok) {
    process.exitCode = 1;
  }
}

program
  .command('init')
  .description('interactive configuration wizard (AK / SK / endpoint / bucket)')
  .action(async () => {
    const rl = createInterface({ input: stdin, output: stdout });
    try {
      const ask = (prompt: string) => rl.question(`${prompt}: `);
      await finish(await runInit(ask));
    } finally {
      rl.close();
    }
  });

const configCommand = program
  .command('config')
  .description('manage configuration (list / set / get / unset)');
configCommand
  .command('list')
  .description('list all config values (sk masked)')
  .action(async () => {
    await finish(await runConfigCommand({ action: 'list', format: 'text' }));
  });
configCommand
  .command('set <key> <value>')
  .description('set a config value (ak / sk / endpoint / bucket)')
  .action(async (key: string, value: string) => {
    await finish(await runConfigCommand({ action: 'set', key, value, format: 'text' }));
  });
configCommand
  .command('get <key>')
  .description('print a config value')
  .action(async (key: string) => {
    await finish(await runConfigCommand({ action: 'get', key, format: 'text' }));
  });
configCommand
  .command('unset <key>')
  .description('remove a config value')
  .action(async (key: string) => {
    await finish(await runConfigCommand({ action: 'unset', key, format: 'text' }));
  });

program
  .command('ls [prefix]')
  .description('list objects under a prefix (recursive)')
  .action(async (prefix: string | undefined, options: GlobalOptions, command) => {
    const global = command.parent.opts() as GlobalOptions;
    const client = createClient(global);
    await finish(
      await runLs(client, { prefix: prefix ?? '', format: parsedFormat(global) }),
      client,
    );
  });

program
  .command('download <key>')
  .description('download an object to a local file (defaults to the key basename)')
  .option('-o, --output <file>', 'local output path')
  .action(async (key: string, cmdOptions: { output?: string }, command) => {
    const global = command.parent.opts() as GlobalOptions;
    const client = createClient(global);
    await finish(await runDownload(client, { key, output: cmdOptions.output }), client);
  });

program
  .command('upload <file> <key>')
  .description('upload a local file to the given object key')
  .action(async (file: string, key: string, _options, command) => {
    const global = command.parent.opts() as GlobalOptions;
    const client = createClient(global);
    await finish(await runUpload(client, { file, key }), client);
  });

program
  .command('copy <srcKey> <destKey>')
  .description('copy an object server-side (e.g. move dev template to prod path)')
  .action(async (srcKey: string, destKey: string, _options, command) => {
    const global = command.parent.opts() as GlobalOptions;
    const client = createClient(global);
    await finish(await runCopy(client, { srcKey, destKey }), client);
  });

program
  .command('rm <key>')
  .description('delete an object (irreversible; the CLI never asks for confirmation)')
  .action(async (key: string, _options, command) => {
    const global = command.parent.opts() as GlobalOptions;
    const client = createClient(global);
    await finish(await runRm(client, { key }), client);
  });

program
  .command('completion <shell>')
  .description('emit a shell completion script (bash / zsh / powershell)')
  .action(async (shell: string) => {
    const script = new CompletionScripts().get(shell);
    if (script === undefined) {
      console.error(`Unsupported shell: ${shell}. Use bash, zsh, or powershell.`);
      process.exitCode = 1;
      return;
    }
    console.log(script);
  });

program.parseAsync().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
