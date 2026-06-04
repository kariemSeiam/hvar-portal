---
description: "Full project absorption — artifact-driven. Each phase writes to disk. CONTEXT.md is the final artifact, built from prior ones. Run once per project, again when codebase changes significantly."
---

# VENOM Eat — Project Absorption

Six phases. Each one reads and writes. Context can reset mid-absorption — intermediate artifacts survive.
CONTEXT.md is the final output, built from everything discovered.

Absorption is not reading. It's becoming.

---

## Phase 1 — Shape

What kind of body is this? Fast structural read.

```bash
ls -la
find . -maxdepth 2 -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -type f | head -40
```

Read the manifest — whichever exists:
- `package.json` → stack, deps, scripts, entry points
- `pyproject.toml` / `setup.py` → language version, deps, commands
- `go.mod` → module name, Go version, deps
- `Cargo.toml` → crate, dependencies, workspace

Write to `.venom/work/eat-shape.md`:
```markdown
## Shape — [project name] — [date]
**Language:** [language + version]
**Framework:** [framework + version]
**Key dependencies:** [top 5 with purposes]
**Scripts:** [build, test, start commands]
**Entry points:** [main files]
**Scale:** [rough file count, directory structure summary]
```

---

## Phase 2 — Skeleton

What is the data model? What does everything revolve around?

Read: database schemas, migration files, model definitions, core type files, interfaces.
```bash
find . -name "*.prisma" -o -name "schema.sql" -o -name "models.py" -o -name "types.ts" | grep -v node_modules | head -10
```

If no explicit schema: infer from dominant nouns in file names and function signatures.

Write to `.venom/work/eat-skeleton.md`:
```markdown
## Skeleton — [date]
**Core entities:** [list — what the system revolves around]
**Data model:** [key relationships, one paragraph]
**Schema location:** [file paths]
**Notable constraints:** [uniqueness, required fields, business rules baked into schema]
```

---

## Phase 3 — Heartbeat

What runs most often? What is the hot path?

```bash
grep -rn "export default\|module\.exports\|def main\|func main\|fn main\|app\.listen\|createServer\|@app\.route\|router\." \
  --include="*.ts" --include="*.js" --include="*.py" --include="*.go" --include="*.rs" \
  -l 2>/dev/null | grep -v node_modules | head -10
```

Read the entry point files. Trace the main request/event flow. Follow it to where data is read, transformed, written.

Write to `.venom/work/eat-heartbeat.md`:
```markdown
## Heartbeat — [date]
**Entry point:** [file:function]
**Hot path:** [A → B → C — one paragraph tracing main flow]
**Performance-critical code:** [files and functions that run on every request]
**Background jobs:** [if any — what they do, how often]
```

---

## Phase 4 — Nervous System

How do things communicate?

Read: route files, event emitters, API clients, webhook handlers, queue consumers, pub/sub configs.

Write to `.venom/work/eat-nerves.md`:
```markdown
## Nervous System — [date]
**API surface:** [routes or endpoints — one line each]
**Internal events:** [event names, emitters, listeners]
**External integrations:** [what external services, how they're called]
**Async patterns:** [queues, workers, crons — what and why]
```

---

## Phase 5 — Risks

What could break? What's concerning?

Look for:
- Missing tests on critical paths
- Commented-out error handling
- Hardcoded values that should be env vars
- Very large files (complexity accumulation)
- TODOs in critical paths
- Outdated or vulnerable dependencies

```bash
grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.js" --include="*.py" --include="*.go" | grep -v node_modules | head -20
wc -l $(find . -name "*.ts" -o -name "*.py" -o -name "*.go" | grep -v node_modules) 2>/dev/null | sort -rn | head -10
```

Write to `.venom/work/eat-risks.md`:
```markdown
## Risks — [date]
**Risk 1:** [specific — file, function, consequence]
**Risk 2:** [specific]
**Risk 3:** [specific]
**TODOs in critical paths:** [list — file:line]
**Missing test coverage:** [specific areas, not "generally"]
```

---

## Phase 6 — Write CONTEXT.md

Now synthesize. Read all five artifacts. Write `.venom/CONTEXT.md` from what was discovered.

```markdown
# [Project Name] — Context

**Stack:** [from eat-shape.md — language, framework, key deps with versions]

**Structure:** [one paragraph — where things live, directory organization]

**Hot paths:** [from eat-heartbeat.md — specific files and functions that run constantly]

**Conventions:** [naming patterns, error handling style, async patterns, testing approach]

**Risks:** [top 3 from eat-risks.md — specific, not generic]

**Last eaten:** [today's date]
```

Stay under 2KB. Every word earns its place.

---

## After

CONTEXT.md is now populated. The plugin injects it into every future session automatically.

The intermediate artifacts (`eat-shape.md`, `eat-skeleton.md`, `eat-heartbeat.md`, `eat-nerves.md`, `eat-risks.md`) stay in `.venom/work/` as source material. When `/venom-eat` runs again, they are overwritten with fresh discovery.

Run again when:
- Significant features are added or removed
- Stack changes
- 2+ weeks of heavy development have passed
- Something feels off about VENOM's project awareness

---

*Each phase writes. Phases can be resumed if context resets. CONTEXT.md is built from artifacts, not from memory.*
