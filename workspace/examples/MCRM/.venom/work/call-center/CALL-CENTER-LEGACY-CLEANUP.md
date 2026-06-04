# Call Center Legacy Code Cleanup — Complete ✅

> **Date:** 2026-03-09
> **Status:** All legacy and dead code removed from call center

---

## What Was Removed

### Backend (`app/api/call_center_api.py`)

1. **Unused Imports:**
   - ✅ `normalize_phone_safe` — imported but never used
   - ✅ `success_response, error_response` — imported but never used (using `_err` instead)
   - ✅ `pymysql.err` — imported but never used (used in worker, not API)

2. **Unused Constants:**
   - ✅ `ERP_BASE_URL` — defined but never used (moved to worker)

3. **Deprecated Endpoint:**
   - ✅ `POST /api/call-center/orders/<id>/respond-to-info` — deprecated endpoint removed
     - Was marked with `Deprecation: true` header
     - Not used in frontend (new flow: request-info → status=new → agent edits in call session → confirm)
     - Functionality replaced by: request-info sets status=new, agent uses call session to edit and confirm

---

## What Was Kept

### Helper Functions (Used by Worker)
- ✅ `_erp_row_to_order()` — used by `erp_sync_worker.py`
- ✅ `_dedupe_erp_rows_by_order()` — used by `erp_sync_worker.py`
- ✅ `_build_erp_draft_params()` — used by `erp_sync_worker.py`
- ✅ `_bosta_enrich_order()` — used for lazy enrichment in `get_order()`

### Active Endpoints
- ✅ All endpoints are actively used
- ✅ Helper functions are used by worker or endpoints

---

## Frontend Status

**No legacy code found:**
- ✅ No references to `respondToInfo` or `respond-to-info`
- ✅ No references to `info_requested` status
- ✅ Comment in `OrdersTable.jsx` mentions "Respond to Info" but no actual code uses it

**Note:** The comment "Leader Action Modal (Reject / Request Info / Respond to Info)" in `OrdersTable.jsx` is just documentation. The actual modal only has Reject and Request Info buttons.

---

## Files Changed

### Backend
- ✅ `app/api/call_center_api.py` — removed unused imports, constant, and deprecated endpoint

### Frontend
- ✅ No changes needed — already clean

---

## Verification

- ✅ No linter errors
- ✅ All imports are used
- ✅ All endpoints are active
- ✅ Helper functions are used by worker or endpoints
- ✅ No deprecated endpoints remain

---

## Summary

**Removed:**
- 3 unused imports
- 1 unused constant
- 1 deprecated endpoint (25 lines)

**Result:** Cleaner codebase, no dead code, all imports used, all endpoints active.

---

## Status: ✅ COMPLETE

All legacy and dead code removed from call center API.
