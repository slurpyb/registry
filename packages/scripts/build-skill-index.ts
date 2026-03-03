#!/usr/bin/env bun
/**
 * build-skill-index.ts
 *
 * Extracts name + description from skill-report.json (or SKILL.md frontmatter)
 * into a lightweight index for classification and embedding.
 *
 * Output: packages/registry/skill-index.json
 *
 * Usage:
 *   bun scripts/build-skill-index.ts
 */

import { readdir, readFile, mkdir } from "node:fs/promises"
import { join } from "node:path"

const ROOT = join(import.meta.dirname, "..", "..")
const SKILLS_DIR = join(ROOT, "files/skills")
const REGISTRY_DIR = join(ROOT, "packages/registry")
const INDEX_PATH = join(REGISTRY_DIR, "skill-index.json")

interface SkillIndexEntry {
  name: string
  description: string
  category: string       // from rogue report (generic)
  tags: string[]         // from rogue report
  capabilities: string[] // from rogue report content.actual_capabilities
  author: string
}

function extractFrontmatterDesc(content: string): string {
  const fm = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fm?.[1]) return ""
  const desc = fm[1].match(/^description:\s*["']?([\s\S]*?)["']?\s*(?:\n\w|\n---|$)/m)
  return desc?.[1]?.replace(/\n\s*/g, " ").trim() ?? ""
}

async function main() {
  await mkdir(REGISTRY_DIR, { recursive: true })

  const dirs = await readdir(SKILLS_DIR, { withFileTypes: true })
  const skills = dirs.filter((d) => d.isDirectory() && d.name !== ".DS_Store").sort((a, b) => a.name.localeCompare(b.name))

  console.log(`Scanning ${skills.length} skill directories...`)

  const index: SkillIndexEntry[] = []
  let fromReport = 0
  let fromFrontmatter = 0
  let noDesc = 0

  for (const dir of skills) {
    const name = dir.name
    let description = ""
    let category = ""
    let tags: string[] = []
    let capabilities: string[] = []
    let author = ""

    // Try skill-report.json first
    const reportPath = join(SKILLS_DIR, name, "skill-report.json")
    try {
      const raw = await readFile(reportPath, "utf-8")
      const report = JSON.parse(raw)
      description = report.skill?.description ?? ""
      category = report.skill?.category ?? ""
      tags = report.skill?.tags ?? []
      capabilities = (report.content?.actual_capabilities ?? []).slice(0, 3)
      author = report.skill?.author ?? ""
      if (description) fromReport++
    } catch { /* no report */ }

    // Fallback to SKILL.md frontmatter
    if (!description) {
      const skillMdPath = join(SKILLS_DIR, name, "SKILL.md")
      try {
        const content = await readFile(skillMdPath, "utf-8")
        description = extractFrontmatterDesc(content)
        if (description) fromFrontmatter++
      } catch { /* no SKILL.md */ }
    }

    if (!description) {
      noDesc++
      continue
    }

    index.push({ name, description, category, tags, capabilities, author })
  }

  await Bun.write(INDEX_PATH, JSON.stringify(index, null, 2))

  console.log(`\nDone!`)
  console.log(`  Total: ${index.length} skills indexed`)
  console.log(`  From skill-report.json: ${fromReport}`)
  console.log(`  From SKILL.md frontmatter: ${fromFrontmatter}`)
  console.log(`  Skipped (no description): ${noDesc}`)
  console.log(`  Output: ${INDEX_PATH}`)
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
