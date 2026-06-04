---
description: "Absorb a project fully — structure, skeleton, hot paths, nervous system, risks. Writes phase artifacts to .venom/work/. Synthesizes .venom/CONTEXT.md from what was discovered."
subtask: false
---

Eat this project. Not a summary — full absorption. Each phase writes to disk.
If context resets mid-absorption, the intermediate artifacts survive. Resume from where you left off.

## Orient: what's already been eaten?

!`ls .venom/work/eat-*.md 2>/dev/null && echo "RESUMING" || echo "FRESH_START"`

If resuming: read existing eat files to understand what's already known. Skip phases already complete. Start from the first missing phase.

```
venom_workflow_update({ workflow: "eat", phase: 0, phaseName: "Orient" })
```

---

## Phase 1: Shape

```
venom_workflow_update({ workflow: "eat", phase: 1, phaseName: "Shape" })
```

What kind of body is this?

!`ls -la`
!`find . -maxdepth 2 -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/build/*" -type f | head -40`
!`cat package.json 2>/dev/null || cat go.mod 2>/dev/null || cat Cargo.toml 2>/dev/null || cat pyproject.toml 2>/dev/null || cat requirements.txt 2>/dev/null || echo "No manifest"`

Write `.venom/work/eat-shape.md`:
```markdown
## Shape — [project name] — [date]
**Language:** [language + version]
**Framework:** [framework + version]
**Key dependencies:** [top 5 with one-line purpose each]
**Scripts:** [build, test, start, lint commands]
**Entry points:** [main file(s)]
**Scale:** [file count estimate, key directories]
```

---

## Phase 2: Skeleton

```
venom_workflow_update({ workflow: "eat", phase: 2, phaseName: "Skeleton", artifactWritten: ".venom/work/eat-shape.md" })
```

What does everything revolve around?

Read schema files, migration files, model definitions, core type files.
!`find . -name "*.prisma" -o -name "schema.sql" -o -name "models.py" -o -name "types.ts" -o -name "schema.ts" 2>/dev/null | grep -v node_modules | head -10`

Write `.venom/work/eat-skeleton.md`:
```markdown
## Skeleton — [date]
**Core entities:** [list — what the system revolves around]
**Data model:** [key relationships, one paragraph]
**Schema location:** [file paths]
**Notable constraints:** [business rules baked into schema]
```

---

## Phase 3: Heartbeat

```
venom_workflow_update({ workflow: "eat", phase: 3, phaseName: "Heartbeat", artifactWritten: ".venom/work/eat-skeleton.md" })
```

What is the hot path?

!`grep -rn "export default\|module\.exports\|def main\|func main\|fn main\|app\.listen\|createServer\|@app\.route\|router\." --include="*.ts" --include="*.js" --include="*.py" --include="*.go" --include="*.rs" -l 2>/dev/null | grep -v node_modules | head -10`

Read the entry point files. Trace the main request or event flow.

Write `.venom/work/eat-heartbeat.md`:
```markdown
## Heartbeat — [date]
**Entry point:** [file:function]
**Hot path:** [A → B → C — one paragraph]
**Performance-critical code:** [files that run on every request]
**Background jobs:** [if any — what and how often]
```

---

## Phase 4: Nervous System

```
venom_workflow_update({ workflow: "eat", phase: 4, phaseName: "Nervous System", artifactWritten: ".venom/work/eat-heartbeat.md" })
```

How do things communicate?

Read: routes, event emitters, API clients, webhooks, queue consumers.

Write `.venom/work/eat-nerves.md`:
```markdown
## Nervous System — [date]
**API surface:** [routes/endpoints — one line each]
**Internal events:** [event names, emitters, listeners]
**External integrations:** [services, how called]
**Async patterns:** [queues, workers, crons — what and why]
```

---

## Phase 5: Risks

```
venom_workflow_update({ workflow: "eat", phase: 5, phaseName: "Risks", artifactWritten: ".venom/work/eat-nerves.md" })
```

What could break?

!`grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.js" --include="*.py" --include="*.go" 2>/dev/null | grep -v node_modules | head -20`

Look for: missing tests on critical paths, commented error handling, hardcoded secrets, very large files, deprecated deps.

Write `.venom/work/eat-risks.md`:
```markdown
## Risks — [date]
**Risk 1:** [specific — file, consequence]
**Risk 2:** [specific]
**Risk 3:** [specific]
**TODOs in critical paths:** [file:line if found]
```

---

## Phase 6: Synthesize CONTEXT.md

```
venom_workflow_update({ workflow: "eat", phase: 6, phaseName: "Synthesize", artifactWritten: ".venom/work/eat-risks.md" })
```

Read all five eat files. Write `.venom/CONTEXT.md` from what was discovered — not from memory.

```markdown
# [Project Name] — Context

**Stack:** [from eat-shape — language, framework, key deps with versions]

**Structure:** [one paragraph — directory organization, how things are split]

**Hot paths:** [from eat-heartbeat — specific files and functions]

**Conventions:** [naming, error handling style, async patterns, test approach]

**Risks:** [top 3 from eat-risks — specific, not generic]

**Last eaten:** [today's date]
```

Stay under 2KB. Every word earns its place.

```
venom_workflow_update({ workflow: "eat", phase: 6, phaseName: "Complete", artifactWritten: ".venom/CONTEXT.md", complete: true })
```

---

## Report

```
Project absorbed.

Shape:     [language + framework]
Skeleton:  [N core entities]
Heartbeat: [entry point]
Risks:     [top risk one-liner]

CONTEXT.md written. VENOM now knows this project.

Intermediate artifacts in .venom/work/eat-*.md (re-run to refresh).
```

$ARGUMENTS
