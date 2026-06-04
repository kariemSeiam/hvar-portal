---
description: "Execute tasks.md wave by wave. Reads workflow state to find active feature. Marks tasks [x] as they complete. Verifies each wave before the next. Reports progress after every task."
subtask: false
---

Execute the current feature's tasks. Wave by wave. Each task marked `[x]` when done.

## Step 1: Find what to build

!`cat .venom/state/workflow-state.json 2>/dev/null || echo "NO_WORKFLOW_STATE"`

If $ARGUMENTS names a feature: use that slug.
If `workflow-state.json` has `feature` and `workflow: "spec"`: use that feature.
If multiple feature directories exist: list them, ask which one.

!`ls .venom/work/features/ 2>/dev/null || echo "NO_FEATURES"`

If no feature found anywhere: "No feature found. Run `/venom-spec [what to build]` first."

## Step 2: Read context

Read `.venom/work/features/[feature]/tasks.md` — full file.
Read `.venom/work/features/[feature]/plan.md` — implementation contract.
Read `.venom/work/features/[feature]/spec.md` — what we're building against.

```
venom_workflow_update({ workflow: "spec", feature: "[feature]", phase: 6, phaseName: "Build" })
```

## Step 3: Orient on progress

Parse tasks.md. Find all `- [ ]` and `- [x]` lines.

Count:
- Total tasks: [N]
- Complete (`[x]`): [done]
- Remaining (`[ ]`): [remaining]

Report:
```
Building: [feature]
Progress: [done] / [N] tasks complete
Starting: [Wave N — description]
```

If all tasks already `[x]`: "All tasks complete. Run /venom-review to verify against spec."

## Step 4: Find next wave

The next wave = the first phase/wave section that has any `[ ]` tasks AND whose preceding wave tasks are all `[x]`.

Tasks within a wave are independent — they can run in parallel.
Tasks in different waves are sequential — complete one wave before the next.

## Step 5: Execute wave

For **1 task**: execute directly.
For **2+ independent tasks in the wave**: announce parallel execution.

```
Executing Wave [N] — [N] tasks in parallel:
- T[N]: [description]
- T[N]: [description]
```

For each task:
1. Read the target file(s) for context
2. Make the complete change — no TODOs, no placeholders
3. Run the verification (`verify: [how]` from tasks.md)
4. **Mark the task `[x]` in tasks.md immediately on success**

Marking tasks: edit `.venom/work/features/[feature]/tasks.md` — replace `- [ ] T[N]:` with `- [x] T[N]:`.

If a task fails:
- Do not mark it `[x]`
- Report what failed
- Do not proceed to next wave
- Fix or ask

## Step 6: Wave verification gate

After all tasks in a wave are marked `[x]`:

!`npm test 2>&1 | tail -20 || pytest --tb=short 2>&1 | tail -20 || go test ./... 2>&1 | tail -20 || cargo test 2>&1 | tail -20 || echo "No test runner detected — verify manually"`

If tests fail: stop. Report what broke. Fix before proceeding.

Report after each wave:
```
Wave [N] complete. [N] tasks. [tests: N passing].
Next: Wave [N+1] — [N] tasks.
```

## Step 7: Continue until done

After all waves complete: check tasks.md — all `[x]`?

If yes:
```
All [N] tasks complete.
Run /venom-review to verify against spec.
```

```
venom_workflow_update({ workflow: "spec", feature: "[feature]", phase: 6, phaseName: "Build Complete" })
```

If not all done (interrupted or partial): report progress and state cleanly.

## Step 8: Update state

After completion or pause:
```
venom_remember({ content: "Build progress on [feature]: [N/M] complete. Wave [N] finished. [decisions made].", type: "note" })
```

$ARGUMENTS
