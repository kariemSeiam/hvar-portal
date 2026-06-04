---
description: "Root cause loop — artifact-driven. Writes hypothesis log to disk. Exits when root cause is proven, not when a fix seems to work. Never guesses."
---

# VENOM Debug Loop

Something is broken and the cause isn't immediately obvious.
This loop exits when root cause is **proven** — not when a fix "seems to work."

Every iteration writes to `.venom/work/debug-log.md`. Context can reset — the log survives.

---

## Before Starting — Open the Log

Create or append to `.venom/work/debug-log.md`:

```markdown
## Debug Session — [date] — [one-line problem description]

**Error:** [exact message — full stack trace if available]
**Reproduces:** [always / sometimes / only when X]
**First seen:** [when, after what change]

---
```

This file is the investigation record. Every hypothesis, every test, every finding goes here.

---

## Phase 1 — Observe

Before forming any hypothesis, collect the raw facts.

```
@venom-explorer [area where the bug manifests]
```

Collect:
- Exact error message (full stack trace — summary is not enough)
- Exact reproduction conditions (always? sometimes? environment-specific?)
- What changed recently: `git log --oneline -10`
- What the code says it does vs what it actually does

Write to debug-log.md:
```markdown
### Observations
- Error: [verbatim]
- Reproduces when: [specific condition]
- Recent changes: [git log output — last 3-5 commits]
- Code claims to do: [what function/module says it does]
- Code actually does: [what trace/log shows it doing]
```

**Gate:** Do not hypothesize until observation is written. Hypotheses formed before observation are stories, not science.

---

## Phase 2 — Hypothesize

One hypothesis. Specific. Testable. Falsifiable.

Not: "Something is wrong with auth."
Yes: "The session token is being invalidated before the middleware reads it because the logout handler runs synchronously before the response is sent."

Write to debug-log.md:
```markdown
### Hypothesis [N]
**Claim:** [one sentence — specific and falsifiable]
**Prediction:** if this is true, then [what we'll see when we test]
**Test:** [exactly what to run or read to confirm/deny]
```

---

## Phase 3 — Test

```
@venom-debugger [hypothesis from debug-log.md]
```

Debugger receives: exact error, reproduction conditions, current hypothesis.

Debugger protocol:
- Add instrumentation to **verify or falsify** — not to fix
- Run the reproduction case
- Read actual output against prediction

Write to debug-log.md:
```markdown
### Test Result — Hypothesis [N]
**Result:** [confirmed / falsified]
**Evidence:** [what was seen — specific, not interpreted]
**New information:** [what this tells us that we didn't know before]
```

---

## Phase 4 — Evaluate

Did the test confirm or falsify?

**Confirmed** → root cause found. Move to Phase 5.

**Falsified** → new information gathered. Return to Phase 2.
The new hypothesis must incorporate what was learned. Never re-test the same hypothesis twice.

**Stall detection — stop and escalate when:**
- Same hypothesis 3 iterations without new information → stuck. The hypothesis is wrong. Try the opposite direction.
- 5 iterations without answering anything → wrong area, wrong tool. Write partial findings and ask for direction.
- Circular read pattern (A reads B reads A) → document the cycle, it's the finding.

Write to debug-log.md when stuck:
```markdown
### Stuck — Iteration [N]
**Ruled out:** [list of falsified hypotheses]
**Current best guess:** [what seems most likely given evidence]
**What's blocking progress:** [specific gap — what information would unblock]
**Direction needed:** [what question to answer next]
```

Never keep testing to avoid saying stuck. The log shows the work — stopping is not failure.

---

## Phase 5 — Fix

Fix only the root cause. Not symptoms. Not unrelated issues noticed along the way.

Fix is:
- **Minimal** — changes only what caused the problem
- **Atomic** — one commit, revertable
- **Verified** — reproduction case no longer reproduces

Write to debug-log.md:
```markdown
### Fix
**Root cause:** [one sentence — precise]
**Fix applied:** [what changed — file:line]
**Verified by:** [how reproduction was confirmed fixed]
```

---

## Phase 6 — Prevent

After the fix, think forward.

- What made this bug possible? (the structural condition that allowed it)
- Is the same pattern present elsewhere in the codebase?
- What would have caught this earlier — test, type, lint, review?

Write to memory:
```
venom_remember({
  content: "Bug: [what]. Root cause: [why]. Fixed by: [how]. Pattern to watch: [where else this could appear].",
  type: "correction"
})
```

Update debug-log.md with prevention notes. Archive the log to `.venom/work/archive/debug-[date]-[slug].md`.

---

*A bug is not fixed until you know why it happened. A fix you can't explain is a guess.*
*The log is the evidence. Without it, the next session starts from zero.*
