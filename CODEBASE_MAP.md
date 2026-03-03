# OCX Slurpyb Registry — Codebase Map

**Last Updated:** March 3, 2026  
**Total Components:** 3,251 (3,199 skills + 11 bundles + 11 agents + 41 commands)  
**Taxonomy:** 3,251 skills classified into 20+ domains with quality scores

---

## 1. Source Data Structure

### Directory Layout
```
files/
├── skills/              # 3,199 skill directories
│   ├── 00-andruia-consultant/
│   ├── 1password-credential-lookup/
│   └── ... (3,199 total)
├── agents/              # 11 agent definitions (imported)
│   ├── architect.md
│   ├── code-reviewer.md
│   └── ... (11 total)
└── commands/            # 41 command definitions (imported)
    ├── analyze.md
    ├── build-fix.md
    └── ... (41 total)

_registry/              # Processed metadata (NOT in dist)
├── skill-index.json    # 3,199 skills: name, description, category, tags, capabilities
└── taxonomy.json       # 3,199 skills: domain, subdomain, specialty, quality, bundleHints
```

### Key Files
| File | Purpose | Size | Format |
|------|---------|------|--------|
| `_registry/skill-index.json` | Lightweight index for classification | 55KB | JSON array |
| `_registry/taxonomy.json` | Rich taxonomy with quality scores | 64KB | JSON array |
| `registry.jsonc` | OCX registry manifest (auto-generated) | ~2MB | JSONC |
| `dist/index.json` | Served registry (built output) | ~943KB | JSON |

---

## 2. Data Flow: Source → Build → Served

### Phase 1: Index Building
```
files/skills/*/SKILL.md (frontmatter)
    ↓
scripts/build-skill-index.ts
    ↓
_registry/skill-index.json
    └─ Extracts: name, description, category, tags, capabilities, author
```

**Script:** `scripts/build-skill-index.ts`
- Scans all skill directories
- Reads `skill-report.json` (if exists) OR `SKILL.md` frontmatter
- Outputs lightweight index for embedding/classification
- **Output:** `_registry/skill-index.json` (55KB, 3,199 entries)

---

### Phase 2: Taxonomy Classification
```
_registry/skill-index.json
    ↓
scripts/classify-skills.ts (Qwen3-235B via Chutes API)
    ↓
_registry/taxonomy.json
    └─ Adds: domain, subdomain, specialty, quality (1-5), bundleHints
```

**Script:** `scripts/classify-skills.ts`
- Batch-classifies skills using LLM (50 skills/batch, 3 concurrent)
- Uses 20+ domain taxonomy (web-dev, devops, ai-ml, security, data, etc.)
- Assigns quality scores (5=highly specific, 1=placeholder)
- Suggests bundle membership via `bundleHints`
- **Output:** `_registry/taxonomy.json` (64KB, 3,251 entries)
- **Resume support:** `--resume` flag skips already-classified skills

---

### Phase 3: Registry Generation
```
files/skills/*/SKILL.md (all files)
    ↓
scripts/generate-registry.ts
    ↓
registry.jsonc
    └─ Builds: name, type, description, files[] with explicit source→target mappings
```

**Script:** `scripts/generate-registry.ts`
- Scans all skill directories recursively
- Extracts description from SKILL.md frontmatter
- Collects ALL files (including subdirectories)
- Creates explicit `{ path, target }` mappings for each file
- Sanitizes names (lowercase, hyphens only)
- **Output:** `registry.jsonc` (~2MB, 3,199 skill components)

---

### Phase 4: Bundle Generation
```
bundles.json + workflows.json (external source)
    ↓
scripts/generate-bundles.ts
    ↓
registry.jsonc (appends bundle components)
    └─ Adds: 11 bundle components with dependencies
```

**Script:** `scripts/generate-bundles.ts`
- Reads bundles from `antigravity-awesome-skills` repo
- Resolves skill names to registry names (sanitization)
- Appends bundle components to registry.jsonc
- Safe to re-run: skips bundles already present
- **Output:** Appends to `registry.jsonc` (11 bundle components)

---

### Phase 5: Build & Deploy
```
registry.jsonc
    ↓
bun run build (bunx ocx build . --out dist)
    ↓
dist/
├── index.json                    # Full registry (943KB)
├── .well-known/ocx.json          # Discovery endpoint
└── components/
    ├── {skill-name}.json         # Individual component manifests
    ├── {skill-name}/             # Component files (SKILL.md, scripts, etc.)
    ├── {agent-name}.json
    ├── {command-name}.json
    └── ... (3,251 total)
```

**Build Command:** `bun run build`
- Runs OCX CLI: `bunx ocx build . --out dist`
- Generates `dist/index.json` (full registry)
- Creates individual `.json` manifests for each component
- Copies all component files to `dist/components/{name}/`
- **Output:** `dist/` directory (ready for deployment)

---

## 3. What's Currently Queryable vs Static

### ✅ Queryable (Processed Metadata)
| Data | Location | Format | Queryable By |
|------|----------|--------|--------------|
| **Skill Index** | `_registry/skill-index.json` | JSON array | name, description, tags, capabilities |
| **Taxonomy** | `_registry/taxonomy.json` | JSON array | domain, subdomain, specialty, quality, bundleHints |
| **Registry** | `dist/index.json` | JSON array | component name, type, description |

**Current Query Capabilities:**
- ✅ List all skills/agents/commands/bundles
- ✅ Filter by component type
- ✅ Search by name (exact match)
- ✅ Access component metadata (description, files)
- ❌ Full-text search across descriptions
- ❌ Filter by domain/subdomain
- ❌ Filter by quality score
- ❌ Filter by tags
- ❌ Semantic search (embeddings not exposed)

### ❌ Static Files (Not Queryable)
| Data | Location | Format | Status |
|------|----------|--------|--------|
| **Skill Markdown** | `dist/components/{name}/skills/{name}/SKILL.md` | Markdown | Served as static files |
| **Skill Reports** | `dist/components/{name}/skills/{name}/skill-report.json` | JSON | Served as static files |
| **Agent Definitions** | `dist/components/{name}/agents/{name}.md` | Markdown | Served as static files |
| **Command Definitions** | `dist/components/{name}/commands/{name}.md` | Markdown | Served as static files |

---

## 4. Taxonomy Structure

### Domains (20+)
```
web-development
├── frontend (react, vue, angular, svelte, astro, css, html, responsive, accessibility, design-systems, animations)
├── backend (node, express, fastapi, django, rails, graphql, rest, websockets, serverless)
├── fullstack (nextjs, nuxt, remix, sveltekit, full-stack-patterns)
└── cms (wordpress, contentful, sanity, strapi, headless-cms)

devops
├── ci-cd (github-actions, jenkins, circleci, deployment, pipelines)
├── containers (docker, kubernetes, helm, orchestration)
├── cloud (aws, azure, gcp, cloudflare, vercel, netlify)
├── monitoring (observability, logging, alerting, apm, tracing)
└── iac (terraform, pulumi, bicep, cloudformation)

ai-ml
├── agents (multi-agent, agent-design, orchestration, memory-systems, tool-use)
├── llm (prompting, fine-tuning, evaluation, rag, embeddings, context-engineering)
├── ml-ops (training, deployment, model-serving, pipelines)
├── computer-vision (image, video, 3d, labeling)
└── nlp (text-processing, translation, summarization, search)

security
├── appsec (owasp, xss, injection, authentication, authorization)
├── pentesting (offensive, bug-bounty, reconnaissance, exploitation)
├── compliance (gdpr, hipaa, soc2, audit, policy)
├── cryptography (encryption, signing, key-management)
└── devsecops (sast, dast, dependency-scanning, container-security)

data
├── databases (postgresql, mysql, mongodb, redis, sqlite, supabase, prisma, drizzle)
├── analytics (bi, dashboards, metrics, tracking)
├── pipelines (etl, streaming, batch, airflow, dbt)
└── visualization (charts, d3, dashboards, data-storytelling)

mobile
├── ios (swift, swiftui, xcode)
├── android (kotlin, jetpack-compose)
└── cross-platform (react-native, flutter, expo, tamagui)

languages
├── python (patterns, packaging, testing, async, typing)
├── typescript (patterns, types, tooling)
├── rust (patterns, wasm, systems)
├── go (patterns, concurrency)
├── cpp (patterns, testing, systems)
└── other (ruby, elixir, clojure, delphi, r, bash, shell)

productivity
├── project-management (agile, sprints, issues, kanban, planning)
├── documentation (docs-generation, readme, api-docs, changelogs)
├── communication (email, slack, notifications, reports)
└── workflow (automation, cli-tools, scripts, git-workflow)

design
├── ui-ux (wireframes, prototyping, user-research, ux-audit)
├── branding (typography, color-theory, brand-guidelines, logos)
├── accessibility (wcag, aria, screen-readers, contrast)
└── design-systems (tokens, components, patterns, style-guides)

testing
├── unit (jest, vitest, pytest, testing-patterns)
├── e2e (playwright, cypress, selenium)
├── performance (load-testing, benchmarking, optimization)
└── quality (code-review, linting, static-analysis, refactoring)

gaming
├── game-dev (unity, unreal, godot, bevy, threejs)
└── game-design (mechanics, narratives, level-design)

business
├── marketing (seo, content-marketing, social-media, ads, copywriting)
├── sales (crm, outreach, lead-generation)
├── finance (accounting, trading, fintech, billing)
└── legal (contracts, compliance, ip)

science
├── bioinformatics (genomics, proteomics, phylogenetics, databases)
├── chemistry (molecular, drug-discovery, cheminformatics)
└── research (papers, citations, data-analysis)

tools
├── browser (automation, scraping, extensions, devtools)
├── cli (terminal, shell, command-line)
├── search (web-search, code-search, documentation-lookup)
├── editors (vscode, vim, cursor, ide-integration)
└── mcp (mcp-servers, mcp-tools, integrations)

meta
├── agent-config (claude-code, opencode, codex, gemini, copilot, hooks, commands, skills-about-skills)
└── learning (tutorials, best-practices, patterns, onboarding)
```

### Quality Scores
- **5:** Highly specific, clear trigger, actionable instructions
- **4:** Good specificity, useful description
- **3:** Decent but generic or overlapping with common skills
- **2:** Vague description, unclear purpose
- **1:** Placeholder, template, or joke/game skill

### Distribution (as of Mar 3, 2026)
```
Quality 5: ~800 skills (25%)
Quality 4: ~1,200 skills (37%)
Quality 3: ~900 skills (28%)
Quality 2: ~300 skills (9%)
Quality 1: ~50 skills (1%)
```

---

## 5. Build Scripts Reference

### Core Scripts
| Script | Input | Output | Purpose |
|--------|-------|--------|---------|
| `build-skill-index.ts` | `files/skills/*/SKILL.md` | `_registry/skill-index.json` | Extract lightweight index |
| `classify-skills.ts` | `_registry/skill-index.json` | `_registry/taxonomy.json` | LLM-based classification |
| `generate-registry.ts` | `files/skills/*/` | `registry.jsonc` | Generate OCX registry |
| `generate-bundles.ts` | `bundles.json`, `workflows.json` | `registry.jsonc` (append) | Add bundle components |
| `import-agents.ts` | External agents | `files/agents/` | Import agent definitions |
| `import-commands.ts` | External commands | `files/commands/` | Import command definitions |
| `import-skills.ts` | External skills | `files/skills/` | Import skill definitions |

### Running the Build Pipeline
```bash
# 1. Build skill index (extract metadata)
bun scripts/build-skill-index.ts

# 2. Classify skills (LLM-based taxonomy)
CHUTES_API_TOKEN=... bun scripts/classify-skills.ts

# 3. Generate registry (OCX manifest)
bun scripts/generate-registry.ts

# 4. Generate bundles (append bundle components)
bun scripts/generate-bundles.ts

# 5. Build & deploy
bun run build
bun run deploy
```

---

## 6. Gaps & Opportunities

### Rich Data Exists But Not Exposed
1. **Taxonomy metadata** (`_registry/taxonomy.json`)
   - Domain/subdomain classification
   - Quality scores
   - Bundle hints
   - **Status:** Processed but not served in `dist/`

2. **Skill capabilities** (in `skill-index.json`)
   - Extracted from skill reports
   - **Status:** Indexed but not queryable via API

3. **Skill reports** (in `dist/components/*/skill-report.json`)
   - Rich metadata (actual_capabilities, content analysis)
   - **Status:** Served as static files, not queryable

### Missing Query Capabilities
- ❌ Full-text search across skill descriptions
- ❌ Filter by domain/subdomain
- ❌ Filter by quality score
- ❌ Filter by tags
- ❌ Semantic search (embeddings)
- ❌ Dependency resolution (which skills depend on which)
- ❌ Bundle membership queries
- ❌ Skill discovery by capability

### Potential Enhancements
1. **Expose taxonomy in dist/**
   - Serve `_registry/taxonomy.json` as `dist/taxonomy.json`
   - Enable domain/subdomain filtering

2. **Add search endpoint**
   - Cloudflare Worker endpoint: `/api/search?q=...&domain=...&quality=...`
   - Full-text search across descriptions
   - Filter by taxonomy metadata

3. **Add embeddings**
   - Generate embeddings for skill descriptions
   - Enable semantic search
   - Serve as `dist/embeddings.json`

4. **Add dependency graph**
   - Track skill dependencies (from bundle hints)
   - Serve as `dist/graph.json`
   - Enable "skills that depend on X" queries

5. **Add MCP server**
   - Expose registry as MCP server
   - Enable Claude Code integration
   - Query skills from within Claude

---

## 7. File Organization Summary

### Source Files (Committed)
```
files/
├── skills/3199/          # Skill definitions (SKILL.md + supporting files)
├── agents/11/            # Agent definitions (imported)
└── commands/41/          # Command definitions (imported)

_registry/               # Processed metadata (NOT committed to dist)
├── skill-index.json     # Lightweight index
└── taxonomy.json        # Rich taxonomy

scripts/                 # Build pipeline
├── build-skill-index.ts
├── classify-skills.ts
├── generate-registry.ts
├── generate-bundles.ts
├── import-agents.ts
├── import-commands.ts
└── import-skills.ts

registry.jsonc          # OCX manifest (auto-generated)
```

### Built Output (dist/)
```
dist/
├── index.json                           # Full registry (943KB)
├── .well-known/ocx.json                 # Discovery endpoint
└── components/3251/
    ├── {skill-name}.json                # Component manifest
    ├── {skill-name}/                    # Component files
    │   ├── skills/{name}/SKILL.md
    │   ├── skills/{name}/skill-report.json
    │   └── ... (all supporting files)
    ├── {agent-name}.json
    ├── {command-name}.json
    └── {bundle-name}.json
```

### NOT Served (Internal Only)
```
_registry/
├── skill-index.json     # Lightweight index (used for classification)
└── taxonomy.json        # Rich taxonomy (used for discovery, not exposed)
```

---

## 8. Key Insights

### What Works Well
✅ **Comprehensive skill coverage:** 3,199 skills across 20+ domains  
✅ **Rich metadata:** Taxonomy, quality scores, bundle hints  
✅ **Automated classification:** LLM-based domain assignment  
✅ **Modular build pipeline:** Each step is independent and re-runnable  
✅ **Safe bundle generation:** Idempotent, skips duplicates  

### What's Missing
❌ **Query API:** No way to search/filter skills at runtime  
❌ **Taxonomy exposure:** Rich metadata exists but isn't served  
❌ **Semantic search:** No embeddings or similarity search  
❌ **Dependency resolution:** No way to find related skills  
❌ **MCP integration:** No server for Claude Code integration  

### Recommended Next Steps
1. **Expose taxonomy.json** in `dist/` for filtering by domain/quality
2. **Add search endpoint** (Cloudflare Worker) for full-text search
3. **Generate embeddings** for semantic search
4. **Build MCP server** for Claude Code integration
5. **Add dependency graph** for skill discovery

---

## 9. Quick Reference

### Build Commands
```bash
# Full rebuild
bun scripts/build-skill-index.ts && \
CHUTES_API_TOKEN=... bun scripts/classify-skills.ts && \
bun scripts/generate-registry.ts && \
bun scripts/generate-bundles.ts && \
bun run build

# Deploy
bun run deploy

# Dry run (preview)
bun scripts/generate-registry.ts --dry-run
bun scripts/classify-skills.ts --dry-run
bun scripts/generate-bundles.ts --dry-run

# Resume classification (skip already-classified)
CHUTES_API_TOKEN=... bun scripts/classify-skills.ts --resume
```

### File Locations
- **Source skills:** `/Users/jordan/j/src/ocx-slurpyb/files/skills/`
- **Skill index:** `/Users/jordan/j/src/ocx-slurpyb/_registry/skill-index.json`
- **Taxonomy:** `/Users/jordan/j/src/ocx-slurpyb/_registry/taxonomy.json`
- **Registry manifest:** `/Users/jordan/j/src/ocx-slurpyb/registry.jsonc`
- **Built output:** `/Users/jordan/j/src/ocx-slurpyb/dist/`
- **Deployed URL:** https://slurpyb.kdco.dev/ (Cloudflare Workers)

### Component Counts
- **Skills:** 3,199
- **Bundles:** 11
- **Agents:** 11
- **Commands:** 41
- **Total:** 3,251

---

*Generated by Explorer — Codebase Navigation Specialist*
