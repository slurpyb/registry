# OCX Slurpyb — Codebase Index

**Quick Links to Documentation:**

## 📖 Main Documentation

1. **[CODEBASE_MAP.md](./CODEBASE_MAP.md)** — Comprehensive Overview
   - Complete data flow explanation
   - Taxonomy structure (20+ domains)
   - Build scripts reference
   - Gaps & opportunities
   - 9 detailed sections

2. **[DATA_FLOW.md](./DATA_FLOW.md)** — Visual Pipeline Diagram
   - ASCII art data flow (5 phases)
   - Data availability matrix
   - Query capabilities
   - Recommended enhancements

3. **[FILES_REFERENCE.md](./FILES_REFERENCE.md)** — File Locations & Structure
   - Directory tree with descriptions
   - Absolute file paths
   - File sizes & component counts
   - Build pipeline commands
   - Deployment targets

## 🎯 Quick Facts

| Metric | Value |
|--------|-------|
| **Total Components** | 3,251 |
| **Skills** | 3,199 |
| **Bundles** | 11 |
| **Agents** | 11 |
| **Commands** | 41 |
| **Taxonomy Domains** | 20+ |
| **Quality Scores** | 1-5 |

## 🔄 Data Pipeline (5 Phases)

```
Source Files
    ↓
Phase 1: Index Building (build-skill-index.ts)
    ↓
Phase 2: Taxonomy Classification (classify-skills.ts)
    ↓
Phase 3: Registry Generation (generate-registry.ts)
    ↓
Phase 4: Bundle Generation (generate-bundles.ts)
    ↓
Phase 5: Build & Deploy (bun run build)
    ↓
Deployed Registry (https://slurpyb.kdco.dev/)
```

## 📁 Key Directories

| Path | Purpose | Files |
|------|---------|-------|
| `files/skills/` | Skill definitions | 3,199 |
| `files/agents/` | Agent definitions | 11 |
| `files/commands/` | Command definitions | 41 |
| `_registry/` | Processed metadata | 2 |
| `scripts/` | Build pipeline | 9 |
| `dist/` | Built output | 3,251+ |

## 🔍 What's Queryable

✅ **Currently Supported:**
- List all components
- Filter by type (skill, agent, command, bundle)
- Get component metadata
- Access component files

❌ **Not Supported (But Data Exists!):**
- Full-text search
- Filter by domain/subdomain
- Filter by quality score
- Filter by tags
- Semantic search
- Dependency resolution

## 🚀 Build Commands

```bash
# Full rebuild
bun scripts/build-skill-index.ts && \
CHUTES_API_TOKEN=... bun scripts/classify-skills.ts && \
bun scripts/generate-registry.ts && \
bun scripts/generate-bundles.ts && \
bun run build

# Deploy
bun run deploy

# Individual steps
bun scripts/build-skill-index.ts
CHUTES_API_TOKEN=... bun scripts/classify-skills.ts --resume
bun scripts/generate-registry.ts
bun scripts/generate-bundles.ts
bun run build
bun run deploy
```

## 📊 File Sizes

| File | Size | Entries |
|------|------|---------|
| `_registry/skill-index.json` | 55 KB | 3,199 |
| `_registry/taxonomy.json` | 64 KB | 3,251 |
| `registry.jsonc` | ~2 MB | 3,251 |
| `dist/index.json` | 943 KB | 3,251 |
| `dist/components/` | ~500 MB | 3,251 |

## 🎓 Understanding the System

### For Beginners
1. Start with **DATA_FLOW.md** for visual overview
2. Read **FILES_REFERENCE.md** for file locations
3. Explore `files/skills/` to see skill structure

### For Developers
1. Read **CODEBASE_MAP.md** section 2 (Data Flow)
2. Study `scripts/` directory for build pipeline
3. Check `registry.jsonc` for component structure

### For DevOps
1. Review **FILES_REFERENCE.md** deployment section
2. Check `wrangler.jsonc` for Cloudflare config
3. See `vercel.json` and `netlify.toml` for alternatives

## 🔗 External Resources

- **OCX CLI:** https://github.com/kdcokenny/ocx
- **Registry Schema:** https://ocx.kdco.dev/schema.json
- **Deployed Registry:** https://slurpyb.kdco.dev/

## 💡 Key Insights

### What Works Well
✓ Comprehensive skill coverage (3,199 skills)  
✓ Rich metadata (taxonomy, quality scores, bundle hints)  
✓ Automated classification (LLM-based)  
✓ Modular build pipeline (independent steps)  
✓ Safe bundle generation (idempotent)  

### What's Missing
✗ Query API (no search/filter at runtime)  
✗ Taxonomy exposure (rich data not served)  
✗ Semantic search (no embeddings)  
✗ Dependency graph (no skill relationships)  
✗ MCP integration (no Claude Code integration)  

## 🎯 Recommended Next Steps

1. **Expose taxonomy.json** in `dist/` for filtering
2. **Add search endpoint** (Cloudflare Worker)
3. **Generate embeddings** for semantic search
4. **Build MCP server** for Claude Code
5. **Add dependency graph** for skill discovery

## 📍 Quick Reference

```
Source:     /Users/jordan/j/src/ocx-slurpyb/files/
Metadata:   /Users/jordan/j/src/ocx-slurpyb/_registry/
Registry:   /Users/jordan/j/src/ocx-slurpyb/registry.jsonc
Built:      /Users/jordan/j/src/ocx-slurpyb/dist/
Deployed:   https://slurpyb.kdco.dev/
```

## 📚 Documentation Map

```
CODEBASE_INDEX.md (this file)
├── CODEBASE_MAP.md
│   ├── Section 1: Source Data Structure
│   ├── Section 2: Data Flow (5 phases)
│   ├── Section 3: Queryable vs Static
│   ├── Section 4: Taxonomy Structure
│   ├── Section 5: Build Scripts
│   ├── Section 6: Gaps & Opportunities
│   ├── Section 7: File Organization
│   ├── Section 8: Key Insights
│   └── Section 9: Quick Reference
├── DATA_FLOW.md
│   ├── High-level pipeline diagram
│   ├── Data availability matrix
│   ├── Query capabilities
│   └── Gaps & opportunities
└── FILES_REFERENCE.md
    ├── Source files structure
    ├── Processed metadata
    ├── Build scripts
    ├── Built output
    ├── File locations (absolute paths)
    ├── File sizes
    ├── Component counts
    ├── Build pipeline commands
    ├── Important notes
    ├── Taxonomy domains
    ├── External data sources
    └── Deployment targets
```

---

**Last Updated:** March 3, 2026  
**Created by:** Explorer — Codebase Navigation Specialist
