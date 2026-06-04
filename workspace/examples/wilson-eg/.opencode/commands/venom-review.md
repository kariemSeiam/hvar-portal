---
description: "Deep 8-perspective code review. Security, performance, correctness, maintainability, style, dependencies, docs, tests."
agent: venom-reviewer
subtask: true
---

Review the following for security, performance, correctness, maintainability, style, dependencies, documentation, and test coverage. Most critical issues first. Include a fix for each issue found.

$ARGUMENTS

If no specific files or scope given, review the most recent git changes:
!`git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only --cached 2>/dev/null || echo "No changes found"`
