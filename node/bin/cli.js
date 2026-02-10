#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const SKILL_NAME = 'project-management-with-beads';
const SKILL_REL_PATH = path.join('.agent-skills', SKILL_NAME);
const SKILL_FILE_NAME = 'SKILL.md';
const START_MARK = `<!-- AGENT-SKILL:START ${SKILL_NAME} -->`;
const END_MARK = `<!-- AGENT-SKILL:END ${SKILL_NAME} -->`;
const POINTER_LINE = `Use skill at: ${SKILL_REL_PATH}/${SKILL_FILE_NAME}`;

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

function cmdSync(repo) {
  const base = gitRoot(repo || process.cwd());
  const target = path.join(base, SKILL_REL_PATH, SKILL_FILE_NAME);
  const data = fs.readFileSync(skillPath);
  writeAtomic(target, data);
  console.log(`Synced skill to ${target}`);
}

function cmdInject(repo, agentsFile) {
  const base = gitRoot(repo || process.cwd());
  const file = path.join(base, agentsFile || 'AGENTS.md');
  let text = '';
  if (fs.existsSync(file)) {
    text = fs.readFileSync(file, 'utf8');
  }
  const eol = text ? detectEol(text) : '\n';
  const block = `${START_MARK}${eol}${POINTER_LINE}${eol}${END_MARK}${eol}`;
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
}

function cmdVersion() {
  console.log('0.1.0');
}

const argv = yargs(hideBin(process.argv))
  .command('sync', 'Sync skill into repo', y => y.option('repo', { type: 'string' }), args => cmdSync(args.repo))
  .command('inject', 'Inject pointer into AGENTS.md', y => y
    .option('repo', { type: 'string' })
    .option('agents-file', { type: 'string', default: 'AGENTS.md' }), args => cmdInject(args.repo, args['agents-file']))
  .command('version', 'Print version', () => {}, cmdVersion)
  .demandCommand(1)
  .help()
  .parse();
