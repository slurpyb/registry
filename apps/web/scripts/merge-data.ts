#!/usr/bin/env bun
/**
 * Prebuild script: Merges all data sources into content collection JSON files
 *
 * Data sources (priority high→low for conflicts):
 * 1. files/skills/{name}/skill-report.json - richest data
 * 2. packages/registry/taxonomy.json - domain/quality enrichment
 * 3. packages/registry/skill-index.json - capabilities/author
 * 4. dist/index.json - canonical component list
 *
 * Output:
 * - src/content/components/{name}.json (one per component)
 * - src/content/bundles/{name}.json (one per bundle)
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "fs"
import { join, dirname } from "path"

// Paths relative to monorepo root
const ROOT = join(dirname(import.meta.path), "../../..")
const DIST_INDEX = join(ROOT, "dist/index.json")
const TAXONOMY = join(ROOT, "packages/registry/taxonomy.json")
const SKILL_INDEX = join(ROOT, "packages/registry/skill-index.json")
const SKILLS_DIR = join(ROOT, "files/skills")
const BUNDLES_FILE = join(ROOT, "bundles.jsonc")
const OUTPUT_COMPONENTS = join(ROOT, "apps/web/src/content/components")
const OUTPUT_BUNDLES = join(ROOT, "apps/web/src/content/bundles")

// Types
interface IndexComponent {
  name: string
  type: string
  description: string
}

interface TaxonomyEntry {
  name: string
  domain?: string
  subdomain?: string
  specialty?: string
  tags?: string[]
  quality?: number
  qualityReason?: string
  bundleHints?: string[]
}

interface SkillIndexEntry {
  name: string
  description?: string
  category?: string
  tags?: string[]
  capabilities?: string[]
  author?: string
}

interface SkillReport {
  schema_version: string
  meta: {
    generated_at: string
    slug: string
    source_url?: string
    source_ref?: string
    model?: string
    analysis_version?: string
    source_type?: string
  }
  skill: {
    name: string
    description?: string
    summary?: string
    icon?: string
    version?: string
    author?: string
    license?: string
    category?: string
    tags?: string[]
    supported_tools?: string[]
    risk_factors?: string[]
  }
  security_audit: {
    risk_level?: "low" | "medium" | "high" | "critical"
    is_blocked?: boolean
    safe_to_publish?: boolean
    summary?: string
    critical_findings?: unknown[]
    high_findings?: unknown[]
    medium_findings?: unknown[]
    low_findings?: unknown[]
    files_scanned?: number
    total_lines?: number
  }
  content: {
    user_title?: string
    value_statement?: string
    seo_keywords?: string[]
    actual_capabilities?: string[]
    limitations?: string[]
    use_cases?: Array<{
      target_user: string
      title: string
      description: string
    }>
    prompt_templates?: Array<{
      title: string
      scenario: string
      prompt: string
    }>
    output_examples?: Array<{
      input: string
      output: string[]
    }>
    best_practices?: string[]
    anti_patterns?: string[]
    faq?: Array<{
      question: string
      answer: string
    }>
  }
  file_structure?: unknown[]
}

interface MergedComponent {
  name: string
  type: "skill" | "plugin" | "agent" | "command" | "bundle" | "profile"
  description: string

  // Taxonomy
  domain?: string
  subdomain?: string
  specialty?: string
  quality?: number
  qualityReason?: string
  tags: string[]
  bundleHints: string[]

  // Skill index
  capabilities: string[]
  author?: string

  // Skill report
  icon?: string
  version?: string
  license?: string
  supportedTools: string[]
  riskLevel?: "low" | "medium" | "high" | "critical"
  safeToPublish?: boolean
  securitySummary?: string
  valueStatement?: string
  userTitle?: string
  limitations: string[]
  useCases: Array<{
    targetUser: string
    title: string
    description: string
  }>
  promptTemplates: Array<{
    title: string
    scenario: string
    prompt: string
  }>
  bestPractices: string[]
  antiPatterns: string[]
  faq: Array<{
    question: string
    answer: string
  }>
  seoKeywords: string[]

  // Meta
  sourceUrl?: string
  sourceType?: string

  // Bundle-specific
  dependencies: string[]
}

function parseJsoncFile(path: string): unknown {
  if (!existsSync(path)) return null
  const content = readFileSync(path, "utf-8")
  // Strip JSONC comments more carefully
  // Remove // comments (not inside strings)
  // Remove /* */ comments (not inside strings)
  // Simple approach: remove whole-line comments and trailing comments after value
  const lines = content.split("\n")
  const cleaned = lines.map(line => {
    // Remove whole-line comments
    if (line.trim().startsWith("//")) return ""
    // Remove trailing comments (naive - won't handle // inside strings perfectly)
    // But for our use case, bundles.jsonc doesn't have URLs in comments
    return line
  }).join("\n")
  // Remove block comments
  const stripped = cleaned.replace(/\/\*[\s\S]*?\*\//g, "")
  return JSON.parse(stripped)
}

function normalizeType(type: string): MergedComponent["type"] {
  // Handle both "skill" and "ocx:skill" formats
  const bare = type.replace(/^ocx:/, "")
  return bare as MergedComponent["type"]
}

function isPlaceholderDescription(desc: string): boolean {
  return !desc || desc === "|" || desc === ">" || desc === ">-" || desc.trim().length < 5
}

function mergeTags(...sources: (string[] | undefined)[]): string[] {
  const all = new Set<string>()
  for (const src of sources) {
    if (src) {
      for (const tag of src) {
        all.add(tag.toLowerCase())
      }
    }
  }
  return [...all].sort()
}

async function main() {
  console.log("🔄 Merging data sources into content collections...")

  // Ensure output directories exist
  mkdirSync(OUTPUT_COMPONENTS, { recursive: true })
  mkdirSync(OUTPUT_BUNDLES, { recursive: true })

  // Load data sources
  console.log("  Loading dist/index.json...")
  const indexData = JSON.parse(readFileSync(DIST_INDEX, "utf-8")) as {
    components: IndexComponent[]
  }

  console.log("  Loading taxonomy.json...")
  const taxonomyData = existsSync(TAXONOMY)
    ? (JSON.parse(readFileSync(TAXONOMY, "utf-8")) as TaxonomyEntry[])
    : []
  const taxonomyMap = new Map(taxonomyData.map((t) => [t.name, t]))

  console.log("  Loading skill-index.json...")
  const skillIndexData = existsSync(SKILL_INDEX)
    ? (JSON.parse(readFileSync(SKILL_INDEX, "utf-8")) as SkillIndexEntry[])
    : []
  const skillIndexMap = new Map(skillIndexData.map((s) => [s.name, s]))

  console.log("  Loading bundles.jsonc...")
  const bundlesData = parseJsoncFile(BUNDLES_FILE) as { components: IndexComponent[] } | null

  // Build skill report lookup by scanning directory
  console.log("  Scanning skill reports...")
  const skillReportMap = new Map<string, SkillReport>()
  if (existsSync(SKILLS_DIR)) {
    const skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)

    for (const skillName of skillDirs) {
      const reportPath = join(SKILLS_DIR, skillName, "skill-report.json")
      if (existsSync(reportPath)) {
        try {
          const report = JSON.parse(readFileSync(reportPath, "utf-8")) as SkillReport
          skillReportMap.set(skillName, report)
        } catch {
          console.warn(`  ⚠️ Failed to parse ${reportPath}`)
        }
      }
    }
  }
  console.log(`  Found ${skillReportMap.size} skill reports`)

  // Process components
  let processed = 0
  let skipped = 0

  for (const comp of indexData.components) {
    // Skip invalid-name test fixture
    if (comp.name === "invalid-name") {
      skipped++
      continue
    }

    const type = normalizeType(comp.type)
    const taxonomy = taxonomyMap.get(comp.name)
    const skillIndex = skillIndexMap.get(comp.name)
    const skillReport = type === "skill" ? skillReportMap.get(comp.name) : undefined

    // Merge data with priority: skillReport > taxonomy > skillIndex > index
    const merged: MergedComponent = {
      name: comp.name,
      type,
      description: isPlaceholderDescription(comp.description)
        ? skillReport?.skill?.description || skillIndex?.description || "No description available"
        : comp.description,

      // Taxonomy fields
      domain: taxonomy?.domain,
      subdomain: taxonomy?.subdomain,
      specialty: taxonomy?.specialty,
      quality: taxonomy?.quality,
      qualityReason: taxonomy?.qualityReason,
      bundleHints: taxonomy?.bundleHints || [],

      // Merged tags from all sources
      tags: mergeTags(
        taxonomy?.tags,
        skillIndex?.tags,
        skillReport?.skill?.tags
      ),

      // Capabilities: prefer skill report's actual_capabilities
      capabilities: skillReport?.content?.actual_capabilities ||
        skillIndex?.capabilities ||
        [],

      // Author: prefer skill report
      author: skillReport?.skill?.author || skillIndex?.author,

      // Skill report exclusive fields
      icon: skillReport?.skill?.icon,
      version: skillReport?.skill?.version,
      license: skillReport?.skill?.license,
      supportedTools: skillReport?.skill?.supported_tools || [],
      riskLevel: skillReport?.security_audit?.risk_level,
      safeToPublish: skillReport?.security_audit?.safe_to_publish,
      securitySummary: skillReport?.security_audit?.summary,
      valueStatement: skillReport?.content?.value_statement,
      userTitle: skillReport?.content?.user_title,
      limitations: skillReport?.content?.limitations || [],
      useCases: (skillReport?.content?.use_cases || []).map((uc) => ({
        targetUser: uc.target_user || uc.title || "",
        title: uc.title || "",
        description: uc.description || "",
      })),
      promptTemplates: skillReport?.content?.prompt_templates || [],
      bestPractices: skillReport?.content?.best_practices || [],
      antiPatterns: skillReport?.content?.anti_patterns || [],
      faq: skillReport?.content?.faq || [],
      seoKeywords: skillReport?.content?.seo_keywords || [],

      // Meta
      sourceUrl: skillReport?.meta?.source_url,
      sourceType: skillReport?.meta?.source_type,

      // Dependencies (for bundles)
      dependencies: [],
    }

    // Write component JSON
    const outputPath = join(OUTPUT_COMPONENTS, `${comp.name}.json`)
    writeFileSync(outputPath, JSON.stringify(merged, null, 2))
    processed++
  }

  console.log(`✅ Processed ${processed} components (skipped ${skipped})`)

  // Process bundles from bundles.jsonc
  if (bundlesData?.components) {
    let bundleCount = 0
    for (const bundle of bundlesData.components) {
      if (bundle.type !== "bundle") continue

      const bundleData = {
        name: bundle.name,
        description: bundle.description,
        dependencies: (bundle as unknown as { dependencies: string[] }).dependencies || [],
      }

      const outputPath = join(OUTPUT_BUNDLES, `${bundle.name}.json`)
      writeFileSync(outputPath, JSON.stringify(bundleData, null, 2))
      bundleCount++
    }
    console.log(`✅ Processed ${bundleCount} bundles`)
  }

  console.log("🎉 Data merge complete!")
}

main().catch((err) => {
  console.error("❌ Merge failed:", err)
  process.exit(1)
})
