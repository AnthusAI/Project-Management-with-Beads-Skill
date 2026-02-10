import hashlib
from pathlib import Path
import subprocess
import sys

import agent_skills.cli as cli


def _hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_sync_and_inject(tmp_path: Path):
    repo = tmp_path / "repo"
    repo.mkdir()
    # create fake .git marker
    (repo / ".git").mkdir()

    # run sync
    subprocess.check_call([sys.executable, "-m", "agent_skills.cli", "sync", "--repo", str(repo)])
    skill_path = repo / cli.SKILL_REL_PATH / cli.SKILL_FILE_NAME
    assert skill_path.exists()

    # inject
    agents = repo / "AGENTS.md"
    subprocess.check_call([sys.executable, "-m", "agent_skills.cli", "inject", "--repo", str(repo)])
    text1 = agents.read_text()
    # second inject idempotent
    subprocess.check_call([sys.executable, "-m", "agent_skills.cli", "inject", "--repo", str(repo)])
    assert text1 == agents.read_text()

    # hash matches packaged content
    bundled = cli._skill_bytes()
    assert _hash(skill_path) == hashlib.sha256(bundled).hexdigest()
