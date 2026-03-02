# config-manager skill

Purpose: safely manage `/Users/jordan/.config/opencode/opencode.json` and `/Users/jordan/.config/opencode/oh-my-opencode.json`.

## Included assets

- `SKILL.md` - execution workflow and guardrails
- `validate_configs.py` - strict schema + model-ID validation

## Documentation sources used by this skill

- Official OpenCode docs mirror:
  - `/Users/jordan/.config/opencode/docs/opencode-official/docs-en-md/`
  - `/Users/jordan/.config/opencode/docs/opencode-official/config.schema.json`
- oh-my-opencode local repository:
  - `/Users/jordan/j/src/oh-my-opencode/`
  - `/Users/jordan/j/src/oh-my-opencode/assets/oh-my-opencode.schema.json`

## Manual validation

```bash
python3 "/Users/jordan/.config/opencode/skills/config-manager/validate_configs.py"
```
