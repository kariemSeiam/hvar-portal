# .opencode/ — The Operational Body

> I am VENOM's operational body. OpenCode reads me.
> Everything here fires on demand. Together these organs ARE VENOM on OpenCode.

---

## The Organs

| Organ | Fires when | Role | If missing |
|-------|-----------|------|-----------|
| `agents/` | `@mention` in TUI | Six specialist minds — each masters one mode of operation | Primary handles everything alone, no depth, no specialization |
| `commands/` | `/slash` in TUI | Five motor verbs — structured actions the body can execute | No structured actions, everything manual |
| `workflows/` | Situation recognized | Four artifact-driven choreographies — each phase writes to disk, gates between phases | Complex work collapses into single-shot improvisation; context resets destroy work-in-progress |
| `plugins/venom-core.ts` | Session start (if configured) | Autonomic nervous system — 7 hooks that fire without being asked | No automatic memory, no loop detection, no safety gates, no compaction survival |
| `skills/VENOM_OPENCODE/` | Agent calls `skill()` | Deep knowledge store — all 10 intelligence patterns on demand | Intelligence patterns unavailable when needed most |
| `knowledge/` | Agent reads directly | Platform reference cortex — what OpenCode provides, what's available | Platform-blind decisions, configuration errors, wrong assumptions |

---

## Signal Flow Through the Body

```
session.created
      │
      ▼  plugin fires (if active)
venom-core.ts injects identity → agents get VENOM context
      │
      ▼  user types
Primary agent (build or plan) receives input
      │
      ├──@mention  → agent fires from agents/
      ├──/slash    → command fires from commands/
      ├──situation → workflow choreography from workflows/
      └──tool call → plugin before-hook fires
             │
             ▼  if pattern reference needed
             skill() → VENOM_OPENCODE/SKILL.md loads
             │
             ▼  if platform question arises
             agent reads knowledge/ directly
```

---

## Loading Behavior

OpenCode loads each organ differently. This is not configurable — it's the platform's contract.

| Organ | How OpenCode loads it | VENOM implication |
|-------|----------------------|-------------------|
| `agents/*.md` | On `@mention` — on demand | Specialists are free until needed |
| `commands/*.md` | On `/slash` in TUI — on demand | Verbs are free until invoked |
| `workflows/*.md` | Never automatic — VENOM reads directly | Situation-matched, not platform-triggered |
| `plugins/venom-core.ts` | On session start (must be in `opencode.json` plugin array) | Must uncomment in config to activate |
| `skills/VENOM_OPENCODE/` | When agent calls `skill({ name: "venom-opencode" })` | Only description visible until called |
| `knowledge/` | Never automatic — agent reads directly | Pull when needed, not pre-loaded |
| `INDEX.md` files | Never — navigation only | OpenCode ignores these; VENOM reads them |

---

## What OpenCode Never Touches

`INDEX.md` files in this directory are VENOM's nervous system navigation — not OpenCode artifacts. OpenCode ignores any `.md` file that isn't in a watched path (`agents/`, `commands/`, `skills/`, `knowledge/`).

These files are for me. I read them to understand my own body.
