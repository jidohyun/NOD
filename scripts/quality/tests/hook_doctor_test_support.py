# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest discover -s scripts/quality/tests -v

import os
import subprocess
from pathlib import Path
from typing import Final

QUALITY_ROOT: Final = Path(__file__).resolve().parents[1]
HOOK_DOCTOR: Final = QUALITY_ROOT / "hook_doctor.py"
KNOWN_ERROR_CODES: Final = (
    "GIT_DIR_RESOLVE_FAILED",
    "HOOKS_PATH_RESOLVE_FAILED",
    "HOOK_NOT_FOUND",
    "HOOK_READ_FAILED",
    "NOT_EXECUTABLE",
    "DELEGATION_MISMATCH",
    "EXEC_KEYWORD_MISSING",
    "STDIN_REDIRECTED",
    "ARG_FORWARDING_MISSING",
)
CANONICAL_HOOKS: Final = {
    "commit-msg": '#!/bin/sh\nexec mise run git:commit-msg -- "$1"\n',
    "pre-commit": "#!/bin/sh\nexec mise run git:pre-commit\n",
    "pre-push": '#!/bin/sh\nexec mise run git:pre-push -- "$@"\n',
}


def run(command: tuple[str, ...], *, cwd: Path, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=cwd, env=env, capture_output=True, text=True, check=False)


def initialize_repository(path: Path) -> Path:
    path.mkdir()
    completed = run(("git", "init", "-q"), cwd=path)
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr)
    hooks_path = path / ".git" / "hooks"
    install_hooks(hooks_path)
    return hooks_path


def install_hooks(hooks_path: Path) -> None:
    hooks_path.mkdir(parents=True, exist_ok=True)
    for name, content in CANONICAL_HOOKS.items():
        write_executable(hooks_path / name, content)


def write_executable(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")
    _ = path.chmod(0o755)


def run_doctor(cwd: Path, *, env: dict[str, str] | None = None, timeout: float = 15) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ("python3", str(HOOK_DOCTOR), "--cwd", str(cwd), "--json"),
        env=env,
        capture_output=True,
        text=True,
        check=False,
        timeout=timeout,
    )


def error_codes(completed: subprocess.CompletedProcess[str]) -> set[str]:
    return {code for code in KNOWN_ERROR_CODES if f'"code": "{code}"' in completed.stdout}


def process_exists(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    return True
