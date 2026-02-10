import os
import re
import shutil
import subprocess
import sys
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
POINTER_TEXT = (
    f"Use skill at: {SKILL_REL_PATH}/{SKILL_FILE_NAME}\n"
    "Why: Beads task management is MANDATORY here; every task must live in Beads.\n"
    "When: Create/update the Beads task before coding; close it only after the change lands.\n"
    "How: Follow the workflow in the skill for recording, implementation notes, and closure."
)
HOOK_INSTALL_CMD = ["bd", "install-hooks"]


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


def _hook_installed(repo: Path) -> bool:
    hook = repo / ".git" / "hooks" / "pre-commit"
    if not hook.exists():
        return False
    try:
        content = hook.read_text()
    except OSError:
        return False
    markers = ("beads", "bd ", "bd\n", "bd-")
    return any(m in content for m in markers)


def _maybe_install_hooks(repo: Path, install: Optional[bool], hooks_cmd: str):
    if _hook_installed(repo):
        return
    cmd_parts = hooks_cmd.split()
    msg = (
        f"Beads commit hooks not detected in {repo}.\n"
        f"Install with: {' '.join(cmd_parts)}"
    )
    typer.secho(msg, fg="yellow")

    if install is None:
        decision = typer.confirm("Install Beads commit hooks now?", default=True) if sys.stdin.isatty() else True
    else:
        decision = install

    if not decision:
        typer.echo("Skipping hook install. Run the command above later or re-run with --install-hooks.")
        return

    try:
        subprocess.check_call(cmd_parts, cwd=repo)
        typer.secho("Installed Beads commit hooks.", fg="green")
    except FileNotFoundError:
        typer.secho(
            f"Cannot install hooks: command '{cmd_parts[0]}' not found. Install Beads CLI first.",
            fg="red",
        )
    except subprocess.CalledProcessError as exc:
        typer.secho(f"Hook installation failed (exit {exc.returncode}).", fg="red")


@app.command()
def sync(
    repo: Optional[Path] = typer.Option(None, help="Path to repo (defaults to git root of cwd)"),
    install_hooks: Optional[bool] = typer.Option(
        None,
        "--install-hooks/--no-install-hooks",
        help="Install Beads commit hooks if missing (default: prompt, yes if non-interactive)",
    ),
    hooks_cmd: str = typer.Option(
        "bd install-hooks",
        "--hooks-cmd",
        help="Command to install Beads hooks (space separated)",
    ),
):
    """Copy packaged skill into .agent-skills/<name>/SKILL.md"""
    base = _git_root(repo if repo else Path.cwd())
    target = base / SKILL_REL_PATH / SKILL_FILE_NAME
    _write_atomic(target, _skill_bytes())
    typer.echo(f"Synced skill to {target}")
    _maybe_install_hooks(base, install_hooks, hooks_cmd)


@app.command()
def inject(
    repo: Optional[Path] = typer.Option(None, help="Path to repo (defaults to git root of cwd)"),
    agents_file: str = typer.Option("AGENTS.md", help="Agents file relative to repo"),
    install_hooks: Optional[bool] = typer.Option(
        None,
        "--install-hooks/--no-install-hooks",
        help="Install Beads commit hooks if missing (default: prompt, yes if non-interactive)",
    ),
    hooks_cmd: str = typer.Option(
        "bd install-hooks",
        "--hooks-cmd",
        help="Command to install Beads hooks (space separated)",
    ),
):
    """Insert or update managed block in AGENTS.md"""
    base = _git_root(repo if repo else Path.cwd())
    path = base / agents_file
    if path.exists():
        text = path.read_text()
    else:
        text = ""
    eol = _detect_eol(text) if text else "\n"

    block = f"{START_MARK}{eol}{POINTER_TEXT}{eol}{END_MARK}{eol}"

    if START_MARK in text and END_MARK in text:
        pattern = re.compile(rf"{re.escape(START_MARK)}.*?{re.escape(END_MARK)}\s*", re.S)
        new_text = pattern.sub(block, text)
    else:
        if text and not text.endswith(("\n", "\r")):
            text += eol
        new_text = text + block

    path.write_text(new_text)
    typer.echo(f"Injected pointer into {path}")
    _maybe_install_hooks(base, install_hooks, hooks_cmd)


@app.command()
def version():
    typer.echo("0.1.3")


if __name__ == "__main__":
    app()
