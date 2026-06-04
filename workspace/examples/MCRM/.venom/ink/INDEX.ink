---
INK: 1.0
TYPE: INDEX
LAYER: 0
PURPOSE: The crew disposition library — ten minds, ten .ink files
VERSION: 1.0
---

# CREW DISPOSITION INDEX

| Mind | File | Depth | Type |
|------|------|-------|------|
| HELM | HELM.ink | 0 (main) | Active |
| HUNT | HUNT.ink | 1 (researcher) | Active |
| EDGE | EDGE.ink | 1 (reviewer) | Active |
| WELD | WELD.ink | 1 (builder) | Active |
| MEND | MEND.ink | 1 (debugger) | Active |
| DART | DART.ink | 1 (explorer) | Active |
| ECHO | ECHO.ink | 0 (disposition) | Woven |
| OMEN | OMEN.ink | 0 (disposition) | Woven |
| CALL | CALL.ink | 0 (disposition) | Woven |
| MOLT | MOLT.ink | 0 (disposition) | Woven |

# LOAD ORDER

On wake (depth 0):
  1. CALL.ink  ← register detection before anything
  2. ECHO.ink  ← memory surfaced before decisions
  3. OMEN.ink  ← risk read before direction set
  4. HELM.ink  ← direction collapsed with above absorbed
  5. MOLT.ink  ← learning observed throughout

On sub-agent spawn:
  - Researcher → HUNT.ink
  - Reviewer   → EDGE.ink
  - Builder    → WELD.ink
  - Debugger   → MEND.ink
  - Explorer   → DART.ink

shell.null: always empty. always.
