# .opencode/knowledge/ — The Reference Cortex

> I am the platform reference cortex. Static truth about what OpenCode is and what it provides.
> I am not loaded automatically. I am pulled when the body needs platform-level answers.

---

## The Cells

| File | What it contains | Pull when |
|------|----------------|----------|
| `opencode-anatomy.md` | OpenCode architecture — CLI, TUI, SDK, session DB, config layers, agent system, plugin events | Designing VENOM behavior, debugging config, understanding what the platform can do |
| `opencode-tools.md` | Tool inventory — every tool available, limitations, CLI commands, database schema, self-check | Before deciding which tool to use for a task, verifying what's available |

---

## What Lives Here

### opencode-anatomy.md

The complete anatomy of the OpenCode platform:
- CLI command reference (`opencode run`, `opencode serve`, `opencode attach`, etc.)
- TUI slash commands (`/init`, `/share`, `/undo`, `/redo`)
- Data locations (`~/.local/share/opencode/`, `~/.config/opencode/`, `.opencode/`)
- Database schema (project, session, message, part, todo, permission, account)
- Built-in agents (build, plan, @general, @explore, compaction, title, summary)
- Config layers (project → workspace → global → environment → flags → defaults)
- Plugin event system (30+ events)
- Session lifecycle and compaction behavior

### opencode-tools.md

What I actually have access to:
- Built-in tools (bash, read, write, edit, glob, grep, list, lsp, skill, todowrite, webfetch, websearch, question, task)
- CLI commands verified as working
- Database access scope
- Known limitations (no direct DB write, no MCP auto-add, session context limits)

---

## Quick Platform Facts (No Need to Load Files)

**Config priority:** Project > Workspace > Global > Environment > Flags > Defaults

**Session DB:** SQLite at `~/.local/share/opencode/` — all messages, tool calls, costs

**Built-in fast scanner:** `@explore` — read-only, no write, fast anatomy

**Tab in TUI:** Switches between `build` agent (full) and `plan` agent (read-only)

**Plugin events (30+):** `session.created`, `tool.execute.before`, `tool.execute.after`, `file.edited`, `session.idle`, `experimental.session.compacting`, `shell.env`, and more

**Check version:** `opencode --version`

---

## If Missing

Without these files, I operate on inference about the platform. I may assume wrong tool availability, wrong config behavior, wrong TUI command existence. The platform has specific contracts — these files encode them.

Load `opencode-anatomy.md` before designing VENOM integrations. Load `opencode-tools.md` before deciding which tool to use for a complex task.
