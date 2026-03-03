---
description: Enhance user prompt
agent: plan
model: anthropic/claude-opus-4-6
---
Here is an instruction that I'd like to give you, but it needs to be improved. Rewrite and enhance this instruction to make it clearer, more specific, less ambiguous, and correct any mistakes. Do not use any tools: reply immediately with your answer, even if you're not sure. Consider the context of our conversation history when enhancing the prompt. If there is code in triple backticks (```) consider whether it is a code sample and should remain unchanged. **Always Include** XML tag structure with semantic tags such as: `<objective>`, `<context>`, `<requirements>`, `<constraints>`, `<output>`. Include **Contextual information** about the instruction, why it matters, what it's for, who will use it, and the end goal
Be explicit **Explicit: write specific instructions**. Unambiguous language telling an agent exactly what to do. Write **Sequential steps**: use numbered lists for clarity and precision. **File output instructions using relative paths**: `./filename` or `./subfolder/filename`. Reference to reading AGENTS.md and engram for project conventions. Explicit success criteria within `<success_criteria>` or `<verification>` tags.

$ARGUMENTS
