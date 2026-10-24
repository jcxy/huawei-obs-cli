# Contributing

Small tool, small process. The most useful contributions are bug reports with the
exact command and output, and pull requests that keep the command surface small.

## Setup

```bash
git clone https://github.com/jcxy/huawei-obs-cli.git
cd huawei-obs-cli
npm ci
npm run build
npm test
```

Run the CLI from source without building:

```bash
npm run dev -- ls dev/
```

## Checks

CI runs exactly these on Linux and Windows, Node 20 and 22:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

`npm run format` fixes formatting in place.

## Tests

Unit tests mock the `ObsClientLike` seam in `src/obs.ts` and never touch a real
bucket, so they run without credentials. Every behavior change needs a test.

## Skill changes

`skills/huawei-obs-cli/SKILL.md` is installed by agents through
`npx skills add jcxy/huawei-obs-cli`. It must keep its YAML frontmatter (`name`,
`description`) and its `requires obs-cli >= x.y.z` line; `npm run verify:skill`
enforces both. Keep the skill a thin guide — command surface, output contract, and
the few rules an agent cannot infer. Workflow advice and use-case narratives
belong in the README.

## Commits

Conventional commits, imperative mood, one concern per commit:

```
feat(cli): add --dry-run to destructive commands
fix(skill): stop double-encoding CopySource
docs: clarify bucket override precedence
```

## License

Contributions are released under the MIT license.
