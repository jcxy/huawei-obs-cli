// Guards the one thing `npx skills add` refuses to install without: YAML
// frontmatter carrying `name` and `description`. Run in CI so the skill can
// never silently regress into "No valid skills found".
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const EXPECTED_NAME = 'huawei-obs-cli';
const skillPath = fileURLToPath(new URL('../skills/huawei-obs-cli/SKILL.md', import.meta.url));
const raw = readFileSync(skillPath, 'utf-8');

const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(raw);
if (!frontmatter) {
  fail(['SKILL.md must start with a YAML frontmatter block delimited by ---']);
}

const fields = new Map();
for (const line of frontmatter[1].split(/\r?\n/)) {
  const match = /^([A-Za-z0-9_-]+):\s*(.+)$/.exec(line);
  if (match) fields.set(match[1], match[2].trim().replace(/^['"]|['"]$/g, ''));
}

const problems = [];
const name = fields.get('name') ?? '';
const description = fields.get('description') ?? '';

if (name !== EXPECTED_NAME) {
  problems.push(`name must be "${EXPECTED_NAME}" (found "${name}")`);
}
if (description.length < 40) {
  problems.push('description must be a real trigger sentence of at least 40 characters');
}
if (!/obs/i.test(description)) {
  problems.push('description must mention OBS so agents can route requests to this skill');
}
if (!raw.includes('requires obs-cli >=')) {
  problems.push('SKILL.md must state the minimum CLI version ("requires obs-cli >= x.y.z")');
}

if (problems.length > 0) fail(problems);

console.log(`SKILL.md frontmatter OK (name: ${name}, description: ${description.length} chars)`);

function fail(problems) {
  for (const problem of problems) console.error(`error: ${problem}`);
  process.exit(1);
}
