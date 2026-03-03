#!/usr/bin/env bun
/**
 * generate-bundles.ts
 *
 * Reads bundles.json + workflows.json from antigravity-awesome-skills and
 * appends OCX bundle components (no files, only dependencies) to registry.jsonc.
 *
 * Safe to re-run: skips bundles already present by name.
 *
 * Usage:
 *   bun scripts/generate-bundles.ts
 *   bun scripts/generate-bundles.ts --dry-run
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"

const ROOT = join(import.meta.dirname, "..", "..")
const REGISTRY_PATH = join(ROOT, "registry.jsonc")
const INDEX_PATH = join(ROOT, "packages/registry/skill-index.json")

const BUNDLES_SRC = "/Users/jordan/j/llms/packages/repos/antigravity-awesome-skills-main/data/bundles.json"
const WORKFLOWS_SRC = "/Users/jordan/j/llms/packages/repos/antigravity-awesome-skills-main/data/workflows.json"

const DRY_RUN = process.argv.includes("--dry-run")

// ── Sanitize (must match generate-registry.ts) ────────────────────────────────

function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

// ── Load data ─────────────────────────────────────────────────────────────────

const bundlesSrc = JSON.parse(readFileSync(BUNDLES_SRC, "utf-8"))
const workflowsSrc = JSON.parse(readFileSync(WORKFLOWS_SRC, "utf-8"))
const index: { name: string }[] = JSON.parse(readFileSync(INDEX_PATH, "utf-8"))
const ourSkills = new Set(index.map((s) => s.name))

// ── Resolve skill names into registry names ───────────────────────────────────

function resolveSkills(names: string[]): string[] {
  const resolved: string[] = []
  for (const name of names) {
    const sanitized = sanitizeName(name)
    if (ourSkills.has(sanitized)) {
      resolved.push(sanitized)
    } else {
      // Try stripping namespace prefix: security/aws-* → aws-*
      const afterSlash = sanitizeName(name.split("/").pop()!)
      if (ourSkills.has(afterSlash)) {
        resolved.push(afterSlash)
      } else {
        console.warn(`  skipped (not in registry): ${name}`)
      }
    }
  }
  return [...new Set(resolved)]
}

// ── Build bundle list ─────────────────────────────────────────────────────────

interface Bundle {
  name: string
  description: string
  dependencies: string[]
}

const bundles: Bundle[] = []

// Named bundles
for (const [bundleName, bundle] of Object.entries(bundlesSrc.bundles) as [string, any][]) {
  const deps = resolveSkills(bundle.skills)
  bundles.push({ name: bundleName, description: bundle.description, dependencies: deps })
}

// common → common-essentials bundle
if (bundlesSrc.common?.length) {
  const deps = resolveSkills(bundlesSrc.common)
  bundles.push({
    name: "common-essentials",
    description: "Commonly used foundational skills across all domains.",
    dependencies: deps,
  })
}

// Workflows → one bundle per workflow (union of all step skills)
for (const workflow of workflowsSrc.workflows) {
  const allSkills: string[] = workflow.steps.flatMap((s: any) => s.recommendedSkills)
  const deps = resolveSkills(allSkills)
  bundles.push({
    name: `workflow-${workflow.id}`,
    description: workflow.description,
    dependencies: deps,
  })
}

// ── Read registry.jsonc and find which bundles are new ───────────────────────

const registryText = readFileSync(REGISTRY_PATH, "utf-8")
const existingNames = new Set([...registryText.matchAll(/"name":\s*"([^"]+)"/g)].map(m => m[1]))

const newBundles = bundles.filter(b => !existingNames.has(b.name))

console.log(`Bundles to add: ${newBundles.length} (${bundles.length - newBundles.length} already exist)`)
for (const b of newBundles) {
  console.log(`  + ${b.name} (${b.dependencies.length} deps)`)
}

if (newBundles.length === 0 || DRY_RUN) {
  if (DRY_RUN) console.log("\n[dry-run] No changes written.")
  process.exit(0)
}

// ── Serialize each bundle as a JSONC component entry ─────────────────────────

function serializeBundle(b: Bundle): string {
  const deps = b.dependencies.map(d => `        "${d}"`).join(",\n")
  return `    {
      "name": "${b.name}",
      "type": "bundle",
      "description": ${JSON.stringify(b.description)},
      "dependencies": [
${deps}
      ]
    }`
}

// ── Inject before the final closing `]` of the components array ──────────────
// Find the last `}` that closes the last component, then append after it.
// The file ends with: ...  }\n  ]\n}

const tail = "\n  ]\n}"
if (!registryText.trimEnd().endsWith(tail)) {
  throw new Error(`registry.jsonc doesn't end with expected "${tail}" — check formatting`)
}

// Everything up to and including the last component's closing brace
const insertAt = registryText.lastIndexOf(tail)
const before = registryText.slice(0, insertAt)
const newEntries = newBundles.map(serializeBundle).join(",\n")
const updated = before + ",\n" + newEntries + "\n" + tail

await Bun.write(REGISTRY_PATH, updated)
console.log(`\nDone. Run 'bun run build' to rebuild dist.`)
