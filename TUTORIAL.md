# OCX Registry Tutorial - Complete Guide

A step-by-step guide for managing your OCX component registry. This covers **everything**: skills, agents, plugins, commands, tools, bundles, and profiles.

---

## Table of Contents

1. [Understanding Component Types](#understanding-component-types)
2. [Adding Components](#adding-components)
3. [Updating Components](#updating-components)
4. [Removing Components](#removing-components)
5. [Building & Deploying](#building--deploying)
6. [Advanced Patterns](#advanced-patterns)
7. [Troubleshooting](#troubleshooting)

---

## Understanding Component Types

OCX supports 7 component types:

| Type | What It Is | File Format | Example Use |
|------|------------|-------------|-------------|
| **ocx:skill** | Instructions that teach AI how to do something | Markdown (SKILL.md) | "How to build MCP servers", "Gemini CLI usage" |
| **ocx:agent** | AI persona with specific role and permissions | Markdown | "Code reviewer", "Security auditor" |
| **ocx:plugin** | Code that extends Claude Code functionality | TypeScript | Add custom tools, hooks, MCP servers |
| **ocx:command** | User-invokable slash commands | Markdown | `/review`, `/deploy`, `/test` |
| **ocx:tool** | Custom tool implementations | TypeScript | Database query tool, API wrapper |
| **ocx:bundle** | Collection of related components | JSON | "Starter kit", "Security suite" |
| **ocx:profile** | Shareable configuration preset | JSON | "My preferred settings" |

---

## Adding Components

### 1. Adding a Skill

**Skills** are the most common component type. They teach AI assistants how to perform specific tasks.

#### Step 1: Create the skill file

```bash
# Create directory
mkdir -p files/skills/my-awesome-skill

# Create SKILL.md
cat > files/skills/my-awesome-skill/SKILL.md << 'EOF'
---
name: my-awesome-skill
description: Brief description of what this skill does
---

# My Awesome Skill

## TL;DR

One-paragraph summary for quick reference.

## When to Use

- Use case 1
- Use case 2
- Use case 3

## Instructions

Detailed step-by-step instructions...

### Step 1: Do This

Explanation...

### Step 2: Then That

Explanation...

## Examples

Show good and bad examples...

## What NOT to Do

- Anti-pattern 1
- Anti-pattern 2
EOF
```

#### Step 2: Add to registry.jsonc

Open `registry.jsonc` and add to the `components` array:

```json
{
  "name": "my-awesome-skill",
  "type": "ocx:skill",
  "description": "Brief description of what this skill does",
  "files": ["skills/my-awesome-skill/SKILL.md"]
}
```

#### Step 3: Build and deploy

```bash
bun run build
bunx wrangler deploy
```

#### Skills with Additional Files

If your skill has references, assets, scripts, or templates:

```bash
# Create structure
mkdir -p files/skills/my-skill/{references,assets,scripts,templates}

# Add files
echo "# Reference doc" > files/skills/my-skill/references/api-docs.md
echo "console.log('helper')" > files/skills/my-skill/assets/helper.js
```

Update `registry.jsonc` to include all files:

```json
{
  "name": "my-skill",
  "type": "ocx:skill",
  "description": "Skill with extra files",
  "files": [
    "skills/my-skill/SKILL.md",
    "skills/my-skill/references/api-docs.md",
    "skills/my-skill/assets/helper.js",
    "skills/my-skill/scripts/setup.sh"
  ]
}
```

---

### 2. Adding an Agent

**Agents** define specialized AI roles with specific permissions and behaviors.

#### Step 1: Create the agent file

```bash
mkdir -p files/agents

cat > files/agents/code-reviewer.md << 'EOF'
---
name: code-reviewer
description: Meticulous code reviewer focused on quality and best practices
permissions:
  read: ["**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"]
  write: []
  bash: ["npm test", "bun test"]
---

# Agent: Code Reviewer

You are a meticulous code reviewer focused on quality and best practices.

## Role

- Review code for bugs, security issues, and style problems
- Suggest improvements with clear explanations
- Be constructive and educational, not critical

## Permissions

- Read any TypeScript/JavaScript file in the codebase
- Run test commands only
- Cannot modify files directly (suggest changes only)

## Forbidden Actions

- Never approve code with known security vulnerabilities
- Never skip tests or linting checks
- Never make changes without explaining why

## Response Format

Use this structure for reviews:

### Summary
Brief overview of the code quality

### Issues Found
- [SEVERITY] Description of issue
  - Location: file:line
  - Suggestion: How to fix

### Recommendations
Prioritized list of improvements
EOF
```

#### Step 2: Add to registry.jsonc

```json
{
  "name": "code-reviewer",
  "type": "ocx:agent",
  "description": "Meticulous code reviewer focused on quality and best practices",
  "files": ["agents/code-reviewer.md"]
}
```

---

### 3. Adding a Plugin

**Plugins** extend Claude Code with custom tools, hooks, and MCP servers.

#### Step 1: Create the plugin file

```bash
mkdir -p files/plugins

cat > files/plugins/my-plugin.ts << 'EOF'
import type { Plugin, PluginContext, ToolDefinition } from "Claude"

// Define custom tools
const myTool: ToolDefinition = {
  name: "my-tool",
  description: "Does something useful",
  parameters: {
    type: "object",
    properties: {
      input: { type: "string", description: "The input value" }
    },
    required: ["input"]
  },
  execute: async (params, ctx) => {
    return { result: `Processed: ${params.input}` }
  }
}

// Export the plugin
export default {
  name: "my-plugin",
  version: "1.0.0",

  // Lifecycle hooks
  onSessionStart: async (ctx: PluginContext) => {
    console.log("Session started")
  },

  onSessionEnd: async (ctx: PluginContext) => {
    console.log("Session ended")
  },

  // Register tools
  tools: [myTool],

  // Inject configuration
  config: {
    mcp: {
      "my-server": {
        type: "remote",
        url: "https://api.example.com/mcp"
      }
    }
  }
} satisfies Plugin
EOF
```

#### Step 2: Add to registry.jsonc

```json
{
  "name": "my-plugin",
  "type": "ocx:plugin",
  "description": "Adds custom tools and MCP integration",
  "files": ["plugins/my-plugin.ts"]
}
```

---

### 4. Adding a Command

**Commands** are user-invokable slash commands in the TUI.

#### Step 1: Create the command file

```bash
mkdir -p files/commands

cat > files/commands/review.md << 'EOF'
---
name: review
description: Perform comprehensive code review
usage: /review [path]
---

# Review Command

Performs a comprehensive code review of the specified path or current directory.

## Usage

```
/review                  # Review current directory
/review src/            # Review specific directory
/review src/app.ts      # Review specific file
```

## What It Does

1. Analyzes code for:
   - Security vulnerabilities
   - Performance issues
   - Code quality problems
   - Best practice violations

2. Generates a detailed report with:
   - Summary of findings
   - Severity ratings
   - Specific recommendations
   - Code examples

## Implementation

When this command is invoked:

1. Parse the path argument (default to current directory)
2. Read all relevant files
3. Analyze using code review patterns
4. Generate structured report
5. Save report to `review-report.md`
EOF
```

#### Step 2: Add to registry.jsonc

```json
{
  "name": "review",
  "type": "ocx:command",
  "description": "Perform comprehensive code review",
  "files": ["commands/review.md"]
}
```

---

### 5. Adding a Tool

**Tools** are custom tool implementations that extend Claude Code's capabilities.

#### Step 1: Create the tool file

```bash
mkdir -p files/tools

cat > files/tools/database-query.ts << 'EOF'
import type { Tool, ToolContext } from "Claude"

export default {
  name: "database-query",
  description: "Query the database using SQL",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "SQL query to execute"
      },
      database: {
        type: "string",
        description: "Database name",
        default: "main"
      }
    },
    required: ["query"]
  },
  
  execute: async (params: { query: string; database?: string }, ctx: ToolContext) => {
    // Validate query (prevent destructive operations)
    if (/DELETE|DROP|TRUNCATE/i.test(params.query)) {
      throw new Error("Destructive queries not allowed")
    }

    // Execute query (pseudo-code)
    const db = await connectToDatabase(params.database || "main")
    const results = await db.query(params.query)
    
    return {
      rows: results.rows,
      rowCount: results.rowCount,
      fields: results.fields.map(f => f.name)
    }
  }
} satisfies Tool
EOF
```

#### Step 2: Add to registry.jsonc

```json
{
  "name": "database-query",
  "type": "ocx:tool",
  "description": "Query the database using SQL",
  "files": ["tools/database-query.ts"]
}
```

---

### 6. Adding a Bundle

**Bundles** group related components for easy installation.

#### Step 1: Create the bundle file

```bash
mkdir -p files/bundles

cat > files/bundles/starter-kit.json << 'EOF'
{
  "name": "starter-kit",
  "type": "ocx:bundle",
  "description": "Everything you need to get started",
  "dependencies": [
    "deepinit",
    "mcp-builder",
    "code-reviewer",
    "review"
  ]
}
EOF
```

#### Step 2: Add to registry.jsonc

```json
{
  "name": "starter-kit",
  "type": "ocx:bundle",
  "description": "Everything you need to get started",
  "files": ["bundles/starter-kit.json"]
}
```

---

### 7. Adding a Profile

**Profiles** are shareable configuration presets.

#### Step 1: Create the profile file

```bash
mkdir -p files/profiles

cat > files/profiles/my-setup.json << 'EOF'
{
  "name": "my-setup",
  "type": "ocx:profile",
  "description": "My preferred Claude Code configuration",
  "config": {
    "model": "claude-sonnet-4",
    "temperature": 0.7,
    "tools": {
      "enabled": ["Read", "Edit", "Bash", "Write"],
      "disabled": []
    },
    "mcp": {
      "filesystem": {
        "type": "local",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/projects"]
      }
    }
  }
}
EOF
```

#### Step 2: Add to registry.jsonc

```json
{
  "name": "my-setup",
  "type": "ocx:profile",
  "description": "My preferred Claude Code configuration",
  "files": ["profiles/my-setup.json"]
}
```

---

## Updating Components

### Update a Skill

1. Edit the skill file:
   ```bash
   vim files/skills/my-skill/SKILL.md
   ```

2. Update version in `registry.jsonc` (optional but recommended):
   ```json
   {
     "name": "my-skill",
     "version": "1.1.0",  // Increment version
     "type": "ocx:skill",
     "description": "Updated description",
     "files": ["skills/my-skill/SKILL.md"]
   }
   ```

3. Rebuild and deploy:
   ```bash
   bun run build
   bunx wrangler deploy
   ```

### Add Files to Existing Component

1. Add the new files:
   ```bash
   echo "# New reference" > files/skills/my-skill/references/new-doc.md
   ```

2. Update `registry.jsonc`:
   ```json
   {
     "name": "my-skill",
     "type": "ocx:skill",
     "description": "My skill",
     "files": [
       "skills/my-skill/SKILL.md",
       "skills/my-skill/references/new-doc.md"  // Add this
     ]
   }
   ```

3. Rebuild and deploy:
   ```bash
   bun run build
   bunx wrangler deploy
   ```

---

## Removing Components

### Remove a Component

1. Delete the component files:
   ```bash
   rm -rf files/skills/unwanted-skill
   ```

2. Remove from `registry.jsonc`:
   ```json
   {
     "components": [
       // Delete the entire component object
       // {
       //   "name": "unwanted-skill",
       //   "type": "ocx:skill",
       //   ...
       // },
       {
         "name": "other-skill",
         ...
       }
     ]
   }
   ```

3. Rebuild and deploy:
   ```bash
   bun run build
   bunx wrangler deploy
   ```

### Remove Files from Component

1. Delete the files:
   ```bash
   rm files/skills/my-skill/references/old-doc.md
   ```

2. Update `registry.jsonc` (remove from files array):
   ```json
   {
     "name": "my-skill",
     "type": "ocx:skill",
     "files": [
       "skills/my-skill/SKILL.md"
       // Remove: "skills/my-skill/references/old-doc.md"
     ]
   }
   ```

3. Rebuild and deploy:
   ```bash
   bun run build
   bunx wrangler deploy
   ```

---

## Building & Deploying

### Local Development

Test your registry locally:

```bash
# Build the registry
bun run build

# Start local server
bun run dev
```

Visit `http://localhost:8787` to test:
- `http://localhost:8787/index.json` - Registry index
- `http://localhost:8787/.well-known/ocx.json` - Discovery endpoint
- `http://localhost:8787/components/my-skill.json` - Component metadata

### Deploy to Cloudflare

```bash
# Build and deploy in one command
bun run deploy

# Or separately
bun run build
bunx wrangler deploy
```

Your registry will be live at: `https://registry.slurpyb.workers.dev`

### Deploy to Vercel

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Install Netlify CLI
bun add -g netlify-cli

# Deploy
netlify deploy --prod
```

---

## Advanced Patterns

### Using Rogue to Sync Skills

The `rogue` CLI can help you sync skills from your local collection:

```bash
# Publish a skill to OpenCode, Gemini, Codex, etc.
rogue skill ~/j/llms/skills/my-skill --to=opencode

# Sync all skills
rogue sync
```

### Bulk Import Skills

To import multiple skills at once:

```bash
# Copy all skills
for skill in deepinit mcp-builder codex gemini agent-browser; do
  cp -r ~/j/llms/skills/$skill ./files/skills/
done

# Generate registry entries (manual or script)
```

### Component Dependencies

Components can depend on other components:

```json
{
  "name": "advanced-skill",
  "type": "ocx:skill",
  "description": "Requires other skills",
  "dependencies": [
    "deepinit",           // Same registry
    "kdco/background-agents"  // External registry (namespace/component)
  ],
  "files": ["skills/advanced-skill/SKILL.md"]
}
```

### File Transformations

Use object notation for advanced file handling:

```json
{
  "name": "my-skill",
  "type": "ocx:skill",
  "files": [
    {
      "source": "skills/my-skill/SKILL.md",
      "target": ".claude/skills/my-skill.md",
      "transform": "minify"
    }
  ]
}
```

### Conditional Components

Use tags to organize components:

```json
{
  "name": "experimental-feature",
  "type": "ocx:skill",
  "description": "Experimental feature",
  "tags": ["experimental", "beta"],
  "files": ["skills/experimental-feature/SKILL.md"]
}
```

---

## Troubleshooting

### Build Fails

**Error: Source file not found**

```
error Build failed with 1 errors
  my-skill: Source file not found at /path/to/file
```

**Fix:** Verify the file exists and the path in `registry.jsonc` is correct:

```bash
# Check file exists
ls -la files/skills/my-skill/SKILL.md

# Verify path in registry.jsonc matches
cat registry.jsonc | grep -A 5 "my-skill"
```

**Error: Invalid JSON**

```
error Failed to parse registry.jsonc
```

**Fix:** Validate JSON syntax (JSONC allows comments and trailing commas):

```bash
# Use a JSON validator or check manually
cat registry.jsonc
```

### Deploy Fails

**Error: wrangler not found**

```
error: wrangler: command not found
```

**Fix:** Use `bunx` instead:

```bash
bunx wrangler deploy
```

**Error: Authentication required**

```
error: Not logged in to Cloudflare
```

**Fix:** Login to Cloudflare:

```bash
bunx wrangler login
```

### Component Not Found After Deploy

**Issue:** Component doesn't appear in registry after deployment.

**Fix:**

1. Verify build succeeded:
   ```bash
   ls -la dist/components/
   ```

2. Check component appears in `dist/index.json`:
   ```bash
   cat dist/index.json | grep "my-component"
   ```

3. Clear CDN cache (if using one):
   ```bash
   # Cloudflare Workers auto-updates
   # Vercel: redeploy
   # Netlify: redeploy
   ```

### Hidden Files Not Copied

**Issue:** `.claude-plugin` or other hidden directories not copied.

**Fix:** Explicitly copy hidden files:

```bash
cp -r ~/j/llms/skills/my-skill/.claude-plugin ./files/skills/my-skill/
```

Or use `rsync`:

```bash
rsync -av ~/j/llms/skills/my-skill/ ./files/skills/my-skill/
```

---

## Quick Reference

### Common Commands

```bash
# Build registry
bun run build

# Local development
bun run dev

# Deploy to Cloudflare
bunx wrangler deploy

# Check Cloudflare auth
bunx wrangler whoami

# View deployed registry
curl https://registry.slurpyb.workers.dev/index.json

# Install component from your registry
ocx add slurpyb/my-skill
```

### File Structure

```
ocx-slurpyb/
├── registry.jsonc              # Registry manifest (EDIT THIS)
├── files/                       # Component source files (ADD FILES HERE)
│   ├── skills/
│   │   └── my-skill/
│   │       ├── SKILL.md
│   │       ├── references/
│   │       ├── assets/
│   │       └── scripts/
│   ├── agents/
│   ├── plugins/
│   ├── commands/
│   ├── tools/
│   ├── bundles/
│   └── profiles/
├── dist/                        # Built output (GENERATED - DON'T EDIT)
│   ├── index.json
│   ├── .well-known/ocx.json
│   └── components/
├── wrangler.jsonc               # Cloudflare config
├── vercel.json                  # Vercel config
└── netlify.toml                 # Netlify config
```

### Component Template

```json
{
  "name": "component-name",
  "type": "ocx:skill|agent|plugin|command|tool|bundle|profile",
  "description": "Brief description",
  "version": "1.0.0",              // Optional
  "tags": ["tag1", "tag2"],        // Optional
  "dependencies": ["other-comp"],  // Optional
  "files": [
    "path/to/file.md"
  ]
}
```

---

## Next Steps

1. **Add more skills** from `~/j/llms/skills/`
2. **Create custom agents** for your workflow
3. **Build plugins** to extend functionality
4. **Share your registry** with others
5. **Contribute back** to the OCX ecosystem

---

**Questions?**
- OCX Documentation: https://github.com/kdcokenny/ocx
- Registry Protocol: https://raw.githubusercontent.com/kdcokenny/ocx/main/docs/REGISTRY_PROTOCOL.md
- OpenCode Reference: https://raw.githubusercontent.com/kdcokenny/ocx/main/docs/OPENCODE_REFERENCE.md
