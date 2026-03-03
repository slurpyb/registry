#!/usr/bin/env bun
/**
 * generate-registry.ts
 *
 * Scans files/skills/ for all skill directories, extracts metadata from
 * SKILL.md frontmatter, collects all files, and writes registry.jsonc
 * with explicit { source, target } mappings for every file.
 *
 * Usage:
 *   bun scripts/generate-registry.ts            # write registry.jsonc
 *   bun scripts/generate-registry.ts --dry-run  # preview JSON to stdout
 */

import { readdir, readFile, stat } from "node:fs/promises"
import { join, relative } from "node:path"

// ── Config ──────────────────────────────────────────────────────────────────

const ROOT = join(import.meta.dirname, "..")
const FILES_DIR = join(ROOT, "files")
const SKILLS_DIR = join(FILES_DIR, "skills")
const PLUGINS_DIR = join(FILES_DIR, "plugins")
const REGISTRY_PATH = join(ROOT, "registry.jsonc")
const DRY_RUN = process.argv.includes("--dry-run")

// ── Types ───────────────────────────────────────────────────────────────────

interface FileMapping {
  path: string
  target: string
}

interface ComponentEntry {
  name: string
  type: string
  description: string
  files: FileMapping[]
}

interface Registry {
  $schema: string
  name: string
  version: string
  author: string
  opencode: string
  ocx: string
  components: ComponentEntry[]
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Recursively collect all files under a directory (skips .DS_Store but follows hidden dirs). */
async function collectFiles(dir: string): Promise<string[]> {
  const results: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      results.push(...(await collectFiles(fullPath)))
    } else {
      results.push(fullPath)
    }
  }

  return results.sort()
}

/** Extract `description` from YAML frontmatter in SKILL.md. */
function extractDescription(content: string): string {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) return ""

  const frontmatter = fmMatch?.[1]
  if (!frontmatter) return ""

  // Handle multi-line description (quoted or flowing)
  const descMatch = frontmatter.match(
    /^description:\s*["']?([\s\S]*?)["']?\s*(?:\n\w|\n---|$)/m
  )
  if (!descMatch?.[1]) return ""

  // Clean up: collapse newlines, trim
  return descMatch[1].replace(/\n\s*/g, " ").trim()
}

/** Sanitize a directory name into a valid OCX component name. */
function sanitizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")   // replace invalid chars with hyphens
    .replace(/-{2,}/g, "-")         // collapse consecutive hyphens
    .replace(/^-|-$/g, "")          // trim leading/trailing hyphens
}

/** Build a single component entry from a skill directory. */
async function buildEntry(skillDir: string): Promise<ComponentEntry | null> {
  const rawName = skillDir.split("/").pop()!
  const name = sanitizeName(rawName)

  if (!name) {
    console.warn(`  SKIP ${rawName}: name sanitizes to empty string`)
    return null
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    console.warn(`  SKIP ${rawName}: invalid name after sanitization: "${name}"`)
    return null
  }

  const skillMdPath = join(skillDir, "SKILL.md")

  // Every skill must have a SKILL.md
  try {
    await stat(skillMdPath)
  } catch {
    console.warn(`  SKIP ${name}: no SKILL.md found`)
    return null
  }

  const skillContent = await readFile(skillMdPath, "utf-8")
  const description = extractDescription(skillContent)

  if (!description) {
    console.warn(`  SKIP ${name}: missing description in SKILL.md frontmatter`)
    return null
  }

  const allFiles = await collectFiles(skillDir)

  // Build explicit { source, target } mappings
  // source = path relative to files/ (what OCX reads from)
  // target = same path (skills install to their matching location)
  const files: FileMapping[] = allFiles.map((absPath) => {
    const relPath = relative(FILES_DIR, absPath)
    return {
      path: relPath,
      target: relPath,
    }
  })

  return {
    name,
    type: "skill",
    description,
    files,
  }
}

/** Build a single component entry from a plugin directory. */
async function buildPluginEntry(pluginDir: string): Promise<ComponentEntry | null> {
  const pluginLabel = relative(PLUGINS_DIR, pluginDir) || pluginDir
  const manifestPath = join(pluginDir, ".claude-plugin", "plugin.json")
  let rawManifest: string

  try {
    rawManifest = await readFile(manifestPath, "utf-8")
  } catch {
    console.warn(`  SKIP ${pluginLabel}: missing .claude-plugin/plugin.json`)
    return null
  }

  let manifest: Record<string, unknown>

  try {
    manifest = JSON.parse(rawManifest)
  } catch {
    console.warn(`  SKIP ${pluginLabel}: invalid JSON in plugin manifest`)
    return null
  }

  const rawName = typeof manifest.name === "string" ? manifest.name.trim() : ""
  const name = sanitizeName(rawName)
  if (!name) {
    console.warn(`  SKIP ${pluginLabel}: invalid or missing name in plugin manifest`)
    return null
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    console.warn(`  SKIP ${pluginLabel}: name "${name}" is not a valid component name`)
    return null
  }

  const description = typeof manifest.description === "string" ? manifest.description.trim() : ""
  if (!description) {
    console.warn(`  SKIP ${pluginLabel}: missing description in plugin manifest`)
    return null
  }

  const allFiles = await collectFiles(pluginDir)
  const files: FileMapping[] = allFiles.map((absPath) => {
    const relPath = relative(FILES_DIR, absPath)
    return {
      path: relPath,
      target: relPath,
    }
  })

  return {
    name,
    type: "plugin",
    description,
    files,
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Scanning skills directories...")

  const skillDirs = await readdir(SKILLS_DIR, { withFileTypes: true })
  const dirs = skillDirs
    .filter((d) => d.isDirectory() && d.name !== ".DS_Store")
    .map((d) => join(SKILLS_DIR, d.name))
    .sort()

  console.log(`Found ${dirs.length} skill directories\n`)

  const entries: ComponentEntry[] = []

  for (const dir of dirs) {
    const entry = await buildEntry(dir)
    if (entry) {
      entries.push(entry)
      const fileCount = entry.files.length
      console.log(`  OK  ${entry.name} (${fileCount} file${fileCount !== 1 ? "s" : ""})`)
    }
  }

  console.log("\nScanning plugin directories...")

  let pluginDirs: string[] = []
  let pluginsDirMissing = false

  try {
    const pluginEntries = await readdir(PLUGINS_DIR, { withFileTypes: true })
    pluginDirs = pluginEntries
      .filter((d) => d.isDirectory() && d.name !== ".DS_Store")
      .map((d) => join(PLUGINS_DIR, d.name))
      .sort()
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      pluginsDirMissing = true
    } else {
      throw err
    }
  }

  const pluginCountMessage = pluginsDirMissing
    ? "Found 0 plugin directories (plugins folder missing)\n"
    : `Found ${pluginDirs.length} plugin directories\n`
  console.log(pluginCountMessage)

  for (const dir of pluginDirs) {
    const entry = await buildPluginEntry(dir)
    if (entry) {
      entries.push(entry)
      const fileCount = entry.files.length
      console.log(`  OK  ${entry.name} (${fileCount} file${fileCount !== 1 ? "s" : ""})`)
    }
  }

  const registry: Registry = {
    $schema: "https://ocx.kdco.dev/schemas/v2/registry.json",
    name: "Slurpyb Registry",
    version: "0.0.1",
    author: "Jordan Sweeting",
    opencode: "1.0.0",
    ocx: "1.0.16",
    components: entries,
  }

  // Serialize as JSONC with comments at top
  const header = `{
  // OCX Registry — auto-generated by scripts/generate-registry.ts
  // Re-run: bun scripts/generate-registry.ts
  //
  // Schema reference: https://ocx.kdco.dev/schema.json
  // Documentation: https://github.com/kdcokenny/ocx

`
  const body = JSON.stringify(registry, null, 2)

  // Merge: replace opening "{" with our header, keep the rest
  const jsoncContent = header + body.slice(2) // skip "{\n"

  if (DRY_RUN) {
    console.log("\n--- DRY RUN (would write to registry.jsonc) ---\n")
    console.log(jsoncContent)
  } else {
    await Bun.write(REGISTRY_PATH, jsoncContent)
    console.log(`\nWrote ${entries.length} components to registry.jsonc`)
  }
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
