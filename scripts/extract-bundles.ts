import { readFileSync, writeFileSync } from "fs"
import { parse } from "jsonc-parser"

// Read registry.jsonc
const registryContent = readFileSync("registry.jsonc", "utf-8")
const registry = parse(registryContent)

// Extract bundles and non-bundles
const bundles = registry.components.filter((c: any) => c.type === "bundle")
const nonBundles = registry.components.filter((c: any) => c.type !== "bundle")

// Create bundles.jsonc with same structure
const bundlesRegistry = {
  ...registry,
  components: bundles,
}

// Update registry.jsonc with non-bundles only
const updatedRegistry = {
  ...registry,
  components: nonBundles,
}

// Write bundles.jsonc
writeFileSync(
  "bundles.jsonc",
  JSON.stringify(bundlesRegistry, null, 2) + "\n"
)

// Write updated registry.jsonc
writeFileSync(
  "registry.jsonc",
  JSON.stringify(updatedRegistry, null, 2) + "\n"
)

console.log(`✓ Extracted ${bundles.length} bundles to bundles.jsonc`)
console.log(`✓ Updated registry.jsonc with ${nonBundles.length} components`)
