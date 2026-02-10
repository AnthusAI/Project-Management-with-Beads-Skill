# Project Management with Beads Skill (Project Memory)

**What:** Centralized agent-skill repo for Beads project-management workflow

**Repo:** Dual-distribution (Python + Node) with a single source skill at `skills/project-management-with-beads/SKILL.md`

**CRITICAL AGENT INSTRUCTION:** Never perform a `git commit` until the user explicitly tells you to do so.

---

## Layout

- Skill source: `skills/project-management-with-beads/SKILL.md`
- Python package: `python/`
- Node package: `node/`

## Build / Test

### Python

```bash
cd python
python -m pip install -q .
python -m agent_skills.cli --help
pytest -q tests_cli.py
```

### Node

```bash
cd node
npm install
node test.js
```

## Usage

- Python CLI:
  - `agent-skills sync --repo <path>`
  - `agent-skills inject --repo <path> --agents-file AGENTS.md`

- Node CLI:
  - `beads-skill sync --repo <path>`
  - `beads-skill inject --repo <path> --agents-file AGENTS.md`
