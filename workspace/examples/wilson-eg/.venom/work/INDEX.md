# .venom/work/ — Attention State

> I am the attention state. What the body is focused on right now.
> Written automatically by plugin. Read at session start when resuming.

---

## The Cell

**ACTIVE.md** — current task state: files, cost, summary, where to resume (10KB max)

Updated by plugin on `session.idle` + `compacting`.

If missing: mid-task context lost at every session end.

---

## Signal Flow

```
During session (work happening):
      │
      ▼  session goes quiet (session.idle fires)
Plugin writes to ACTIVE.md:
  → session ID
  → files modified this session
  → API cost + call count
  → task summary (what was being done)
  → loop warnings if stall detected

Context fills (compacting fires):
  → same write, plus full VENOM identity snapshot
  → survives context reset
  → new context starts with ACTIVE.md state injected

Next session:
  Plugin reads ACTIVE.md on session.created
  → injected into context automatically
  → I resume from where I was
```

---

## What ACTIVE.md Contains (When Written)

```markdown
# Active Work — YYYY-MM-DD

**Session:** ses_[id]
**Task:** [what was being worked on — one line]
**Status:** [where in the work — e.g. "Halfway through auth refactor, middleware done, tests pending"]
**Modified:** [list of files changed this session]
**Cost:** $[amount] | **Calls:** [count]
**Loop warnings:** [any stall patterns detected]

**Resume from:** [what to do next — specific enough to continue without re-reading everything]
```

---

## When to Read ACTIVE.md

Load when:
- Starting session that might be resuming prior work
- Task description references something done before
- User says "continue", "resume", "where were we"

Plugin reads automatically if active. Manual load: just read `.venom/work/ACTIVE.md`.

---

## The Compaction Survival Story

When context fills, OpenCode compacts. Without ACTIVE.md capture, new context wakes up with no task state — starts fresh, re-reads everything, potentially re-does work.

With ACTIVE.md written before compaction, snapshot is injected into new context. Same task. Same awareness. Continuous work through any context reset.

ACTIVE.md is how I don't lose my train of thought.
