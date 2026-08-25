# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest discover -s scripts/quality/tests -v

import json
import re
from pathlib import Path
from typing import Final

from scripts.quality.contracts.json_boundary import load_json_object_path

type JsonValue = None | bool | int | float | str | list[JsonValue] | dict[str, JsonValue]
type JsonObject = dict[str, JsonValue]

QUALITY_ROOT: Final = Path(__file__).resolve().parents[1]
CONTRACTS: Final = QUALITY_ROOT / "contracts"
LOCK_PATH: Final = QUALITY_ROOT / "trufflehog.lock"
AJV_2020: Final = QUALITY_ROOT.parents[1] / "apps" / "web" / "node_modules" / "ajv" / "dist" / "2020.js"
EXPECTED_CHECKSUMS: Final = {
    "darwin_arm64": "ad0a99bd48d6df80eabab24d11d0fd771e245fc55ed347f943cafb5e5f497c5c",
    "darwin_amd64": "037e4aeb197870555ff515432bb5f1f2c98dce5f1214631a689112b5e0e4c9fd",
    "linux_arm64": "f48f57e3d4343377865b1b64653f96d381d61a7792d89d026e85524732039fde",
    "linux_amd64": "62224de2f9dd7cd418800feb953760a302ed2f82a7c547fe1146a4874fb179e4",
}


def load_json(path: Path) -> JsonObject:
    return load_json_object_path(path)


def validate(instance, schema, root=None) -> bool:
    root_schema = schema if root is None else root
    if "$ref" in schema:
        target = root_schema
        for part in schema["$ref"].removeprefix("#/").split("/"):
            target = target[part]
        return validate(instance, target, root_schema)
    if "const" in schema and instance != schema["const"]:
        return False
    if "enum" in schema and instance not in schema["enum"]:
        return False
    expected_type = schema.get("type")
    matches_type = {
        "array": isinstance(instance, list),
        "boolean": isinstance(instance, bool),
        "integer": isinstance(instance, int) and not isinstance(instance, bool),
        "object": isinstance(instance, dict),
        "string": isinstance(instance, str),
    }.get(expected_type, True)
    if not matches_type:
        return False
    if isinstance(instance, str):
        if "pattern" in schema and re.search(schema["pattern"], instance) is None:
            return False
        if len(instance) < schema.get("minLength", 0):
            return False
    if isinstance(instance, int) and instance < schema.get("minimum", instance):
        return False
    if isinstance(instance, list):
        if len(instance) < schema.get("minItems", 0) or len(instance) > schema.get("maxItems", len(instance)):
            return False
        if schema.get("uniqueItems") and len({json.dumps(item, sort_keys=True) for item in instance}) != len(instance):
            return False
        if "items" in schema and not all(validate(item, schema["items"], root_schema) for item in instance):
            return False
        if "contains" in schema:
            count = sum(validate(item, schema["contains"], root_schema) for item in instance)
            if count < schema.get("minContains", 1):
                return False
    if isinstance(instance, dict):
        if not set(schema.get("required", ())).issubset(instance):
            return False
        properties = schema.get("properties", {})
        additional = schema.get("additionalProperties")
        if additional is False and not set(instance).issubset(properties):
            return False
        if isinstance(additional, dict) and not all(
            validate(value, additional, root_schema) for key, value in instance.items() if key not in properties
        ):
            return False
        if "propertyNames" in schema and not all(validate(key, schema["propertyNames"], root_schema) for key in instance):
            return False
        if not all(validate(value, properties[key], root_schema) for key, value in instance.items() if key in properties):
            return False
    if "not" in schema and validate(instance, schema["not"], root_schema):
        return False
    if "allOf" in schema and not all(validate(instance, item, root_schema) for item in schema["allOf"]):
        return False
    if "anyOf" in schema and not any(validate(instance, item, root_schema) for item in schema["anyOf"]):
        return False
    if "if" in schema and validate(instance, schema["if"], root_schema):
        return validate(instance, schema.get("then", {}), root_schema)
    return True
