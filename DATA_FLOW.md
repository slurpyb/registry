# OCX Slurpyb — Data Flow Diagram

## High-Level Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SOURCE DATA (files/)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  files/skills/3199/          files/agents/11/         files/commands/41/    │
│  ├── SKILL.md                ├── architect.md         ├── analyze.md        │
│  ├── skill-report.json       ├── code-reviewer.md     ├── build-fix.md      │
│  ├── scripts/                └── ...                  └── ...               │
│  └── ...                                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 1: INDEX BUILDING (build-skill-index.ts)           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Input:  files/skills/*/SKILL.md (frontmatter) + skill-report.json         │
│  Output: _registry/skill-index.json (55KB, 3,199 entries)                  │
│                                                                              │
│  Extracts:                                                                   │
│  ├── name                                                                    │
│  ├── description                                                             │
│  ├── category                                                                │
│  ├── tags[]                                                                  │
│  ├── capabilities[]                                                          │
│  └── author                                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│              PHASE 2: TAXONOMY CLASSIFICATION (classify-skills.ts)          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Input:  _registry/skill-index.json                                         │
│  LLM:    Qwen3-235B via Chutes API (50 skills/batch, 3 concurrent)         │
│  Output: _registry/taxonomy.json (64KB, 3,251 entries)                     │
│                                                                              │
│  Adds:                                                                       │
│  ├── domain (20+ options: web-dev, devops, ai-ml, security, data, etc.)    │
│  ├── subdomain (e.g., frontend, backend, fullstack for web-dev)            │
│  ├── specialty (1-3 word focus)                                             │
│  ├── tags[] (3-6 search tags)                                               │
│  ├── quality (1-5 score)                                                    │
│  ├── qualityReason (brief explanation)                                      │
│  └── bundleHints[] (suggested bundle membership)                            │
│                                                                              │
│  Quality Distribution:                                                       │
│  ├── 5/5: ~800 skills (25%) — highly specific, clear trigger               │
│  ├── 4/5: ~1,200 skills (37%) — good specificity                           │
│  ├── 3/5: ~900 skills (28%) — decent but generic                           │
│  ├── 2/5: ~300 skills (9%) — vague description                             │
│  └── 1/5: ~50 skills (1%) — placeholder/template                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│            PHASE 3: REGISTRY GENERATION (generate-registry.ts)              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Input:  files/skills/*/ (all files recursively)                           │
│  Output: registry.jsonc (~2MB, 3,199 skill components)                     │
│                                                                              │
│  For each skill:                                                             │
│  ├── name (sanitized: lowercase, hyphens only)                              │
│  ├── type: "skill"                                                          │
│  ├── description (from SKILL.md frontmatter)                                │
│  └── files[] (explicit { path, target } mappings)                           │
│      ├── skills/{name}/SKILL.md                                             │
│      ├── skills/{name}/skill-report.json                                    │
│      ├── skills/{name}/scripts/*                                            │
│      └── ... (all supporting files)                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│             PHASE 4: BUNDLE GENERATION (generate-bundles.ts)                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Input:  bundles.json + workflows.json (external source)                   │
│  Output: registry.jsonc (appends 11 bundle components)                     │
│                                                                              │
│  For each bundle:                                                            │
│  ├── name (sanitized)                                                       │
│  ├── type: "bundle"                                                         │
│  ├── description                                                             │
│  └── dependencies[] (resolved skill names)                                  │
│                                                                              │
│  Safe to re-run: skips bundles already present by name                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                  PHASE 5: BUILD & DEPLOY (bun run build)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Command: bunx ocx build . --out dist                                       │
│                                                                              │
│  Outputs:                                                                    │
│  ├── dist/index.json (943KB)                                                │
│  │   └── Full registry with all 3,251 components                            │
│  │                                                                           │
│  ├── dist/.well-known/ocx.json                                              │
│  │   └── Discovery endpoint: { "registry": "/index.json" }                  │
│  │                                                                           │
│  └── dist/components/3251/                                                  │
│      ├── {skill-name}.json (component manifest)                             │
│      ├── {skill-name}/ (component files)                                    │
│      │   ├── skills/{name}/SKILL.md                                         │
│      │   ├── skills/{name}/skill-report.json                                │
│      │   └── ... (all supporting files)                                     │
│      ├── {agent-name}.json                                                  │
│      ├── {command-name}.json                                                │
│      └── {bundle-name}.json                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT (bun run deploy)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Command: wrangler deploy                                                   │
│                                                                              │
│  Deploys to: Cloudflare Workers                                             │
│  URL: https://slurpyb.kdco.dev/                                             │
│                                                                              │
│  Endpoints:                                                                  │
│  ├── GET /.well-known/ocx.json                                              │
│  ├── GET /index.json                                                        │
│  ├── GET /components/{name}.json                                            │
│  └── GET /components/{name}/* (static files)                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Availability Matrix

| Data | Location | Format | Queryable | Served |
|------|----------|--------|-----------|--------|
| **Skill Index** | `_registry/skill-index.json` | JSON | ✅ (local) | ❌ |
| **Taxonomy** | `_registry/taxonomy.json` | JSON | ✅ (local) | ❌ |
| **Registry** | `dist/index.json` | JSON | ✅ (HTTP) | ✅ |
| **Component Manifests** | `dist/components/{name}.json` | JSON | ✅ (HTTP) | ✅ |
| **Skill Markdown** | `dist/components/{name}/skills/{name}/SKILL.md` | Markdown | ❌ | ✅ |
| **Skill Reports** | `dist/components/{name}/skills/{name}/skill-report.json` | JSON | ❌ | ✅ |
| **Agent Definitions** | `dist/components/{name}/agents/{name}.md` | Markdown | ❌ | ✅ |
| **Command Definitions** | `dist/components/{name}/commands/{name}.md` | Markdown | ❌ | ✅ |

---

## Query Capabilities

### ✅ Currently Supported
- List all components (from `dist/index.json`)
- Filter by component type (skill, agent, command, bundle)
- Get component metadata (name, description, files)
- Access component files (static HTTP)

### ❌ Not Supported
- Full-text search across descriptions
- Filter by domain/subdomain
- Filter by quality score
- Filter by tags
- Semantic search (embeddings)
- Dependency resolution
- Bundle membership queries

---

## Gaps & Opportunities

### Rich Data Exists But Not Exposed
1. **Taxonomy metadata** (`_registry/taxonomy.json`)
   - 3,251 skills classified into 20+ domains
   - Quality scores (1-5)
   - Bundle hints
   - **Status:** Processed but not served

2. **Skill capabilities** (in `skill-index.json`)
   - Extracted from skill reports
   - **Status:** Indexed but not queryable

3. **Skill reports** (in `dist/components/*/skill-report.json`)
   - Rich metadata (actual_capabilities, content analysis)
   - **Status:** Served as static files, not queryable

### Recommended Enhancements
1. **Expose taxonomy.json** in `dist/` for filtering
2. **Add search endpoint** (Cloudflare Worker) for full-text search
3. **Generate embeddings** for semantic search
4. **Build MCP server** for Claude Code integration
5. **Add dependency graph** for skill discovery

