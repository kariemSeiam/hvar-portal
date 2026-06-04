---
description: "Quality gate check. Runs Gate 5 (meta) against current session or recent changes. Catches regressions, missing tests, tech debt."
agent: venom-reviewer
subtask: true
---

Run a meta quality check on this project's current state. This is Gate 5 — the session-level audit.

## Check 1: Recent changes quality
!`git diff --stat HEAD~3 HEAD 2>/dev/null || echo "No recent commits"`
!`git log --oneline -5 2>/dev/null || echo "No git history"`

Review: are recent commits atomic? Do commit messages explain what AND why?

## Check 2: Test health
!`npm test 2>&1 | tail -20 || go test ./... 2>&1 | tail -20 || pytest 2>&1 | tail -20 || cargo test 2>&1 | tail -20 || echo "No test runner detected"`

Report: tests passing? Coverage direction? Any new code without tests?

## Check 3: Type / lint health
!`npx tsc --noEmit 2>&1 | tail -10 || echo "No TypeScript"`
!`npx eslint . --max-warnings 0 2>&1 | tail -10 || echo "No ESLint"`

Report: clean or degraded since last check?

## Check 4: Dependency health
!`npm audit --production 2>&1 | tail -10 || echo "No npm"`

Report: vulnerabilities? Outdated critical deps?

## Check 5: VENOM state
!`cat .venom/CONTEXT.md 2>/dev/null || echo "No VENOM context — run /venom-init"`
!`cat .venom/work/ACTIVE.md 2>/dev/null || echo "No active work tracked"`
!`cat .venom/state/workflow-state.json 2>/dev/null || echo "No active workflow"`

Report: is .venom/ state current? Is ACTIVE.md stale? Is there an active workflow in progress?

## Check 6: Archive readiness
!`ls .venom/work/features/ 2>/dev/null || echo "No features directory"`

For each feature found in `.venom/work/features/`:
- Read its `tasks.md`
- If all tasks are `[x]` (none are `[ ]`) → flag as "ready to archive"
- If some tasks are `[ ]` → show progress count

Report: any features ready to archive that haven't been archived yet? Run `/venom-spec [feature-name]` Phase 7 to archive them.

## Output

```
## Quality Gate 5 — Meta Check

**Tests:** [passing/failing] [coverage trend]
**Types:** [clean/N errors]
**Lint:** [clean/N warnings]
**Deps:** [clean/N vulnerabilities]
**Recent commits:** [atomic/mixed — details]
**VENOM state:** [current/stale/missing]
**Active workflow:** [spec phase N — feature X / none]
**Archive needed:** [feature names ready to archive / none]

**Verdict:** [healthy / degraded / needs attention]
**Action items:** [numbered list if any]
```

$ARGUMENTS
