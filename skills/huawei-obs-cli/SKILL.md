---
name: huawei-obs-cli
description: Operate Huawei Cloud OBS (华为云对象存储) from the terminal with obs-cli — list, inspect, upload, download, server-side copy and delete objects. Use whenever a request involves Huawei Cloud OBS / 华为云 OBS / Object Storage Service files, such as uploading a local file, downloading an object, promoting a file from dev to prod, checking whether a key exists, or cleaning up old objects in a bucket.
license: MIT
---

# Huawei Cloud OBS (obs-cli)

A thin CLI over Huawei Cloud OBS object storage. It moves bytes and reports what it
did; it never rewrites keys, never guesses prefixes, and never prompts.

**requires obs-cli >= 0.2.0** — `npm install -g @cvtoolman/huawei-obs-cli`.

## Commands

```
obs-cli ls [prefix]                    # list objects under a prefix, recursive
obs-cli stat <key>                     # size / etag / last-modified of one object
obs-cli download <key> [-o <file>]     # download; defaults to the key's basename
obs-cli upload <file> <key>            # upload a local file
obs-cli copy <srcKey> <destKey>        # server-side copy, no local transfer
obs-cli rm <key>                       # delete one object
obs-cli init                           # interactive AK / SK / endpoint / bucket wizard
obs-cli config list|set|get|unset      # manage config without the wizard
```

Global options go before the subcommand:

```
--format text|json    # output shape; json is for parsing
--bucket <name>       # override the configured default bucket
```

`--dry-run` exists on `upload`, `copy` and `rm`.

## Output contract

- `ls` text: one object per line, `key<TAB>size<TAB>lastModified`, sorted by key; an
  empty prefix prints nothing.
- `ls --format json`: `[{"key","size","lastModified"}]`.
- `stat` text: `key<TAB>size<TAB>etag<TAB>lastModified`; `--format json` gives one
  object with those four fields. A missing key exits 1 with `No such object: <key>`.
- `--dry-run` text: one line, e.g. `Would delete dev/a.xlsx`. With `--format json`:
  `{"dryRun":true,"action":"delete","key":"dev/a.xlsx"}`.
- Data goes to stdout, failures to stderr, exit code 0 or non-zero. Quote failures
  verbatim.

## Rule

**Inspect before destroying.** `rm`, an overwriting `upload`, and a `copy` whose
destination exists are irreversible. `stat` the destination (or `ls` its prefix), run
the same command with `--dry-run`, state exactly what will change, and only then run
it for real.

## Notes

- Keys are full object paths (`dev/templates/user-import.xlsx`). There is no
  environment concept; `dev/` and `prod/` are just prefixes someone chose.
- Config lives in `~/.obs-cli/config.json`; `OBS_AK`, `OBS_SK`, `OBS_ENDPOINT` and
  `OBS_BUCKET` override it. A credential error means the human must run
  `obs-cli init` themselves — never ask for AK/SK in chat.
