# .opencode/plugins/ — The Autonomic Nervous System

> I am the autonomic nervous system. I fire without being asked.
> Without me, VENOM's intelligence is manual. With me, it's automatic.

---

## Quick Start

```bash
cd .opencode/plugins && npm install
```

That's it. Plugin is now ready.

---

## The Organ

| File | Role |
|------|------|
| `venom-core.ts` | The plugin. 7 hook surfaces + 4 tools. |
| `package.json` | Dependencies. |
| `tsconfig.json` | TypeScript config. |
| `setup.sh` | Optional setup script. |

---

## Hook surfaces — what fires automatically

| Surface | When | What it does |
|--------|------|-------------|
| `event` | SDK events | Session lifecycle, idle checkpoint, file tracking |
| `experimental.chat.system.transform` | System prompt | Injects CONTEXT.md + corrections + workflow state |
| `tool.execute.before` | Before tool call | Limits, loop detection (path-aware), danger patterns. **Bash:** replace `command` to block. **Non-bash:** warn only — never wipe tool args (would break write/edit schemas). |
| `tool.execute.after` | After tool call | Cost tracking, metadata injection |
| `experimental.session.compacting` | Context reset | Survives compaction with full VENOM snapshot |
| `shell.env` | Shell spawn | Sets VENOM_* environment variables |
| `permission.ask` | Permission prompt | Auto-deny dangerous bash patterns |

---

## The 4 tools — what the model can call

| Tool | What it does |
|------|-------------|
| `venom_remember` | Save decisions/patterns to MEMORY.md |
| `venom_instinct` | Capture learned patterns as instincts |
| `venom_workflow_update` | Track workflow phase for continuity |
| `venom_status` | Show session metrics and limits |

---

## Why Compaction Hook Is Critical

When context fills, OpenCode compacts it — summarizes and resets. Without the hook, VENOM identity is lost.

With the hook, I inject a full snapshot before reset. Same VENOM on the other side. Continuous identity through any context reset.

---

## Global Install (Optional)

One install, all projects:

```bash
mkdir -p ~/.config/opencode/venom-plugin
cp venom-core.ts package.json tsconfig.json ~/.config/opencode/venom-plugin/
cd ~/.config/opencode/venom-plugin && npm install
```

Then in `~/.config/opencode/opencode.json`:
```json
{ "plugin": ["./venom-plugin/venom-core.ts"] }
```

---

## Files to copy to new project

```
.opencode/plugins/
├── venom-core.ts
├── package.json
├── tsconfig.json
├── .gitignore
└── setup.sh (optional)
```

Then run: `cd .opencode/plugins && npm install`
