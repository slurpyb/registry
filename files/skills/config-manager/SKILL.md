---
name: config-manager
description: Use when updating OpenCode global config files (`opencode.json`, `oh-my-opencode.json`) with schema validation, safety checks, and backups.
version: 1.0.0
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

# config-manager

Safely updates OpenCode configuration in `/Users/jordan/.config/opencode/`.

## Scope

- Primary files:
  - `/Users/jordan/.config/opencode/opencode.json`
  - `/Users/jordan/.config/opencode/oh-my-opencode.json`
- Official OpenCode docs mirror:
  - `/Users/jordan/.config/opencode/docs/opencode-official/`
  - `/Users/jordan/.config/opencode/docs/opencode-official/config.schema.json`
  - `/Users/jordan/.config/opencode/docs/opencode-official/docs-en-md/`
- oh-my-opencode local docs + schema:
  - `/Users/jordan/j/src/oh-my-opencode/`
  - `/Users/jordan/j/src/oh-my-opencode/assets/oh-my-opencode.schema.json`

## What This Skill Does

1. Reads current configs and requested changes.
2. Cross-checks keys against official schema/docs.
3. Applies minimal JSON edits only to requested fields.
4. Creates timestamped backups before writing.
5. Runs strict schema validation for both config files.
6. Reports exactly what changed and whether validation passed.

## Required Workflow

### 1) Read and understand current state

- Read both config files first.
- If the request references settings, inspect relevant docs in:
  - `/Users/jordan/.config/opencode/docs/opencode-official/docs-en-md/`
  - `/Users/jordan/j/src/oh-my-opencode/README.md`
  - `/Users/jordan/j/src/oh-my-opencode/docs/` (if present)

### 2) Backup before any write

Use Bash:

```bash
python3 - <<'PY'
from datetime import datetime
from pathlib import Path

files = [
    Path('/Users/jordan/.config/opencode/opencode.json'),
    Path('/Users/jordan/.config/opencode/oh-my-opencode.json'),
]
stamp = datetime.now().strftime('%Y-%m-%dT%H-%M-%S')
for f in files:
    bak = f.with_name(f"{f.name}.bak.{stamp}")
    bak.write_text(f.read_text(encoding='utf-8'), encoding='utf-8')
    print(bak)
PY
```

### 3) Apply surgical edits

- Preserve existing formatting style where practical.
- Do not refactor unrelated keys.
- Keep `$schema` pointers intact unless explicitly requested.

### 4) Validate before finalising

Run:

```bash
python3 "/Users/jordan/.config/opencode/skills/config-manager/validate_configs.py"
```

If validation fails:

- Do not leave invalid JSON behind.
- Fix and re-run validation.
- Report failures and fixes.

## Guardrails

- Never remove or rewrite unrelated config sections.
- Never disable safety-related permissions unless explicitly requested.
- Never store secrets inline; prefer `{file:...}` or env references.
- Keep model IDs in `provider/model` format.

## Output Contract

After changes, always provide:

1. Files changed
2. Key-level diff summary
3. Validation result from `validate_configs.py`
4. Backup file paths created
