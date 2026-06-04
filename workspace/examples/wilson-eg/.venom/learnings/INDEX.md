# .venom/learnings/ — Procedural Memory

> I am procedural memory. Two types: reflexes and learned patterns.
> Corrections are reflexes — binary, always fire. Instincts are probabilistic — fire when confident.

---

## The Cells

| File | Role | Budget | Fires when | If missing |
|------|------|--------|-----------|-----------|
| `corrections.yaml` | Reflexes — hard never-again rules | 1KB max | Every complex or risky task, before instincts | Same mistakes repeated indefinitely |
| `instincts.yaml` | Learned patterns — probabilistic, confidence-scored | 2KB max | Before tool calls when confidence ≥ 0.6 | No pattern recognition, no evolution |

---

## The Difference

**Corrections = reflexes.** Binary. A mistake happened. The rule is absolute. Confidence is always 1.0. Source is either user correction or critical failure.

```yaml
corrections:
  - rule: "Never run migrations without a dry-run flag on production"
    context: "Dropped user_sessions table in prod — 2026-03-15"
    added: "2026-03-15"
    confidence: 1.0
    source: critical-failure
```

**Instincts = learned patterns.** Probabilistic. Observed multiple times. Grows more confident with evidence. Can be wrong — that's why they have confidence scores.

```yaml
instincts:
  - id: instinct-1711548000
    confidence: 0.7
    trigger: "When modifying auth middleware"
    action: "Check session invalidation edge cases"
    evidence: "3 separate bugs from this pattern, sessions not invalidated"
    learned: "2026-03-27"
    fire_count: 12
    false_positives: 0
```

---

## Signal Flow

```
Correction added (user says "no, do it this way"):
      │
      ▼
  corrections.yaml updated immediately
      │
      ▼
  Next complex task → correction checked first
  → fires before any instinct
  → cannot be overridden

Instinct captured (plugin observes pattern):
      │
      ▼
  session.idle → instincts.yaml updated
      │
      ▼
  confidence: 0.3 (first observation)
      │
      ▼  (pattern seen again)
  confidence rises → 0.6 → auto-fire threshold
      │
      ▼  (seen 3+ times with evidence)
  confidence: 0.9 → fires before tool call automatically
```

---

## Confidence Thresholds

| Confidence | Behavior |
|-----------|---------|
| < 0.3 | Learning phase — observe only, no firing |
| 0.3 - 0.6 | Check before firing — show as suggestion |
| 0.6 - 0.9 | Auto-fire with warning — "Instinct: [action]" |
| 0.9+ | Auto-fire silently — high confidence, proven reliable |
| 1.0 | Corrections only — user-set, never questions |

---

## Evolution Law

When 3+ instincts share a trigger context and all have confidence > 0.7, they can promote to a skill. Plugin detects the cluster and proposes a new `SKILL.md` in `.opencode/skills/`. Once promoted, instincts are marked `evolved: true` and stop firing individually.

This is how VENOM's intelligence grows beyond individual sessions.
