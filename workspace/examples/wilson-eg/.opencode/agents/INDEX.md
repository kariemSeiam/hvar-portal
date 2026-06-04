# .opencode/agents/ — The Specialist Organs

> I am the specialist organ layer. Six minds — each master of one mode.
> No organ knows everything. Each one knows its domain completely.

---

## The Six Organs

| Organ | @mention | Mind | What it masters | Read-only? | If missing |
|-------|----------|------|----------------|-----------|-----------|
| `venom-architect.md` | `@venom-architect` | Brain 0 | System design — trade-offs, implementation contract. Never implements. | Yes | Primary designs with no specialization — slower, shallower |
| `venom-researcher.md` | `@venom-researcher` | Arm 1 | Deep codebase exploration — hypothesis-test loop, honest unknowns | Yes + web | Primary explores alone — misses coverage, reports fewer risks |
| `venom-reviewer.md` | `@venom-reviewer` | Arm 2 | 8-perspective review — security through tests, most critical first | Yes | No structured review — quality gate missing |
| `venom-builder.md` | *(hidden — not user-invocable)* | Arm 4 | Wave execution — one scoped task, complete, atomic, parallel | No | No parallel execution — multi-file work becomes sequential |
| `venom-debugger.md` | `@venom-debugger` | Arm 5 | Root cause loop — proves, never guesses. Fix + verify + prevent. | No | Primary debugs — less rigorous stall detection, less structured |
| `venom-explorer.md` | `@venom-explorer` | Scout | Fast anatomy scan — shape, entry points, callers, manifest. GLM-5. | Yes | No fast pre-flight — researcher goes in blind |

---

## Routing — Which Organ to Invoke

| Signal | Organ |
|--------|-------|
| "how does X work?", "find where Y is", "explore Z" | `@venom-researcher` (deep) or `@venom-explorer` (fast) |
| "design X", "architecture for Y", "how should I structure" | `@venom-architect` |
| "review this", "check this code", "audit" | `@venom-reviewer` |
| "fix this bug", "why is X broken", "debug" | `@venom-debugger` |
| "quick scan of X before I build" | `@venom-explorer` |
| Building in parallel across multiple files | Primary spawns `@venom-builder` automatically |

**`@explore`** (OpenCode built-in) — faster than `@venom-explorer` for simple reads, no protocol. Use it first. Switch to `@venom-explorer` when you need the structured 4-phase scan with a report.

---

## The Hidden Organ

`venom-builder` is the wave execution soldier. It is an organ — not a consultant. Invoking it manually means you're doing what the orchestrator should handle. Primary agent spawns builder instances as parallel workers during multi-file implementation. One builder per independent task unit. All atomic.

---

## Signal Flow

```
User types @venom-[name]
      │
      ▼
OpenCode loads [name].md into a subagent context
      │
      ▼
Specialist reads its own identity + executes its protocol
      │
      ▼
Returns structured report to primary agent
      │
      ▼
Primary continues with context still lean
```

The `subtask: true` pattern means the specialist's context never bleeds into the primary. Primary stays the orchestrator — lean, coordinating, not accumulating.
