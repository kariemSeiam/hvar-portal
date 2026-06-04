# .opencode/workflows/ — The Procedural Body

> I am the procedural body. Deep workflows — multi-phase, artifact-driven, gate-protected.
> **Commands (`/venom-spec`, `/venom-build`, `/venom-eat`) are the primary interface.** Workflows are the architecture behind them.
> The dev describes intent. The command reads context, detects phase, and drives the workflow. The dev doesn't orchestrate — VENOM does.
> Each phase writes an artifact. Artifacts survive context resets. That's the point.

---

## Command → Workflow Relationship

| Dev types | Command runs | Workflow driving it |
|-----------|-------------|---------------------|
| `/venom-spec Build auth` | `venom-spec.md` command | `workflows/venom-spec.md` architecture |
| `/venom-build` | `venom-build.md` command | `workflows/venom-spec.md` (execution phase) |
| `/venom-eat` | `venom-eat.md` command | `workflows/venom-eat.md` architecture |
| Implicit (debug situation) | via AGENTS.md routing | `workflows/venom-debug.md` |
| Before commit | `/venom-review` + `/venom-check` | `workflows/venom-ship.md` (review + verify phase) |

The commands are the dev-facing interface. The workflows are the detailed procedure behind each command. Dev never reads workflow files — VENOM does.

---

## The Four Workflows

| Workflow | Invoke when | Phases | Artifacts produced |
|----------|------------|--------|--------------------|
| `venom-spec.md` | Building a new feature from requirements | Constitution → Specify → Clarify → Plan → Tasks → Build → Verify | constitution.md, spec.md, clarifications.md, plan.md, tasks.md |
| `venom-ship.md` | Before any significant commit or release | Understand → Clarify → Design → Check → Build → Review + Verify | research.md, clarifications.md, plan.md |
| `venom-debug.md` | Something broken with non-obvious cause | Observe → Hypothesize → Test → Evaluate → Fix → Prevent | debug-log.md |
| `venom-eat.md` | First session, or major codebase change | Shape → Skeleton → Heartbeat → Nerves → Risks → Write | eat-shape.md, eat-skeleton.md, eat-heartbeat.md, eat-nerves.md, eat-risks.md, CONTEXT.md |

---

## Artifact Architecture

All intermediate artifacts write to `.venom/work/`:

```
.venom/work/
├── constitution.md        ← project governing principles (written once)
├── research.md            ← venom-ship Phase 1 output
├── clarifications.md      ← venom-ship Phase 2 output
├── plan.md                ← venom-ship Phase 3 output
├── debug-log.md           ← venom-debug running investigation log
├── eat-shape.md           ← venom-eat Phase 1 output
├── eat-skeleton.md        ← venom-eat Phase 2 output
├── eat-heartbeat.md       ← venom-eat Phase 3 output
├── eat-nerves.md          ← venom-eat Phase 4 output
├── eat-risks.md           ← venom-eat Phase 5 output
├── ACTIVE.md              ← plugin-managed session state
└── features/
    └── [feature-name]/
        ├── spec.md         ← venom-spec Phase 1 output
        ├── clarifications.md ← venom-spec Phase 2 output
        ├── plan.md         ← venom-spec Phase 3 output
        └── tasks.md        ← venom-spec Phase 5 output
```

After a workflow completes: artifacts archive to `.venom/work/archive/[name]/`.

---

## Signal Flow

```
Situation recognized → workflow selected
      │
      ▼
Phase 1 runs → writes artifact
      │
      ▼  gate check: artifact complete?
Phase 2 runs → reads Phase 1 artifact, writes Phase 2 artifact
      │
      ▼  gate check: artifacts coherent?
...
      │
      ▼
Final artifact produced → archive
```

**Why artifacts matter:** Context resets. Sessions end. Memory fades.
Artifacts don't. A workflow that only lives in context dies with the context.

---

## When Not to Use Workflows

Simple, clear, single-file tasks → use commands or act directly.
Workflows are for complex situations where sequencing, gates, and cross-session continuity matter.

If you can do it in one move — do it in one move.

---

## Gate Philosophy

Every gate exists because skipping it has a known cost:

| Skipped gate | Known cost |
|-------------|-----------|
| Understand before design | Architect designs the wrong thing |
| Clarify before plan | Ambiguity becomes implicit code decisions |
| Consistency check | Plan and spec drift — implementation satisfies neither |
| Wave verification | Errors compound across waves — harder to debug |
| Review against spec | Code satisfies the plan but misses the user need |

Gates are not friction. Gates are the difference between finishing and shipping.
