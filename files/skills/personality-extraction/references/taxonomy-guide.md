# Taxonomy Synthesis Guide

Reference for Phase 3 of the personality extraction process. Use when collapsing raw
Phase 2 move names into a controlled vocabulary.

---

## Synthesis Checklist

Work through these steps in order:

1. **Collect** — Export all `move` field values from Phase 2 JSONL output into a flat list
2. **Deduplicate** — Remove exact duplicates; keep near-duplicates for comparison
3. **Cluster** — Group names by the underlying mechanism they describe, not surface similarity
4. **Name** — Assign a single `UPPER_SNAKE_CASE` label to each cluster
5. **Define** — Write a 2–3 sentence definition per type (see template below)
6. **Test** — Apply the draft taxonomy to 5 new passages not used in Phase 2
7. **Iterate** — Adjust until remainder rate is below 10%

---

## Definition Template

Each move type definition must answer three questions:

```
[MOVE_TYPE_NAME]: 
  What the author is doing: ...
  What the target/reader experiences: ...
  What distinguishes this from adjacent moves: ...
```

Collapsed into 2–3 sentences for use in prompt_description:

```
MOVE_TYPE_NAME: [What the author does]. [What the target experiences or what effect is
produced]. [The distinguishing feature that separates this from the nearest adjacent type].
```

---

## Quality Criteria

### A good taxonomy has:
- Every type appearing ≥3 times across the full corpus
- No two types that could be confused given a single example
- Any new passage classifiable without ambiguity
- A remainder rate (unclassifiable moves) below 10%
- 5–12 types total (fewer = too coarse, more = too granular)

### A bad taxonomy has:
- Types defined by topic (e.g. "workplace humour", "parenting jokes") rather than mechanism
- Types that are sub-types of each other (e.g. "sarcasm" and "heavy sarcasm")
- Types requiring inference of author intent rather than observable text features
- Types that only appear in one or two passages (over-fitted to specific content)
- Types with definitions so broad they apply to most of the corpus

---

## Worked Example — David Thorne (7 moves)

Derived from 27bslash6.com. Validated against 20+ passages across email exchanges,
first-person articles, and ironic impersonations.

| Move | Definition |
|---|---|
| `BURDEN_TRANSFER` | Shifts obligation, blame, or discomfort onto the target while the author maintains innocence, generosity, or reasonableness. The target is left holding a problem the author created. Distinguished from FEIGNED_SINCERITY by the transfer of a concrete obligation, not just a performed register. |
| `FEIGNED_SINCERITY` | Performs a social or professional register — concern, apology, acceptance, enthusiasm, gratitude — with technical correctness while the actual meaning is the opposite. Cannot be challenged without the challenger appearing unreasonable. Distinguished from BURDEN_TRANSFER by the absence of a transferred obligation. |
| `ABSURDIST_ESCALATION` | Introduces a plausible or mundane premise then compounds it with increasingly specific, impossible, or disturbing detail, each step presented as a natural continuation. No single step is flagged as absurd — the cumulative effect produces the humour. Distinguished from PSEUDO_ACADEMIC_REGISTER by the escalating content rather than the formal register. |
| `IRONIC_IMPERSONATION` | Writes entirely as another person, adopting their voice, logic, and worldview, to expose the absurdity or menace of that perspective from the inside without authorial comment. The author disappears — the character condemns themselves. Distinguished from all other types by the complete absence of the author's own voice. |
| `PSEUDO_ACADEMIC_REGISTER` | Applies formal, clinical, legal, or scientific language and structure to trivial, absurd, or grotesque subject matter. The language is genuinely formal — not a parody of formality. The absurdity comes from the subject matter, not the register. Distinguished from ABSURDIST_ESCALATION by the register mismatch being the primary mechanism. |
| `RADICAL_UNDERSTATEMENT` | Follows an elaborate, disturbing, or absurd sequence with a single flat sentence that reveals the author's true position through its brevity and emotional vacancy. Length and flatness are the mechanism — the sentence lands because of what precedes it. Distinguished from all other types by its dependency on prior context for effect. |
| `RECONTEXTUALISATION` | Takes something the target said, did, or implied and reframes it entirely — as a compliment, a request, a logical proof, or a different category of thing — so that engaging with the reframe validates the author's absurd premise. The target must either accept the reframe or explicitly correct it — both options benefit the author. Distinguished from BURDEN_TRANSFER by the mechanism being cognitive (reframing) rather than obligatory (transferring). |

### Corpus frequency notes
- `ABSURDIST_ESCALATION` — very high (present in almost every passage)
- `BURDEN_TRANSFER`, `FEIGNED_SINCERITY`, `RECONTEXTUALISATION` — high
- `PSEUDO_ACADEMIC_REGISTER`, `RADICAL_UNDERSTATEMENT`, `IRONIC_IMPERSONATION` — medium

High frequency of a single type across an author's work is expected and valid — it
reflects that author's dominant technique, not a flaw in the taxonomy.

---

## Common Failure Modes

### Splitting too early
Resist naming a move type after a single memorable passage. If you can only find 1–2
examples, it's either a sub-type of something broader or a one-off.

### Mood contamination
Phase 1 mood labels (sardonic, deadpan, exasperated) will bleed into Phase 2 if you're
not careful. Move types must describe mechanism, not affect. "Sardonic delivery" is a
mood. "Performing concern while describing the target's suffering in graphic detail" is
a mechanism.

### Intent-dependent types
"Deliberate cruelty disguised as kindness" requires you to infer intent. "Performs a
care register while delivering content that increases the target's distress" does not.
Always describe what the text does, not what the author intended.

### Over-fitting to format
If a type only appears in email exchanges and never in articles, it may be a format
artefact rather than a genuine rhetorical move. Test across formats before committing.
