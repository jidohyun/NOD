# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m scripts.quality.contracts.json_boundary < receipt.json

import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Final, TextIO, override

type JsonValue = None | bool | int | float | str | list[JsonValue] | dict[str, JsonValue]
type JsonObject = dict[str, JsonValue]

_JSON_LOADS: Final[Callable[..., JsonValue]] = json.loads
_JSON_LOAD: Final[Callable[..., JsonValue]] = json.load
_JSON_LOAD_OBJECT: Final[Callable[..., JsonObject]] = json.load


@dataclass(frozen=True, slots=True)
class DuplicateJsonMemberError(ValueError):
    name: str

    @override
    def __str__(self) -> str:
        return f"duplicate JSON member name: {self.name}"


def _strict_object(pairs: list[tuple[str, JsonValue]]) -> JsonObject:
    parsed: JsonObject = {}
    for name, value in pairs:
        if name in parsed:
            raise DuplicateJsonMemberError(name)
        parsed[name] = value
    return parsed


def load_json_bytes(raw: bytes) -> JsonValue:
    return _JSON_LOADS(raw, object_pairs_hook=_strict_object)


def load_json_stream(stream: TextIO) -> JsonValue:
    return _JSON_LOAD(stream, object_pairs_hook=_strict_object)


def load_json_object_path(path: Path) -> JsonObject:
    with path.open(encoding="utf-8") as stream:
        return _JSON_LOAD_OBJECT(stream, object_pairs_hook=_strict_object)


def main() -> int:
    try:
        parsed = load_json_bytes(sys.stdin.buffer.read())
    except DuplicateJsonMemberError as error:
        _ = sys.stderr.write(f"{error}\n")
        return 2
    _ = json.dump(parsed, sys.stdout, separators=(",", ":"))
    _ = sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
