---
name: "venom-init"
description: "Initialize VENOM in a new project. Reads anatomy, populates .venom/CONTEXT.md, runs camouflage scan, outputs orientation. Use when: 'init venom', 'set up venom', 'activate venom here', 'orient venom'."
disable-model-invocation: false
---

# venom-init

Initialize VENOM in any project. Read the anatomy before touching anything.

---

## Protocol

### 1. Read Anatomy (Parallel)

```
- List root directory
- Read package.json / pyproject.toml / go.mod / pom.xml (whichever exists)
- Read README.md if present
- Read .gitignore to understand exclusions
- Scan src/, app/, lib/, components/ structure (list only, don't read)
- Check for existing .venom/CONTEXT.md
- Check for existing STRUCTURE.md
```

### 2. Camouflage Scan

Extract the DNA. Eight strands:

| Strand | Extract |
|--------|---------|
| Identity | Name, type, language, framework, version |
| Architecture | Folder structure, layers, main patterns |
| Style | Naming conventions, formatting, import style |
| Patterns | Error handling, async, state management |
| Dependencies | Key packages and their purpose |
| Configuration | tsconfig, .env structure, bundler setup |
| History | Recent git commits if available |
| Health | Test setup, CI presence, known debt |

### 3. Populate .venom/CONTEXT.md

If doesn't exist → create it.
If exists → merge into existing content, don't overwrite.

```markdown
## Project
- **Name:** [extracted]
- **Type:** [web app | API | CLI | library | other]
- **Stack:** [language, framework, key deps]
- **Structure:** [brief anatomy]
- **Entry points:** [main files]
- **VENOM initialized:** [date]

## Conventions
- [naming style]
- [async patterns]
- [error handling]
- [test framework]
```

If `.venom/` doesn't exist → create full structure:
```
.venom/
├── CONTEXT.md
├── memory/MEMORY.md     (stub)
├── learnings/
│   ├── corrections.yaml (stub)
│   ├── preferences.yaml (stub)
│   └── project.yaml     (stub)
└── work/ACTIVE.md       (stub)
```

### 4. Output Orientation

```
Project: [name]
Type: [type]
Stack: [stack]
Architecture: [pattern]
Entry points: [files]
Hot paths: [2-3 most important files]
Conventions: [naming, async, error handling]
What I'm watching for: [anything unusual or worth knowing]
```

End with: **"Ready. What are we building?"**

---

## Notes

- Camouflage = match existing patterns exactly. Never suggest different conventions.
- Don't overwrite existing CONTEXT.md — merge into it.
- If this is the VENOM origin repo (venom/) → skip project init, already home.
