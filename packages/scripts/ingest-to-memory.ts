/**
 * ingest-to-memory.ts
 *
 * Reads skill-index.json, taxonomy.json, and registry.jsonc, merges them
 * into enriched entries, then outputs JSONL optimized for opencode-mem
 * semantic search.
 *
 * Strategy: Group by domain → domain summary entries + individual entries
 * for high-quality components. This keeps total count manageable (~100-150)
 * while maximizing retrieval relevance.
 *
 * Usage:
 *   bun packages/scripts/ingest-to-memory.ts              # generate JSONL
 *   bun packages/scripts/ingest-to-memory.ts --dry-run     # preview stats only
 *   bun packages/scripts/ingest-to-memory.ts --load        # generate + load into opencode-mem via HTTP API
 *   bun packages/scripts/ingest-to-memory.ts --load-only   # load existing JSONL (skip generation)
 */

import { readFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { parse as parseJsonc } from "jsonc-parser"

const ROOT = join(import.meta.dirname, "..", "..")

// --- Types ---

interface SkillIndexEntry {
  name: string
  description: string
  category?: string
  tags: string[]
  capabilities: string[]
  author?: string
}

interface TaxonomyEntry {
  name: string
  domain: string
  subdomain: string
  specialty: string
  tags: string[]
  quality: number
  qualityReason: string
  bundleHints: string[]
}

interface RegistryComponent {
  name: string
  type: string
  description: string
  files: (string | { path: string; target?: string })[]
  dependencies?: string[]
}

interface EnrichedEntry {
  name: string
  type: string
  description: string
  domain: string
  subdomain: string
  specialty: string
  category?: string
  tags: string[]
  capabilities: string[]
  quality: number
  qualityReason: string
  author?: string
  bundleHints: string[]
  dependencies: string[]
}

interface MemoryEntry {
  content: string
  tags: string
  type: string
}

// --- Loaders ---

async function loadJson<T>(path: string): Promise<T> {
  const raw = await readFile(join(ROOT, path), "utf-8")
  return JSON.parse(raw)
}

async function loadJsonc<T>(path: string): Promise<T> {
  const raw = await readFile(join(ROOT, path), "utf-8")
  return parseJsonc(raw) as T
}

// --- Merge ---

function mergeEntries(
  skills: SkillIndexEntry[],
  taxonomy: TaxonomyEntry[],
  components: RegistryComponent[],
): EnrichedEntry[] {
  const skillMap = new Map(skills.map((s) => [s.name, s]))
  const taxMap = new Map(taxonomy.map((t) => [t.name, t]))

  return components.map((comp) => {
    const skill = skillMap.get(comp.name)
    const tax = taxMap.get(comp.name)
    const allTags = new Set<string>([
      ...(skill?.tags ?? []),
      ...(tax?.tags ?? []),
    ])

    return {
      name: comp.name,
      type: comp.type.replace("ocx:", ""),
      description: comp.description || skill?.description || "",
      domain: tax?.domain ?? "uncategorized",
      subdomain: tax?.subdomain ?? "",
      specialty: tax?.specialty ?? "",
      category: skill?.category,
      tags: [...allTags],
      capabilities: skill?.capabilities ?? [],
      quality: tax?.quality ?? 0,
      qualityReason: tax?.qualityReason ?? "",
      author: skill?.author,
      bundleHints: tax?.bundleHints ?? [],
      dependencies: comp.dependencies ?? [],
    }
  })
}

// --- Memory entry generators ---

function entryForComponent(e: EnrichedEntry): MemoryEntry {
  const lines = [
    `[OCX Component] ${e.name} (${e.type})`,
    e.description,
  ]
  if (e.domain !== "uncategorized") {
    lines.push(`Domain: ${e.domain} > ${e.subdomain} > ${e.specialty}`)
  }
  if (e.capabilities.length > 0) {
    lines.push(`Capabilities: ${e.capabilities.join(", ")}`)
  }
  if (e.quality > 0) {
    lines.push(`Quality: ${e.quality}/5 — ${e.qualityReason}`)
  }
  if (e.dependencies.length > 0) {
    lines.push(`Dependencies: ${e.dependencies.join(", ")}`)
  }
  if (e.bundleHints.length > 0) {
    lines.push(`Bundle hints: ${e.bundleHints.join(", ")}`)
  }

  const tags = [
    "ocx",
    e.type,
    e.domain,
    e.subdomain,
    ...(e.category ? [e.category] : []),
    ...e.tags.slice(0, 8),
  ]
    .filter(Boolean)
    .map((t) => t.toLowerCase().replace(/\s+/g, "-"))

  return {
    content: lines.filter(Boolean).join("\n"),
    tags: [...new Set(tags)].join(","),
    type: "feature",
  }
}

function entryForDomain(
  domain: string,
  entries: EnrichedEntry[],
): MemoryEntry {
  const subdomains = new Map<string, EnrichedEntry[]>()
  for (const e of entries) {
    const key = e.subdomain || "general"
    if (!subdomains.has(key)) subdomains.set(key, [])
    subdomains.get(key)!.push(e)
  }

  const lines = [
    `[OCX Registry Domain] ${domain}`,
    `${entries.length} components across ${subdomains.size} subdomains.`,
    "",
  ]

  for (const [sub, items] of [...subdomains.entries()].sort()) {
    lines.push(`## ${sub}`)
    const sorted = items.sort((a, b) => b.quality - a.quality)
    for (const item of sorted.slice(0, 10)) {
      const q = item.quality > 0 ? ` [${item.quality}/5]` : ""
      lines.push(`- ${item.name} (${item.type}): ${item.description}${q}`)
    }
    if (sorted.length > 10) {
      lines.push(`  ...and ${sorted.length - 10} more`)
    }
    lines.push("")
  }

  const allTags = new Set<string>()
  allTags.add("ocx")
  allTags.add("registry-domain")
  allTags.add(domain.toLowerCase().replace(/\s+/g, "-"))
  for (const e of entries) {
    for (const t of e.tags.slice(0, 3)) {
      allTags.add(t.toLowerCase().replace(/\s+/g, "-"))
    }
  }

  return {
    content: lines.join("\n").trim(),
    tags: [...allTags].slice(0, 15).join(","),
    type: "feature",
  }
}

function masterIndexEntry(
  domains: Map<string, EnrichedEntry[]>,
  total: number,
): MemoryEntry {
  const lines = [
    `[OCX Registry Index] slurpyb — ${total} components`,
    "",
    "Domain summary:",
  ]
  for (const [domain, entries] of [...domains.entries()].sort()) {
    const types = new Map<string, number>()
    for (const e of entries) {
      types.set(e.type, (types.get(e.type) ?? 0) + 1)
    }
    const breakdown = [...types.entries()]
      .map(([t, n]) => `${n} ${t}s`)
      .join(", ")
    lines.push(`- ${domain}: ${entries.length} components (${breakdown})`)
  }
  lines.push(
    "",
    "To find a component, search memory for the domain or capability you need.",
    "Component types: skill, plugin, agent, command, profile, bundle",
  )

  return {
    content: lines.join("\n"),
    tags: "ocx,registry-index,slurpyb,component-catalog",
    type: "feature",
  }
}

// --- HTTP loader ---

const API_URL = "http://127.0.0.1:4747/api/memories"
const CONCURRENCY = 10
const CONTAINER_TAG = "ocx-registry"

async function loadEntry(entry: MemoryEntry): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: entry.content,
        containerTag: CONTAINER_TAG,
        memoryType: entry.type,
        tags: entry.tags.split(",").filter(Boolean),
      }),
    })
    const data = await res.json() as { success: boolean; data?: { id: string }; error?: string }
    if (!data.success) return { ok: false, error: data.error ?? "unknown" }
    return { ok: true, id: data.data?.id }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

async function loadBatch(entries: MemoryEntry[]): Promise<{ loaded: number; failed: number }> {
  let loaded = 0
  let failed = 0
  // Process in chunks of CONCURRENCY
  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const chunk = entries.slice(i, i + CONCURRENCY)
    const results = await Promise.all(chunk.map(loadEntry))
    for (const r of results) {
      if (r.ok) loaded++
      else {
        failed++
        if (failed <= 5) console.error(`  FAIL: ${r.error}`)
      }
    }
    const pct = (((i + chunk.length) / entries.length) * 100).toFixed(0)
    process.stdout.write(`\r  ${i + chunk.length}/${entries.length} (${pct}%) — ${loaded} ok, ${failed} fail`)
  }
  console.log() // newline after progress
  return { loaded, failed }
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes("--dry-run")
  const doLoad = args.includes("--load")
  const loadOnly = args.includes("--load-only")

  let memoryEntries: MemoryEntry[]

  if (loadOnly) {
    // Read existing JSONL
    const jsonlPath = join(ROOT, "dist", "_data", "memory-entries.jsonl")
    console.log(`Reading ${jsonlPath}...`)
    const raw = await readFile(jsonlPath, "utf-8")
    memoryEntries = raw.trim().split("\n").map((line) => JSON.parse(line))
    console.log(`  ${memoryEntries.length} entries`)
  } else {
    // Generate from sources
    console.log("Loading data sources...")
    const [skills, taxonomy, registry] = await Promise.all([
      loadJson<SkillIndexEntry[]>("packages/registry/skill-index.json"),
      loadJson<TaxonomyEntry[]>("packages/registry/taxonomy.json"),
      loadJsonc<{ components: RegistryComponent[] }>("registry.jsonc"),
    ])

    console.log(`  skill-index: ${skills.length} entries`)
    console.log(`  taxonomy: ${taxonomy.length} entries`)
    console.log(`  registry: ${registry.components.length} components`)

    console.log("\nMerging...")
    const enriched = mergeEntries(skills, taxonomy, registry.components)

    // Group by domain
    const domains = new Map<string, EnrichedEntry[]>()
    for (const e of enriched) {
      if (!domains.has(e.domain)) domains.set(e.domain, [])
      domains.get(e.domain)!.push(e)
    }

    console.log(`  ${domains.size} domains`)

    // Generate memory entries
    memoryEntries = []

    // 1. Master index
    memoryEntries.push(masterIndexEntry(domains, enriched.length))

    // 2. Domain summaries
    for (const [domain, entries] of domains) {
      memoryEntries.push(entryForDomain(domain, entries))
    }

    // 3. Individual entry for every component
    for (const e of enriched) {
      memoryEntries.push(entryForComponent(e))
    }

    console.log(`\nGenerated ${memoryEntries.length} memory entries:`)
    console.log(`  1 master index`)
    console.log(`  ${domains.size} domain summaries`)
    console.log(`  ${enriched.length} individual components`)

    if (dryRun) {
      console.log("\n--dry-run: skipping output")
      const sample = memoryEntries.find((e) =>
        e.content.startsWith("[OCX Registry Domain]"),
      )
      if (sample) {
        console.log("\n--- Sample domain entry ---")
        console.log(JSON.stringify(sample, null, 2))
      }
      return
    }

    // Write JSONL
    const outDir = join(ROOT, "dist", "_data")
    await mkdir(outDir, { recursive: true })
    const outPath = join(outDir, "memory-entries.jsonl")
    const jsonl = memoryEntries.map((e) => JSON.stringify(e)).join("\n")

    await Bun.write(outPath, jsonl + "\n")
    console.log(`\nWrote ${outPath}`)
    console.log(`  ${memoryEntries.length} entries, ${(jsonl.length / 1024).toFixed(1)} KB`)
  }

  // Load into opencode-mem
  if (doLoad || loadOnly) {
    console.log(`\nLoading ${memoryEntries.length} entries into opencode-mem (${API_URL})...`)
    console.log(`  concurrency: ${CONCURRENCY}, container: ${CONTAINER_TAG}`)

    // Verify API is reachable
    try {
      const ping = await fetch(API_URL)
      // Any response means server is reachable (even 405 for wrong method)
      if (!ping.ok && ping.status !== 405) throw new Error(`HTTP ${ping.status}`)
    } catch {
      console.error("\n  ERROR: opencode-mem API not reachable at", API_URL)
      console.error("  Make sure opencode is running with the memory plugin enabled.")
      process.exit(1)
    }

    const { loaded, failed } = await loadBatch(memoryEntries)
    console.log(`\nDone: ${loaded} loaded, ${failed} failed out of ${memoryEntries.length}`)
  } else if (!loadOnly) {
    console.log("\nTo load into memory: bun packages/scripts/ingest-to-memory.ts --load")
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
