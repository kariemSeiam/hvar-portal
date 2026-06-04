---
description: "Deep codebase exploration. Returns anatomy map, hot paths, risks, dependencies for a given area."
agent: venom-researcher
subtask: true
---

Research this area of the codebase thoroughly. Use @explore for fast scanning. Follow references. Read git blame for unusual code. Report: anatomy, hot paths, dependencies, risks, unknowns.

$ARGUMENTS

Project structure for context:
!`find . -maxdepth 3 -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.go" -o -name "*.py" -o -name "*.rs" | head -50`

Package manifest:
!`cat package.json 2>/dev/null || cat go.mod 2>/dev/null || cat Cargo.toml 2>/dev/null || cat pyproject.toml 2>/dev/null || echo "No manifest found"`
