---
description: "Full ship sequence — artifact-driven. Each phase produces a written artifact consumed by the next. Gates are not optional. No shortcuts."
---

# VENOM Ship Sequence

Six phases. Each one produces a written artifact. Each artifact gates the next phase.
Context can reset between phases — the artifacts survive. That's the point.

---

## Phase 1 — Understand

```
@venom-researcher [target area or question]
```

Researcher output writes to `.venom/work/research.md`:

```markdown
## [What Was Researched] — [date]

**Anatomy:**
- Entry point: [file:function]
- Key files: [list — one line each]
- Data flow: [A → B → C]

**Hot paths:** [what runs most, what's performance-critical]

**Dependencies:** [internal + external]

**Risks:** [specific — not generic]

**Unknowns:** [what couldn't be determined — what would resolve it]
```

**Gate:** Unknowns section must be addressed before Phase 2.
"I think it works like X" is not anatomy. Read it.

---

## Phase 2 — Clarify (before design, not after)

Read the research.md. Before the architect designs anything, surface what's ambiguous.

Ask these explicitly:
- What does "done" look like — specific, measurable?
- What cannot break — explicit constraints?
- Are there competing approaches the architect should know about?
- What did research leave uncertain?

Write answers into `.venom/work/clarifications.md` before proceeding.

**Gate:** Clarifications.md must exist and be non-empty before Phase 3.
An architect building on ambiguity produces the wrong architecture.

---

## Phase 3 — Design

```
@venom-architect [what needs to be built — reference research.md]
```

Architect reads research.md + clarifications.md. Output writes to `.venom/work/plan.md`:

```markdown
## Decision: [what is being designed]

**Context:** [why this decision exists]

**Decision:** [the choice]

**Trade-offs:**
- Gains: [specific]
- Costs: [specific]
- Risks: [specific]

**Alternatives rejected:** [list with reasons]

**Implementation contract:**
- Files to create: [exact paths]
- Files to modify: [exact paths + what changes]
- Tests required: [what to verify]

**Boundary:** [what this does NOT cover]
```

**Gate:** Implementation contract must be explicit enough that execution needs no new decisions.
If the builder would need to guess anything, the plan is incomplete.

---

## Phase 4 — Consistency Check

Before executing, verify research.md + clarifications.md + plan.md are coherent.

Read all three. Check:
- Does the plan address every risk in research.md?
- Does the plan respect every constraint in clarifications.md?
- Are there gaps in the implementation contract (files missing, edge cases unspecified)?
- Does the plan introduce new unknowns that weren't in the clarifications?

Write any gaps found back into clarifications.md. If gaps exist, return to Phase 3.
If clean, proceed.

**Gate:** No gaps. No contradictions. Plan is complete against all prior artifacts.

---

## Phase 5 — Build

Execute the implementation contract from plan.md.

For 3+ independent file changes:
```
Spawn venom-builder per independent unit (parallel)
Each unit: one atomic change, self-contained, revertable
Wave order: types → services → handlers → tests
```

After build, update `.venom/work/ACTIVE.md` with what changed.

**Gate:** Every file compiles. No TODOs. No placeholders.
If a gap is found — pause. Update plan.md. Do not improvise past it.

---

## Phase 6 — Review + Verify

```
/venom-review
```

Reviewer reads the implementation against plan.md — not against intent. Two questions:
- Does the implementation match the plan?
- Does the plan's decision hold given what was built?

Then:
```
/venom-check
```

Gate 5 audit:
- Tests pass
- Types valid
- Lint clean
- No new deps without reason
- VENOM state current
- Commit quality: atomic, revertable, message clear

**Gate:** No Level 2+ review issues unresolved. All /venom-check items clean.

When all gates pass: ship. Archive artifacts to `.venom/work/archive/[feature]/`.

---

*Every phase produces an artifact. Every artifact gates the next. The artifacts survive context resets. That's why they exist.*
