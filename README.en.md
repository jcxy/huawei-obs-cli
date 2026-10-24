# huawei-obs-cli

[![CI](https://github.com/jcxy/huawei-obs-cli/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/jcxy/huawei-obs-cli/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@cvtoolman/huawei-obs-cli)](https://www.npmjs.com/package/@cvtoolman/huawei-obs-cli)
[![license](https://img.shields.io/github/license/jcxy/huawei-obs-cli)](LICENSE)

Operate Huawei Cloud OBS (Object Storage Service) from the command line — built to be
driven by AI coding agents.

```console
$ obs-cli stat dev/user-import.xlsx          # inspect before touching it
$ obs-cli upload --dry-run a.xlsx dev/a.xlsx # preview the overwrite
$ obs-cli copy dev/a.xlsx prod/a.xlsx        # server-side promotion, no download
```

Two parts, on purpose: `obs-cli` performs object operations and never prompts, while
`skills/huawei-obs-cli/SKILL.md` is a thin guide that teaches an agent the command
surface, the output contract, and the one rule it cannot infer.

```bash
npm install -g @cvtoolman/huawei-obs-cli
obs-cli init                          # AK / SK / endpoint / bucket
npx skills add jcxy/huawei-obs-cli    # optional: install the agent skill
```

Full documentation lives in [README.md](./README.md) (Chinese). Changelog:
[CHANGELOG.md](./CHANGELOG.md). License: [MIT](./LICENSE).
