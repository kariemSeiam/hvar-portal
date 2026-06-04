# VENOM × OpenCode — Knowledge Base

> What VENOM knows about OpenCode

## OpenCode Anatomy

**Version:** Run `opencode --version` for current. Tested on 1.3.x.
**License:** MIT
**Repo:** https://github.com/opencode-ai/opencode

### Installation

```bash
# npm global
npm install -g opencode-ai

# Or local
opencode --version  # shows current version
```

### CLI Commands

| Command | Purpose |
|---------|---------|
| `opencode [project]` | Start TUI (default) |
| `opencode run [msg]` | Non-interactive execution |
| `opencode serve` | Headless server |
| `opencode web` | Server + browser UI |
| `opencode attach <url>` | Attach to running server |
| `opencode mcp` | Manage MCP servers |
| `opencode agent` | Manage agents |
| `opencode session` | Manage sessions |
| `opencode db` | Database tools |
| `opencode acp` | ACP server |
| `opencode models` | List models |
| `opencode stats` | Token usage |
| `opencode export` | Export session |
| `opencode import` | Import session |
| `opencode pr <num>` | Fetch PR, start |

### Data Locations

| Path | Contents |
|------|---------|
| `~/.local/share/opencode/` | opencode.db, auth.json, logs |
| `~/.config/opencode/` | Global config |
| `.opencode/` | Project config |
| `opencode.json` | Project config |

### Database Schema

**Tables:**
- `project` — worktree, vcs, name, icon
- `workspace` — workspace container
- `session` — project_id, parent_id, title, share_url
- `message` — session_id, data
- `part` — message_id, data
- `todo` — session_id, content, status
- `permission` — project_id, data
- `account` — provider credentials

---

## OpenCode Tools

### Built-in Tools

| Tool | Description |
|------|-------------|
| `bash` | Execute shell commands |
| `read` | Read file contents |
| `write` | Create/overwrite files |
| `edit` | Modify files (string replacement) |
| `glob` | Find files by pattern |
| `grep` | Search with regex |
| `list` | List directory contents |
| `lsp` | LSP operations |
| `skill` | Load SKILL.md files |
| `todowrite` | Manage todo lists |
| `webfetch` | Fetch web content |
| `websearch` | Search web |
| `question` | Ask user questions |
| `task` | Delegate to subagents |

### MCP Integration

```bash
# Add MCP server
opencode mcp add

# List servers
opencode mcp list

# OAuth authenticate
opencode mcp auth [name]
```

### Agent System

**Primary Agents:**
- `build` — Default, full access (Tab key)
- `plan` — Read-only, bash asks permission (Tab key)

**Subagents:**
- `general` — Multi-step tasks
- `explore` — Codebase exploration (fast)
- `compaction` — Context summarization
- `title` — Session titles
- `summary` — Session summaries

---

## OpenCode Patterns

### Mode Detection

```typescript
// VENOM detects OpenCode mode
type OpenCodeMode = 'cli' | 'tui' | 'ide' | 'sdk' | 'web' | 'desktop'

function detectMode(): OpenCodeMode {
  // Check OPENCODE_CLIENT env
  // Check invocation pattern
  // Check file context (.vscode, .idea)
  return mode
}
```

### Response Adaptation

| Mode | Response Style |
|------|-----------------|
| CLI | Ultra-brief, code-first, no preamble |
| TUI | Brief but formatted, bullets/tables |
| IDE | Detailed, explanatory, 2-3 examples |
| SDK | JSON-focused, type-safe, minimal prose |
| Web | Balanced, visual-aware |
| Desktop | Balanced, UI-aware |

### Project Initialization

```bash
# /init and /venom-init are TUI commands — not shell commands
# Launch opencode first, then type in TUI:
# /init         → OpenCode native: creates AGENTS.md with project analysis
# /venom-init   → VENOM enhanced: scaffolds .venom/ brain + verifies config
```

### Session Lifecycle

```bash
/share   # Create shareable URL
/export  # Export to JSON
/import  # Import from URL/JSON
/undo    # Revert last change
/redo    # Restore reverted change
```

---

## Environment Variables

| Variable | Purpose | VENOM Note |
|----------|---------|------------|
| `OPENCODE_CLIENT` | Client identifier | Mode detection |
| `OPENCODE_CONFIG` | Inline config | Config override |
| `OPENCODE_SERVER_PASSWORD` | Server auth | Security context |
| `OPENCODE_DISABLE_CLAUDE_CODE` | Disable .claude/ | ⚠️ Don't set |
| `OPENCODE_EXPERIMENTAL_PLAN_MODE` | Plan mode | Think alignment |

---

## What VENOM Can Do

### File Operations
- Read any file in project
- Write/create files
- Edit with string replacement
- List directories
- Search content

### Project Analysis
- Scan package.json
- Detect frameworks
- Identify tech stack
- Map dependencies

### Session Management
- Share sessions
- Export/Import
- Undo/Redo

### Tool Orchestration
- Batch parallel operations
- Delegate to subagents
- Load skills on demand

---

*Knowledge base for VENOM × OpenCode integration.*
