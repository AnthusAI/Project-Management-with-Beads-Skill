import hashlib
import subprocess
import sys
from pathlib import Path

import pytest
from pytest_bdd import given, scenario, then, when

import agent_skills.cli as cli


@pytest.mark.bdd
@scenario("../sync_inject.feature", "Sync writes skill and inject is idempotent", features_base_dir=None)
def test_sync_inject():
    """BDD scenario runner"""


@given("a git-initialized temporary repository", target_fixture="repo")
def repo(tmp_path: Path) -> Path:
    repo_path = tmp_path / "repo"
    repo_path.mkdir()
    (repo_path / ".git").mkdir()
    return repo_path


@when("I run agent-skills sync")
def run_sync(repo: Path):
    subprocess.check_call([sys.executable, "-m", "agent_skills.cli", "sync", "--repo", str(repo)])


@when("I run agent-skills inject")
def run_inject(repo: Path):
    subprocess.check_call([sys.executable, "-m", "agent_skills.cli", "inject", "--repo", str(repo)])


@then("the skill file matches the packaged bytes")
def skill_matches(repo: Path):
    skill_path = repo / cli.SKILL_REL_PATH / cli.SKILL_FILE_NAME
    assert skill_path.exists(), "skill file missing after sync"
    packaged_hash = hashlib.sha256(cli._skill_bytes()).hexdigest()
    assert hashlib.sha256(skill_path.read_bytes()).hexdigest() == packaged_hash


@then("injecting again leaves AGENTS.md unchanged")
def inject_idempotent(repo: Path):
    agents = repo / "AGENTS.md"
    before = agents.read_text()
    subprocess.check_call([sys.executable, "-m", "agent_skills.cli", "inject", "--repo", str(repo)])
    assert agents.read_text() == before
