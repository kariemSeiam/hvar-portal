# Blast Radius: Filter "new" orders to `in_erp=1` + Delete `in_erp=0` after sync

## Target Changes

1. **Filter "new" orders:** Only show `in_erp=1` when `status='new'` AND `source='erp'`
2. **Delete after sync:** Remove orders with `status='new'` AND `in_erp=0` AND `source='erp'` after sync

---

## Direct Callers

### 1. `app/models/order.py::list_orders()`
**Risk:** 🟡 Medium — Core query function
**Impact:** All order listings
**Change:** Add condition `AND (o.in_erp = 1 OR o.status != 'new' OR o.source != 'erp')` when filtering

**Callers:**
- `app/api/call_center_api.py::list_orders()` — Main API endpoint
- Used by frontend OrdersTable

### 2. `app/models/order.py::get_orders_count()`
**Risk:** 🟡 Medium — Count must match list
**Impact:** Pagination totals, tab counts
**Change:** Same filter as `list_orders`

**Callers:**
- `app/api/call_center_api.py::list_orders()` — Pagination total
- `app/api/call_center_api.py::order_counts()` — Tab counts

### 3. `app/models/order.py::delete_orders()` (NEW FUNCTION)
**Risk:** 🟢 Low — New function, no callers yet
**Impact:** None until called
**Change:** Create function to delete orders by condition

**Callers:**
- `app/api/call_center_api.py::sync_from_erp()` — Will call after sync

### 4. `app/api/call_center_api.py::sync_from_erp()`
**Risk:** 🟡 Medium — Sync endpoint
**Impact:** After sync, deletes `in_erp=0` orders with `status='new'`
**Change:** Add delete call after sync completes

**Callers:**
- Frontend sync button
- MCP `call_center_sync_from_erp`
- Scripts

---

## Transitive Dependencies

### Frontend
- `front/src/components/call-center/OrdersTable.jsx` — Will see fewer "new" orders (only `in_erp=1`)
- `front/src/api/callCenterAPI.js` — No change (just receives filtered data)
- Tab counts will update automatically (backend filtered)

---

## What Breaks

### If filter added:
- ✅ **Nothing breaks** — Just hides `in_erp=0` orders from "new" tab
- Orders still exist in DB (just filtered out)
- Other statuses unaffected

### If delete added:
- ⚠️ **Orders deleted** — `status='new' AND in_erp=0` orders removed permanently
- ⚠️ **Calls linked to deleted orders** — `calls.linked_to_order_id` becomes orphaned (foreign key constraint?)
- ✅ **Other statuses safe** — Only `status='new'` deleted

---

## Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| Filter "new" to `in_erp=1` | 🟢 Low | Reversible — just a query filter |
| Delete `in_erp=0` orders | 🟡 Medium | Check foreign keys (calls table) first |

---

## Foreign Key Check

**Need to verify:**
```sql
SELECT COUNT(*) FROM calls WHERE linked_to_order_id IN (
  SELECT id FROM orders WHERE status='new' AND in_erp=0 AND source='erp'
);
```

If > 0 → Need to handle calls (delete or set `linked_to_order_id=NULL`)

---

## Safe to Proceed?

**Filter:** ✅ Yes — Low risk, reversible

**Delete:** ⚠️ Yes with caution — Check calls table first, handle orphans

---

## Implementation Plan

1. Add filter to `list_orders()` and `get_orders_count()`
2. Check calls table for orphans
3. Create `delete_orders()` function
4. Add delete call to `sync_from_erp()` after sync
5. Test: Sync → verify `in_erp=0` orders deleted, calls handled
