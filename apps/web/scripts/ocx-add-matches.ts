#!/usr/bin/env bun
/**
 * Reads extracted-matches.json and runs `ocx add slurpyb/{name}` for each match.
 *
 * Usage:
 *   bun run scripts/ocx-add-matches.ts
 *   bun run scripts/ocx-add-matches.ts --dry-run
 */
import { readFileSync } from "fs";
import { $ } from "bun";

const dryRun = process.argv.includes("--dry-run");
const data = JSON.parse(
  readFileSync(new URL("../extracted-matches.json", import.meta.url), "utf-8")
);
const names: string[] = data.matches.map((m: { name: string }) => m.name);

console.log(`${dryRun ? "[DRY RUN] " : ""}Adding ${names.length} components...`);

let success = 0;
let fail = 0;

for (const name of names) {
  const ref = `slurpyb/${name}`;
  if (dryRun) {
    console.log(`  ocx add ${ref}`);
    success++;
    continue;
  }
  try {
    await $`ocx add ${ref}`.quiet();
    success++;
    console.log(`  ✓ ${ref}`);
  } catch {
    fail++;
    console.log(`  ✗ ${ref}`);
  }
}

console.log(`\nDone: ${success} added, ${fail} failed out of ${names.length} total`);
