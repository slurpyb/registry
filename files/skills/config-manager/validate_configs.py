#!/usr/bin/env python3
import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator


DEFAULT_OPENCODE_CONFIG = Path("/Users/jordan/.config/opencode/opencode.json")
DEFAULT_OHMY_CONFIG = Path("/Users/jordan/.config/opencode/oh-my-opencode.json")
DEFAULT_OPENCODE_SCHEMA = Path(
    "/Users/jordan/.config/opencode/docs/opencode-official/config.schema.json"
)
DEFAULT_OHMY_SCHEMA = Path(
    "/Users/jordan/j/src/oh-my-opencode/assets/oh-my-opencode.schema.json"
)

MODEL_ID_RE = re.compile(r"^[a-z0-9][a-z0-9._-]*/[A-Za-z0-9][A-Za-z0-9._:-]*$")


class DuplicateKeyError(ValueError):
    pass


def _no_duplicate_object_pairs_hook(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key, value in pairs:
        if key in out:
            raise DuplicateKeyError(f"Duplicate JSON key: {key}")
        out[key] = value
    return out


def load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(
            path.read_text(encoding="utf-8"),
            object_pairs_hook=_no_duplicate_object_pairs_hook,
        )
    except FileNotFoundError:
        raise ValueError(f"Missing file: {path}")
    except DuplicateKeyError as exc:
        raise ValueError(f"{path}: {exc}")
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"{path}: invalid JSON at line {exc.lineno}, column {exc.colno}: {exc.msg}"
        )


def validate_schema(
    instance: Any,
    schema: Any,
    label: str,
    strict_additional_properties: bool,
) -> tuple[list[str], list[str]]:
    validator = Draft202012Validator(schema)
    errors = sorted(
        validator.iter_errors(instance), key=lambda e: list(e.absolute_path)
    )
    if not errors:
        return [], []
    hard: list[str] = []
    soft: list[str] = []
    for err in errors:
        path = ".".join(str(p) for p in err.absolute_path) or "<root>"
        msg = f"{label}: {path}: {err.message}"
        if (
            not strict_additional_properties
            and "Additional properties are not allowed" in err.message
        ):
            soft.append(msg)
        else:
            hard.append(msg)
    return hard, soft


def validate_model_strings(config: dict[str, Any], label: str) -> list[str]:
    errors: list[str] = []

    def check_model(value: Any, at: str) -> None:
        if isinstance(value, str) and not MODEL_ID_RE.match(value):
            errors.append(
                f"{label}: {at}: model should look like provider/model, got '{value}'"
            )

    if isinstance(config, dict):
        check_model(config.get("model"), "model")
        check_model(config.get("small_model"), "small_model")

        agents = config.get("agent") or config.get("agents")
        if isinstance(agents, dict):
            for name, data in agents.items():
                if isinstance(data, dict):
                    check_model(data.get("model"), f"agents.{name}.model")

        categories = config.get("categories")
        if isinstance(categories, dict):
            for name, data in categories.items():
                if isinstance(data, dict):
                    check_model(data.get("model"), f"categories.{name}.model")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate OpenCode and oh-my-opencode config files."
    )
    _ = parser.add_argument(
        "--opencode-config", type=Path, default=DEFAULT_OPENCODE_CONFIG
    )
    _ = parser.add_argument("--ohmy-config", type=Path, default=DEFAULT_OHMY_CONFIG)
    _ = parser.add_argument(
        "--opencode-schema", type=Path, default=DEFAULT_OPENCODE_SCHEMA
    )
    _ = parser.add_argument("--ohmy-schema", type=Path, default=DEFAULT_OHMY_SCHEMA)
    _ = parser.add_argument(
        "--strict-additional-properties",
        action="store_true",
        help="Treat additionalProperties schema violations as hard errors.",
    )
    args = parser.parse_args()

    failures = []
    warnings = []

    try:
        opencode_cfg = load_json(args.opencode_config)
        ohmy_cfg = load_json(args.ohmy_config)
        opencode_schema = load_json(args.opencode_schema)
        ohmy_schema = load_json(args.ohmy_schema)
    except ValueError as exc:
        print(f"ERROR: {exc}")
        return 1

    hard, soft = validate_schema(
        opencode_cfg,
        opencode_schema,
        "opencode.json",
        args.strict_additional_properties,
    )
    failures.extend(hard)
    warnings.extend(soft)

    hard, soft = validate_schema(
        ohmy_cfg,
        ohmy_schema,
        "oh-my-opencode.json",
        args.strict_additional_properties,
    )
    failures.extend(hard)
    warnings.extend(soft)
    failures.extend(validate_model_strings(opencode_cfg, "opencode.json"))
    failures.extend(validate_model_strings(ohmy_cfg, "oh-my-opencode.json"))

    if warnings:
        print("CONFIG VALIDATION WARNINGS")
        for item in warnings:
            print(f"- {item}")
        print()

    if failures:
        print("CONFIG VALIDATION FAILED")
        for item in failures:
            print(f"- {item}")
        return 1

    print("CONFIG VALIDATION PASSED")
    print(f"- opencode config: {args.opencode_config}")
    print(f"- oh-my-opencode config: {args.ohmy_config}")
    print(f"- opencode schema: {args.opencode_schema}")
    print(f"- oh-my-opencode schema: {args.ohmy_schema}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
