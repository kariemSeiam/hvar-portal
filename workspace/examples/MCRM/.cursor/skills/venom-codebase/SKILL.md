---
name: "venom-codebase"
description: "Lightweight codebase knowledge graph. Use before major refactors, when asked about architecture, or when impact analysis is needed. Maps structure, hot paths, coupling, and risk zones without leaving Cursor."
disable-model-invocation: false
---

# venom-codebase

Build a structural understanding of the codebase before touching anything significant.
Lightweight, Cursor-native. Good enough for most refactors and architecture questions.

---

## When to Run

- Before any refactor touching 5+ files
- When asked "how does this codebase work"
- When asked "what's the architecture"
- When joining a new project for the first time
- When something is mysteriously broken and you need the full picture

---

## Protocol

### 1. Broad Structural Pass (SemanticSearch)

```
SemanticSearch: "main entry point"
SemanticSearch: "database connection" or "data layer"
SemanticSearch: "authentication" or "auth middleware"
SemanticSearch: "routing" or "routes"
SemanticSearch: "configuration"
```

Run in parallel. This gives the architecture skeleton.

### 2. Dependency Map (Grep)

```
Grep: import — frequency map (which files are imported most)
Grep: require — same
Grep: export default — what's exported as primary
Grep: export { — what's exported as named
```

Files imported most = hot nodes. These are the highest-risk changes.

### 3. Entry Points

```
Read: package.json → "main", "scripts" → understand entry
Read: app.js / index.ts / main.py / server.js (whichever applies)
```

### 4. Data Flow

```
SemanticSearch: "database" or "db" or "model" or "schema"
Grep: ".query(" or ".find(" or ".save(" or "SELECT"
```

Where does data enter? Where does it transform? Where does it exit?

### 5. Output Knowledge Graph

```
## Codebase: [name]

### Architecture Pattern
[MVC / modular / layered / monolith / microservices]

### Entry Points
[files, what they do]

### Hot Nodes (Most Imported)
[file → N imports — these are high-risk to change]

### Data Flow
[request → processing → storage → response]

### Service Boundaries
[what talks to what, contracts]

### Risk Zones
[coupled things, unclear ownership, high fan-out]

### Orphans / Dead Code
[files imported by nothing — candidates for removal]

### What to Change First
[if refactoring: start here, it's safest]
```

---

## Notes

- This is a snapshot, not a live graph. Re-run after major changes.
- Combine with `venom-audit` for specific change impact.
- For very large codebases (100+ files) → focus on the domain relevant to the current task, not the whole thing.
