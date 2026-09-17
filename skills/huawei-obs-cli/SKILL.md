# Huawei Cloud OBS CLI (obs-cli) — Agent Skill

Use `obs-cli` to operate Huawei Cloud OBS (Object Storage Service) buckets and objects on the user's behalf. This skill teaches you how to translate natural-language requests into correct `obs-cli` commands.

**bin name:** `obs-cli` · **npm package:** `@cvtoolman/huawei-obs-cli`

## Command Reference

### Credentials & config

```
obs-cli init                        # interactive wizard: AK / SK / endpoint / bucket
obs-cli config list                 # show config (sk masked)
obs-cli config set <key> <value>    # key: ak | sk | endpoint | bucket
obs-cli config get <key>
obs-cli config unset <key>
```

Config file: `~/.obs-cli/config.json` (Windows: `%USERPROFILE%\.obs-cli\config.json`).
Env vars override the file: `OBS_AK`, `OBS_SK`, `OBS_ENDPOINT`, `OBS_BUCKET`.

### Object operations

```
obs-cli ls [prefix]                     # list objects (recursive under prefix)
obs-cli download <key> [-o <file>]      # download; -o optional local path
obs-cli upload <file> <key>             # upload local file
obs-cli copy <srcKey> <destKey>         # server-side copy (no local transfer)
obs-cli rm <key>                        # delete object
obs-cli completion <bash|zsh|powershell>
```

Global options (placed before the subcommand):

```
--format text|json     # ls output format; json is machine-readable
--bucket <name>        # override the configured default bucket
```

- `ls` text output: one object per line, `key<TAB>size<TAB>lastModified`, sorted by key.
- `ls --format json`: `[{ "key": "...", "size": 123, "lastModified": "ISO-8601" }]`.
- `download` without `-o` saves to the basename of the key in the current directory.
- `copy` overwrites the destination if it exists. `upload` overwrites the key if it exists.
- There is NO interactive confirmation for overwrite/delete. See Safety rules.

## Workflow: the template lifecycle (typical use case)

The user's system keeps Excel import/export templates in OBS, separated by directory prefixes per environment (e.g. `dev/...` and `prod/...` in the same bucket). Determine the actual prefixes from the user's codebase context — the CLI has no built-in environment concept.

1. **Find** the template: `obs-cli ls <prefix>/` (use `--format json` when you need to parse keys programmatically).
2. **Download**: `obs-cli download <key> [-o <file>]`.
3. The user (or you, with other tools) edits the file locally. obs-cli does NOT edit file contents.
4. **Upload back**: `obs-cli upload <localFile> <key>`.
5. **Promote across environments**: `obs-cli copy dev/<template> prod/<template>` — server-side, fast, no local transfer.

## Safety rules — follow strictly

1. **Destructive ops need explicit user confirmation first.** Before `copy` onto an existing key, `upload` that overwrites, or `rm`, run `obs-cli ls` to show what exists, state exactly what will be overwritten/deleted, and get the user's go-ahead. The CLI itself never asks.
2. **prod paths deserve extra care.** When the destination prefix looks production-like, re-confirm with the user even if they already asked once.
3. **Never guess keys.** If unsure which object the user means, `ls` first and show candidates.
4. **Credential errors**: if a command fails with "Missing required config: ak, sk, endpoint", tell the user to run `obs-cli init` (interactive — the human must run it themselves) or set `OBS_AK`/`OBS_SK`/`OBS_ENDPOINT`/`OBS_BUCKET` env vars. Do not ask the user to paste secrets into the chat.
5. **Exit codes**: 0 = success, non-zero = failure with a readable error on stderr. Report the error message verbatim when a command fails.

## Typical translations

| User says | You run |
|---|---|
| "看下 dev 目录有哪些模版" | `obs-cli ls dev/` |
| "把用户导入模版下载下来" | `obs-cli download dev/user-import.xlsx` |
| "改好了，传回去" | `obs-cli upload user-import.xlsx dev/user-import.xlsx` |
| "把这个模版发到生产" | confirm first, then `obs-cli copy dev/user-import.xlsx prod/user-import.xlsx` |
| "删掉 dev 下那个废弃模版" | confirm first, then `obs-cli rm dev/old-template.xlsx` |

## Notes

- Objects are addressed by full keys with `/`-separated prefixes; the CLI never rewrites or appends to keys.
- `--bucket` overrides the default bucket for a single command; use it for cross-bucket operations without touching config.
- SDK: `esdk-obs-nodejs` (official). Endpoint must include scheme, e.g. `https://obs.cn-north-4.myhuaweicloud.com`.
