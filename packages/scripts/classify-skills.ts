#!/usr/bin/env bun
/**
 * classify-skills.ts
 *
 * Batch-classifies skills into a hierarchical taxonomy + quality score
 * using Qwen3-235B via Chutes API. Sends 50 skills per request.
 *
 * Input:  packages/registry/skill-index.json
 * Output: packages/registry/taxonomy.json
 *
 * Usage:
 *   CHUTES_API_TOKEN=... bun scripts/classify-skills.ts
 *   bun scripts/classify-skills.ts --dry-run
 *   bun scripts/classify-skills.ts --resume
 */

import { readFileSync, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const ROOT = join(import.meta.dirname, "..", "..")
const INDEX_PATH = join(ROOT, "packages/registry/skill-index.json")
const TAXONOMY_PATH = join(ROOT, "packages/registry/taxonomy.json")

const DRY_RUN = process.argv.includes("--dry-run")
const RESUME = process.argv.includes("--resume")

const API_KEY = process.env.CHUTES_API_TOKEN
const LLM_URL = "https://llm.chutes.ai/v1/chat/completions"
const MODEL = "Qwen/Qwen3-235B-A22B-Instruct-2507-TEE"
const BATCH_SIZE = 50
const CONCURRENCY = 3
const MAX_RETRIES = 6
const BASE_DELAY_MS = 3000
const MAX_TOKENS = 16384
const TEMPERATURE = 0.3

if (!DRY_RUN && !API_KEY) {
  console.error("Error: CHUTES_API_TOKEN not set. Use --dry-run to test.")
  process.exit(1)
}

// ── Types ───────────────────────────────────────────────────────────────────

interface SkillIndexEntry {
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
  quality: number        // 1-5
  qualityReason: string  // brief explanation
  bundleHints: string[]  // suggested bundle names this skill belongs to
}

// ── Taxonomy ────────────────────────────────────────────────────────────────

const TAXONOMY = `## Skill Taxonomy (use these exact domain/subdomain values)

web-development:
  frontend: react, vue, angular, svelte, astro, css, html, responsive, accessibility, design-systems, animations
  backend: node, express, fastapi, django, rails, graphql, rest, websockets, serverless
  fullstack: nextjs, nuxt, remix, sveltekit, full-stack-patterns
  cms: wordpress, contentful, sanity, strapi, headless-cms

devops:
  ci-cd: github-actions, jenkins, circleci, deployment, pipelines
  containers: docker, kubernetes, helm, orchestration
  cloud: aws, azure, gcp, cloudflare, vercel, netlify
  monitoring: observability, logging, alerting, apm, tracing
  iac: terraform, pulumi, bicep, cloudformation

ai-ml:
  agents: multi-agent, agent-design, orchestration, memory-systems, tool-use
  llm: prompting, fine-tuning, evaluation, rag, embeddings, context-engineering
  ml-ops: training, deployment, model-serving, pipelines
  computer-vision: image, video, 3d, labeling
  nlp: text-processing, translation, summarization, search

security:
  appsec: owasp, xss, injection, authentication, authorization
  pentesting: offensive, bug-bounty, reconnaissance, exploitation
  compliance: gdpr, hipaa, soc2, audit, policy
  cryptography: encryption, signing, key-management
  devsecops: sast, dast, dependency-scanning, container-security

data:
  databases: postgresql, mysql, mongodb, redis, sqlite, supabase, prisma, drizzle
  analytics: bi, dashboards, metrics, tracking
  pipelines: etl, streaming, batch, airflow, dbt
  visualization: charts, d3, dashboards, data-storytelling

mobile:
  ios: swift, swiftui, xcode
  android: kotlin, jetpack-compose
  cross-platform: react-native, flutter, expo, tamagui

languages:
  python: patterns, packaging, testing, async, typing
  typescript: patterns, types, tooling
  rust: patterns, wasm, systems
  go: patterns, concurrency
  cpp: patterns, testing, systems
  other: ruby, elixir, clojure, delphi, r, bash, shell

productivity:
  project-management: agile, sprints, issues, kanban, planning
  documentation: docs-generation, readme, api-docs, changelogs
  communication: email, slack, notifications, reports
  workflow: automation, cli-tools, scripts, git-workflow

design:
  ui-ux: wireframes, prototyping, user-research, ux-audit
  branding: typography, color-theory, brand-guidelines, logos
  accessibility: wcag, aria, screen-readers, contrast
  design-systems: tokens, components, patterns, style-guides

testing:
  unit: jest, vitest, pytest, testing-patterns
  e2e: playwright, cypress, selenium
  performance: load-testing, benchmarking, optimization
  quality: code-review, linting, static-analysis, refactoring

gaming:
  game-dev: unity, unreal, godot, bevy, threejs
  game-design: mechanics, narratives, level-design

business:
  marketing: seo, content-marketing, social-media, ads, copywriting
  sales: crm, outreach, lead-generation
  finance: accounting, trading, fintech, billing
  legal: contracts, compliance, ip

science:
  bioinformatics: genomics, proteomics, phylogenetics, databases
  chemistry: molecular, drug-discovery, cheminformatics
  research: papers, citations, data-analysis

tools:
  browser: automation, scraping, extensions, devtools
  cli: terminal, shell, command-line
  search: web-search, code-search, documentation-lookup
  editors: vscode, vim, cursor, ide-integration
  mcp: mcp-servers, mcp-tools, integrations

meta:
  agent-config: claude-code, opencode, codex, gemini, copilot, hooks, commands, skills-about-skills
  learning: tutorials, best-practices, patterns, onboarding`

// ── Prompt ──────────────────────────────────────────────────────────────────

function buildPrompt(batch: SkillIndexEntry[]): string {
  const skillLines = batch.map((s, i) =>
    `${i}: ${s.name} | ${s.description.slice(0, 200)}${s.tags.length ? ` [${s.tags.slice(0, 4).join(", ")}]` : ""}`
  ).join("\n")

  return `Classify each AI skill into the taxonomy below. Return a JSON array with one object per skill (same order).

${TAXONOMY}

For each skill return:
{
  "name": "skill-name",
  "domain": "exact domain from taxonomy",
  "subdomain": "exact subdomain from taxonomy",
  "specialty": "1-3 word specific focus within subdomain",
  "tags": ["3-6 specific tags beyond the taxonomy, useful for search"],
  "quality": 1-5,
  "qualityReason": "10 words max explaining score",
  "bundleHints": ["1-3 bundle names this skill naturally belongs to, e.g. 'python-stack', 'security-toolkit'"]
}

Quality scoring:
- 5: Highly specific, clear trigger, actionable instructions
- 4: Good specificity, useful description
- 3: Decent but generic or overlapping with common skills
- 2: Vague description, unclear purpose
- 1: Placeholder, template, or joke/game skill

Return ONLY a valid JSON array. No markdown, no explanation.

Skills to classify:
${skillLines}`
}

// ── LLM ─────────────────────────────────────────────────────────────────────

function stripThinking(content: string): string {
  const closed = content.replace(/<think>[\s\S]*?<\/think>/g, "")
  const open = closed.replace(/^<think>[\s\S]*$/, "")
  return open.trim()
}

async function classifyBatch(
  batch: SkillIndexEntry[],
  batchIdx: number,
  totalBatches: number,
): Promise<TaxonomyEntry[] | null> {
  const prompt = buildPrompt(batch)

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const t0 = Date.now()
    process.stdout.write(`  [${batchIdx}/${totalBatches}] ${batch.length} skills, attempt ${attempt}... `)

    let response: Response
    try {
      response = await fetch(LLM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: TEMPERATURE,
          max_tokens: MAX_TOKENS,
          // response_format: { type: "json_object" }, // not supported by all models
          messages: [{ role: "user", content: prompt }],
        }),
      })
    } catch (err) {
      console.log(`network error (${((Date.now() - t0) / 1000).toFixed(1)}s)`)
      await Bun.sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1))
      continue
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)

    if (response.status === 429) {
      console.log(`rate limited (${elapsed}s)`)
      await Bun.sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1))
      continue
    }

    if (!response.ok) {
      const err = await response.text()
      console.log(`HTTP ${response.status} (${elapsed}s): ${err.slice(0, 100)}`)
      await Bun.sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1))
      continue
    }

    const data = (await response.json()) as any
    const tokIn = data.usage?.prompt_tokens ?? "?"
    const tokOut = data.usage?.completion_tokens ?? "?"
    const raw = data.choices?.[0]?.message?.content ?? ""
    const cleaned = stripThinking(raw)

    try {
      let parsed: any
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        // Try extracting array from response
        const match = cleaned.match(/\[[\s\S]*\]/)
        if (match) {
          parsed = JSON.parse(match[0])
        } else {
          // Maybe it's wrapped in an object
          const objMatch = cleaned.match(/\{[\s\S]*\}/)
          if (objMatch) {
            const obj = JSON.parse(objMatch[0])
            // Look for an array property
            parsed = Object.values(obj).find(Array.isArray)
          }
          if (!parsed) throw new Error("No JSON array found")
        }
      }

      // Handle wrapped response (e.g. { "skills": [...] })
      const arr = Array.isArray(parsed)
        ? parsed
        : Object.values(parsed).find(Array.isArray) as any[]

      if (!arr || !Array.isArray(arr)) throw new Error("Not an array")

      console.log(`${arr.length}/${batch.length} classified (${tokIn}→${tokOut} tok, ${elapsed}s)`)

      // Map results back by index, filling gaps with defaults
      return batch.map((skill, i) => {
        const result = arr[i] ?? arr.find((r: any) => r.name === skill.name)
        return {
          name: skill.name,
          domain: result?.domain ?? "unknown",
          subdomain: result?.subdomain ?? "unknown",
          specialty: result?.specialty ?? "",
          tags: result?.tags ?? skill.tags,
          quality: result?.quality ?? 3,
          qualityReason: result?.qualityReason ?? "",
          bundleHints: result?.bundleHints ?? [],
        }
      })
    } catch (parseErr) {
      console.log(`parse error (${elapsed}s): ${String(parseErr).slice(0, 80)}`)
      if (attempt < MAX_RETRIES) {
        await Bun.sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1))
        continue
      }
      return null
    }
  }

  console.log(`  FAILED after ${MAX_RETRIES} retries`)
  return null
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!existsSync(INDEX_PATH)) {
    console.error(`Skill index not found. Run build-skill-index.ts first.`)
    process.exit(1)
  }

  const index: SkillIndexEntry[] = JSON.parse(readFileSync(INDEX_PATH, "utf-8"))
  console.log(`Skill Classification Pipeline`)
  console.log(`==============================`)
  console.log(`Model: ${MODEL}`)
  console.log(`Skills: ${index.length}`)
  console.log(`Batch size: ${BATCH_SIZE}`)
  console.log(`Concurrency: ${CONCURRENCY}`)

  // Load existing taxonomy for resume
  let existing = new Map<string, TaxonomyEntry>()
  if (RESUME && existsSync(TAXONOMY_PATH)) {
    const raw: TaxonomyEntry[] = JSON.parse(readFileSync(TAXONOMY_PATH, "utf-8"))
    for (const e of raw) existing.set(e.name, e)
    console.log(`Resuming: ${existing.size} already classified`)
  }

  const toClassify = RESUME
    ? index.filter((s) => !existing.has(s.name))
    : index

  const totalBatches = Math.ceil(toClassify.length / BATCH_SIZE)
  console.log(`To classify: ${toClassify.length} (${totalBatches} batches)\n`)

  if (DRY_RUN) {
    const sample = toClassify.slice(0, BATCH_SIZE)
    console.log(`[DRY RUN] Sample prompt:\n`)
    console.log(buildPrompt(sample))
    return
  }

  // Build batches
  const batches: SkillIndexEntry[][] = []
  for (let i = 0; i < toClassify.length; i += BATCH_SIZE) {
    batches.push(toClassify.slice(i, i + BATCH_SIZE))
  }

  // Process with concurrency pool
  const results: TaxonomyEntry[] = [...existing.values()]
  let completed = 0
  let failed = 0
  const startTime = Date.now()

  const queue = batches.map((batch, i) => async () => {
    const result = await classifyBatch(batch, i + 1, totalBatches)
    if (result) {
      results.push(...result)
      completed += result.length
    } else {
      failed += batch.length
    }

    // Save incrementally every 5 batches
    if ((i + 1) % 5 === 0 || i === batches.length - 1) {
      const sorted = results.sort((a, b) => a.name.localeCompare(b.name))
      await Bun.write(TAXONOMY_PATH, JSON.stringify(sorted, null, 2))
    }
  })

  const pool: Promise<void>[] = []
  for (const task of queue) {
    const p = task().then(() => { pool.splice(pool.indexOf(p), 1) })
    pool.push(p)
    if (pool.length >= CONCURRENCY) await Promise.race(pool)
  }
  await Promise.all(pool)

  // Final save
  const sorted = results.sort((a, b) => a.name.localeCompare(b.name))
  await Bun.write(TAXONOMY_PATH, JSON.stringify(sorted, null, 2))

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
  console.log(`\nDone in ${elapsed}s`)
  console.log(`  Classified: ${completed}`)
  console.log(`  Failed: ${failed}`)
  console.log(`  Total in taxonomy: ${sorted.length}`)

  // Stats
  const domains = new Map<string, number>()
  const qualities = [0, 0, 0, 0, 0, 0]
  for (const t of sorted) {
    domains.set(t.domain, (domains.get(t.domain) ?? 0) + 1)
    qualities[t.quality] = (qualities[t.quality] ?? 0) + 1
  }

  console.log(`\nDomain distribution:`)
  for (const [domain, count] of [...domains.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${domain}: ${count}`)
  }

  console.log(`\nQuality distribution:`)
  for (let q = 5; q >= 1; q--) {
    console.log(`  ${q}/5: ${qualities[q]} skills`)
  }

  console.log(`\nOutput: ${TAXONOMY_PATH}`)
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
