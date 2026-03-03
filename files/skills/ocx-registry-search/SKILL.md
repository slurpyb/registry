# OCX Registry Search

Local MCP server for discovering and searching 3,200+ skills in the OCX Slurpyb registry. Provides taxonomy-aware search with domain filtering, quality scoring, and install commands.

## TL;DR

Exposes 4 MCP tools (`search_skills`, `get_skill`, `list_domains`, `list_bundles`) over stdio. Searches enriched registry data with LLM-classified taxonomy (domain, subdomain, quality 1-5, tags). Returns ranked results with `bunx ocx add` install commands.

## When to Use

- Finding skills for a specific task or technology
- Discovering what skill categories exist in the registry
- Getting install commands for skills
- Browsing curated bundles for common workflows
- Filtering skills by quality, domain, or tags

## Setup

Add to your `.mcp.json` or Claude Code config:

```json
{
  "mcpServers": {
    "ocx-registry": {
      "type": "stdio",
      "command": "bun",
      "args": ["src/mcp-server.ts"],
      "cwd": "/path/to/ocx-slurpyb"
    }
  }
}
```

Requires enriched data (run `bun scripts/enrich-index.ts` first, or the server falls back to raw `_registry/` sources).

## Tools

### search_skills

Search by text query, domain, quality, or tags. Returns ranked results.

**Parameters:**
- `query` (string, optional) — Text search across name, description, tags, capabilities
- `domain` (string, optional) — Filter by domain (e.g. `web-dev`, `devops`, `ai-ml`, `security`, `data`)
- `subdomain` (string, optional) — Filter by subdomain within a domain
- `min_quality` (number, optional) — Minimum quality score (1-5)
- `tags` (string, optional) — Comma-separated tags (any match)
- `limit` (number, optional) — Max results (default 20, max 50)

### get_skill

Get full metadata for a specific skill by exact name.

**Parameters:**
- `name` (string, required) — Exact skill name

### list_domains

List all skill domains with counts and subdomains. No parameters. Use this to discover available categories before searching.

### list_bundles

List curated skill bundles with skill counts. No parameters.

## Examples

**Find Docker skills rated 4+:**
```
search_skills(query="docker", min_quality=4)
```

**Browse security domain:**
```
search_skills(domain="security", limit=10)
```

**Get details for a specific skill:**
```
get_skill(name="docker-expert")
```

## What NOT to Do

- Don't guess skill names — use `search_skills` first, then `get_skill`
- Don't filter by domain without calling `list_domains` first to see valid values
- Don't set `limit` above 50 — it caps there anyway
