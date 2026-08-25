#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
# How to run: python3 scripts/quality/secret_scan.py --json < pre-push-refs.txt

from __future__ import annotations

import json
import os
import platform
import re
import shutil
import signal
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from types import FrameType
from typing import Final, TypedDict, override

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
if __package__ is None:
    __package__ = "scripts.quality"

from .contracts.json_boundary import DuplicateJsonMemberError, JsonValue, load_json_bytes, load_json_object_path
from .git_reader import git
from .plan import RefUpdate, parse_ref_stream

LOCK_PATH: Final = Path(__file__).with_name("trufflehog.lock")
VERSION: Final = "v3.97.0"
CHECKSUMS: Final = {
    "darwin_arm64": "ad0a99bd48d6df80eabab24d11d0fd771e245fc55ed347f943cafb5e5f497c5c",
    "darwin_amd64": "037e4aeb197870555ff515432bb5f1f2c98dce5f1214631a689112b5e0e4c9fd",
    "linux_arm64": "f48f57e3d4343377865b1b64653f96d381d61a7792d89d026e85524732039fde",
    "linux_amd64": "62224de2f9dd7cd418800feb953760a302ed2f82a7c547fe1146a4874fb179e4",
}
DEFAULT_TIMEOUT_SECONDS: Final = 120.0
FINDINGS_EXIT: Final = 183
SAFE_METADATA: Final = re.compile(r"^[^\x00-\x1f\x7f]{1,512}$")


class FindingJson(TypedDict):
    rule: str
    path: str
    commit: str


class RefResultJson(TypedDict):
    remote_ref: str
    remote_oid: str
    status: str


class ResultJson(TypedDict):
    schema_version: int
    classification: str
    refs: list[RefResultJson]
    findings: list[FindingJson]


@dataclass(frozen=True, slots=True)
class ScanInterrupted(BaseException):
    signal_number: int


@dataclass(frozen=True, slots=True)
class ScannerFailure(RuntimeError):
    classification: str
    exit_code: int

    @override
    def __str__(self) -> str:
        return self.classification


def _result(classification: str, refs: list[RefResultJson], findings: list[FindingJson] | None = None) -> ResultJson:
    return {"schema_version": 1, "classification": classification, "refs": refs, "findings": findings or []}


def _lock_is_valid(path: Path) -> bool:
    try:
        lock = load_json_object_path(path)
    except (OSError, json.JSONDecodeError, DuplicateJsonMemberError):
        return False
    if set(lock) != {"schema_version", "tool", "version", "release_url", "checksum_manifest_url", "assets"}:
        return False
    if lock["schema_version"] != 1 or lock["tool"] != "trufflehog" or lock["version"] != VERSION:
        return False
    assets = lock["assets"]
    if not isinstance(assets, list) or len(assets) != len(CHECKSUMS):
        return False
    found: dict[str, str] = {}
    for value in assets:
        if not isinstance(value, dict) or set(value) != {"platform", "url", "sha256"}:
            return False
        name, checksum, url = value["platform"], value["sha256"], value["url"]
        if not isinstance(name, str) or not isinstance(checksum, str) or not isinstance(url, str):
            return False
        if name in found or f"trufflehog_3.97.0_{name}.tar.gz" not in url:
            return False
        found[name] = checksum
    return found == CHECKSUMS


def _resolve_scanner(lock: Path) -> Path:
    if not _lock_is_valid(lock):
        raise ScannerFailure("SCANNER_LOCK_INVALID", 69)
    system = platform.system().lower()
    machine = platform.machine().lower()
    architecture = "arm64" if machine in {"arm64", "aarch64"} else "amd64" if machine in {"x86_64", "amd64"} else ""
    if f"{system}_{architecture}" not in CHECKSUMS:
        raise ScannerFailure("SCANNER_PLATFORM_UNSUPPORTED", 69)
    resolved = shutil.which("trufflehog")
    if resolved is None:
        raise ScannerFailure("SCANNER_UNAVAILABLE", 69)
    binary = Path(resolved).resolve()
    try:
        version = subprocess.run((os.fspath(binary), "--version"), check=False, capture_output=True, text=True, timeout=10)
    except (OSError, subprocess.TimeoutExpired) as error:
        raise ScannerFailure("SCANNER_UNAVAILABLE", 69) from error
    versions = re.findall(r"(?<![0-9])v?(\d+\.\d+\.\d+)(?![0-9])", version.stdout + version.stderr)
    if version.returncode != 0 or versions != [VERSION.removeprefix("v")]:
        raise ScannerFailure("SCANNER_VERSION_INVALID", 69)
    return binary


def _canonical_base(update: RefUpdate) -> str | None:
    if update.update_type == "delete":
        return None
    if git("cat-file", "-e", f"{update.local_oid}^{{commit}}").returncode != 0:
        raise ScannerFailure("HISTORY_BASE_UNAVAILABLE", 2)
    if update.update_type != "create":
        if git("cat-file", "-e", f"{update.remote_oid}^{{commit}}").returncode != 0:
            raise ScannerFailure("HISTORY_BASE_UNAVAILABLE", 2)
        if git("merge-base", "--is-ancestor", update.remote_oid, update.local_oid).returncode != 0:
            raise ScannerFailure("HISTORY_BASE_UNAVAILABLE", 2)
        return update.remote_oid
    outgoing_result = git("rev-list", update.local_oid, "--not", "--remotes")
    if outgoing_result.returncode != 0:
        raise ScannerFailure("HISTORY_BASE_UNAVAILABLE", 2)
    outgoing = frozenset(outgoing_result.stdout.splitlines())
    if not outgoing:
        return None
    boundaries: set[str] = set()
    for commit in outgoing:
        parents = git("rev-list", "--parents", "-n", "1", commit)
        if parents.returncode != 0:
            raise ScannerFailure("HISTORY_BASE_UNAVAILABLE", 2)
        boundaries.update(parent for parent in parents.stdout.split()[1:] if parent not in outgoing)
    if len(boundaries) != 1:
        raise ScannerFailure("HISTORY_BASE_UNAVAILABLE", 2)
    base = next(iter(boundaries))
    if git("merge-base", "--is-ancestor", base, update.local_oid).returncode != 0:
        raise ScannerFailure("HISTORY_BASE_UNAVAILABLE", 2)
    return base


def _metadata(value: JsonValue, secrets: tuple[str, ...]) -> FindingJson:
    if not isinstance(value, dict):
        raise ScannerFailure("SCANNER_OUTPUT_INVALID", 74)
    rule = value.get("DetectorName")
    source = value.get("SourceMetadata")
    if not isinstance(rule, str) or not isinstance(source, dict):
        raise ScannerFailure("SCANNER_OUTPUT_INVALID", 74)
    data = source.get("Data")
    git_data = data.get("Git") if isinstance(data, dict) else None
    if not isinstance(git_data, dict):
        raise ScannerFailure("SCANNER_OUTPUT_INVALID", 74)
    commit, path = git_data.get("commit"), git_data.get("file")
    if not isinstance(commit, str) or re.fullmatch(r"[0-9a-f]{40}(?:[0-9a-f]{24})?", commit) is None:
        raise ScannerFailure("SCANNER_OUTPUT_INVALID", 74)
    if not isinstance(path, str) or SAFE_METADATA.fullmatch(path) is None or SAFE_METADATA.fullmatch(rule) is None:
        raise ScannerFailure("SCANNER_OUTPUT_INVALID", 74)
    for secret in secrets:
        if secret:
            path = path.replace(secret, "[REDACTED]")
            rule = rule.replace(secret, "[REDACTED]")
    return {"rule": rule, "path": path, "commit": commit}


def _parse_findings(raw: bytes) -> list[FindingJson]:
    findings: list[FindingJson] = []
    for line in raw.splitlines():
        if not line.strip():
            continue
        try:
            value = load_json_bytes(line)
        except (json.JSONDecodeError, UnicodeDecodeError, DuplicateJsonMemberError) as error:
            raise ScannerFailure("SCANNER_OUTPUT_INVALID", 74) from error
        secrets = tuple(item for name in ("Raw", "RawV2") if isinstance((item := value.get(name) if isinstance(value, dict) else None), str))
        findings.append(_metadata(value, secrets))
    return findings


def _scan(binary: Path, repo: Path, update: RefUpdate, base: str, timeout: float) -> list[FindingJson]:
    command = (
        os.fspath(binary), "--json", "--no-update", "--fail", "--fail-on-scan-errors",
        "git", repo.resolve().as_uri(), "--since-commit", base, "--branch", update.local_oid,
        "--results=verified,unknown", "--trust-local-git-config",
    )
    try:
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except OSError as error:
        raise ScannerFailure("SCANNER_UNAVAILABLE", 69) from error
    try:
        stdout, _stderr = process.communicate(timeout=timeout)
    except subprocess.TimeoutExpired as error:
        process.kill()
        _ = process.communicate()
        raise ScannerFailure("SCANNER_TIMEOUT", 124) from error
    except ScanInterrupted:
        process.terminate()
        _ = process.communicate()
        raise
    parsed_findings = _parse_findings(stdout)
    outgoing = git("rev-list", update.local_oid, f"^{base}")
    if outgoing.returncode != 0:
        raise ScannerFailure("HISTORY_BASE_UNAVAILABLE", 2)
    findings = [finding for finding in parsed_findings if finding["commit"] in frozenset(outgoing.stdout.splitlines())]
    if process.returncode == 0 and not parsed_findings:
        return []
    if process.returncode == FINDINGS_EXIT and parsed_findings:
        return findings
    if process.returncode in (0, FINDINGS_EXIT):
        raise ScannerFailure("SCANNER_OUTPUT_INVALID", 74)
    if process.returncode < 0:
        raise ScannerFailure("SCANNER_SIGNALLED", 128 - process.returncode)
    raise ScannerFailure("SCANNER_ERROR", 74)


def _signal_handler(signum: int, _frame: FrameType | None) -> None:
    raise ScanInterrupted(signum)


def main() -> int:
    arguments = sys.argv[1:]
    if "--help" in arguments:
        print("usage: secret_scan.py [--json] [--input PATH] [--lock PATH] [--timeout SECONDS]")
        return 0
    try:
        timeout = float(arguments[arguments.index("--timeout") + 1]) if "--timeout" in arguments else DEFAULT_TIMEOUT_SECONDS
        input_path = Path(arguments[arguments.index("--input") + 1]) if "--input" in arguments else None
        lock_path = Path(arguments[arguments.index("--lock") + 1]) if "--lock" in arguments else LOCK_PATH
        raw = input_path.read_text(encoding="utf-8") if input_path is not None else sys.stdin.read()
        if timeout <= 0:
            raise ValueError
    except (ValueError, IndexError, OSError, UnicodeError):
        print(json.dumps(_result("MALFORMED_INPUT", []), sort_keys=True, separators=(",", ":")))
        return 2
    updates, malformed = parse_ref_stream(raw)
    if malformed is not None:
        print(json.dumps(_result("MALFORMED_INPUT", []), sort_keys=True, separators=(",", ":")))
        return 2
    if not updates:
        print(json.dumps(_result("NO_REF_UPDATES", []), sort_keys=True, separators=(",", ":")))
        return 0
    previous_term = signal.signal(signal.SIGTERM, _signal_handler)
    previous_interrupt = signal.signal(signal.SIGINT, _signal_handler)
    refs: list[RefResultJson] = []
    findings: list[FindingJson] = []
    try:
        bases = [(update, _canonical_base(update)) for update in updates]
        if all(base is None for _, base in bases):
            refs = [{"remote_ref": update.remote_ref, "remote_oid": update.remote_oid, "status": "skipped"} for update, _ in bases]
            result = _result("NO_OUTGOING_OBJECTS", refs)
            exit_code = 0
        else:
            binary = _resolve_scanner(lock_path)
            for update, base in bases:
                if base is None:
                    refs.append({"remote_ref": update.remote_ref, "remote_oid": update.remote_oid, "status": "skipped"})
                    continue
                ref_findings = _scan(binary, Path.cwd(), update, base, timeout)
                findings.extend(ref_findings)
                refs.append({"remote_ref": update.remote_ref, "remote_oid": update.remote_oid, "status": "failed" if ref_findings else "pass"})
            result = _result("SECRET_FOUND" if findings else "CLEAN", refs, findings)
            exit_code = 1 if findings else 0
    except ScannerFailure as error:
        result, exit_code = _result(error.classification, refs), error.exit_code
    except ScanInterrupted as error:
        result, exit_code = _result("INTERRUPTED", refs), 128 + error.signal_number
    finally:
        _ = signal.signal(signal.SIGTERM, previous_term)
        _ = signal.signal(signal.SIGINT, previous_interrupt)
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
