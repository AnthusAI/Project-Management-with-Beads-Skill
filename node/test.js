const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function assert(cond, msg) { if (!cond) throw new Error(msg); }

const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'beads-skill-'));
const repo = path.join(tmp, 'repo');
fs.mkdirSync(repo);
fs.mkdirSync(path.join(repo, '.git'));

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`${cmd} failed`);
}

run('node', [path.join(__dirname, 'bin/cli.js'), 'sync', '--repo', repo]);
const skillPath = path.join(repo, '.agent-skills/project-management-with-beads/SKILL.md');
assert(fs.existsSync(skillPath), 'skill not synced');

run('node', [path.join(__dirname, 'bin/cli.js'), 'inject', '--repo', repo]);
const agents = path.join(repo, 'AGENTS.md');
const text1 = fs.readFileSync(agents, 'utf8');
run('node', [path.join(__dirname, 'bin/cli.js'), 'inject', '--repo', repo]);
assert(text1 === fs.readFileSync(agents, 'utf8'), 'inject not idempotent');

console.log('ok');
