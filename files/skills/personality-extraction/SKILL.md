---
name: personality-extraction
description: "Extract structured rhetorical and tonal patterns from personality-driven writing using langextract-mcp. Use when analysing a body of work by a single author to build a validated taxonomy of rhetorical moves, mood profiles, or linguistic patterns for training, prompting, or evaluating personality-based AI agents. Triggers on: personality extraction, rhetorical analysis, writing style analysis, author voice, mood taxonomy, agent personality, langextract."
---

# Personality Extraction Skill

Extract structured rhetorical and tonal patterns from a body of writing to produce a
validated, reusable schema for personality-based AI agents.

## When to Use

Use this skill when:
- Analysing a body of writing by a single author to understand how they construct humour,
  provocation, persuasion, or a distinctive voice
- Building a schema to train or prompt a personality-based AI agent
- Extracting mood profiles or rhetorical move taxonomies from any personality-driven content

Requires `langextract-mcp` to be available as an MCP tool.

---

## Four-Phase Process

### Phase 1 — Mood Extraction

**Purpose:** Establish tonal range before structural analysis. Produces signal, not schema.

**Tool:** `extract_from_text`

**prompt_description:**
```
Analyze the text to extract distinct personality moods and linguistic tones. For each
mood found, identify the 'name' of the mood, a 'hint' describing the specific way this
mood is expressed through word choice or sentence structure, and an intensity 'score'
between 0.0 and 1.0.
```

**Extraction structure:**
```json
{
  "extraction_class": "mood",
  "extraction_text": "<quoted span>",
  "attributes": { "hint": "<how this mood manifests>", "score": 0.0 }
}
```

**Parameters:** `temperature: 0.3`, `extraction_passes: 2`

**Run on:** 5–8 representative passages. Save output immediately with `save_extraction_results`.

**Look for:** Co-occurring moods, consistent high-score moods, rare peak-intensity moods.

---

### Phase 2 — Open Exploration

**Purpose:** Surface raw rhetorical mechanics without constraining vocabulary. This is the
most important phase — do not skip it or collapse it into Phase 3.

**Tool:** `extract_from_text`

**prompt_description:**
```
Identify the specific rhetorical moves used to construct humour or provocation in this
text. For each move found, name it as precisely as possible, quote the exact span of
text that performs the move, and describe what the move is actually doing beneath the
surface — the gap between what is stated and what is meant, or the mechanism by which
confusion, mockery, or absurdity is produced. Do not use broad mood labels. Be as
granular and specific as possible.
```

**Extraction structure:**
```json
{
  "extraction_class": "rhetorical_move",
  "extraction_text": "<quoted span>",
  "attributes": {
    "move": "<precise name invented by the model>",
    "mechanism": "<one sentence: the gap between stated and meant>"
  }
}
```

**Parameters:** `temperature: 0.2`, `extraction_passes: 2`

**Run on:** 3–4 passages chosen for mechanical diversity (different formats, different targets).
Provide 2–4 seed examples to anchor the format, not the vocabulary.

**Look for:** Move names that recur across passages (natural clusters), strong `mechanism`
descriptions, and patterns that don't fit prior assumptions about the author.

---

### Phase 3 — Taxonomy Synthesis

**Purpose:** Collapse raw Phase 2 move names into a controlled vocabulary of 5–10 types.
Do this by hand — the model should not drive this step.

**How to synthesise:**
1. List every distinct move name from Phase 2 output
2. Group by underlying mechanism, not surface name
3. Name each group in `UPPER_SNAKE_CASE`
4. Write a 2–3 sentence definition specifying: what the author does, what the target
   experiences, what distinguishes this move from adjacent ones

**Signs of a good taxonomy:**
- Every type appears ≥3 times across the corpus
- No two types could be confused given a single example
- Any new passage can be classified without ambiguity
- Remainder rate (unclassifiable moves) is below 10%

**Signs of a bad taxonomy:**
- Types defined by topic rather than mechanism
- Types that are sub-types of each other
- Fewer than 5 or more than 12 types
- Types that require inferring author intent

See `references/taxonomy-guide.md` for the full synthesis checklist and the David Thorne
validated taxonomy as a worked reference.

---

### Phase 4 — Schema Validation

**Purpose:** Run the finalised taxonomy against the full corpus to confirm coverage and
produce the canonical extraction dataset.

**Tool:** `extract_from_text`

**prompt_description template:**
```
Extract rhetorical moves from this text using exactly the [N] move types defined below.
For each instance found, classify it using the exact move name, quote the precise text
span that performs the move, and write a one-sentence mechanism describing what the move
is doing in this specific instance.

[MOVE_TYPE_1]: [definition]
[MOVE_TYPE_2]: [definition]
...
```

**Parameters:** `temperature: 0.2`, `extraction_passes: 2`

**Chunking:** Keep each call to ~400 words of source text. Run chunks in parallel.
See the chunking note below — timeouts are a client-side issue, not a server issue.

**Validation checks:**
- Any move type never found → definition too narrow, or the move doesn't exist
- Any move type in >60% of extractions → too broad, consider splitting
- Any passage producing zero extractions → passage type may be outside the taxonomy
- Spot-check 10 `mechanism` fields — are they specific or generic?

**Save output:** `save_extraction_results` → `generate_visualization`

---

## Extending to a New Author

1. **Gather corpus** — 15–30 passages covering the author's range. Include different
   formats, different targets, and passages you suspect are atypical. Store as a JSON
   array: `[{ "type", "title", "full_text", "source_url" }]`.

2. **Phase 1 on a sample** — 5–8 passages. Read results before proceeding. Do not
   carry a previous author's mood taxonomy forward.

3. **Phase 2 on diverse passages** — Choose for mechanical diversity, not tonal diversity.

4. **Synthesise with fresh eyes** — Move types must emerge from the text. Do not impose
   a prior taxonomy.

5. **Validate and iterate** — If coverage is poor, return to Phase 2 with uncovered
   passages. One iteration is usually enough.

---

## File Conventions

```
<project-dir>/
  <author-slug>.json                      # Source corpus
  <author-slug>-moods.jsonl               # Phase 1 output
  <author-slug>-moods.html                # Phase 1 visualisation
  <author-slug>-exploration.jsonl         # Phase 2 output (intermediate)
  <author-slug>-rhetorical-moves.jsonl    # Phase 4 canonical output
  <author-slug>-rhetorical-moves.html     # Phase 4 visualisation
  <author-slug>-schema.json               # Taxonomy + canonical examples
```

The `<author-slug>-schema.json` file is the primary deliverable. It contains the full
taxonomy with definitions, extraction config, and one canonical example per move type.
See `assets/david-thorne-schema.json` for a complete worked example.

---

## Chunking and Timeouts

`extract_from_text` processes text in `max_char_buffer` chunks (default 1000 chars) using
parallel workers. Large texts with `extraction_passes: 2` can exceed client-side timeouts
even when the server is healthy.

**Rule of thumb:** ~400 words per call with `extraction_passes: 2`. Run chunks in parallel.

If a call times out, verify the server is still running before retrying:
```bash
ps aux | grep fastmcp
```
Split the text and retry. Do not restart the server.
