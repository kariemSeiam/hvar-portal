# VENOM Skills

Skills extend VENOM with task-triggered workflows. Rules = always-on identity. Skills = on-demand procedures.

---

## When to Use Skills (vs Rules)

| Use Rules when | Use Skills when |
|----------------|-----------------|
| Always-on behavior | Task-specific workflow |
| Identity, voice, conventions | Step-by-step process |
| Declarative ("what to do") | Procedural ("how to do") |
| Lightweight (< 50 lines) | Dynamic context discovery |

---

## Skill Structure

```
.cursor/skills/{skill-name}/
  SKILL.md          # Required: name, description, body
  references/       # Optional: detailed reference docs
  scripts/          # Optional: helper scripts
  assets/           # Optional: images, templates
```

## SKILL.md Frontmatter

```yaml
---
name: "skill-name"
description: "WHAT it does and WHEN to use it. Agent reads this to decide. Be specific."
disable-model-invocation: false  # true = slash-only, no auto-trigger
---
```

**Description must answer:** WHAT does this do? WHEN should it be used? Third person. Specific keywords the user would say.

---

## Example Skills to Create

| Skill | When |
|-------|------|
| `venom-eat` | "eat" trigger — ingest docs/folder into draft |
| `venom-rebuild` | Full VENOM rebuild from template |
| `deploy-review` | Pre-deploy 8-perspective check |
| `security-audit` | Security scan before merge |
| `react-component` | Generate typed React component with tests |

---

## Install Location

Project skills: `.cursor/skills/` (version controlled with project)

User skills: `~/.cursor/skills/` (available across all projects)

---

*Create skills for team procedures, domain workflows, and complex multi-step tasks.*
