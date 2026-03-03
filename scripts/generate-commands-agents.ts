#!/usr/bin/env bun
/**
 * generate-commands-agents.ts
 *
 * Scans files/commands/*.md and files/agents/*.md and appends them as
 * OCX command/agent components to registry.jsonc.
 *
 * Safe to re-run: skips components already present by name.
 *
 * Usage:
 *   bun scripts/generate-commands-agents.ts
 *   bun scripts/generate-commands-agents.ts --dry-run
 */

import { readdirSync, readFileSync } from "node:fs"
import { join, basename } from "node:path"

const ROOT = join(import.meta.dirname, "..")
const REGISTRY_PATH = join(ROOT, "registry.jsonc")
const DRY_RUN = process.argv.includes("--dry-run")

// ── Parse frontmatter description ────────────────────────────────────────────

function parseDescription(content: string): string {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/m)
  if (!match) return ""
  const descMatch = match[1]?.match(/^description:\s*(.+)$/m)
  return descMatch?.[1]?.trim() ?? ""
}

// ── Scan a directory for .md files ───────────────────────────────────────────

interface Component {
  name: string
  type: "command" | "agent"
  description: string
  filePath: string // relative to files/
}

function scanDir(dir: string, type: "command" | "agent"): Component[] {
  const entries = readdirSync(join(ROOT, "files", dir))
  return entries
    .filter(f => f.endsWith(".md"))
    .map(f => {
      const content = readFileSync(join(ROOT, "files", dir, f), "utf-8")
      const name = basename(f, ".md")
      const description = parseDescription(content) || `${name} ${type}`
      return { name, type, description, filePath: `${dir}/${f}` }
    })
}

const components: Component[] = [
  ...scanDir("commands", "command"),
  ...scanDir("agents", "agent"),
]

// ── Check which are already in registry ──────────────────────────────────────

const registryText = readFileSync(REGISTRY_PATH, "utf-8")
const existingNames = new Set([...registryText.matchAll(/"name":\s*"([^"]+)"/g)].map(m => m[1]))

const newComponents = components.filter(c => !existingNames.has(c.name))

console.log(`Found: ${components.length} (${components.filter(c => c.type === "command").length} commands, ${components.filter(c => c.type === "agent").length} agents)`)
console.log(`To add: ${newComponents.length} (${newComponents.length - newComponents.filter(c => c.type === "agent").length} commands, ${newComponents.filter(c => c.type === "agent").length} agents)`)
for (const c of newComponents) {
  console.log(`  + [${c.type}] ${c.name}`)
}

if (newComponents.length === 0 || DRY_RUN) {
  if (DRY_RUN) console.log("\n[dry-run] No changes written.")
  process.exit(0)
}

// ── Serialize ─────────────────────────────────────────────────────────────────

function serializeComponent(c: Component): string {
  const desc = c.description ? `\n      "description": ${JSON.stringify(c.description)},` : ""
  return `    {
      "name": "${c.name}",
      "type": "${c.type}",${desc}
      "files": [
        {
          "path": "${c.filePath}",
          "target": "${c.filePath}"
        }
      ]
    }`
}

// ── Inject before final `  ]\n}` ─────────────────────────────────────────────

const tail = "\n  ]\n}"
if (!registryText.trimEnd().endsWith(tail)) {
  throw new Error(`registry.jsonc doesn't end with expected "${tail}"`)
}

const insertAt = registryText.lastIndexOf(tail)
const before = registryText.slice(0, insertAt)
const newEntries = newComponents.map(serializeComponent).join(",\n")
const updated = before + ",\n" + newEntries + "\n" + tail

await Bun.write(REGISTRY_PATH, updated)
console.log(`\nDone. Run 'bun run build' to rebuild dist.`)
