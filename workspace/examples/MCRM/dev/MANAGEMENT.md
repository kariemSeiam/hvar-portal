# Update process

Discussion mode: suggest before changing. Confirm then update.

---

## Flow

```
Conversation
  → Recognize context change (decision, idea, plan, design, Q answered)
  → Suggest which file(s) and what to add/change
  → Propose exact text or changes
  → Wait for confirmation (Yes / No / Modify)
  → Apply update only after Yes (or after Modify instructions)
  → Confirm what changed
```

**Behavior:** Recognize (decision/idea/plan/design) → Suggest (file + section) → Propose (exact text) → Confirm ("Update? Yes/No/Modify") → Update only after Yes → Confirm done. User: Yes / No / Modify.

---

## Idea-folder files

| File | Update when |
|------|-------------|
| thinking.md | New ideas, brainstorming, technical/UX thoughts |
| planning.md | Tasks agreed, phases, priorities |
| uiux.md | Design discussion, layout, components, flows |
| discussion.md | Decisions, Q&A, meeting notes |
| notes.md | Reminders, references, one-off points |

Canonical project docs: **docs/** (docs/INDEX.md). Dev idea folders are for work-in-progress; ship finished content to docs/.
