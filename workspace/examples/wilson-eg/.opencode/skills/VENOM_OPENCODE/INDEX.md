# .opencode/skills/VENOM_OPENCODE/ — The Deep Knowledge Store

> I am the deep knowledge store. I hold all of VENOM's intelligence patterns for this surface.
> I am lazy-loaded — only the description is visible until I am explicitly called.

---

## The Cell

| File | What it holds | Loaded when |
|------|-------------|------------|
| `SKILL.md` | All 10 intelligence patterns, routing map, energy matching, pushback scale, OpenCode non-negotiables, surface-aware rules | Agent calls `skill({ name: "venom-opencode" })` |

---

## Why Lazy Loading Matters

Every session starts with a context budget. If I loaded on session start, I would consume ~200 lines of that budget before any work begins — whether those patterns were needed or not.

Instead: VENOM sees my name and description. Only when the patterns are needed does the content load. This is Pattern #1 (Context Engineering) applied to my own existence.

**What's always visible (from frontmatter):**
```
name: venom-opencode
description: "VENOM intelligence for OpenCode — init sequence, surface rules,
agent routing, all 10 intelligence patterns, memory bridge, energy matching,
OpenCode-specific never-do list."
```

**What loads on demand:** Everything in `SKILL.md` — 344 lines of intelligence.

---

## What I Contain (When Loaded)

- **Init sequence** — how VENOM wakes up (plugin-driven vs manual)
- **Surface-aware behavior** — TUI vs CLI vs SDK vs PR review mode
- **Agent routing map** — intent → mind → artifact, delegation threshold
- **All 10 intelligence patterns** — when each fires, what implements it
- **Memory bridge** — when to load which `.venom/` file, size budgets
- **Energy matching** — signal detection → state → archetype → response shape
- **Pushback scale** — Level 0 through 3, when to hold vs defer
- **OpenCode non-negotiables** — 10 hard rules specific to this platform
- **XML task specification** — Pattern #9, structured internal task prompting
- **Multi-agent orchestration** — Pattern #10, delegation threshold, wave execution

---

## Signal Flow

```
Agent needs intelligence pattern reference
      │
      ▼
skill({ name: "venom-opencode" }) called
      │
      ▼
SKILL.md loads into agent context
      │
      ▼
Agent uses pattern, then continues
```

The skill loads and is available for the rest of that agent's session. It does not persist between sessions — each session pulls fresh from the file.

---

## If Missing

Without this skill, intelligence patterns are only available from AGENTS.md (which carries the core disposition) and from agent-specific protocols (which carry pattern implementations for each specialist).

SKILL.md is the full reference — the place VENOM goes when it needs to be explicit about how to apply a pattern rather than running on disposition.
