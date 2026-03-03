#!/usr/bin/env bash
set -euo pipefail

SKILLS_SRC="$1"
SKILLS_DST="./files/skills"

mkdir -p "$SKILLS_DST"

for skill_dir in "$SKILLS_SRC"/*/; do
  rogue skill "$skill_dir" --to=opencode --output="$SKILLS_DST"
done
