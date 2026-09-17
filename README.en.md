# huawei-obs-cli — CLI + SKILL

[简体中文](./README.md) | English

> Let your AI coding assistant (Claude Code, Cursor, Copilot, Qoder, …) operate Huawei Cloud OBS (Object Storage Service) through natural language.

One tool, two parts:

| Part | Purpose |
| --- | --- |
| CLI (`obs-cli`) | A lightweight command-line client for the Huawei Cloud OBS API |
| SKILL (`SKILL.md`) | A "manual" for AI assistants, teaching them to turn natural language into CLI commands |

Once the AI has read the skill, you can simply say "publish the user-import template to production" — the AI lists the files, confirms with you, and runs `obs-cli copy dev/... prod/...`. No keys to remember, no console to open.

## Quick Start

### 1. Install the CLI

```
npm install -g @cvtoolman/huawei-obs-cli
```

### 2. Configure credentials

```
obs-cli init
```

The wizard asks for AK, SK, Endpoint, and Bucket in one pass. Config is stored in `~/.obs-cli/config.json`.

### 3. Install the Skill (for your AI tool)

Claude Code:

```
mkdir -p .claude/skills/huawei-obs-cli
curl -o .claude/skills/huawei-obs-cli/SKILL.md \
https://raw.githubusercontent.com/jcxy/huawei-obs-cli/main/skills/huawei-obs-cli/SKILL.md
```

Qoder:

```
mkdir -p .qoder/skills/huawei-obs-cli
curl -o .qoder/skills/huawei-obs-cli/SKILL.md \
https://raw.githubusercontent.com/jcxy/huawei-obs-cli/main/skills/huawei-obs-cli/SKILL.md
```

Manual install (any AI tool): copy `skills/huawei-obs-cli/SKILL.md` into your tool's skills directory.

### 4. Use it directly from the shell (no AI required)

```
# List objects (recursive)
obs-cli ls dev/

# JSON output, pipe into jq
obs-cli --format json ls dev/ | jq .

# Download (saved to the current directory by default)
obs-cli download dev/user-import.xlsx

# Upload (overwrites an existing object with the same key)
obs-cli upload user-import.xlsx dev/user-import.xlsx

# Server-side copy (dev -> prod release, no local transfer)
obs-cli copy dev/user-import.xlsx prod/user-import.xlsx

# Delete (no confirmation prompt — careful)
obs-cli rm dev/old-template.xlsx
```

## Command Reference

```
obs-cli init                          Interactive config wizard (AK/SK/Endpoint/Bucket)
obs-cli config list|set|get|unset     Manage config values
obs-cli ls [prefix]                   List objects under a prefix (recursive)
obs-cli download <key> [-o <file>]    Download an object
obs-cli upload <file> <key>           Upload a local file
obs-cli copy <srcKey> <destKey>       Server-side copy
obs-cli rm <key>                      Delete an object
obs-cli completion <bash|zsh|powershell>  Shell completion

Global options (placed before the subcommand):
--format text|json                    Output format (default text: key<TAB>size<TAB>modified)
--bucket <name>                       Override the default bucket for one command
```

## Configuration

Stored in `~/.obs-cli/config.json` (Windows: `%USERPROFILE%\.obs-cli\config.json`).

| Key | Required | Description |
| --- | --- | --- |
| ak | yes | Huawei Cloud Access Key |
| sk | yes | Huawei Cloud Secret Key |
| endpoint | yes | OBS endpoint incl. scheme, e.g. `https://obs.cn-north-4.myhuaweicloud.com` |
| bucket | no | Default bucket (can be overridden per command with `--bucket`) |

Environment variables take precedence over the file: `OBS_AK` / `OBS_SK` / `OBS_ENDPOINT` / `OBS_BUCKET`.

## Safety Design

The CLI itself performs **no interactive confirmation** (overwrites and deletes execute immediately), so AI agents can run it unattended. Safety lives in the SKILL.md layer: before any overwrite or delete, the AI must `ls` the current state, spell out the consequences, and get the user's confirmation. See [SKILL.md](./skills/huawei-obs-cli/SKILL.md).

## Development

```
git clone https://github.com/jcxy/huawei-obs-cli.git
cd huawei-obs-cli
npm install
npm run build     # compile to dist/
npm test          # unit tests (SDK mocked; no real OBS connection)
npm run dev -- ls dev/
```

## License

MIT
