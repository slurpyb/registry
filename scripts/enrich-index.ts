/**
 * Merges taxonomy.json + skill-index.json into a single enriched registry file.
 * Output: dist/_data/enriched-registry.json
 *
 * Run: bun scripts/enrich-index.ts
 */

import { readFile, writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"

const ROOT = join(import.meta.dir, "..")
const REGISTRY_DIR = join(ROOT, "_registry")
const OUT_DIR = join(ROOT, "dist", "_data")

interface SkillEntry {
  name: string
  description: string
  category: string
  tags: string[]
  capabilities: string[]
  author: string
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

async function main() {
  const [skillRaw, taxRaw] = await Promise.all([
    readFile(join(REGISTRY_DIR, "skill-index.json"), "utf-8"),
    readFile(join(REGISTRY_DIR, "taxonomy.json"), "utf-8"),
  ])

  const skills: SkillEntry[] = JSON.parse(skillRaw)
  const taxonomy: TaxonomyEntry[] = JSON.parse(taxRaw)

  // Index taxonomy by name for O(1) lookup
  const taxMap = new Map<string, TaxonomyEntry>()
  for (const t of taxonomy) {
    taxMap.set(t.name, t)
  }

  // Merge: skill-index is the base, taxonomy enriches it
  const enriched: EnrichedEntry[] = skills.map((skill) => {
    const tax = taxMap.get(skill.name)
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

  // Build domain summary for quick lookups
  const domains = new Map<string, { count: number; subdomains: Set<string> }>()
  for (const e of enriched) {
    const d = domains.get(e.domain) ?? { count: 0, subdomains: new Set() }
    d.count++
    if (e.subdomain) d.subdomains.add(e.subdomain)
    domains.set(e.domain, d)
  }

  const domainSummary = Object.fromEntries(
    [...domains.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, { count, subdomains }]) => [
        name,
        { count, subdomains: [...subdomains].sort() },
      ])
  )

  await mkdir(OUT_DIR, { recursive: true })

  await Promise.all([
    writeFile(
      join(OUT_DIR, "enriched-registry.json"),
      JSON.stringify(enriched),
      "utf-8"
    ),
    writeFile(
      join(OUT_DIR, "domains.json"),
      JSON.stringify(domainSummary),
      "utf-8"
    ),
  ])

  console.log(`✓ Enriched ${enriched.length} entries`)
  console.log(`✓ ${domains.size} domains`)
  console.log(`✓ Output: ${OUT_DIR}/enriched-registry.json`)
  console.log(`✓ Output: ${OUT_DIR}/domains.json`)
}

main().catch((err) => {
  console.error("Failed to enrich index:", err)
  process.exit(1)
})
