# Claude Code — Full Eat (Pigo machine)

> Absorbed 2026-06-01 from: installed binary v2.1.159, ~/.claude/*, changelog cache, filtered source leak (Downloads), sdk-tools.d.ts

## Install on this machine

| Item | Value |
|------|-------|
| Version | **2.1.159** (latest seen in changelog) |
| Binary | `~/.local/share/fnm/node-versions/v22.22.2/.../bin/claude.exe` (native, not JS) |
| npm wrapper | `@anthropic-ai/claude-code@2.1.159` |
| Config home | `~/.claude/` |
| Global state | `~/.claude.json` |
| Changelog cache | `~/.claude/cache/changelog.md` (~4000 lines) |
| Account | kariemseiam@gmail.com — **Claude Max 5x** |
| Default model | `sonnet` (settings.json) |
| Effort | `medium` |
| IDE | autoConnectIde: true (Cursor) |

## Architecture (mental model)

```
npm @anthropic-ai/claude-code
  └── bin/claude.exe          ← native Bun-compiled binary (all logic here)
  └── cli-wrapper.cjs         ← thin launcher
  └── sdk-tools.d.ts          ← tool I/O JSON schemas (Agent, Bash, Workflow, Cron, etc.)

~/.claude/
  ├── settings.json           ← user settings (merged with project/local)
  ├── settings.local.json     ← permission allow-list (Pigo has extensive Bash allows)
  ├── CLAUDE.md               ← global instructions (VENOM identity)
  ├── agents/                 ← custom subagents (*.md)
  ├── skills/                 ← user skills (auto-loaded, no marketplace needed since 2.1.157)
  ├── rules/                  ← conditional rules (*.md with paths: frontmatter)
  ├── scripts/                ← hooks (session-start, pre-tool-use, etc.)
  ├── plugins/                ← marketplace cache (official installed, 0 plugins enabled)
  ├── projects/<hash>/        ← per-project transcripts (*.jsonl)
  ├── sessions/               ← session index
  └── cache/changelog.md      ← full release notes
```

**Filtered TypeScript source** exists at:
`~/Downloads/01 src [CLAUDE ORIGINAL FILTRADO] 31-03-2026/` (~1900 files) — use for env vars, slash commands, feature flags.

## Power features (2.1.154+ — current generation)

| Feature | How to use |
|---------|------------|
| **Opus 4.8** | `/model` → opus; `/effort xhigh` or `max` for hardest tasks |
| **Fast mode** | `/fast on` on Opus 4.8 — 2.5× speed, 2× cost |
| **Dynamic workflows** | Say "create a workflow for X" or `/workflows` — orchestrates many background agents |
| **Background agents** | `←←` or `claude agents`; `! cmd` runs shell as bg session; `claude --bg --exec 'cmd'` |
| **Remote Control** | `/remote-control` or `claude --remote-control` — drive terminal from claude.ai/mobile |
| **Auto mode** | Shift+Tab cycles permission modes; classifier blocks dangerous ops without asking |
| **Worktrees** | `claude -w [name]` or `--worktree`; subagents can use `isolation: worktree` |
| **Ultraplan** | `/ultraplan` — long visual planning (up to 90min) |
| **Ultrareview** | `claude ultrareview` — cloud multi-agent PR review (5 agents, Opus) |
| **Goal mode** | `/goal` — Claude keeps working until condition met |
| **Side questions** | `/btw question` while Claude is busy — parallel quick ask |
| **Memory** | `/memory` — auto-memory + manual; global at `~/.claude/projects/-home-pigo/memory/` |
| **Chrome** | `/chrome` — browser automation (tengu_malort_pedway enabled) |
| **Voice** | `/voice` — push-to-talk STT |
| **Plugins in skills/** | Drop plugin in `~/.claude/skills/<name>/` — auto-loads; `claude plugin init <name>` |
| **Cron / schedule** | CronCreate tool + `/schedule`; routines on claude.ai/code |

## All slash commands (from source)

`/add-dir` `/agents` `/branch` `/bridge` `/btw` `/chrome` `/clear` `/color` `/compact` `/config` `/context` `/copy` `/cost` `/debug-tool-call` `/desktop` `/diff` `/doctor` `/effort` `/exit` `/export` `/extra-usage` `/fast` `/feedback` `/help` `/hooks` `/ide` `/init` `/install-github-app` `/install-slack-app` `/keybindings` `/login` `/logout` `/mcp` `/memory` `/mobile` `/model` `/onboarding` `/passes` `/permissions` `/plan` `/plugin` `/pr_comments` `/privacy-settings` `/release-notes` `/reload-plugins` `/reload-skills` `/remote-control` `/rename` `/resume` `/review` `/sandbox-toggle` `/session` `/share` `/skills` `/stats` `/status` `/summary` `/tag` `/tasks` `/teleport` `/terminal-setup` `/theme` `/thinkback` `/upgrade` `/usage` `/vim` `/voice` `/workflows` `/ultraplan` `/goal` `/simplify` `/code-review` `/claude-api` `/good-claude` `/bughunter` `/security-review` `/advisor` `/commit` `/commit-push-pr`

## CLI flags worth knowing

```bash
claude -p "prompt"                    # print mode (CI/scripts)
claude -c / -r [session-id]           # continue / resume
claude -w [name]                      # git worktree session
claude --worktree --tmux              # worktree + tmux panes
claude --remote-control [name]        # mobile/web control
claude --permission-mode plan         # plan-only
claude --permission-mode bypassPermissions  # yolo (also settings)
claude --effort xhigh                 # max thinking
claude --model opus                   # alias
claude --agent venom-builder          # default subagent
claude --bare                         # minimal: no hooks, no CLAUDE.md auto-load
claude --chrome / --no-chrome
claude --include-partial-messages     # stream tokens in -p mode
claude --output-format stream-json    # SDK-style output
claude --max-budget-usd 5             # cost cap in -p
claude --from-pr [number]             # resume PR-linked session
claude agents                         # background agent dashboard
claude ultrareview [pr|branch]        # cloud code review
claude auto-mode config               # see your auto mode rules
claude mcp list / add / serve         # MCP management
claude plugin install X@marketplace   # plugins
claude project purge [path]           # wipe project claude state
```

## Hidden / power env vars (from leaked source)

**Unlock / tune:**
- `CLAUDE_CODE_ENABLE_AUTO_MODE=1` — auto mode on Bedrock/Vertex/Foundry
- `CLAUDE_CODE_COORDINATOR_MODE=1` — multi-agent coordinator
- `CLAUDE_CODE_SIMPLE=1` — strip skills, memory, MCP, hooks (also `--bare`)
- `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` — turn off auto-memory
- `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS=1` — remove built-in commit/PR instructions
- `CLAUDE_CODE_USE_POWERSHELL_TOOL=1` — PowerShell tool (Windows)
- `CLAUDE_CODE_PROFILE_QUERY=1` — profile latency to first token
- `CLAUDE_CODE_ENABLE_XAA=1` — MCP cross-account auth
- `CLAUDE_CODE_BASH_SANDBOX_SHOW_INDICATOR=1` — show sandbox badge
- `CLAUDE_CODE_MAX_OUTPUT_TOKENS` — cap output
- `BASH_MAX_OUTPUT_LENGTH` / `TASK_MAX_OUTPUT_LENGTH` — tool output limits
- `CLAUDE_CODE_SHELL_PREFIX` — wrap every bash command
- `CLAUDE_CODE_EFFORT_LEVEL=high|xhigh|max` — default effort
- `OTEL_LOG_TOOL_DETAILS=1` — log tool params in telemetry

**Providers:**
- `CLAUDE_CODE_USE_BEDROCK=1` / `USE_VERTEX=1` / `USE_FOUNDRY=1`
- `ANTHROPIC_API_KEY` disables Remote Control + claude.ai MCP connectors

## Pigo's live config highlights

**Enabled feature flags (GrowthBook cache):** workflows, ultraplan, harbor (RC), bridge v2, auto mode 2-stage classifier, worktree mode, prompt suggestions, streaming tools, claude.ai MCP connectors, chrome automation, code-review CLI, file write optimization.

**MCP connected:** Gmail, Google Drive, Google Calendar. Notion needs auth.

**Plugins:** marketplace `claude-plugins-official` cached; **none installed**. Available: security-guidance, code-review, ralph-loop, feature-dev, frontend-design, pr-review-toolkit, skill-creator, all LSP plugins, etc.

**Custom setup:** VENOM global CLAUDE.md, 5 venom agents, 4 venom skills, 6 hook scripts, extensive settings.local.json permissions.

**Unlocked powerups:** cross-device. **Guest passes:** 3 remaining.

## Permission modes (Shift+Tab)

| Mode | Behavior |
|------|----------|
| default | Ask on sensitive ops |
| acceptEdits | Auto-approve file edits |
| plan | Read-only planning |
| auto | AI classifier decides allow/deny/ask |
| bypassPermissions | No prompts (dangerous) |
| dontAsk | Auto-deny unknown |

## Hook events (for custom automation)

SessionStart, SessionEnd, PreToolUse, PostToolUse, PostToolUseFailure, PreCompact, PostCompact, Stop, SubagentStop, UserPromptSubmit, Notification, ConfigChange, InstructionsLoaded, MessageDisplay, WorktreeCreate, WorktreeRemove, TeammateIdle, TaskCompleted

## Gotchas on this machine

1. `claude doctor` may hang in non-TTY (needs trusted dir + interactive)
2. Remote Control needs full OAuth — `setup-token` / `CLAUDE_CODE_OAUTH_TOKEN` won't work for RC
3. API key auth disables RC, schedules, claude.ai MCP
4. Use `127.0.0.1` patterns — Pigo's local.json already allows `/mnt/pigo/**` and `/hub/**` reads
5. npm global install may not auto-update — use `claude update` or native install
6. Feature flags in `.claude.json` → `cachedGrowthBookFeatures` — server-controlled, not manually editable for unlock

## Changelog milestones (recent)

- **2.1.159** — internal only
- **2.1.158** — auto mode on Bedrock/Vertex/Foundry
- **2.1.157** — skills-dir plugins, `claude plugin init`, agents settings.agent honored
- **2.1.154** — Opus 4.8, workflows, fast mode, `/simplify` cleanup review
- **2.1.152** — `/code-review --fix`, MessageDisplay hook, `/reload-skills`
- **2.1.69** — `/claude-api` skill, voice 20 langs, remote-control naming
- **2.1.59** — auto-memory (`/memory`)
- **2.1.51** — `claude remote-control` subcommand
- **2.1.49** — `--worktree` flag

Full history: `~/.claude/cache/changelog.md`
