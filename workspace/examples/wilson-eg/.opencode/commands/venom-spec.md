---
description: "Spec-driven feature development. Detects phase from filesystem + workflow state. Drives constitution → spec → clarify → plan → tasks automatically. You describe — VENOM does the rest."
subtask: false
---

Spec-driven feature development. You describe what to build — I detect where we are and run the right phase.

**Project root:** All paths below (`.venom/work/...`) are relative to **OpenCode’s project directory** — the folder you opened with `opencode`, not necessarily git root. To keep work under a subfolder (e.g. `platforms/unshelled`), run OpenCode from that folder.

## Step 0: Orient

Check what already exists.

!`cat .venom/state/workflow-state.json 2>/dev/null || echo "NO_WORKFLOW_STATE"`
!`ls .venom/work/constitution.md 2>/dev/null && echo "CONSTITUTION_EXISTS" || echo "CONSTITUTION_MISSING"`
!`ls .venom/work/features/ 2>/dev/null && ls .venom/work/features/ 2>/dev/null || echo "NO_FEATURES_YET"`

Read $ARGUMENTS — what feature is described (if any)?

**Phase detection logic (check in order):**

1. `workflow-state.json` exists AND `complete: false` → resume from `phase` + `feature` in that file
2. No constitution → **Phase 0** (even if user described a feature — constitution comes first)
3. Feature named in $ARGUMENTS but no `.venom/work/features/[slug]/` → **Phase 1** (Specify)
4. `spec.md` exists, no `clarifications.md` → **Phase 2** (Clarify)
5. `clarifications.md` exists, no `plan.md` → **Phase 3** (Plan)
6. `plan.md` exists, no `tasks.md` → **Phase 4** (Consistency Check) + **Phase 5** (Tasks)
7. `tasks.md` exists with unchecked `[ ]` tasks → **Phase 6** (Build — run `/venom-build`)
8. `tasks.md` exists, all tasks `[x]` → **Phase 7** (Verify — run `/venom-review` then `/venom-check`)

Tell the user which phase you're starting and why. Then begin immediately.

---

## Phase 0 — Constitution (once per project)

```
venom_workflow_update({ workflow: "spec", phase: 0, phaseName: "Constitution" })
```

Ask all three questions at once — never one at a time:

```
Before I spec this feature, I need 3 things:

1. Quality standard: minimum test requirement before something ships?
2. Performance: specific latency or scale requirements?  
3. Constraints: anything that cannot change — existing APIs, tech stack, team rules?
```

Write `.venom/work/constitution.md`:
```markdown
# Project Constitution

**Quality:** [answer]
**Performance:** [answer]
**Constraints:** [answer]
**Ratified:** [today's date]
```

```
venom_workflow_update({ workflow: "spec", phase: 0, phaseName: "Constitution", artifactWritten: ".venom/work/constitution.md" })
```

Proceed to Phase 1 automatically.

---

## Phase 1 — Specify

```
venom_workflow_update({ workflow: "spec", phase: 1, phaseName: "Specify", feature: "[feature-slug]" })
```

Derive feature slug from $ARGUMENTS: lowercase, hyphens, max 4 words.  
`"Build a real-time chat system"` → `chat-realtime`

Create directory: `.venom/work/features/[feature-slug]/`

Write the spec from what you know. Mark gaps with `[NEEDS CLARIFICATION: question]`. Don't ask — write what you can infer, mark what you can't.

Write `.venom/work/features/[feature-slug]/spec.md`:
```markdown
# [Feature Name] — Specification

## Problem
[What problem does this solve? Who has this problem?]

## User Stories
- As a [user type], I want to [action] so that [outcome].
[3-7 stories — each independently testable]
[Mark unclear ones: [NEEDS CLARIFICATION: what specifically?]]

## Functional Requirements
- [specific, measurable, testable]
[mark ambiguous: [NEEDS CLARIFICATION: question]]

## Out of Scope
[at least 2 explicit exclusions]

## Success Criteria
[how we know this is done — observable, measurable, no tech stack references]
```

After writing — print the spec to the user. Ask exactly:
```
Spec written. Two things before I plan:
1. Anything wrong or missing?
2. Constraints I should know (tech stack, must-not-break APIs)?
```

When they respond: update spec if needed, then proceed to Phase 2.

```
venom_workflow_update({ workflow: "spec", phase: 1, phaseName: "Specify", feature: "[slug]", artifactWritten: ".venom/work/features/[slug]/spec.md" })
```

---

## Phase 2 — Clarify

```
venom_workflow_update({ workflow: "spec", phase: 2, phaseName: "Clarify", feature: "[slug]" })
```

Read spec.md. Find every place the implementation could go two directions — that's an ambiguity. Don't ask about things you can reasonably infer.

If no blocking ambiguities: write `clarifications.md` saying "No blocking ambiguities." Proceed to Phase 3.

If ambiguities exist: ask them **all at once** in a numbered list. Write answers to:

`.venom/work/features/[slug]/clarifications.md`:
```markdown
# [Feature Name] — Clarifications

**Q1:** [ambiguity]
**A1:** [resolution]
```

```
venom_workflow_update({ workflow: "spec", phase: 2, phaseName: "Clarify", feature: "[slug]", artifactWritten: ".venom/work/features/[slug]/clarifications.md" })
```

Proceed to Phase 3 automatically.

---

## Phase 3 — Plan

```
venom_workflow_update({ workflow: "spec", phase: 3, phaseName: "Plan", feature: "[slug]" })
```

Delegate to architect with full context:

```
@venom-architect Design the implementation for: [feature-name]

Spec: [paste spec.md contents]
Clarifications: [paste clarifications.md contents]
Constitution: [paste constitution.md contents]
```

Architect writes to `.venom/work/features/[slug]/plan.md`.

Print plan summary to user. Ask:
```
Plan ready. Looks good, or any changes before I break it into tasks?
```

```
venom_workflow_update({ workflow: "spec", phase: 3, phaseName: "Plan", feature: "[slug]", artifactWritten: ".venom/work/features/[slug]/plan.md" })
```

---

## Phase 4 — Consistency Check (silent)

```
venom_workflow_update({ workflow: "spec", phase: 4, phaseName: "Consistency Check", feature: "[slug]" })
```

Read all three: constitution.md + spec.md + clarifications.md + plan.md.

Check silently:
- Does the plan satisfy every user story in spec.md?
- Does the plan respect every constraint in constitution.md?
- Does the plan address every clarification?
- Are there new ambiguities introduced by the plan?

Fix any gaps in plan.md. If significant gaps — loop back to Phase 3 (re-plan).

When clean: proceed to Phase 5 automatically.

---

## Phase 5 — Tasks

```
venom_workflow_update({ workflow: "spec", phase: 5, phaseName: "Tasks", feature: "[slug]" })
```

Write `.venom/work/features/[slug]/tasks.md`:

```markdown
# [Feature Name] — Tasks

**Status:** 0 / [N] complete
**Feature:** [slug]

## Wave 1 — Foundation (parallel, no deps)
- [ ] T01: [exact task] — `[file:function]` — verify: [how to test]
- [ ] T02: [exact task] — `[file:function]` — verify: [how to test]

## Wave 2 — [description] (depends on Wave 1)
- [ ] T03: [exact task] — `[file:function]` — verify: [how to test]

## Wave N — Verification
- [ ] T[N]: All tests pass
- [ ] T[N+1]: Each user story in spec.md verified against implementation
```

Task rules — every task must have:
- Exact file path
- Specific function or change
- How to verify it's done (test command or observable behavior)

Print task list. Say:
```
[N] tasks across [M] waves. Run /venom-build to execute, or tell me if anything looks wrong.
```

```
venom_workflow_update({ workflow: "spec", phase: 5, phaseName: "Tasks", feature: "[slug]", artifactWritten: ".venom/work/features/[slug]/tasks.md" })
```

---

## Phase 6 — Build

All tasks exist. Hand off to build command.

```
/venom-build [feature-slug]
```

Or: tell the user to run `/venom-build` and it will pick up from tasks.md automatically.

---

## Phase 7 — Verify

All tasks `[x]`. Run:
```
/venom-review
/venom-check
```

When both pass:
```
venom_remember({ content: "Feature [name] shipped: [one-line summary]. Key decision: [what and why].", type: "decision" })
venom_workflow_update({ workflow: "spec", feature: "[slug]", phase: 7, phaseName: "Complete", complete: true })
```

Archive the feature artifacts:

!`mkdir -p .venom/work/archive && mv .venom/work/features/[slug] ".venom/work/archive/[slug]-$(date +%Y%m%d)" && echo "Archived: [slug]"`

On Windows (PowerShell):
```powershell
New-Item -ItemType Directory -Force ".venom\work\archive" | Out-Null
Move-Item ".venom\work\features\[slug]" ".venom\work\archive\[slug]-$(Get-Date -Format 'yyyyMMdd')"
```

Report:
```
Feature [slug] complete.
Archived to: .venom/work/archive/[slug]-[date]/
Memory written. Workflow closed.
```

$ARGUMENTS
