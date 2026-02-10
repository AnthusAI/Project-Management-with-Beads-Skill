# Project Management with Beads Skill
[![Python Tests](https://github.com/AnthusAI/Project-Management-with-Beads-Skill/actions/workflows/python-tests.yml/badge.svg?branch=main)](https://github.com/AnthusAI/Project-Management-with-Beads-Skill/actions/workflows/python-tests.yml) [![Node Tests](https://github.com/AnthusAI/Project-Management-with-Beads-Skill/actions/workflows/node-tests.yml/badge.svg?branch=main)](https://github.com/AnthusAI/Project-Management-with-Beads-Skill/actions/workflows/node-tests.yml)

Single-source skill for Beads/agent workflows. Provides Python and Node CLIs to sync the skill into each repo and inject a pointer into `AGENTS.md`.

## Skill content
- Source: `skills/project-management-with-beads/SKILL.md` (copied from Springstack AGENTS)
- Deployed location in each repo: `.agent-skills/project-management-with-beads/SKILL.md`

## Python CLI
- Install (GitHub, no PyPI yet):
  - `pip install "git+https://github.com/AnthusAI/Project-Management-with-Beads-Skill.git#subdirectory=python"`
- Install (local checkout): `pip install .` (from `python/`)
- Commands:
  - `agent-skills sync [--repo PATH]`
  - `agent-skills inject [--repo PATH] [--agents-file AGENTS.md]`
- Defaults: repo auto-detected via `.git` from cwd; agents file defaults to `AGENTS.md`.

## Node CLI
- Install (GitHub, no npm publish yet):
  - `npm install -g git+https://github.com/AnthusAI/Project-Management-with-Beads-Skill.git#subdirectory=node`
- Install (local checkout): `npm install -g .` (from `node/`)
- Commands:
  - `beads-skill sync [--repo PATH]`
  - `beads-skill inject [--repo PATH] [--agents-file AGENTS.md]`

## Pointer block format
```
<!-- AGENT-SKILL:START project-management-with-beads -->
Use skill at: .agent-skills/project-management-with-beads/SKILL.md
Why: Beads task management is MANDATORY; every task must live in Beads.
When: Create/update the Beads task before coding; close it after the change lands.
How: Follow the skill for workflow, implementation notes, and closure steps.
<!-- AGENT-SKILL:END project-management-with-beads -->
```

## Tests
- Python: `pip install .[test]` then `pytest` (unit) or `pytest -m bdd` (BDD feature)
- Node: `npm install` then `node test.js` (unit) or `npx cucumber-js` (BDD feature)

## Beads git hooks
- CLIs can remind and install: add `--install-hooks` to `agent-skills sync|inject` or `beads-skill sync|inject`.
