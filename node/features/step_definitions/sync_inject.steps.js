const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { Given, When, Then, setWorldConstructor } = require('@cucumber/cucumber');

const SKILL_REL_PATH = path.join('.agent-skills', 'project-management-with-beads', 'SKILL.md');
const packagedPath = path.join(__dirname, '..', '..', 'data', 'skills', 'project-management-with-beads', 'SKILL.md');

class World {
  constructor() {
    this.tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'beads-skill-'));
    this.repo = path.join(this.tmpRoot, 'repo');
    fs.mkdirSync(this.repo);
    fs.mkdirSync(path.join(this.repo, '.git'));
  }
}
setWorldConstructor(World);

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed`);
}

Given('a git-initialized temporary repository', function () {
  // repo already created in world
});

When('I run beads-skill sync', function () {
  run('node', [path.join(__dirname, '..', '..', 'bin/cli.js'), 'sync', '--repo', this.repo], this.repo);
});

When('I run beads-skill inject', function () {
  run('node', [path.join(__dirname, '..', '..', 'bin/cli.js'), 'inject', '--repo', this.repo], this.repo);
});

Then('the skill file matches the packaged bytes', function () {
  const target = path.join(this.repo, SKILL_REL_PATH);
  assert.ok(fs.existsSync(target), 'skill file missing after sync');
  const packagedHash = fs.readFileSync(packagedPath);
  assert.strictEqual(
    fs.readFileSync(target, 'utf8'),
    packagedHash.toString('utf8'),
    'synced skill differs from packaged content'
  );
});

Then('injecting again leaves AGENTS.md unchanged', function () {
  const agents = path.join(this.repo, 'AGENTS.md');
  const before = fs.readFileSync(agents, 'utf8');
  run('node', [path.join(__dirname, '..', '..', 'bin/cli.js'), 'inject', '--repo', this.repo], this.repo);
  assert.strictEqual(fs.readFileSync(agents, 'utf8'), before, 'inject not idempotent');
});
