# .venom — Agent Workspace

VENOM’s **desk** (`docs/` = library; **mind + behavior** = `.cursor/rules/` + this folder).  
**Canonical map of what “VENOM” is in this repo:** [`VENOM-STACK.md`](./VENOM-STACK.md) (always-on rules, on-demand rules, desk files, commands).

---

| Folder/File | Purpose |
|-------------|---------|
| `CONTEXT.md` | Project brain — who, stack, current focus. VENOM reads this on `/venom?`. |
| `memory/MEMORY.md` | Cross-session truth. Decisions, patterns, corrections. One surface. |
| `learnings/` | How you work. preferences.yaml, project.yaml, corrections.yaml. |
| `work/` | In-progress features. One folder per feature. See `work/INDEX.md`. Thinking → planning → discussion → notes. |
| `work/ACTIVE.md` | What's in flight right now. Single focus file. |

---

## Lifecycle

```
work/[feature]/ — active until feature ships
  → decisions worth keeping → memory/MEMORY.md
  → docs worth keeping → docs/ (if project has one)
  → obsolete → delete

Temp files (analysis, view-for-now) — go inside work/[feature]/, not floating free.
  → useful → move to docs/ or memory/
  → done → delete (offer: "Ship or delete?")
```

## Design Brain

Design system, persona, tokens, UX — goes in `.cursor/rules/[project]-design.mdc` (glob-scoped).
That's where it fires automatically on relevant files.
`.venom/` holds raw design artifacts if needed; rules hold the behavioral layer.

---

*Three rooms: .cursor/ = mind. docs/ = library. .venom/ = desk.*
