---
description: "Spec-driven feature workflow — constitution → specify → clarify → plan → tasks → build. Artifacts gate each phase. Each phase produces a written document consumed by the next."
---

# VENOM Spec — Feature Workflow

Build a new feature the right way. Not prompt → code. But: requirements → spec → clarify → plan → tasks → build.

Each phase produces a written artifact. Each artifact gates the next. Context can reset between phases — the artifacts survive. The specification IS the intelligence.

Use this for any non-trivial feature. Non-trivial means: more than one file, more than one session, more than one person.

---

## Phase 0 — Constitution (once per project)

The governing principles that all subsequent development must respect. Written once, referenced always.

If `.venom/work/constitution.md` doesn't exist yet, create it now. Ask:
- What are the code quality standards? (testing requirements, coverage expectations)
- What are the performance requirements? (latency budgets, scale targets)
- What are the design principles? (simplicity over cleverness, explicit over implicit)
- What are the security requirements? (auth, data handling, secrets)
- What are the constraints? (tech stack choices that cannot change, APIs that must stay stable)

Write to `.venom/work/constitution.md`:
```markdown
# Project Constitution

> Governing principles. All features are built against these.

## Code Quality
[standards — specific, not "write good code"]

## Performance
[requirements — measurable targets]

## Design Principles
[decisions already made — what patterns to use, what to avoid]

## Security
[requirements — auth model, data handling rules, secrets policy]

## Constraints
[what cannot change — existing APIs, tech stack, team conventions]
```

**Gate:** Constitution exists before any feature spec is written.
A feature that contradicts the constitution is wrong before the first line of code.

---

## Phase 1 — Specify

Describe **what** to build. Not how. Not the tech stack. What the user needs and why.

Think in user stories. Think in outcomes. Not in code.

Write to `.venom/work/features/[feature-name]/spec.md`:
```markdown
# [Feature Name] — Specification

## Problem
[What problem does this solve? Who has this problem? Why does it matter?]

## User Stories
- As a [user type], I want to [do something] so that [outcome].
- As a [user type], I want to [do something] so that [outcome].
[minimum 3, maximum 10 — each testable]

## Functional Requirements
- [requirement — specific, measurable, testable]
- [requirement]
[each requirement maps to one or more user stories]

## Out of Scope
[what this feature explicitly does NOT include]

## Success Criteria
[how we'll know this feature is done — observable, measurable]

## Review Checklist
- [ ] Each user story is independently testable
- [ ] Success criteria are measurable (not "it works well")
- [ ] Out of scope is explicit
- [ ] No implementation details in this document
```

**Gate:** Spec is complete and reviewed against checklist before planning.
Ambiguous specs produce wrong implementations. Resolve ambiguity in spec, not in code.

---

## Phase 2 — Clarify

Before planning, surface what's still underspecified.

Read spec.md. Find every place where the implementation could go in more than one direction — that's an ambiguity.

Ask:
- Is there any user story where "done" is unclear?
- Are there edge cases not covered by the functional requirements?
- Does the spec contradict the constitution in any way?
- Are there dependencies on other features not documented?

Write answers to `.venom/work/features/[feature-name]/clarifications.md`:
```markdown
# [Feature Name] — Clarifications

**Q1:** [ambiguity identified]
**A1:** [resolution]

**Q2:** [ambiguity identified]
**A2:** [resolution]
```

**Gate:** All ambiguities in the spec have answers before the plan is written.
Unresolved ambiguity becomes implicit decision-making during implementation — which is uncontrolled.

---

## Phase 3 — Plan

Now: the technical implementation. How will the spec be built?

```
@venom-architect [feature-name — reference spec.md and clarifications.md]
```

Architect reads: constitution.md + spec.md + clarifications.md.
Output writes to `.venom/work/features/[feature-name]/plan.md`:

```markdown
# [Feature Name] — Implementation Plan

## Architecture Decision
[the core technical choice — what pattern, what structure]

## Trade-offs
- Gains: [specific]
- Costs: [specific]
- Alternatives rejected: [list with reasons]

## Components
[breakdown of what needs to be built — files, modules, services]

## Data Model Changes
[new schema, migrations needed]

## API Changes
[new endpoints, changed signatures, backward compat]

## Implementation Contract
- Files to create: [exact paths + what each contains]
- Files to modify: [exact paths + what changes]
- Tests required: [what to verify for each component]
- Migration: [yes/no + steps]

## Risk
[what could go wrong in the implementation — specific]
```

**Gate:** Implementation contract is specific enough that execution needs zero new decisions.
If the builder would need to guess — the plan is incomplete.

---

## Phase 4 — Consistency Check

Before breaking down into tasks, verify all artifacts are coherent.

Read: constitution.md + spec.md + clarifications.md + plan.md.

Check:
- Does the plan satisfy every user story in spec.md?
- Does the plan respect every constraint in constitution.md?
- Does the plan address every clarification in clarifications.md?
- Are there gaps in the implementation contract?
- Does the plan introduce new ambiguities not in clarifications.md?

Fix any gaps. Update plan.md. If significant changes, loop back to Phase 3.

**Gate:** No gaps between spec and plan. No contradictions with constitution.

---

## Phase 5 — Tasks

Break the plan into atomic, ordered, executable tasks.

Write to `.venom/work/features/[feature-name]/tasks.md`:

```markdown
# [Feature Name] — Tasks

## Wave 1 — Foundation (no deps)
- [ ] T1: [specific task] — [file:function] — [test: how to verify]
- [ ] T2: [specific task] — [file:function] — [test: how to verify]

## Wave 2 — Services (depends on Wave 1)
- [ ] T3: [specific task] — [file:function] — [test: how to verify]
- [ ] T4: [specific task] — [file:function] — [test: how to verify]

## Wave 3 — Integration (depends on Wave 2)
- [ ] T5: [specific task] — [file:function] — [test: how to verify]

## Wave 4 — Verification
- [ ] T6: All tests pass
- [ ] T7: Types valid
- [ ] T8: Each user story in spec.md verified against implementation
```

Task rules:
- Each task maps to one file or one function
- Each task has a test (how to verify it's done)
- Tasks within a wave are independent (can run in parallel)
- Waves are ordered by dependency

**Gate:** Every task is atomic, has a test, and maps to a specific file.
"Implement auth" is not a task. "Add JWT validation middleware in src/middleware/auth.ts" is.

---

## Phase 6 — Build

Execute tasks.md wave by wave.

For tasks within a wave:
```
Spawn venom-builder per independent task (parallel)
Each builder: one task, one commit, atomic
```

After each wave: verify before starting the next.
Mark tasks `[x]` in tasks.md as they complete.

**Gate between waves:**
- All tasks in current wave marked `[x]`
- Tests for the wave pass
- No regressions from prior waves

---

## Phase 7 — Verify

```
/venom-review
```

Reviewer reads implementation against spec.md — not against the plan. The spec is the contract with the user.

Two questions:
- Does every user story in spec.md have working implementation?
- Does the implementation respect the constitution?

Then:
```
/venom-check
```

When clean: mark the feature done. Archive artifacts to `.venom/work/archive/[feature-name]/`.

Write to memory:
```
venom_remember({
  content: "Feature [name]: [what was built]. Key decision: [main architectural choice and why]. Watch for: [patterns that emerged].",
  type: "decision"
})
```

---

*The spec is the intelligence. The artifacts are the memory. The gates are the discipline.*
*Build from specification, not from approximation.*
