#!/usr/bin/env bun
/**
 * Local MCP server for OCX skill registry discovery.
 * Transport: stdio (standard for Claude Code local MCP servers)
 *
 * Usage in claude_desktop_config.json or .mcp.json:
 *   { "command": "bun", "args": ["src/mcp-server.ts"], "cwd": "/path/to/ocx-slurpyb" }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// ─── Types ───────────────────────────────────────────────────────────────────

interface EnrichedEntry {
  name: string
  description: string
  domain: string
  subdomain: string
  specialty: string
  tags: string[]
  quality: number
  qualityReason: string
  capabilities: string[]
  author: string
  bundleHints: string[]
}

interface DomainSummary {
  [domain: string]: { count: number; subdomains: string[] }
}

// ─── Data Loading ────────────────────────────────────────────────────────────

const ROOT = join(import.meta.dir, "..")
const DATA_DIR = join(ROOT, "dist", "_data")

let registry: EnrichedEntry[]
let domains: DomainSummary

try {
  registry = JSON.parse(readFileSync(join(DATA_DIR, "enriched-registry.json"), "utf-8"))
  domains = JSON.parse(readFileSync(join(DATA_DIR, "domains.json"), "utf-8"))
} catch {
  // Fall back to building from source if dist/_data doesn't exist
  const skillIndex = JSON.parse(readFileSync(join(ROOT, "_registry", "skill-index.json"), "utf-8"))
  const taxonomy = JSON.parse(readFileSync(join(ROOT, "_registry", "taxonomy.json"), "utf-8"))

  const taxMap = new Map(taxonomy.map((t: any) => [t.name, t]))
  registry = skillIndex.map((skill: any) => {
    const tax: any = taxMap.get(skill.name)
    return {
      name: skill.name,
      description: skill.description,
      domain: tax?.domain ?? "uncategorized",
      subdomain: tax?.subdomain ?? "",
      specialty: tax?.specialty ?? "",
      tags: [...new Set([...(skill.tags ?? []), ...(tax?.tags ?? [])])],
      quality: tax?.quality ?? 0,
      qualityReason: tax?.qualityReason ?? "",
      capabilities: skill.capabilities ?? [],
      author: skill.author ?? "",
      bundleHints: tax?.bundleHints ?? [],
    }
  })

  const domainMap = new Map<string, { count: number; subdomains: Set<string> }>()
  for (const e of registry) {
    const d = domainMap.get(e.domain) ?? { count: 0, subdomains: new Set<string>() }
    d.count++
    if (e.subdomain) d.subdomains.add(e.subdomain)
    domainMap.set(e.domain, d)
  }
  domains = Object.fromEntries(
    [...domainMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, { count, subdomains }]) => [name, { count, subdomains: [...subdomains].sort() }])
  )
}

// ─── Search ──────────────────────────────────────────────────────────────────

function searchSkills(opts: {
  query?: string
  domain?: string
  subdomain?: string
  minQuality?: number
  tags?: string[]
  limit?: number
}): EnrichedEntry[] {
  const limit = Math.min(opts.limit ?? 20, 50)
  const queryTerms = opts.query?.toLowerCase().split(/\s+/).filter(Boolean)

  let results = registry.filter((entry) => {
    if (opts.domain && entry.domain !== opts.domain) return false
    if (opts.subdomain && entry.subdomain !== opts.subdomain) return false
    if (opts.minQuality && entry.quality < opts.minQuality) return false
    if (opts.tags?.length) {
      const entryTags = new Set(entry.tags.map((t) => t.toLowerCase()))
      if (!opts.tags.some((t) => entryTags.has(t.toLowerCase()))) return false
    }
    return true
  })

  if (queryTerms?.length) {
    const scored = results.map((entry) => {
      let score = 0
      for (const term of queryTerms) {
        if (entry.name.toLowerCase().includes(term)) score += 10
        if (entry.description.toLowerCase().includes(term)) score += 5
        if (entry.tags.some((t) => t.toLowerCase().includes(term))) score += 3
        if (entry.capabilities.some((c) => c.toLowerCase().includes(term))) score += 2
      }
      score += entry.quality * 0.5
      return { entry, score }
    })

    results = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.entry)
  } else {
    results.sort((a, b) => b.quality - a.quality)
  }

  return results.slice(0, limit)
}

// ─── MCP Server ──────────────────────────────────────────────────────────────

const server = new McpServer(
  { name: "ocx-slurpyb", version: "1.0.0" },
  { capabilities: { tools: {} } }
)

server.tool(
  "search_skills",
  "Search the OCX skill registry by text query, domain, quality, or tags. Returns ranked results.",
  {
    query: z.string().optional().describe("Text search across name, description, tags, capabilities"),
    domain: z.string().optional().describe("Filter by domain (e.g. web-dev, devops, ai-ml, security, data)"),
    subdomain: z.string().optional().describe("Filter by subdomain within a domain"),
    min_quality: z.number().optional().describe("Minimum quality score (1-5)"),
    tags: z.string().optional().describe("Comma-separated tags to filter by (any match)"),
    limit: z.number().optional().describe("Max results (default 20, max 50)"),
  },
  async (args) => {
    const results = searchSkills({
      query: args.query,
      domain: args.domain,
      subdomain: args.subdomain,
      minQuality: args.min_quality,
      tags: args.tags?.split(",").map((t) => t.trim()),
      limit: args.limit,
    })

    const formatted = results.map((r) => ({
      name: r.name,
      description: r.description,
      domain: r.domain,
      subdomain: r.subdomain,
      specialty: r.specialty,
      quality: r.quality,
      tags: r.tags.slice(0, 8),
      install: `bunx ocx add slurpyb/${r.name}`,
    }))

    return {
      content: [{ type: "text" as const, text: JSON.stringify({ count: results.length, results: formatted }, null, 2) }],
    }
  }
)

server.tool(
  "get_skill",
  "Get full details for a specific skill by name.",
  { name: z.string().describe("Exact skill name") },
  async (args) => {
    const skill = registry.find((s) => s.name.toLowerCase() === args.name.toLowerCase())
    if (!skill) {
      return {
        content: [{ type: "text" as const, text: `Skill "${args.name}" not found. Use search_skills to find available skills.` }],
        isError: true,
      }
    }
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ ...skill, install: `bunx ocx add slurpyb/${skill.name}` }, null, 2) }],
    }
  }
)

server.tool(
  "list_domains",
  "List all skill domains with counts and subdomains.",
  {},
  async () => ({
    content: [{ type: "text" as const, text: JSON.stringify(domains, null, 2) }],
  })
)

server.tool(
  "list_bundles",
  "List curated skill bundles — pre-made collections for common workflows.",
  {},
  async () => {
    const bundleCounts = new Map<string, number>()
    for (const entry of registry) {
      for (const hint of entry.bundleHints) {
        bundleCounts.set(hint, (bundleCounts.get(hint) ?? 0) + 1)
      }
    }
    const bundles = [...bundleCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, skillCount: count }))

    return {
      content: [{ type: "text" as const, text: JSON.stringify({ count: bundles.length, bundles }, null, 2) }],
    }
  }
)

// ─── Start ───────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport()
await server.connect(transport)
