# Project Management with Beads Skill

Single-source skill for Beads/agent workflows. Provides Python and Node CLIs to sync the skill into each repo and inject a pointer into `AGENTS.md`.

## Skill content
- Source: `skills/project-management-with-beads/SKILL.md` (copied from Springstack AGENTS)
- Deployed location in each repo: `.agent-skills/project-management-with-beads/SKILL.md`

## Python CLI
- Install: `pip install .` (from `python/`)
- Commands:
  - `agent-skills sync [--repo PATH]`
  - `agent-skills inject [--repo PATH] [--agents-file AGENTS.md]`
- Defaults: repo auto-detected via `.git` from cwd; agents file defaults to `AGENTS.md`.

## Node CLI
- Install: `npm install -g .` (from `node/`) or `npx beads-skill ...` after publish
- Commands:
  - `beads-skill sync [--repo PATH]`
  - `beads-skill inject [--repo PATH] [--agents-file AGENTS.md]`

## Pointer block format
```
<!-- AGENT-SKILL:START project-management-with-beads -->
Use skill at: .agent-skills/project-management-with-beads/SKILL.md
<!-- AGENT-SKILL:END project-management-with-beads -->
```

## Tests
- Python: `pytest` (runs sync/inject in temp dir)
- Node: `node test.js`
