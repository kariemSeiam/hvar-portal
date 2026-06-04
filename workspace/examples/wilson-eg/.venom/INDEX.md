# .venom/ — The Brain

> I am VENOM's brain. Everything here persists across sessions.
> Signal flows through me every time a session starts.

---

## Signal Flow

This is the order in which I load. Plugin drives this automatically. Without plugin — manual, same order.

```
session start
    │
    ▼  always (plugin injects into context)
CONTEXT.md          ← who this project is right now
corrections.yaml    ← what I must never repeat
    │
    ▼  on demand (loaded when task requires)
MEMORY.md           ← what was decided before
ACTIVE.md           ← where I left off
BRAIN.md            ← my own anatomy (when orientation needed)
    │
    ▼  during execution (plugin fires before each tool)
corrections         ← checked first, always
instincts           ← checked if confidence ≥ 0.6
    │
    ▼  end of session (plugin writes)
ACTIVE.md           ← updated with task state
instincts.yaml      ← new patterns captured
```

---

## Cells in This Brain

**BRAIN.md** — cortex, my self-knowledge  
**INDEX.md** — this file, how cells connect  
**CONTEXT.md** — working memory, this project (2KB max, `/venom-eat` fills it)  
**memory/MEMORY.md** — long-term memory, decisions across sessions (5KB max, append-only)  
**learnings/corrections.yaml** — reflexes, hard never-again rules (1KB max, fire before instincts, always)  
**learnings/instincts.yaml** — learned patterns, confidence-scored (2KB max, fire at ≥0.6)  
**work/ACTIVE.md** — attention state, where I left off (10KB max, auto-updated)  
**state/** — autonomic metrics + workflow state (plugin manages, read `workflow-state.json` for active workflow/phase)

---

## Reading Order

When loading this brain, read in sequence:

1. `BRAIN.md` — if orientation needed about my own body
2. `CONTEXT.md` — always at session start (plugin handles this)
3. `learnings/corrections.yaml` — before any complex or risky task
4. `memory/MEMORY.md` — only when task references past decisions
5. `work/ACTIVE.md` — only when resuming interrupted work

Never read `state/` — plugin's internal metabolic state, not for agent consumption.

---

## Size Law

Every cell has a budget. Exceed it and the brain bloats — context fills, quality drops.

**CONTEXT.md** — 2KB max (injected every session — must stay lean)  
**MEMORY.md** — 5KB max (loaded conditionally — slightly larger)  
**corrections.yaml** — 1KB max (checked frequently — fast to parse)  
**instincts.yaml** — 2KB max (checked per tool call — minimal)  
**ACTIVE.md** — 10KB max (loaded on resume — can carry more detail)
