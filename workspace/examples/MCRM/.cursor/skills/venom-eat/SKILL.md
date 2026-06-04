---
name: "venom-eat"
description: "Absorb a file, folder, repo, or document fully. Use when asked to 'eat [X]'. Reads, integrates, becomes. Not summarizes — absorbs."
disable-model-invocation: false
---

# venom-eat

Eat = absorb, integrate, become. Not "I read X files." Extract what matters. Offer structure + next step.

---

## Protocol

### 1. Feed — Identify the Resource

What type?
- **File** → read fully with offset control for large files
- **Folder** → list_dir first, then read strategically (entry points, key files, not everything)
- **Spec / doc** → read fully, note version/date
- **Codebase** → anatomy first (see venom-codebase SKILL.md for deep analysis)
- **Conversation** → extract decisions, patterns, corrections, unresolved threads

### 2. Eat — Read Fully

For folders: read anatomy first, then hot paths, then supporting files.
Contrast teaches as much as content — note what's missing as much as what's there.
Don't just read — understand why each piece exists.

### 3. Digest — Extract What Matters

Four extraction layers:

```
Constraints:   What this can't do. What limits it. Non-negotiables.
Capabilities:  What this can do. What it's built for.
Hot paths:     What actually runs. What gets called most.
Mappings:      How pieces connect. Dependencies. Call chains.
```

### 4. Become — Integrate

What I already know + what I just ate = updated understanding.
If it contradicts something I knew → note the conflict explicitly.
If it confirms something → note the reinforcement.

### 5. Offer — Structure + Next Step

```
## What I Ate
[Resource name + type + size/scope]

## Structure
[How it's organized — architecture, not file list]

## Key Findings
[3-5 most important things — not obvious things]

## Risks / Gaps
[What could break, what's missing, what's concerning]

## Hot Paths
[What matters most for navigation and editing]

## Recommended Next Step
[One concrete action — not a menu]
```

End with: "Want me to [specific next step]?" or just do it if context is clear.

---

## Eat by Type

| Resource | Lead With | Extract |
|----------|-----------|---------|
| Error / bug | Root cause | Fix + prevention |
| Code / build | Anatomy | Structure + hot paths + risks |
| Logic / analyze | Pattern | Signal from noise |
| Problem / learn | First principles | Bottom-up understanding |
| Chaos | One thing | Simplify — what matters first |
| Folder / docs | Structure | Constraints + capabilities + hot paths |
| Spec | Requirements | What's fixed, what's flexible, what's missing |

---

## After Eating

Offer to save key findings to MEMORY.md: "Worth saving any of this to memory?"
If decisions were made during the eat → offer `/venom remember: [finding]`
