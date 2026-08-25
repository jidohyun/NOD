#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
# How to run: NOD_TRUFFLEHOG_STUB_MODE=clean python3 trufflehog_stub.py --version

from __future__ import annotations

import json
import os
import signal
import sys
from pathlib import Path


def main() -> int:
    if sys.argv[1:] == ["--version"]:
        print(os.environ.get("NOD_TRUFFLEHOG_STUB_VERSION", "trufflehog 3.97.0"))
        return 0
    capture = os.environ.get("NOD_TRUFFLEHOG_STUB_CAPTURE")
    if capture:
        with Path(capture).open("a", encoding="utf-8") as stream:
            _ = stream.write(json.dumps(sys.argv[1:]) + "\n")
    mode = os.environ.get("NOD_TRUFFLEHOG_STUB_MODE", "clean")
    if mode == "clean":
        return 0
    if mode == "finding":
        print(json.dumps({
            "DetectorName": os.environ.get("NOD_TRUFFLEHOG_STUB_RULE", "FixtureDetector"),
            "Raw": os.environ.get("NOD_TRUFFLEHOG_STUB_SECRET", "sensitive"),
            "SourceMetadata": {"Data": {"Git": {
                "commit": os.environ["NOD_TRUFFLEHOG_STUB_COMMIT"],
                "file": os.environ.get("NOD_TRUFFLEHOG_STUB_PATH", "fixture.txt"),
            }}},
        }))
        return 183
    if mode == "malformed":
        print("not-json")
        return 0
    if mode == "error":
        print(os.environ.get("NOD_TRUFFLEHOG_STUB_SECRET", "sensitive"), file=sys.stderr)
        return 17
    if mode == "scanner-signal":
        os.kill(os.getpid(), signal.SIGTERM)
    if mode in {"timeout", "signal"}:
        ready = os.environ.get("NOD_TRUFFLEHOG_STUB_READY")
        fifo = os.environ.get("NOD_TRUFFLEHOG_STUB_FIFO")
        if ready is not None:
            with Path(ready).open("w", encoding="utf-8") as stream:
                _ = stream.write("ready\n")
        signal.pause()
        if fifo is not None:
            _ = Path(fifo).read_bytes()
        return 0
    return 19


if __name__ == "__main__":
    raise SystemExit(main())
