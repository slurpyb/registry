#!/usr/bin/env bun
/**
 * import-skills.ts
 *
 * Scans ~/j/llms/packages/repos/** for skill directories (any dir containing SKILL.md),
 * deduplicates by name (keeping largest by file count, then content size),
 * and converts them to opencode format via `rogue skill --to=opencode`.
 *
 * Incremental: skips skills already imported. Re-run after `git pull` on repos.
 * Tracks source→dest in files/skills/.import-manifest.json for re-imports.
 *
 * Usage:
 *   bun scripts/import-skills.ts                # import new skills
 *   bun scripts/import-skills.ts --dry-run      # preview without writing
 *   bun scripts/import-skills.ts --force         # re-import everything
 *   bun scripts/import-skills.ts --report        # just print the dedup report
 *   bun scripts/import-skills.ts --concurrency=8 # parallel rogue calls (default: 8)
 */

import { readdir, readFile, stat, rm, mkdir } from "node:fs/promises"
import { join, basename, relative } from "node:path"
import { createHash } from "node:crypto"
import { $ } from "bun"

// ── Config ──────────────────────────────────────────────────────────────────

const REPOS_DIR = join(process.env.HOME!, "j/llms/packages/repos")
const ROOT = join(import.meta.dirname, "..")
const FILES_DIR = join(ROOT, "files")
const SKILLS_DIR = join(FILES_DIR, "skills")
const MANIFEST_PATH = join(SKILLS_DIR, ".import-manifest.json")

const DRY_RUN = process.argv.includes("--dry-run")
const FORCE = process.argv.includes("--force")
const REPORT_ONLY = process.argv.includes("--report")

const concurrencyArg = process.argv.find((a) => a.startsWith("--concurrency="))
const CONCURRENCY = concurrencyArg ? parseInt(concurrencyArg.split("=")[1]!) : 8

// Directories to skip when traversing
const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", ".cache",
  "scripts", "template",
])

// Skip non-repo entries in the repos dir
const SKIP_REPO_ENTRIES = new Set([
  "scripts", "index.json",
  "search-1-translation.json", "search-2-specification.json", "search-3-structural.json",
])

// ── Types ───────────────────────────────────────────────────────────────────

interface SkillCandidate {
  name: string
  absPath: string
  repo: string
  contentHash: string
  fileCount: number
  totalSize: number
  hasDescription: boolean
}

interface DedupeResult {
  winner: SkillCandidate
  dupes: SkillCandidate[]
}

interface ManifestEntry {
  name: string
  sourcePath: string
  sourceRepo: string
  contentHash: string
  importedAt: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16)
}

async function dirStats(dir: string): Promise<{ fileCount: number; totalSize: number }> {
  let fileCount = 0
  let totalSize = 0
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name === ".DS_Store" || SKIP_DIRS.has(entry.name)) continue
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        const sub = await dirStats(fullPath)
        fileCount += sub.fileCount
        totalSize += sub.totalSize
      } else {
        fileCount++
        try {
          const s = await stat(fullPath)
          totalSize += s.size
        } catch { /* skip */ }
      }
    }
  } catch { /* skip */ }
  return { fileCount, totalSize }
}

function hasDescription(content: string): boolean {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) return false
  return /^description:\s*.+/m.test(fmMatch[1]!)
}

async function findSkillDirs(
  dir: string,
  repo: string,
  depth = 0,
  maxDepth = 5
): Promise<SkillCandidate[]> {
  if (depth > maxDepth) return []
  const candidates: SkillCandidate[] = []
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    const hasSkillMd = entries.some((e) => e.name === "SKILL.md" && !e.isDirectory())
    if (hasSkillMd) {
      const content = await readFile(join(dir, "SKILL.md"), "utf-8")
      const stats = await dirStats(dir)
      candidates.push({
        name: basename(dir),
        absPath: dir,
        repo,
        contentHash: sha256(content),
        fileCount: stats.fileCount,
        totalSize: stats.totalSize,
        hasDescription: hasDescription(content),
      })
      return candidates // don't recurse into skill subdirs
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (SKIP_DIRS.has(entry.name)) continue
      if (entry.name.startsWith(".") && entry.name !== ".curated" && entry.name !== ".agents" && entry.name !== ".experimental" && entry.name !== ".template") continue
      candidates.push(...(await findSkillDirs(join(dir, entry.name), repo, depth + 1, maxDepth)))
    }
  } catch { /* skip */ }
  return candidates
}

function deduplicateSkills(candidates: SkillCandidate[]): Map<string, DedupeResult> {
  const byName = new Map<string, SkillCandidate[]>()
  for (const c of candidates) {
    const existing = byName.get(c.name) || []
    existing.push(c)
    byName.set(c.name, existing)
  }
  const results = new Map<string, DedupeResult>()
  for (const [name, group] of byName) {
    if (group.length === 1) {
      results.set(name, { winner: group[0]!, dupes: [] })
      continue
    }
    const sorted = [...group].sort((a, b) => {
      if (a.hasDescription !== b.hasDescription) return a.hasDescription ? -1 : 1
      if (a.fileCount !== b.fileCount) return b.fileCount - a.fileCount
      return b.totalSize - a.totalSize
    })
    results.set(name, { winner: sorted[0]!, dupes: sorted.slice(1) })
  }
  return results
}

/** Run rogue skill conversion with concurrency limit. */
async function runRogueBatch(
  skills: Array<{ name: string; absPath: string; repo: string; contentHash: string }>,
  outputDir: string,
  concurrency: number
): Promise<{ succeeded: string[]; failed: Array<{ name: string; error: string }> }> {
  const succeeded: string[] = []
  const failed: Array<{ name: string; error: string }> = []

  // Process in batches
  for (let i = 0; i < skills.length; i += concurrency) {
    const batch = skills.slice(i, i + concurrency)
    const promises = batch.map(async (skill) => {
      try {
        const result = await $`rogue skill ${skill.absPath} --to=opencode --output=${outputDir}`.quiet()
        if (result.exitCode !== 0) {
          throw new Error(result.stderr.toString().trim() || `exit code ${result.exitCode}`)
        }
        succeeded.push(skill.name)
      } catch (err: any) {
        failed.push({ name: skill.name, error: err.message || String(err) })
      }
    })
    await Promise.all(promises)

    // Progress
    const done = Math.min(i + concurrency, skills.length)
    if (done % 100 === 0 || done === skills.length) {
      process.stdout.write(`\r  Progress: ${done}/${skills.length} (${succeeded.length} ok, ${failed.length} err)`)
    }
  }
  process.stdout.write("\n")
  return { succeeded, failed }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Scanning repos for skills...\n")

  // 1. Discover all repos
  const repoEntries = await readdir(REPOS_DIR, { withFileTypes: true })
  const repos = repoEntries
    .filter((e) => e.isDirectory() && !SKIP_REPO_ENTRIES.has(e.name) && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort()

  // 2. Find all skill candidates
  const allCandidates: SkillCandidate[] = []
  for (const repo of repos) {
    const candidates = await findSkillDirs(join(REPOS_DIR, repo), repo)
    allCandidates.push(...candidates)
    console.log(`  ${repo}: ${candidates.length} skills`)
  }
  console.log(`\nTotal candidates: ${allCandidates.length}`)

  // 3. Deduplicate
  const deduped = deduplicateSkills(allCandidates)
  const totalDupes = [...deduped.values()].reduce((sum, r) => sum + r.dupes.length, 0)
  const withDupes = [...deduped.values()].filter((r) => r.dupes.length > 0).length
  const withoutDesc = [...deduped.values()].filter((r) => !r.winner.hasDescription).length

  console.log(`\nUnique skills: ${deduped.size}`)
  console.log(`  Duplicates removed: ${totalDupes} (across ${withDupes} names)`)
  console.log(`  Without description: ${withoutDesc} (rogue will add one)`)

  // 4. Duplicate report
  if (withDupes > 0) {
    console.log(`\nDuplicate report (top 10):`)
    const dupEntries = [...deduped.entries()]
      .filter(([_, r]) => r.dupes.length > 0)
      .sort((a, b) => b[1].dupes.length - a[1].dupes.length)
      .slice(0, 10)
    for (const [name, result] of dupEntries) {
      const w = result.winner
      console.log(`  ${name} (${result.dupes.length + 1} versions) -> ${relative(REPOS_DIR, w.absPath)} [${w.fileCount} files]`)
    }
  }

  if (REPORT_ONLY) {
    console.log(`\n(--report mode, no changes made)`)
    return
  }

  // 5. Load existing manifest for incremental mode
  let manifest = new Map<string, ManifestEntry>()
  try {
    const raw = await readFile(MANIFEST_PATH, "utf-8")
    const entries: ManifestEntry[] = JSON.parse(raw)
    for (const e of entries) manifest.set(e.name, e)
  } catch { /* no manifest yet */ }

  // 6. Determine which skills need importing
  const toImport: Array<{ name: string; absPath: string; repo: string; contentHash: string }> = []
  let skipped = 0

  for (const [name, result] of deduped) {
    const winner = result.winner
    const existing = manifest.get(name)

    if (!FORCE && existing && existing.contentHash === winner.contentHash) {
      // Already imported with same content
      skipped++
      continue
    }

    toImport.push({
      name,
      absPath: winner.absPath,
      repo: winner.repo,
      contentHash: winner.contentHash,
    })
  }

  console.log(`\nTo import: ${toImport.length} (skipped ${skipped} unchanged)`)

  if (toImport.length === 0) {
    console.log("Nothing to do!")
    return
  }

  if (DRY_RUN) {
    console.log("\n-- DRY RUN -- Would import:")
    for (const s of toImport.slice(0, 30)) {
      console.log(`  ${s.name} <- ${relative(REPOS_DIR, s.absPath)}`)
    }
    if (toImport.length > 30) console.log(`  ... and ${toImport.length - 30} more`)
    return
  }

  // 7. Remove stale skills that will be re-imported
  for (const s of toImport) {
    const destDir = join(SKILLS_DIR, s.name)
    try {
      await rm(destDir, { recursive: true, force: true })
    } catch { /* didn't exist */ }
  }

  // 8. Run rogue conversions
  console.log(`\nRunning rogue conversions (concurrency=${CONCURRENCY})...`)
  const { succeeded, failed } = await runRogueBatch(toImport, SKILLS_DIR, CONCURRENCY)

  // 9. Update manifest
  const now = new Date().toISOString()
  for (const s of toImport) {
    if (succeeded.includes(s.name)) {
      manifest.set(s.name, {
        name: s.name,
        sourcePath: s.absPath,
        sourceRepo: s.repo,
        contentHash: s.contentHash,
        importedAt: now,
      })
    }
  }

  // Write manifest
  const manifestData = [...manifest.values()].sort((a, b) => a.name.localeCompare(b.name))
  await Bun.write(MANIFEST_PATH, JSON.stringify(manifestData, null, 2))

  // 10. Summary
  console.log(`\nDone!`)
  console.log(`  Imported: ${succeeded.length}`)
  console.log(`  Skipped (unchanged): ${skipped}`)
  console.log(`  Failed: ${failed.length}`)
  console.log(`  Total in manifest: ${manifest.size}`)

  if (failed.length > 0) {
    console.log(`\nFailed skills:`)
    for (const f of failed.slice(0, 20)) {
      console.log(`  ${f.name}: ${f.error}`)
    }
    if (failed.length > 20) console.log(`  ... and ${failed.length - 20} more`)
  }

  console.log(`\nNext: bun scripts/generate-registry.ts && bun run build`)
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
