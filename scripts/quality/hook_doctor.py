#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 scripts/quality/hook_doctor.py --json
"""Read-only, fail-closed validation of generated Git hook wrappers."""

import argparse
import atexit
import json
import os
import signal
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from types import FrameType
from typing import Final, NotRequired, TypedDict

GIT_TIMEOUT_SECONDS: Final = 5.0
TERMINATE_TIMEOUT_SECONDS: Final = 1.0
HOOK_NAMES: Final = ("commit-msg", "pre-commit", "pre-push")
CANONICAL_HOOKS: Final = {
    "commit-msg": '#!/bin/sh\nexec mise run git:commit-msg -- "$1"\n',
    "pre-commit": "#!/bin/sh\nexec mise run git:pre-commit\n",
    "pre-push": '#!/bin/sh\nexec mise run git:pre-push -- "$@"\n',
}


class ErrorJson(TypedDict):
    code: str
    hook: NotRequired[str]
    detail: NotRequired[str]


class HookJson(TypedDict):
    name: str
    identifier: str
    status: str
    errors: list[ErrorJson]


class ReportJson(TypedDict):
    status: str
    errors: list[ErrorJson]
    hooks: list[HookJson]
    core_hooks_path: str


@dataclass(frozen=True, slots=True)
class DoctorConfig:
    cwd: Path
    output_json: bool


@dataclass(frozen=True, slots=True)
class GitLayout:
    git_dir: Path
    hooks_path: Path


@dataclass(frozen=True, slots=True)
class HookValidationError:
    code: str
    detail: str = ""

    def to_json(self) -> ErrorJson:
        result = ErrorJson(code=self.code)
        if self.detail:
            result["detail"] = self.detail
        return result


_active_processes: set[subprocess.Popen[str]] = set()


def _terminate_and_reap(process: subprocess.Popen[str]) -> None:
    """Terminate an owned process group and synchronously reap its leader."""
    if process.poll() is None:
        try:
            os.killpg(process.pid, signal.SIGTERM)
        except ProcessLookupError:
            _ = process.poll()
    try:
        _ = process.communicate(timeout=TERMINATE_TIMEOUT_SECONDS)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            _ = process.poll()
        _ = process.communicate()
    _active_processes.discard(process)


def _cleanup_processes() -> None:
    for process in tuple(_active_processes):
        _terminate_and_reap(process)


def _handle_signal(signum: int, _frame: FrameType | None) -> None:
    _cleanup_processes()
    raise SystemExit(128 + signum)


_ = atexit.register(_cleanup_processes)
_ = signal.signal(signal.SIGTERM, _handle_signal)
_ = signal.signal(signal.SIGINT, _handle_signal)


def _run_git(cwd: Path, arguments: tuple[str, ...]) -> str | None:
    """Run one owned Git query; return stdout only after a clean exit."""
    try:
        process = subprocess.Popen(
            ("git", "-C", str(cwd), *arguments),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            start_new_session=True,
        )
    except OSError:
        return None

    _active_processes.add(process)
    try:
        try:
            stdout, _stderr = process.communicate(timeout=GIT_TIMEOUT_SECONDS)
        except subprocess.TimeoutExpired:
            _terminate_and_reap(process)
            return None
        if process.returncode != 0 or not stdout.strip():
            return None
        return stdout.strip()
    finally:
        if process.poll() is not None:
            _active_processes.discard(process)


def resolve_git_layout(cwd: Path) -> tuple[GitLayout | None, str]:
    """Resolve both Git paths canonically, without filesystem guesses."""
    git_dir_output = _run_git(cwd, ("rev-parse", "--git-dir"))
    if git_dir_output is None:
        return None, "GIT_DIR_RESOLVE_FAILED"
    hooks_output = _run_git(cwd, ("rev-parse", "--git-path", "hooks"))
    if hooks_output is None:
        return None, "HOOKS_PATH_RESOLVE_FAILED"

    git_dir = Path(git_dir_output)
    hooks_path = Path(hooks_output)
    if not git_dir.is_absolute():
        git_dir = cwd / git_dir
    if not hooks_path.is_absolute():
        hooks_path = cwd / hooks_path
    return GitLayout(git_dir=git_dir, hooks_path=hooks_path), ""


def read_hook(hook_path: Path) -> tuple[str | None, str]:
    if not hook_path.exists():
        return None, "HOOK_NOT_FOUND"
    try:
        return hook_path.read_text(encoding="utf-8"), ""
    except (OSError, UnicodeDecodeError):
        return None, "HOOK_READ_FAILED"


def check_executable(hook_path: Path) -> bool:
    return hook_path.exists() and hook_path.stat().st_mode & 0o111 != 0


def validate_exact_exec_delegation(hook_content: str, hook_name: str) -> list[HookValidationError]:
    """Accept only the byte-exact generated wrapper for this known hook."""
    expected = CANONICAL_HOOKS[hook_name]
    if hook_content == expected:
        return []

    errors: list[HookValidationError] = []
    if "<" in hook_content or ">" in hook_content:
        errors.append(HookValidationError("STDIN_REDIRECTED", "Canonical wrapper permits no redirection"))
    if not any(line.startswith("exec mise") for line in hook_content.splitlines()):
        errors.append(HookValidationError("EXEC_KEYWORD_MISSING", "Canonical wrapper requires exec mise"))
    if hook_name == "commit-msg" and '"$1"' not in hook_content:
        errors.append(HookValidationError("ARG_FORWARDING_MISSING", "commit-msg requires exact argument forwarding"))
    if hook_name == "pre-push" and '"$@"' not in hook_content:
        errors.append(HookValidationError("ARG_FORWARDING_MISSING", "pre-push requires exact argument forwarding"))
    errors.append(HookValidationError("DELEGATION_MISMATCH", "Hook differs from the canonical generated wrapper"))
    return errors


def _failed_report(code: str) -> ReportJson:
    return ReportJson(status="fail", errors=[ErrorJson(code=code)], hooks=[], core_hooks_path="hooks")


def _emit(report: ReportJson, output_json: bool) -> None:
    if output_json:
        print(json.dumps(report, indent=2))


def run_doctor(cwd: Path, output_json: bool = False) -> int:
    layout, resolution_error = resolve_git_layout(cwd)
    if layout is None:
        _emit(_failed_report(resolution_error), output_json)
        return 1

    report = ReportJson(status="pass", errors=[], hooks=[], core_hooks_path="hooks")
    for hook_name in HOOK_NAMES:
        hook_path = layout.hooks_path / hook_name
        hook_content, read_error = read_hook(hook_path)
        hook_errors: list[ErrorJson] = []
        if hook_content is None:
            hook_errors.append(ErrorJson(code=read_error))
        elif not check_executable(hook_path):
            hook_errors.append(ErrorJson(code="NOT_EXECUTABLE"))
        else:
            hook_errors.extend(error.to_json() for error in validate_exact_exec_delegation(hook_content, hook_name))

        status = "invalid" if hook_errors else "valid"
        report["hooks"].append(
            HookJson(name=hook_name, identifier=f"hooks/{hook_name}", status=status, errors=hook_errors)
        )
        for error in hook_errors:
            report_error = ErrorJson(code=error["code"], hook=hook_name)
            if "detail" in error:
                report_error["detail"] = error["detail"]
            report["errors"].append(report_error)

    if report["errors"]:
        report["status"] = "fail"
    _emit(report, output_json)
    return 0 if report["status"] == "pass" else 1


def parse_args(argv: list[str]) -> DoctorConfig:
    parser = argparse.ArgumentParser(
        description="Validate Git hooks without modifying them",
        usage="%(prog)s [--cwd PATH] [--json]",
        add_help=False,
    )
    cwd = Path.cwd()
    output_json = False
    index = 0
    while index < len(argv):
        argument = argv[index]
        if argument in {"-h", "--help"}:
            parser.print_help()
            raise SystemExit(0)
        if argument == "--json":
            output_json = True
        elif argument == "--cwd":
            index += 1
            if index >= len(argv):
                parser.error("argument --cwd: expected one argument")
            cwd = Path(argv[index])
        elif argument.startswith("--cwd="):
            cwd = Path(argument.removeprefix("--cwd="))
        else:
            parser.error(f"unrecognized arguments: {argument}")
        index += 1
    return DoctorConfig(cwd=cwd, output_json=output_json)


def main() -> int:
    config = parse_args(sys.argv[1:])
    return run_doctor(config.cwd, output_json=config.output_json)


if __name__ == "__main__":
    sys.exit(main())
