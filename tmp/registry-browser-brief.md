# OCX Registry Browser & Profile Builder — Agent Brief

## What You're Building

An Astro site that lets users browse ~3,300 OCX components (skills, plugins, agents, commands, bundles), add them to a cart, and export the cart as an installable OCX profile (`ocx.jsonc`).

Think: a package registry browser (like npmjs.com) crossed with a shopping cart that outputs a config file instead of a checkout.

**Stack:** Astro with Content Collections, vanilla JS (or minimal framework for cart interactivity — islands architecture). No database. All data is static JSON loaded at build time.

---

## Data Sources

All paths are relative to the project root. You'll ingest these at build time.

### 1. `dist/index.json` — Component Registry Index

The canonical list of all components. This is the **source of truth** for what exists.

```jsonc
{
  "$schema": "https://ocx.kdco.dev/schemas/v2/registry.json",
  "name": "Slurpyb Registry",
  "version": "0.0.1",
  "author": "Jordan Sweeting",
  "components": [
    {
      "name": "accessibility-wcag",    // lowercase-hyphenated, unique
      "type": "skill",                  // "skill" | "plugin" | "agent" | "command" | "bundle" | "profile"
      "description": "Enforce WCAG 2.2 accessibility standards..."
    }
    // ~3,287 entries
  ]
}
```

**Component counts by type:** Almost all are `skill`. There are also ~13 agents, ~75 commands, 5+ plugins, 10 bundles, 0 profiles currently.

### 2. `_registry/taxonomy.json` — Domain/Quality Enrichment

Array of objects, one per component. **Not every component has an entry** — only those that have been classified.

```jsonc
{
  "name": "accessibility-wcag",       // joins to index.json by name
  "domain": "design",                  // broad category
  "subdomain": "accessibility",        // specific area within domain
  "specialty": "standards enforcement", // one-line focus description
  "tags": ["semantic-html", "color-contrast", "keyboard-nav", "aria", "frontend-code", "compliance"],
  "quality": 5,                        // 1-5 integer score
  "qualityReason": "Comprehensive and well-scoped",
  "bundleHints": ["accessibility-suite", "ui-compliance"]  // suggested bundle groupings
}
```

**Known domains** (will vary): `ai-ml`, `business`, `data`, `design`, `devops`, `gaming`, `languages`, `meta`, `productivity`, `science`, `security`, `testing`, `tools`, `web-development`

### 3. `_registry/skill-index.json` — Capabilities & Author

Array of objects. Sparser data — many entries have empty fields.

```jsonc
{
  "name": "1password-credential-lookup",
  "description": "...",
  "category": "security",              // may differ from taxonomy domain
  "tags": ["credentials", "1password", "authentication", "password-manager"],
  "capabilities": [
    "Find credentials by website URL such as github.com or twitter.com",
    "Filter credentials by username when multiple accounts exist for a domain",
    "Handle domain aliases such as x.com mapping to twitter.com"
  ],
  "author": "ClementWalter"            // empty string if unknown
}
```

### 4. `files/skills/*/skill-report.json` — Rich Skill Reports (~3,031 files)

The most detailed data source. One file per skill at `files/skills/{name}/skill-report.json`. **Not every component has one** — only skills, and not all skills have reports.

Top-level structure:

```jsonc
{
  "schema_version": "2.0",
  "meta": {
    "generated_at": "2026-01-16T21:02:17.483Z",
    "slug": "clementwalter-1password-credential-lookup",
    "source_url": "https://github.com/...",
    "source_ref": "main",
    "model": "claude",
    "analysis_version": "3.0.0",
    "source_type": "community",
    "content_hash": "9a352f...",
    "tree_hash": "93ae82..."
  },
  "skill": { /* see below */ },
  "security_audit": { /* see below */ },
  "content": { /* see below */ },
  "file_structure": [ /* directory tree */ ]
}
```

#### `skill` block:

```jsonc
{
  "name": "1password-credential-lookup",
  "description": "...",
  "summary": "...",
  "icon": "🔐",                        // emoji icon for the skill
  "version": "2.0.0",
  "author": "ClementWalter",
  "license": "MIT",
  "category": "security",
  "tags": ["credentials", "1password", "authentication", "password-manager"],
  "supported_tools": ["claude", "codex", "claude-code"],
  "risk_factors": ["external_commands", "filesystem"]
}
```

#### `security_audit` block:

```jsonc
{
  "risk_level": "low",                 // "low" | "medium" | "high" | "critical"
  "is_blocked": false,
  "safe_to_publish": true,
  "summary": "Legitimate credential lookup tool...",
  "risk_factor_evidence": [
    {
      "factor": "external_commands",
      "evidence": [{ "file": "scripts/find_credential.py", "line_start": 30, "line_end": 31 }]
    }
  ],
  "critical_findings": [],             // array of Finding objects
  "high_findings": [],
  "medium_findings": [],
  "low_findings": [
    {
      "title": "Credentials output via stdout",
      "description": "Script outputs credentials as JSON to stdout...",
      "locations": [{ "file": "scripts/find_credential.py", "line_start": 112, "line_end": 128 }]
    }
  ],
  "dangerous_patterns": [],
  "files_scanned": 3,
  "total_lines": 507,
  "audit_model": "claude",
  "audited_at": "2026-01-16T..."
}
```

#### `content` block (the richest section):

```jsonc
{
  "user_title": "Retrieve 1Password credentials by URL",
  "value_statement": "AI agents need secure access to credentials...",
  "seo_keywords": ["1password credential lookup", "Claude Code credentials", ...],
  "actual_capabilities": [
    "Find credentials by website URL such as github.com or twitter.com",
    "Filter credentials by username when multiple accounts exist for a domain",
    // ...
  ],
  "limitations": [
    "Requires 1Password CLI installed and authenticated with op signin",
    // ...
  ],
  "use_cases": [
    {
      "target_user": "Developers",
      "title": "CI/CD Authentication",
      "description": "Retrieve deployment credentials for automated pipelines..."
    }
  ],
  "prompt_templates": [
    {
      "title": "Basic Login",
      "scenario": "Get credentials for a website",
      "prompt": "Find credentials for github.com"
    }
  ],
  "output_examples": [
    {
      "input": "Find credentials for github.com with username claude",
      "output": ["Found credential: GitHub (claude account)", "Username: claude", ...]
    }
  ],
  "best_practices": ["Use URL-based lookup with find_credential instead of guessing..."],
  "anti_patterns": ["Using item_name parameter with URLs or guessed names..."],
  "faq": [
    { "question": "Which AI tools support this skill?", "answer": "Compatible with Claude, Codex..." }
  ]
}
```

### 5. `bundles.jsonc` — Curated Bundle Definitions

Pre-made component collections. These are components themselves (type `bundle`) but also serve as curated "starter kits" you might want to surface prominently.

```jsonc
{
  "components": [
    {
      "name": "workflow-ship-saas-mvp",
      "type": "bundle",
      "description": "End-to-end workflow to scope, build, test, and ship a SaaS MVP quickly.",
      "dependencies": ["brainstorming", "concise-planning", "writing-plans", ...]
    }
  ]
}
```

### 6. `dist/components/{name}.json` — Per-Component Version Data

Each component has a JSON file with versioned metadata and file listings:

```jsonc
{
  "name": "12-factor-app",
  "versions": {
    "1.0.0": {
      "name": "12-factor-app",
      "type": "skill",
      "description": "...",
      "files": [
        { "path": "skills/12-factor-app/SKILL.md", "target": "skills/12-factor-app/SKILL.md" },
        { "path": "skills/12-factor-app/metadata.json", "target": "skills/12-factor-app/metadata.json" }
      ],
      "dependencies": []
    }
  },
  "dist-tags": { "latest": "1.0.0" }
}
```

### 7. `dist/components/{name}/` — Actual Component Files

The files referenced above live here. Skills have `SKILL.md`, agents have `.md` files, plugins have `opencode.json`, commands have `.md` files with YAML frontmatter.

---

## Non-Skill Component Formats

### Agents (`files/agents/*.md`)
Markdown with YAML frontmatter:
```yaml
---
description: Software architecture specialist...
model: opus
---
```
Body is the agent's system prompt.

### Commands (`files/commands/*.md`)
Markdown with YAML frontmatter:
```yaml
---
description: Restate requirements, assess risks, and create step-by-step implementation plan...
---
```
Body is the command instructions.

### Plugins (`files/plugins/*/opencode.json`)
JSON config files that define tool permissions, MCP servers, etc:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": { "read": "allow", "write": "allow", ... },
  "tools": { "read": true, "write": true, ... }
}
```

---

## Output Format: OCX Profile

The cart exports an `ocx.jsonc` file. This is the profile the user will install.

```jsonc
{
  // Model configuration
  "model": "claude-sonnet-4",
  "small_model": "claude-haiku-4",

  // Registries this profile can access
  "registries": {
    "slurpyb": { "url": "https://registry.slurpyb.workers.dev" }
  },

  // MCP server definitions (from plugins or user-added)
  "mcp": {
    "server-name": {
      "type": "remote",
      "url": "https://api.example.com/mcp"
    }
  },

  // Permissions
  "permission": {
    "bash": { "npm test": "allow", "rm -rf *": "deny" },
    "edit": { "src/**": "allow" }
  },

  // Include/exclude instruction patterns
  "include": ["**/*.md"],
  "exclude": ["**/node_modules/**"]
}
```

The profile should also generate a companion registry entry for publishing:

```jsonc
{
  "name": "my-custom-profile",
  "type": "ocx:profile",
  "description": "Generated profile with N skills, N agents...",
  "files": ["profiles/my-custom-profile/ocx.jsonc"]
}
```

---

## Content Collections Strategy

### Recommended Collections

**`components`** — The main collection. One entry per component, merging all data sources by `name`.

Schema should flatten everything into one unified shape:

```ts
// src/content/config.ts
import { z, defineCollection } from 'astro:content';

const components = defineCollection({
  type: 'data',   // JSON, not markdown
  schema: z.object({
    // From index.json
    name: z.string(),
    type: z.enum(['skill', 'plugin', 'agent', 'command', 'bundle', 'profile']),
    description: z.string(),

    // From taxonomy.json (optional — not all components have these)
    domain: z.string().optional(),
    subdomain: z.string().optional(),
    specialty: z.string().optional(),
    quality: z.number().min(1).max(5).optional(),
    qualityReason: z.string().optional(),
    tags: z.array(z.string()).default([]),
    bundleHints: z.array(z.string()).default([]),

    // From skill-index.json
    capabilities: z.array(z.string()).default([]),
    author: z.string().optional(),

    // From skill-report.json (optional — only skills with reports)
    icon: z.string().optional(),
    version: z.string().optional(),
    license: z.string().optional(),
    supportedTools: z.array(z.string()).default([]),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    safeToPublish: z.boolean().optional(),
    securitySummary: z.string().optional(),
    valueStatement: z.string().optional(),
    limitations: z.array(z.string()).default([]),
    useCases: z.array(z.object({
      targetUser: z.string(),
      title: z.string(),
      description: z.string(),
    })).default([]),
    promptTemplates: z.array(z.object({
      title: z.string(),
      scenario: z.string(),
      prompt: z.string(),
    })).default([]),
    bestPractices: z.array(z.string()).default([]),
    antiPatterns: z.array(z.string()).default([]),
    faq: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).default([]),
    seoKeywords: z.array(z.string()).default([]),

    // Bundle-specific
    dependencies: z.array(z.string()).default([]),
  }),
});

const bundles = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    description: z.string(),
    dependencies: z.array(z.string()),
  }),
});

export const collections = { components, bundles };
```

### Build-Time Data Merge Script

You'll need a prebuild script (run before `astro build`) that:

1. Reads `dist/index.json` for the component list
2. For each component, looks up enrichment from `_registry/taxonomy.json`, `_registry/skill-index.json`, and `files/skills/{name}/skill-report.json`
3. Merges into a single JSON file per component at `src/content/components/{name}.json`
4. Reads `bundles.jsonc` and writes to `src/content/bundles/{name}.json`

**Priority when data conflicts (same field from multiple sources):**
- `skill-report.json` > `taxonomy.json` > `skill-index.json` > `index.json`
- For `tags`: union all sources, deduplicate
- For `capabilities`: prefer `skill-report.content.actual_capabilities` over `skill-index.capabilities`
- For `author`: prefer `skill-report.skill.author` over `skill-index.author`

---

## Gotchas

1. **3,287 components = 3,287 JSON files in content collection.** Astro handles this fine but build times will be noticeable. Consider pagination for the browse page (100 per page) rather than rendering all at once.

2. **Not every component has enrichment data.** Many entries will only have `name`, `type`, `description` from `index.json`. Your UI must gracefully handle missing taxonomy, missing report, etc. Don't render empty sections.

3. **The `type` field in `index.json` is bare (`"skill"`)** but in the OCX schema/registry it's prefixed (`"ocx:skill"`). Normalize to bare form in content collections.

4. **Skill reports are ONLY for skills.** Agents, commands, plugins, and bundles don't have `skill-report.json` files. Don't try to load them.

5. **Component names can start with numbers** (e.g., `12-factor-app`, `3d-games`, `37signals-rails`). Make sure your file naming and routing handles this.

6. **Some descriptions are in non-English languages** (Spanish, Chinese, Japanese, Korean). Don't assume English-only.

7. **Some descriptions are truncated or placeholder** (literally `"|"` or `">"` or `">-"`). Filter these out or flag as "no description available."

8. **The `invalid-name` component exists** as a test fixture with an intentionally broken name. Exclude it.

9. **Bundle dependencies reference component names** that should exist in the registry. Use these for the "add entire bundle to cart" feature — resolve all deps and add them.

10. **Skill reports can be large** (some are 10KB+). Don't inline full report data on the browse/list page. Load it on the detail page only.

11. **`dist/components/` has ~6,700 entries** (JSON + directory per component). You probably don't need this at build time since the content collection merge script handles everything. But it's available for file listings if you want to show "what files does this component install."

12. **`quality` is 1-5 but in practice almost everything is 4 or 5.** The distribution is heavily skewed. Consider showing it but don't rely on it as a primary sort differentiator without additional signals.

---

## Pages & Features

### Browse Page (`/browse` or `/`)
- Filterable grid/list of all components
- Filter by: type, domain, quality, risk level, tags
- Search: name, description, tags, specialty
- Sort: alphabetical, quality, recently added
- Each card shows: icon, name, type badge, domain/subdomain, quality stars, risk dot, description truncated to 2 lines, "Add to cart" button
- Pagination or virtual scroll (3,287 items)

### Component Detail Page (`/components/[name]`)
- Full component information from merged data
- Sections (only render if data exists): description, value statement, security audit, capabilities, limitations, use cases, prompt templates, best practices, anti-patterns, FAQ, tags, supported tools, risk factors, bundle hints, file listing
- "Add to cart" / "Remove from cart" button
- If bundle: show all dependencies with individual add buttons + "Add entire bundle" button
- Link to source if `meta.source_url` exists

### Cart / Profile Builder (persistent sidebar or `/cart`)
- List of selected components grouped by type
- Remove individual items
- "Add bundle" quick-add (shows curated bundles from `bundles.jsonc`, click to add all deps)
- Profile configuration panel:
  - Profile name (becomes the filename)
  - Model selection (text input or preset dropdown)
  - Registry URL (default: `https://registry.slurpyb.workers.dev`)
- Export button → generates and downloads `ocx.jsonc`
- Export button → generates registry entry JSON for publishing
- Cart persists across page navigations (localStorage)
- Show count badge on cart icon

### Bundle Gallery (`/bundles`)
- Show the curated bundles from `bundles.jsonc`
- Each bundle card shows: name, description, dependency count, "View components" expand, "Add all to cart"
- Clicking a bundle expands to show all its component dependencies with their details

---

## Cart → Profile Export Logic

When the user clicks "Export Profile," build the `ocx.jsonc`:

```ts
function buildProfile(cart: CartItem[], config: ProfileConfig): string {
  const profile: Record<string, any> = {};

  if (config.model) profile.model = config.model;
  if (config.smallModel) profile.small_model = config.smallModel;

  profile.registries = {
    slurpyb: { url: config.registryUrl || "https://registry.slurpyb.workers.dev" }
  };

  // Components in the cart become the install manifest
  // Group by type for the description
  const byType = groupBy(cart, 'type');
  const summary = Object.entries(byType)
    .map(([type, items]) => `${items.length} ${type}${items.length > 1 ? 's' : ''}`)
    .join(', ');

  // The profile itself doesn't list individual components —
  // that's the registry entry. The profile is the CONFIG.
  // The registry entry references the profile file.

  return JSON.stringify(profile, null, 2);
}

function buildRegistryEntry(cart: CartItem[], profileName: string): string {
  return JSON.stringify({
    name: profileName,
    type: "profile",
    description: `Custom profile with ${cart.length} components`,
    // The actual component list goes into a bundle dependency
    // that the profile references
    dependencies: cart.map(c => c.name),
  }, null, 2);
}
```

Actually — the cleaner approach is to generate **both** a profile (config) and a companion bundle (component list):

1. **Profile** (`profiles/{name}/ocx.jsonc`) — model, MCP, permissions, registry config
2. **Bundle** (`bundles/{name}.json`) — the list of selected components as dependencies

This way the user gets a config file AND a reproducible component manifest.

---

## Tips

- **Use Astro's `getCollection()` for filtering/sorting** — it's fast and type-safe with your schema.
- **Cart state in a Nanostores store** works well with Astro islands. Or plain localStorage + custom events.
- **For the browse page**, consider `getStaticPaths()` with pagination: `/browse/1`, `/browse/2`, etc. With 3,287 components at 50 per page = ~66 pages.
- **Color-code by risk level**: green (low), yellow (medium), red (high/critical). Most are "low."
- **Show security audit prominently** — it's the most unique data point. No other registry has per-component security audits.
- **Bundle hints from taxonomy** can power a "Similar components" or "Often used with" section on detail pages.
- **SEO keywords from skill reports** make excellent `<meta>` tags for component detail pages.
- **The `icon` field** from skill reports is an emoji. Use it in cards and page titles. Fallback to a generic icon per type if missing.
- **`supported_tools`** tells users which AI tools work with a skill (claude, codex, claude-code, cursor, etc.). Surface this — it's a key filter for users.

---

## File Structure Suggestion

```
src/
├── content/
│   ├── config.ts              # Collection schemas
│   ├── components/            # Generated: one JSON per component
│   │   ├── 12-factor-app.json
│   │   ├── accessibility-wcag.json
│   │   └── ... (~3,287 files)
│   └── bundles/               # Generated: one JSON per bundle
│       ├── core-dev.json
│       └── ...
├── pages/
│   ├── index.astro            # Landing / browse
│   ├── browse/
│   │   └── [...page].astro    # Paginated browse with filters
│   ├── components/
│   │   └── [name].astro       # Component detail
│   ├── bundles/
│   │   └── index.astro        # Bundle gallery
│   └── cart.astro             # Full cart / profile builder
├── components/
│   ├── ComponentCard.astro    # Browse list item
│   ├── FilterBar.astro        # Type/domain/quality filters
│   ├── SearchBar.astro        # Client-side search (island)
│   ├── CartButton.tsx         # Add-to-cart island (React/Preact/Svelte)
│   ├── CartSidebar.tsx        # Persistent cart island
│   ├── ProfileExporter.tsx    # Export config island
│   ├── SecurityBadge.astro    # Risk level indicator
│   └── QualityStars.astro     # Star rating display
├── layouts/
│   └── Base.astro
├── lib/
│   ├── cart.ts                # Cart store (nanostores or localStorage wrapper)
│   └── export.ts              # Profile/bundle generation logic
└── scripts/
    └── merge-data.ts          # Prebuild: merge all sources → content collection JSONs
```

---

## Summary

You have 4 data sources to merge by component `name` into one content collection. The site is a browse → detail → cart → export flow. The export produces an OCX profile config file + a bundle manifest. Astro content collections handle the static data perfectly — just write the merge script and the rest is standard Astro pages with a few interactive islands for search, cart, and export.
