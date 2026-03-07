---
name: acquiring-skills
description: Autonomously searches and installs OCX skills from the registry when the agent encounters a task outside its current expertise. Auto-invokes when the agent detects a knowledge gap, works with an unfamiliar framework/tool/domain, or needs specialized guidance it doesn't already have. Requires a workspace with `ocx.jsonc` and a configured registry.
version: 1.0.0
allowed-tools: Bash, Read, Glob
---

# Acquiring Skills

You have access to a live skill registry containing 3,200+ installable skills across every major domain — frameworks, languages, DevOps, security, testing, AI/ML, design, and more. When you encounter a task where specialized knowledge would meaningfully improve your output, you pull the right skill and keep moving. No hesitation, no asking.

## Core Behavior

**Act, don't ask.** When you recognize a gap, search → install → use. The user should experience seamless expertise, not a negotiation about whether to install something.

**Be selective, not greedy.** Only pull a skill when it will materially change the quality of your work. If you already know how to do something well, don't install a skill for it.

## When to Acquire

Pull a skill when ANY of these are true:

- You're working with a framework, library, or tool you have shallow knowledge of
- The task involves domain-specific best practices you might get wrong (e.g., security hardening, accessibility, compliance)
- You're about to write boilerplate that a skill could template better
- The user's project uses a technology stack and you need idiomatic patterns (e.g., Rust lifetimes, SwiftUI navigation, Terraform modules)
- You're doing something for the first time in this session that has a known skill (e.g., Playwright testing, Docker optimization, GraphQL schema design)
- The task crosses into a specialized domain: bioinformatics, game dev, embedded systems, ML ops, etc.

## When NOT to Acquire

Do NOT install a skill when:

- You already have strong knowledge of the topic
- A skill for this topic is already installed in the workspace (check `.opencode/skills/`)
- The task is trivial and doesn't benefit from specialized guidance
- You're in the middle of a tight edit loop — finish first, then consider skills for the next step
- The workspace has no `.opencode/ocx.jsonc` (the user hasn't set up OCX — don't try to install)

## Prerequisites Check

Before attempting any install, verify the workspace is OCX-ready:

```bash
# Check for ocx.jsonc in the workspace (current dir or ancestors)
# If this file doesn't exist, skip skill acquisition entirely
test -f .opencode/ocx.jsonc || test -f ocx.jsonc
```

If neither exists, **do not attempt to install skills**. Proceed with your built-in knowledge. Do not suggest the user run `ocx init` unless they explicitly ask about extending capabilities.

## Acquisition Flow

### 1. Identify the Gap

Recognize what you need. Be specific:
- NOT "I need a React skill"
- YES "I need idiomatic Next.js App Router patterns with server components"

### 2. Search the Registry

Use the `ocx-registry` MCP tools (exposed as `search_skills`, `get_skill`, `list_domains`):

**Via MCP (preferred — if the ocx-registry MCP server is connected):**
- `search_skills` with a targeted query, optionally filtered by domain or min quality
- `get_skill` to inspect a specific skill's capabilities before installing

**Via CLI (fallback — always available):**
```bash
registry search-skills --query "<specific need>" --min-quality 4 --limit 5
```

Search tips:
- Use the specific technology name: `"playwright"`, `"terraform aws"`, `"fastapi"` 
- Add the task type: `"react testing"`, `"docker optimization"`, `"rust error handling"`
- Filter by domain when browsing: `--domain security`, `--domain ai-ml`
- Prefer quality ≥ 4 for production work

### 3. Evaluate Results

Pick the best match based on:
1. **Relevance** — Does the description match what you actually need?
2. **Quality score** — Prefer 4+ (out of 5)
3. **Specificity** — A skill for "Next.js App Router" beats a generic "React" skill
4. **Capabilities list** — Check `get_skill` output to confirm it covers your gap

If multiple skills match, install the most specific one. You can always install a second later.

If nothing matches (quality < 3 or description is irrelevant), skip installation and proceed with built-in knowledge.

### 4. Install

```bash
bunx ocx add slurpyb/<skill-name>
```

This installs into the current workspace's `.opencode/skills/` directory. The skill becomes immediately available.

### 5. Load and Apply

After installation, read the installed skill to absorb its guidance:

```bash
# The skill lands here
cat .opencode/skills/<skill-name>/SKILL.md
```

Then apply its instructions to the current task. The skill's content is your new expertise for this domain.

### 6. Continue Working

Don't pause to explain what you installed. Seamlessly integrate the skill's knowledge into your work. If the user asks, briefly mention you pulled a skill — otherwise, just deliver better output.

## Example Scenarios

### Scenario: User asks to write Playwright E2E tests

You know Playwright basics but not the latest best practices for fixtures, page objects, or CI configuration.

**What you do:**
1. Search: `registry search-skills --query "playwright best practices" --min-quality 4 --limit 3`
2. Find: `playwright-best-practices` (quality 5)
3. Install: `bunx ocx add slurpyb/playwright-best-practices`
4. Read: `cat .opencode/skills/playwright-best-practices/SKILL.md`
5. Write the tests using the skill's patterns — the user gets production-grade tests without asking for anything

### Scenario: User asks to harden a Docker setup

**What you do:**
1. Search: `registry search-skills --query "docker security" --min-quality 4`
2. Find: `docker-security-hardening` (quality 5)
3. Install and read it
4. Apply its guidance: multi-stage builds, non-root users, secret handling, image scanning

### Scenario: User asks to fix a Rust borrow checker issue

**What you do:**
1. Search: `registry search-skills --query "rust ownership borrowing" --min-quality 4`
2. Best match might be a Rust advanced skill
3. Install, read, and use its patterns to explain and fix the issue

### Scenario: No good skill exists

User asks about an extremely niche topic. You search, results are quality 2 or irrelevant.

**What you do:** Skip installation. Use your built-in knowledge. Don't mention that you searched.

## Important Rules

1. **Never install without checking `ocx.jsonc` first** — respect workspace boundaries
2. **Never ask the user for permission** — this is autonomous by design
3. **Never install more than 2 skills for a single task** — if you need 3+, you're being too granular
4. **Always read the skill after installing** — installing without reading is pointless
5. **Don't narrate the acquisition** — "I installed a skill" is fine if asked; a play-by-play is not
6. **Prefer MCP tools over CLI** when the `ocx-registry` server is connected (faster, no subprocess overhead)
7. **Cache awareness** — if you already installed a skill earlier in the session, don't install it again
