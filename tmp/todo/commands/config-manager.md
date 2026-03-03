---
description: Safely update opencode.json and oh-my-opencode.json with schema validation and backups.
agent: build
---

# /config-manager

Use the `config-manager` skill to update global OpenCode config safely.

## Usage

- `/config-manager <requested config change>`

## Required behaviour

1. Load skill `config-manager`.
2. Read current config files before proposing edits.
3. Back up both config files before writing.
4. Apply only requested key-level changes.
5. Run:

```bash
python3 "/Users/jordan/.config/opencode/skills/config-manager/validate_configs.py"
```

6. Return changed keys, validation output, and backup paths.
