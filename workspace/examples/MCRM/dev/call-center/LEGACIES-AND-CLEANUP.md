# Legacies from request-info restructure — list and cleanup plan

> **Source of truth for flow:** REQUEST-INFO-RESTRUCTURE.md.  
> **Current flow:** Request-info → `status=new` (message in snapshot). Agent responds in call session + confirm. No `info_requested` tab; no UI calls `respond-to-info`.

---

## 1. All remaining legacies

| Where | What | Notes |
|-------|------|--------|
| **Backend** | `POST /api/call-center/orders/:id/respond-to-info` | Only works when `status=info_requested`. No new orders get that status. |
| **Backend** | `respond_to_info()` in `app/api/call_center_api.py` | Handler for above. Returns 400 if not `info_requested`. |
| **Frontend** | `leaderRespondToInfo` in `front/src/api/callCenterAPI.js` | Exported; **no component uses it** (tab and button removed). Dead code. |
| **DB/schema** | Enum value `info_requested` (migration 005) | Kept for backward compat; data migrated to `new`. App never sets it. |
| **Docs** | `api-manifest.json` → `call_center_respond_to_info` | Already described as "Legacy only (order must have status=info_requested)". |
| **Docs** | `dev/call-center/PHASE-C-NEXT-EAT.md` § "3. info_requested flow" | Old spec (add tab, respond-to-info). Header says restructured; section is historical. |
| **Archive** | `docs/archive/call-center-page-source/leader-approval-workflow.md` | Old example with `'status': 'info_requested'`. Leave as archive. |
| **Script** | `scripts/archive/run_info_requested_to_new.py` | One-off migration script (already run). Moved from migrations/. |

**.venom:** CONTEXT.md updated with one-line: request-info = new + call session; respond-to-info legacy-only.

---

## 2. Cleanup plan (from this /venom)

### Phase 1 — Safe (no breaking changes)

1. **Frontend:** Remove dead `leaderRespondToInfo` and its export from `callCenterAPI.js`. No callers.
2. **Doc:** In `PHASE-C-NEXT-EAT.md` §3, add one line: *"§3 is historical; current flow in REQUEST-INFO-RESTRUCTURE.md."*

### Phase 2 — Optional (breaking for old clients)

3. **Backend:** Either:
   - **A)** Remove route `respond-to-info` and handler. Return 410 Gone from a single "deprecated" route with message: *"Use request-info + confirm flow."*  
   - **B)** Keep route; add deprecation header and document in manifest as deprecated. No code change.
4. **Manifest:** If keeping endpoint, add `"deprecated": true` to `call_center_respond_to_info` in `api-manifest.json`.

### Phase 3 — Do not do (unless you have a DB migration plan)

5. **DB enum:** Do **not** remove `info_requested` from MySQL enum without a clear migration (MySQL enum changes are brittle). Leaving the value unused is safe.

### Phase 4 — Optional housekeeping

6. **Script:** Move `migrations/run_info_requested_to_new.py` to e.g. `scripts/archive/run_info_requested_to_new.py` or leave in place as historical one-off.

---

## 3. Checklist (execute in order)

- [x] Remove `leaderRespondToInfo` + export from `callCenterAPI.js`
- [x] Add historical note to PHASE-C-NEXT-EAT.md §3
- [x] (Optional) Deprecate or remove `respond-to-info` backend route; update manifest if kept — marked deprecated in manifest; backend adds Deprecation header
- [x] (Optional) Move one-off migration script to archive — moved to `scripts/archive/run_info_requested_to_new.py`
- [ ] Leave DB enum as-is

Done: CONTEXT.md has request-info one-liner; manifest already marks respond-to-info as legacy.
