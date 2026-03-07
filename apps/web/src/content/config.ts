import { z, defineCollection } from "astro:content"

// Component collection schema (merged from all data sources)
const components = defineCollection({
  type: "data",
  schema: z.object({
    // From index.json (required)
    name: z.string(),
    type: z.enum(["skill", "plugin", "agent", "command", "bundle", "profile"]),
    description: z.string(),

    // From taxonomy.json (optional)
    domain: z.string().optional(),
    subdomain: z.string().optional(),
    specialty: z.string().optional(),
    quality: z.number().min(1).max(5).optional(),
    qualityReason: z.string().optional(),
    tags: z.array(z.string()).default([]),
    bundleHints: z.array(z.string()).default([]),

    // From skill-index.json
    capabilities: z.array(z.string()).default([]),
    author: z.string().optional(),

    // From skill-report.json (optional — only skills with reports)
    icon: z.string().optional(),
    version: z.string().optional(),
    license: z.string().optional(),
    supportedTools: z.array(z.string()).default([]),
    riskLevel: z.enum(["low", "medium", "high", "critical", "safe"]).optional(),
    safeToPublish: z.boolean().optional(),
    securitySummary: z.string().optional(),
    valueStatement: z.string().optional(),
    userTitle: z.string().optional(),
    limitations: z.array(z.string()).default([]),
    useCases: z
      .array(
        z.object({
          targetUser: z.string().default(""),
          title: z.string().default(""),
          description: z.string().default(""),
        })
      )
      .default([]),
    promptTemplates: z
      .array(
        z.object({
          title: z.string().default(""),
          scenario: z.string().default(""),
          prompt: z.string().default(""),
        })
      )
      .default([]),
    bestPractices: z.array(z.string()).default([]),
    antiPatterns: z.array(z.string()).default([]),
    faq: z
      .array(
        z.object({
          question: z.string().default(""),
          answer: z.string().default(""),
        })
      )
      .default([]),
    seoKeywords: z.array(z.string()).default([]),

    // Meta
    sourceUrl: z.string().optional(),
    sourceType: z.string().optional(),

    // Bundle-specific
    dependencies: z.array(z.string()).default([]),
  }),
})

// Bundle collection schema
const bundles = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    description: z.string(),
    dependencies: z.array(z.string()),
  }),
})

export const collections = { components, bundles }
