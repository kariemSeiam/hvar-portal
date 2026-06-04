# VENOM × OpenCode — Tool Inventory

> What's actually available. What requires which permissions. What to use when.

---

## Built-in Agent Tools

These tools are available to all agents in OpenCode. Availability depends on agent permissions and mode.

| Tool | What it does | Requires permission |
|------|-------------|-------------------|
| `read` | Read file contents | none (always allowed) |
| `glob` | Find files by pattern | none |
| `grep` | Search file contents with regex | none |
| `webfetch` | Fetch content from a URL | none |
| `write` | Create or overwrite a file | `edit: allow` or confirmation |
| `edit` | Modify specific lines in a file | `edit: allow` or confirmation |
| `bash` | Execute shell commands | `bash: allow` or `bash: ask` |
| `task` | Spawn a subagent for parallel work | depends on subagent permissions |
| `question` | Ask the user a question, wait for answer | none |
| `todowrite` | Create and manage task lists | none |

---

## Tool Availability by Agent Mode

| Tool | `build` agent | `plan` agent | Subagent (mode: subagent) |
|------|:---:|:---:|:---:|
| read, glob, grep, webfetch | ✅ | ✅ | ✅ |
| write, edit | ✅ | ⚠️ ask | depends on agent `.md` permission |
| bash | ✅ (per policy) | ⚠️ ask | depends on agent `.md` permission |
| task | ✅ | ✅ | ✅ |
| question | ✅ | ✅ | ✅ |

**`plan` agent:** edit and bash require user confirmation by default. This is OpenCode's read-first analysis mode. Tab in TUI switches between `build` and `plan`.

**Subagents:** permissions are scoped per `.md` frontmatter. VENOM's agents are explicitly locked down — reviewers cannot edit, explorers cannot bash.

---

## Permission Configuration (opencode.json)

```json
"permission": {
  "edit": "allow",        // file writes — no confirmation needed
  "bash": "ask"           // shell commands — confirm before running
}
```

| Permission value | Behavior |
|-----------------|---------|
| `"allow"` | Executes without confirmation |
| `"ask"` | Prompts user before each execution |
| `"deny"` | Blocked entirely |

Bash can be scoped per command pattern:
```json
"permission": {
  "bash": {
    "*": "ask",
    "git status": "allow",
    "git log*": "allow",
    "npm test": "allow"
  }
}
```

The venom-core.ts plugin adds a **second safety layer** on top of permission policy — it screens for dangerous patterns (`rm -rf /`, `DROP TABLE`, curl-pipe-bash, etc.) regardless of permission setting.

---

## VENOM Agent Permission Scopes

| Agent | edit | bash | task |
|-------|------|------|------|
| `venom-architect` | deny | selective read-only | — |
| `venom-researcher` | deny | selective read-only + git | `@explore` only |
| `venom-reviewer` | deny | selective read-only + git diff | — |
| `venom-builder` | allow | allow (no rm -rf, no sudo) | `@explore` |
| `venom-debugger` | allow | allow (no rm -rf, no sudo) | `@explore` |
| `venom-explorer` | deny | selective read-only | — |

"Selective read-only" = `cat`, `find`, `grep`, `rg`, `tree`, `ls`, `git log`, `git show`, `wc` only.

---

## OpenCode CLI Tools (Shell — not TUI commands)

These are shell commands, not TUI slash commands. Run them outside OpenCode or with `!` prefix inside a session.

```bash
# Verify VENOM is loaded
opencode debug skill            # lists all loaded skills — look for "venom-opencode"

# Verify config merged correctly
opencode debug config           # shows final merged config (all 6 layers)

# Inspect agent policies
opencode debug agent build      # full build agent system prompt + permissions
opencode debug agent plan       # full plan agent system prompt + permissions

# Session management
opencode session list           # all sessions
opencode session delete <id>    # delete a session
opencode export [sessionID]     # export session → JSON

# MCP management
opencode mcp list               # configured MCP servers
opencode mcp add                # interactive add
opencode mcp auth [name]        # authenticate an MCP server

# Model management
opencode models [provider]      # list available models (--verbose for costs)
opencode providers list         # configured providers

# Project stats
opencode stats                  # usage stats (--days N --models --project)
```

---

## TUI Commands (Inside OpenCode — not shell)

These exist ONLY inside the OpenCode TUI. Never prefix with `opencode`:

| TUI command | What it does |
|-------------|-------------|
| `/init` | Create AGENTS.md from template |
| `/connect` | Set up provider / model |
| `/share` | Share session (manual share mode) |
| `/undo` | Undo last file change (requires snapshot: true) |
| `/redo` | Redo |
| `/export` | Export session to JSON |
| `/import` | Import session |
| `/venom-init` | VENOM brain scaffold + config verify |
| `/venom-eat` | Full project absorption |
| `/venom-spec` | Spec-driven feature development |
| `/venom-build` | Wave execution of tasks.md |
| `/venom-review` | 8-perspective code review |
| `/venom-research` | Deep codebase exploration |
| `/venom-check` | Meta quality gate |

**Critical:** `opencode /venom-spec` as a shell command = wrong. `/venom-spec` inside TUI = correct.

---

## What Agents Cannot Do

| Capability | Status | Why |
|-----------|--------|-----|
| Read `opencode.db` directly | ✗ Not available | SQLite DB is OpenCode-internal. Use `opencode session list` from shell. |
| Write to `opencode.db` | ✗ Not available | Read-only from agent perspective |
| Add MCP servers programmatically | ✗ Not available | Must use `opencode mcp add` from shell |
| Create agents via API | ✗ Not available | Must use `opencode agent create` from shell |
| Access other users' sessions | ✗ Not available | Sessions are user-scoped |
| Read env vars from host shell | ✅ via `shell.env` hook | Plugin injects `VENOM_ACTIVE`, `VENOM_PROJECT`, `VENOM_SESSION` |

---

## Self-Check

Verify VENOM is fully loaded and configured:

```bash
# From shell:
opencode debug skill            # venom-opencode should appear
opencode debug config           # check instructions array includes AGENTS.md + .venom/CONTEXT.md
opencode debug agent build      # check VENOM identity appears in system prompt

# From inside TUI:
/venom-check                    # runs Gate 5 — tests, types, lint, deps, VENOM state
```

---

*Last verified: 2026-03-27 · OpenCode 1.3.2*
