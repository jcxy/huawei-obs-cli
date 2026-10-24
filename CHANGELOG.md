# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-10-24

### Added

- `obs-cli stat <key>` — inspect a single object (`size`, `etag`, `lastModified`)
  before touching it; exits with status 1 when the key does not exist.
- `--dry-run` on `upload`, `copy` and `rm` — prints the operation that would run,
  following the global `--format` (`text` or `json`), without mutating the bucket.
- CI on Linux and Windows, Node 20 and 22: lint, format check, typecheck, tests and
  build, plus a coverage artifact and a skill frontmatter check.
- npm publication on tag with provenance, and a generated GitHub release.

### Changed

- The skill is now distributed with `npx skills add jcxy/huawei-obs-cli`. It gained
  the YAML frontmatter that `npx skills` requires, and was rewritten as a thin CLI
  guide (command surface, output contract, one safety rule) instead of a use-case
  walkthrough.
- The README leads with what the tool does and how to verify it, then documents the
  design trade-offs behind the CLI/skill split.

### Removed

- Vendored third-party skills and `skills-lock.json`; they were local development
  tooling, not part of this package.

## [0.1.0] - 2026-09-17

### Added

- `obs-cli init` wizard and `config list|set|get|unset`.
- `ls` (recursive, `text` or `json`), `download`, `upload`, server-side `copy`,
  `rm` and shell `completion` for bash, zsh and PowerShell.
- Credentials in `~/.obs-cli/config.json`, overridable with `OBS_AK`, `OBS_SK`,
  `OBS_ENDPOINT` and `OBS_BUCKET`.
- First version of the agent skill in `skills/huawei-obs-cli/SKILL.md`.

[0.2.0]: https://github.com/jcxy/huawei-obs-cli/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/jcxy/huawei-obs-cli/releases/tag/v0.1.0
