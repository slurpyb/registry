import type { Plugin } from "@opencode-ai/plugin"

const ORCHESTRATOR_MEMORY = `<memory-protocol>
You have access to a persistent memory tool (mcp_memory). Use it actively:

BEFORE any non-trivial task:
  memory({ mode: "search", query: "<topic>", limit: 5 })
  Review results before proceeding.

AFTER completing a non-trivial task, if you made a decision, discovered a constraint, or identified a pattern worth preserving:
  memory({ mode: "add", content: "...", tags: "...", type: "decision|pattern|constraint|feature" })

DO record: architectural decisions and their rationale, non-obvious constraints, cross-session patterns, intent behind implementation choices.
DO NOT record: implementation steps, obvious facts, things evident from reading the code.
</memory-protocol>`

const PLANNER_MEMORY = `<memory-protocol>
You have access to a persistent memory tool (mcp_memory). Use it actively:

BEFORE planning:
  memory({ mode: "search", query: "<topic>", limit: 5 })
  Check for prior decisions, constraints, or patterns relevant to this work.

AFTER finalizing a plan with significant architectural or design decisions:
  memory({ mode: "add", content: "...", tags: "...", type: "decision" })
</memory-protocol>`

export const MemoryPlugin: Plugin = async (_ctx) => {
  return {
    "experimental.chat.system.transform": async (
      input: { agent?: string; sessionID?: string },
      output: { system: string[] },
    ) => {
      if (input.agent === "build") {
        output.system.push(ORCHESTRATOR_MEMORY)
      } else if (input.agent === "plan") {
        output.system.push(PLANNER_MEMORY)
      }
    },
  }
}

export default MemoryPlugin
