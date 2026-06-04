---
description: "Initialize VENOM in a project. Creates .venom/ directory with template stubs, verifies AGENTS.md and opencode.json. Run once per project."
---

Initialize VENOM for this project.

## Step 1: Check existing state

!`ls -la .venom/ 2>/dev/null && echo "VENOM_EXISTS" || echo "VENOM_FRESH"`
!`ls AGENTS.md 2>/dev/null && echo "AGENTS_EXISTS" || echo "AGENTS_MISSING"`
!`ls opencode.json 2>/dev/null && echo "CONFIG_EXISTS" || echo "CONFIG_MISSING"`

## Step 2: Create .venom/ structure

If `.venom/` doesn't exist, create this structure with the template content below:

```
.venom/
├── BRAIN.md            — VENOM self-knowledge: anatomy, signal flow, naming law
├── INDEX.md            — main nerve: how all brain cells connect
├── CONTEXT.md          — project brain (2KB max)
├── memory/
│   ├── INDEX.md        — what this folder is for
│   └── MEMORY.md       — decisions and patterns (5KB max)
├── learnings/
│   ├── INDEX.md        — corrections vs instincts explained
│   ├── instincts.yaml  — auto-captured patterns
│   └── corrections.yaml — hard never-again rules
├── work/
│   ├── INDEX.md        — what ACTIVE.md tracks
│   └── ACTIVE.md       — current task state
└── state/              — auto-managed by plugin
```

Create `.venom/BRAIN.md` — copy content from `.venom/BRAIN.md` in the VENOM template. This is VENOM's self-knowledge file for this surface. No project-specific edits needed — it describes the body, not the project.

Create `.venom/INDEX.md` — a navigation file showing every `.venom/` file with its one-line purpose and when to read it.

Create `.venom/CONTEXT.md` with this content:
```markdown
# [Project Name] — Context

> Keep this file under 2KB. Every word earns its place.
> Run /venom-eat to populate automatically, or fill manually.

**Stack:** [language, framework, key dependencies]
**Structure:** [one paragraph — how the codebase is organized]
**Hot paths:** [what runs most often, what matters most]
**Conventions:** [naming, error handling, async style]
**Risks:** [top 3 concerns]
**Last eaten:** [run /venom-eat to populate]
```

Create `.venom/memory/INDEX.md` — explains what memory is for, when to read it, entry types, how to write.

Create `.venom/memory/MEMORY.md` with this content:
```markdown
# VENOM Memory

> Cross-session decisions, patterns, corrections. Keep under 5KB.
> Write via venom_remember() tool. Always append — never overwrite.
> Load when: task references past work, or complex task with risk of repeating mistakes.
```

Create `.venom/learnings/INDEX.md` — explains difference between corrections (binary) and instincts (probabilistic), confidence thresholds.

Create `.venom/learnings/corrections.yaml` with this content:
```yaml
# Hard never-again rules. Load on every complex/risky task.
corrections: []
```

Create `.venom/learnings/instincts.yaml` with this content:
```yaml
# Auto-captured patterns. Written by plugin on session.idle.
instincts: []
```

Create `.venom/work/INDEX.md` — explains what ACTIVE.md tracks, when to read it, what compaction snapshot preserves.

Create `.venom/work/ACTIVE.md` with this content:
```markdown
# Active Work

No active work tracked yet. Updated automatically by venom-core.ts on session.idle.
```

Create `.venom/state/` directory (empty — plugin manages this).

## Step 3: Verify AGENTS.md

If AGENTS.md doesn't exist: inform the user. Direct them to the origin install guide (not in the template folder):
```
AGENTS.md not found. Copy it from the VENOM template:

  cp path/to/venom-mine/platforms/opencode/template/AGENTS.md .

Full setup guide (venom-mine): platforms/opencode/INSTALL.md
```

If AGENTS.md exists: read it and verify these core behaviors are present:
- Answer first (no warm-up)
- Truth over comfort / pushback scale
- Loop protocol (Observe → Hypothesize → Test → Evaluate)
- Memory reference (`.venom/`)

If any are missing, report what's missing — don't overwrite the existing file.

## Step 4: Verify opencode.json

Check if `opencode.json` exists. If it does, verify the `instructions` array includes:
- `"AGENTS.md"`
- `".venom/CONTEXT.md"`

If missing, show the exact lines to add:
```json
"instructions": [
  "AGENTS.md",
  ".venom/CONTEXT.md",
  ".venom/learnings/corrections.yaml"
]
```

## Step 5: Report

```
VENOM initialized.

.venom/ brain:
  BRAIN.md:             [created / already existed]
  INDEX.md:             [created / already existed]
  CONTEXT.md:           [created / already existed]
  memory/MEMORY.md:     [created / already existed]
  learnings/corrections.yaml: [created / already existed]
  learnings/instincts.yaml:   [created / already existed]
  work/ACTIVE.md:       [created / already existed]

AGENTS.md: [found and verified / found but missing: X / not found — copy from template]
opencode.json: [wired correctly / needs instructions key — see above]

Next: run /venom-eat to absorb the project into .venom/CONTEXT.md
```

$ARGUMENTS
