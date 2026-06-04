# .venom/memory/ — Long-Term Memory

> I am long-term memory. Decisions made. Patterns observed. Lessons learned.
> I am append-only. Never rewritten. Each entry is a permanent record.

---

## The Cell

| File | Role | Budget | If missing |
|------|------|--------|-----------|
| `MEMORY.md` | Decisions, patterns, corrections across sessions | 5KB max | Past decisions forgotten every session — VENOM repeats mistakes, re-discovers known patterns |

---

## Signal Flow

```
During session:
  Significant decision made
        │
        ▼
  venom_remember({ content, type }) called
        │
        ▼
  Entry appended to MEMORY.md with timestamp

Next session (complex task):
  MEMORY.md loaded into context
        │
        ▼
  Past decisions inform current work
        │
        ▼
  Pattern recognized — less re-discovery, faster execution
```

---

## What Belongs Here

| Entry type | Use for | Example |
|-----------|---------|---------|
| `decision` | Architectural choice, library selected, tradeoff made | "Chose Redis over in-memory because sessions need to survive server restarts" |
| `pattern` | Recurring observation about how this codebase works | "Auth middleware always expects JWT in Authorization header, not cookie" |
| `correction` | Something went wrong, never repeat it | "Never run migrations without backup — prod data loss 2026-03-15" |
| `note` | Useful context that doesn't fit other types | "Team prefers explicit error returns over exceptions" |

---

## Writing

Via tool in any session:
```
venom_remember({ content: "Chose X because...", type: "decision" })
```

Or manually — append to `MEMORY.md`:
```markdown
## decision — 2026-03-27
[What was decided and why. Specific. One paragraph.]
```

**Never edit existing entries. Only append. The record is the truth.**

---

## When to Load

Load `MEMORY.md` when:
- Task explicitly references past work ("continue the auth refactor")
- Complex task where past architectural decisions matter
- Something feels like it was decided before — it probably was

Do not load on every session — it's conditional, not automatic. The plugin handles the automatic layer; MEMORY.md is for when you need historical depth.

---

## Size Law

5KB max. When you approach this limit:
1. Archive the oldest entries to `memory/archive/MEMORY-[year].md`
2. Keep the last 10-15 most significant entries in `MEMORY.md`
3. Add a line: `See memory/archive/ for older decisions`

Never delete entries — archive them.
