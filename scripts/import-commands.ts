#!/usr/bin/env bun
/**
 * import-commands.ts
 *
 * Scans ~/j/llms/packages/repos/** for slash command markdown files (any *.md
 * inside a directory named "commands" or ".claude/commands"), deduplicates
 * by name (keeping the one with the best frontmatter / largest size), and
 * converts them to opencode format via `rogue command --to=opencode`.
 *
 * Incremental: skips commands already imported. Re-run after `git pull` on repos.
 * Tracks source→dest in files/commands/.import-manifest.json for re-imports.
 *
 * Usage:
 *   bun scripts/import-commands.ts                # import new commands
 *   bun scripts/import-commands.ts --dry-run      # preview without writing
 *   bun scripts/import-commands.ts --force        # re-import everything
 *   bun scripts/import-commands.ts --report       # just print the dedup report
 *   bun scripts/import-commands.ts --concurrency=8 # parallel rogue calls (default: 8)
 */

import { readdir, readFile, mkdir } from "node:fs/promises"
import { join, basename, relative, extname } from "node:path"
import { createHash } from "node:crypto"
import { $ } from "bun"

// ── Config ──────────────────────────────────────────────────────────────────

const REPOS_DIR = join(process.env.HOME!, "j/llms/packages/repos")
const ROOT = join(import.meta.dirname, "..")
const FILES_DIR = join(ROOT, "files")
const COMMANDS_DIR = join(FILES_DIR, "commands")
const MANIFEST_PATH = join(COMMANDS_DIR, ".import-manifest.json")

const DRY_RUN = process.argv.includes("--dry-run")
const FORCE = process.argv.includes("--force")
const REPORT_ONLY = process.argv.includes("--report")

const concurrencyArg = process.argv.find((a) => a.startsWith("--concurrency="))
const CONCURRENCY = concurrencyArg ? parseInt(concurrencyArg.split("=")[1]!) : 8

// Directories to skip when traversing (but NOT "commands" — that's our target)
const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", ".cache",
  "scripts", "template", "docs", "agents", ".agents",
])

// Skip non-repo entries in the repos dir
const SKIP_REPO_ENTRIES = new Set([
  "scripts", "index.json",
  "search-1-translation.json", "search-2-specification.json", "search-3-structural.json",
])

// Command container directory names to look for
const COMMAND_DIRS = new Set(["commands"])

// Files to skip even if found inside command dirs
const SKIP_FILES = new Set(["index.md", "README.md"])

// ── Types ───────────────────────────────────────────────────────────────────

interface CommandCandidate {
  name: string
  absPath: string
  repo: string
  contentHash: string
  size: number
  hasFrontmatter: boolean
}

interface DedupeResult {
  winner: CommandCandidate
  dupes: CommandCandidate[]
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

function hasFrontmatter(content: string): boolean {
  return content.startsWith("---\n") && content.includes("\n---\n")
}

function commandName(filePath: string): string {
  return basename(filePath)
    .replace(/\.md$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
}

/** Recursively find all command markdown files. */
async function findCommandFiles(
  dir: string,
  repo: string,
  depth = 0,
  maxDepth = 6
): Promise<CommandCandidate[]> {
  if (depth > maxDepth) return []
  const candidates: CommandCandidate[] = []
  let entries: Awaited<ReturnType<typeof readdir>>
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }

  for (const entry of entries) {
    // Allow hidden dirs only if they are known containers like .claude
    if (entry.name.startsWith(".") && entry.name !== ".claude" && entry.name !== ".opencode") continue
    if (SKIP_DIRS.has(entry.name)) continue

    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      if (COMMAND_DIRS.has(entry.name)) {
        // Scan this dir for .md files (flat, no recursion)
        let cmdEntries: Awaited<ReturnType<typeof readdir>>
        try {
          cmdEntries = await readdir(fullPath, { withFileTypes: true })
        } catch {
          continue
        }
        for (const ce of cmdEntries) {
          if (!ce.isFile()) continue
          if (extname(ce.name).toLowerCase() !== ".md") continue
          if (SKIP_FILES.has(ce.name)) continue
          const filePath = join(fullPath, ce.name)
          try {
            const content = await readFile(filePath, "utf-8")
            candidates.push({
              name: commandName(filePath),
              absPath: filePath,
              repo,
              contentHash: sha256(content),
              size: content.length,
              hasFrontmatter: hasFrontmatter(content),
            })
          } catch { /* skip */ }
        }
      } else {
        candidates.push(...(await findCommandFiles(fullPath, repo, depth + 1, maxDepth)))
      }
    }
  }
  return candidates
}

function deduplicateCommands(candidates: CommandCandidate[]): Map<string, DedupeResult> {
  const byName = new Map<string, CommandCandidate[]>()
  for (const c of candidates) {
    const existing = byName.get(c.name) ?? []
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
      if (a.hasFrontmatter !== b.hasFrontmatter) return a.hasFrontmatter ? -1 : 1
      return b.size - a.size
    })
    results.set(name, { winner: sorted[0]!, dupes: sorted.slice(1) })
  }
  return results
}

async function runRogueBatch(
  commands: Array<{ name: string; absPath: string; repo: string; contentHash: string }>,
  outputDir: string,
  concurrency: number
): Promise<{ succeeded: string[]; failed: Array<{ name: string; error: string }> }> {
  const succeeded: string[] = []
  const failed: Array<{ name: string; error: string }> = []

  for (let i = 0; i < commands.length; i += concurrency) {
    const batch = commands.slice(i, i + concurrency)
    await Promise.all(batch.map(async (cmd) => {
      try {
        const result = await $`rogue command ${cmd.absPath} --to=opencode --output=${outputDir}`.quiet()
        if (result.exitCode !== 0) {
          throw new Error(result.stderr.toString().trim() || `exit code ${result.exitCode}`)
        }
        succeeded.push(cmd.name)
      } catch (err: any) {
        failed.push({ name: cmd.name, error: err.message || String(err) })
      }
    }))

    const done = Math.min(i + concurrency, commands.length)
    if (done % 50 === 0 || done === commands.length) {
      process.stdout.write(`\r  Progress: ${done}/${commands.length} (${succeeded.length} ok, ${failed.length} err)`)
    }
  }
  process.stdout.write("\n")
  return { succeeded, failed }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Scanning repos for commands...\n")

  await mkdir(COMMANDS_DIR, { recursive: true })

  const repoEntries = await readdir(REPOS_DIR, { withFileTypes: true })
  const repos = repoEntries
    .filter((e) => e.isDirectory() && !SKIP_REPO_ENTRIES.has(e.name) && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort()

  const allCandidates: CommandCandidate[] = []
  for (const repo of repos) {
    const candidates = await findCommandFiles(join(REPOS_DIR, repo), repo)
    allCandidates.push(...candidates)
    if (candidates.length > 0) console.log(`  ${repo}: ${candidates.length} commands`)
  }
  console.log(`\nTotal candidates: ${allCandidates.length}`)

  const deduped = deduplicateCommands(allCandidates)
  const totalDupes = [...deduped.values()].reduce((sum, r) => sum + r.dupes.length, 0)
  const withDupes = [...deduped.values()].filter((r) => r.dupes.length > 0).length
  const withoutFm = [...deduped.values()].filter((r) => !r.winner.hasFrontmatter).length

  console.log(`\nUnique commands: ${deduped.size}`)
  console.log(`  Duplicates removed: ${totalDupes} (across ${withDupes} names)`)
  console.log(`  Without frontmatter: ${withoutFm}`)

  if (REPORT_ONLY) {
    console.log(`\n(--report mode, no changes made)`)
    return
  }

  // Load manifest
  let manifest = new Map<string, ManifestEntry>()
  try {
    const raw = await readFile(MANIFEST_PATH, "utf-8")
    const entries: ManifestEntry[] = JSON.parse(raw)
    for (const e of entries) manifest.set(e.name, e)
  } catch { /* no manifest yet */ }

  // Determine what to import
  const toImport: Array<{ name: string; absPath: string; repo: string; contentHash: string }> = []
  let skipped = 0

  for (const [name, result] of deduped) {
    const winner = result.winner
    const existing = manifest.get(name)
    if (!FORCE && existing && existing.contentHash === winner.contentHash) {
      skipped++
      continue
    }
    toImport.push({ name, absPath: winner.absPath, repo: winner.repo, contentHash: winner.contentHash })
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

  console.log(`\nRunning rogue conversions (concurrency=${CONCURRENCY})...`)
  const { succeeded, failed } = await runRogueBatch(toImport, COMMANDS_DIR, CONCURRENCY)

  // Update manifest
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

  const manifestData = [...manifest.values()].sort((a, b) => a.name.localeCompare(b.name))
  await Bun.write(MANIFEST_PATH, JSON.stringify(manifestData, null, 2))

  console.log(`\nDone!`)
  console.log(`  Imported: ${succeeded.length}`)
  console.log(`  Skipped (unchanged): ${skipped}`)
  console.log(`  Failed: ${failed.length}`)
  console.log(`  Total in manifest: ${manifest.size}`)

  if (failed.length > 0) {
    console.log(`\nFailed commands:`)
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
