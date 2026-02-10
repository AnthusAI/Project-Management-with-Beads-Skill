import os
import re
import shutil
from pathlib import Path
from typing import Optional

import typer
from importlib import resources

app = typer.Typer(add_completion=False, help="Sync and inject the Beads project-management skill")

SKILL_NAME = "project-management-with-beads"
SKILL_REL_PATH = Path(".agent-skills") / SKILL_NAME
SKILL_FILE_NAME = "SKILL.md"
START_MARK = f"<!-- AGENT-SKILL:START {SKILL_NAME} -->"
END_MARK = f"<!-- AGENT-SKILL:END {SKILL_NAME} -->"
POINTER_LINE = f"Use skill at: {SKILL_REL_PATH}/{SKILL_FILE_NAME}"


def _git_root(start: Path) -> Path:
    cur = start
    for parent in [cur, *cur.parents]:
        if (parent / ".git").exists():
            return parent
    return start


def _skill_bytes() -> bytes:
    # MultiplexedPath.joinpath only accepts a single segment, so chain calls.
    with (
        resources.files("agent_skills.data")
        .joinpath("skills")
        .joinpath(SKILL_NAME)
        .joinpath(SKILL_FILE_NAME)
        .open("rb")
    ) as f:
        return f.read()


def _write_atomic(target: Path, data: bytes):
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp = target.with_suffix(target.suffix + ".tmp")
    with tmp.open("wb") as f:
        f.write(data)
    os.replace(tmp, target)


def _detect_eol(text: str) -> str:
    return "\r\n" if "\r\n" in text else "\n"


@app.command()
def sync(repo: Optional[Path] = typer.Option(None, help="Path to repo (defaults to git root of cwd)")):
    """Copy packaged skill into .agent-skills/<name>/SKILL.md"""
    base = _git_root(repo if repo else Path.cwd())
    target = base / SKILL_REL_PATH / SKILL_FILE_NAME
    _write_atomic(target, _skill_bytes())
    typer.echo(f"Synced skill to {target}")


@app.command()
def inject(
    repo: Optional[Path] = typer.Option(None, help="Path to repo (defaults to git root of cwd)"),
    agents_file: str = typer.Option("AGENTS.md", help="Agents file relative to repo"),
):
    """Insert or update managed block in AGENTS.md"""
    base = _git_root(repo if repo else Path.cwd())
    path = base / agents_file
    if path.exists():
        text = path.read_text()
    else:
        text = ""
    eol = _detect_eol(text) if text else "\n"

    block = f"{START_MARK}{eol}{POINTER_LINE}{eol}{END_MARK}{eol}"

    if START_MARK in text and END_MARK in text:
        pattern = re.compile(rf"{re.escape(START_MARK)}.*?{re.escape(END_MARK)}\s*", re.S)
        new_text = pattern.sub(block, text)
    else:
        if text and not text.endswith(("\n", "\r")):
            text += eol
        new_text = text + block

    path.write_text(new_text)
    typer.echo(f"Injected pointer into {path}")


@app.command()
def version():
    typer.echo("0.1.0")


if __name__ == "__main__":
    app()
