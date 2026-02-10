#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { spawnSync } = require('child_process');

const SKILL_NAME = 'project-management-with-beads';
const SKILL_REL_PATH = path.join('.agent-skills', SKILL_NAME);
const SKILL_FILE_NAME = 'SKILL.md';
const START_MARK = `<!-- AGENT-SKILL:START ${SKILL_NAME} -->`;
const END_MARK = `<!-- AGENT-SKILL:END ${SKILL_NAME} -->`;
const POINTER_TEXT = [
  `Use skill at: ${SKILL_REL_PATH}/${SKILL_FILE_NAME}`,
  'Why: Beads task management is MANDATORY; every task must live in Beads.',
  'When: Create/update the Beads task before coding; close it after the change lands.',
  'How: Follow the skill for workflow, implementation notes, and closure steps.',
].join('\n');
const DEFAULT_HOOK_CMDS = [
  ['bd', 'install-hooks'],
  ['bd', 'hooks', 'install'],
];

const skillPath = path.join(__dirname, '..', 'data', 'skills', SKILL_NAME, SKILL_FILE_NAME);

function gitRoot(start) {
  let cur = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(cur, '.git'))) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) return path.resolve(start);
    cur = parent;
  }
}

function writeAtomic(target, data) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = target + '.tmp';
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, target);
}

function detectEol(text) {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

function promptYesNo(message, defaultYes = true) {
  if (!process.stdin.isTTY || process.env.CI) return defaultYes;
  process.stdout.write(message);
  const buf = Buffer.alloc(1024);
  const bytes = fs.readSync(process.stdin.fd, buf, 0, buf.length, null);
  const answer = buf.slice(0, bytes).toString().trim().toLowerCase();
  if (!answer) return defaultYes;
  return ['y', 'yes'].includes(answer);
}

function hookInstalled(repo) {
  const hook = path.join(repo, '.git/hooks/pre-commit');
  if (!fs.existsSync(hook)) return false;
  try {
    const content = fs.readFileSync(hook, 'utf8');
    return content.includes('beads') || content.includes('bd ');
  } catch {
    return false;
  }
}

function maybeInstallHooks(repo, install, hooksCmd) {
  if (hookInstalled(repo)) return;
  const cmdList = hooksCmd ? [hooksCmd.split(' ')] : DEFAULT_HOOK_CMDS;
  console.warn(
    `Beads commit hooks not detected in ${repo}. Install with one of: ${cmdList
      .map(c => c.join(' '))
      .join(', ')}`
  );

  let decision;
  if (install === undefined) {
    decision = promptYesNo('Install Beads commit hooks now? [Y/n]: ', true);
  } else {
    decision = install;
  }

  if (!decision) {
    console.log('Skipping hook install. Re-run with --install-hooks or run the command above.');
    return;
  }

  for (const cmdParts of cmdList) {
    const res = spawnSync(cmdParts[0], cmdParts.slice(1), { stdio: 'inherit', cwd: repo });
    if (res.error && res.error.code === 'ENOENT') {
      console.error(`Cannot install hooks: command '${cmdParts[0]}' not found.`);
      break;
    }
    if (res.status === 0) {
      console.log(`Installed Beads commit hooks via: ${cmdParts.join(' ')}`);
      return;
    }
    console.warn(`Hook install failed with '${cmdParts.join(' ')}' (exit ${res.status}). Trying next...`);
  }
  console.log('Hook installation did not succeed. Install manually and re-run if needed.');
}

function cmdSync(repo) {
  const base = gitRoot(repo || process.cwd());
  const target = path.join(base, SKILL_REL_PATH, SKILL_FILE_NAME);
  const data = fs.readFileSync(skillPath);
  writeAtomic(target, data);
  console.log(`Synced skill to ${target}`);
  maybeInstallHooks(base, cmdSync.installHooks, cmdSync.hooksCmd);
}
cmdSync.installHooks = undefined;
cmdSync.hooksCmd = null;

function cmdInject(repo, agentsFile) {
  const base = gitRoot(repo || process.cwd());
  const file = path.join(base, agentsFile || 'AGENTS.md');
  let text = '';
  if (fs.existsSync(file)) {
    text = fs.readFileSync(file, 'utf8');
  }
  const eol = text ? detectEol(text) : '\n';
  const block = `${START_MARK}${eol}${POINTER_TEXT}${eol}${END_MARK}${eol}`;
  let newText;
  if (text.includes(START_MARK) && text.includes(END_MARK)) {
    const re = new RegExp(`${START_MARK}[\s\S]*?${END_MARK}\s*`, 'm');
    newText = text.replace(re, block);
  } else {
    if (text && !text.endsWith('\n') && !text.endsWith('\r')) text += eol;
    newText = text + block;
  }
  fs.writeFileSync(file, newText);
  console.log(`Injected pointer into ${file}`);
  maybeInstallHooks(base, cmdInject.installHooks, cmdInject.hooksCmd);
}
cmdInject.installHooks = undefined;
cmdInject.hooksCmd = null;

function cmdVersion() {
  console.log('0.1.4');
}

const argv = yargs(hideBin(process.argv))
  .command(
    'sync',
    'Sync skill into repo',
    y =>
      y
        .option('repo', { type: 'string' })
        .option('install-hooks', { type: 'boolean', describe: 'Install Beads git hooks if missing (default: prompt yes)' })
        .option('hooks-cmd', { type: 'string', describe: 'Override command to install hooks' }),
    args => {
      cmdSync.installHooks = args['install-hooks'];
      cmdSync.hooksCmd = args['hooks-cmd'] || null;
      cmdSync(args.repo);
    }
  )
  .command('inject', 'Inject pointer into AGENTS.md', y => y
    .option('repo', { type: 'string' })
    .option('agents-file', { type: 'string', default: 'AGENTS.md' })
    .option('install-hooks', { type: 'boolean', describe: 'Install Beads git hooks if missing (default: prompt yes)' })
    .option('hooks-cmd', { type: 'string', describe: 'Override command to install hooks' }), args => {
      cmdInject.installHooks = args['install-hooks'];
      cmdInject.hooksCmd = args['hooks-cmd'] || null;
      cmdInject(args.repo, args['agents-file']);
    })
  .command('version', 'Print version', () => {}, cmdVersion)
  .demandCommand(1)
  .help()
  .parse();
