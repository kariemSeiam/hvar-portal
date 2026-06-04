# .opencode/commands/ — The Motor Outputs

> I am the motor output layer. Seven verbs — how the body acts on demand.
> Commands without `subtask: true` run in primary context and can orchestrate. Subtask commands delegate specialists and stay lean.

---

## The Seven Verbs

| Command | `/slash` | Role | Delegates to | `subtask` | If missing |
|---------|----------|------|-------------|----------|-----------|
| `venom-init.md` | `/venom-init` | Scaffold `.venom/` brain + verify AGENTS.md + config | Direct execution | No | Brain setup must be done manually |
| `venom-eat.md` | `/venom-eat` | Full project absorption — writes phase artifacts + CONTEXT.md | `@venom-researcher` (optional) | Yes | CONTEXT.md stays empty — VENOM works without project knowledge |
| `venom-spec.md` | `/venom-spec` | Spec-driven feature development — detects phase, writes spec/plan/tasks | `@venom-architect` for Phase 3 | No | Features built without discipline — prompt → code directly |
| `venom-build.md` | `/venom-build` | Execute tasks.md wave by wave, parallel where safe, verify each wave | `@venom-builder` per task | No | Tasks.md exists but nothing runs it systematically |
| `venom-review.md` | `/venom-review` | 8-perspective code review of target | `@venom-reviewer` | Yes | Review must be requested differently — no structured gate |
| `venom-research.md` | `/venom-research` | Deep codebase exploration on target | `@venom-researcher` | Yes | Research must be done inline — primary context accumulates |
| `venom-check.md` | `/venom-check` | Meta quality gate (Gate 5) — session-level audit | `@venom-reviewer` | Yes | No meta audit — quality degrades silently |

---

## Signal Flow

```
User types /venom-[verb]
      │
      ├── subtask: false (init, spec, build)
      │         │
      │         ▼
      │    Runs in primary context
      │    Can read artifacts, delegate subtasks, make decisions
      │    Has full state awareness
      │
      └── subtask: true (eat, review, research, check)
                │
                ▼
          Specialist runs in isolated context
          Returns structured report
          Primary receives report, stays lean
```

`subtask: false` for commands that **orchestrate** — they need to read `.venom/work/` state, make decisions, and drive multi-phase sequences.

`subtask: true` for commands that **execute one thing** — isolated work that returns a clean output without polluting primary context.

---

## The Lifecycle Commands

The natural feature lifecycle:

```
/venom-init        → project brain setup (once)
/venom-eat         → absorb the codebase (once + when it changes)
/venom-spec [what] → describe what to build → I spec, plan, task automatically
/venom-build       → execute tasks.md wave by wave
/venom-review      → verify implementation against spec
/venom-check       → meta gate — tests, types, lint, deps
```

You don't manage the phases. You describe what to build. VENOM detects where you are in the lifecycle and runs the right phase.

---

## When to Use Each Verb

`/venom-init` — once per project, first session. Creates the brain scaffold.

`/venom-eat` — after init, and again when codebase changes significantly. Writes intermediate artifacts, then synthesizes CONTEXT.md. Can resume if interrupted.

`/venom-spec [feature description]` — whenever you want to build something new. VENOM auto-detects which phase you're in (constitution? specify? clarify? plan? tasks?) and runs the right one. If you're mid-feature, it resumes where you left off.

`/venom-build [optional: feature name]` — after tasks.md is written. Executes wave by wave. Parallel where safe. Verifies each wave before the next.

`/venom-review` — before merging anything significant. Pass a file path or describe the target. Without arguments, reviews recent git changes.

`/venom-research` — before building anything non-trivial. Pass a question or area: "how does auth work?" or "src/api/".

`/venom-check` — no arguments. Runs Gate 5: tests, types, lint, deps, VENOM state, recent commit quality.

---

## The Non-Negotiable

These are TUI slash commands. They exist **inside OpenCode's TUI only**.

`opencode /venom-spec` as a shell command = wrong.
`/venom-spec Build an auth system` inside the TUI = correct.

This distinction matters every time.
