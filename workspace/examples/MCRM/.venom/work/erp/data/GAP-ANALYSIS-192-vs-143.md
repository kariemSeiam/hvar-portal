# Gap Analysis: 192 (DB) vs 143 (ERP)

> **Date:** 2026-03-09  
> **UI shows:** الكل 192 (All 192 orders)  
> **ERP has:** 143 orders  
> **Gap:** 49 orders

---

## The Gap Explained

| Source | Count | Meaning |
|--------|-------|---------|
| **DB orders** (UI: الكل) | 192 | All orders in database with `source='erp'` |
| **ERP drafts** (realtime) | 143 | Orders currently in ERP draft status |
| **Gap** | **49** | Orders in DB but NOT in ERP anymore |

---

## What Are These 49 Orders?

These 49 orders are orders that were synced from ERP but are no longer in ERP's draft list. They likely:

1. **Converted to invoice** — ERP moved them from draft → invoice (no longer in draft-dt endpoint)
2. **Cancelled** — ERP marked them as cancelled
3. **Deleted** — ERP deleted them
4. **Converted to proforma** — ERP moved them to proforma status

**What happened in our DB:**
- Last sync: `mark_erp_orders_not_in_sync()` set `in_erp=0` for all ERP orders
- Sync then set `in_erp=1` only for orders returned by ERP (143 orders)
- The 49 orders not returned by ERP → stayed with `in_erp=0`

---

## How to Verify

Check the `in_erp` flag for these 49 orders:

```sql
SELECT erp_order_id, customer_name, customer_phone, status, in_erp, created_at
FROM orders
WHERE source = 'erp' AND in_erp = 0
ORDER BY created_at DESC
LIMIT 50;
```

**Expected:** These 49 orders should have `in_erp=0` (not in ERP anymore).

**UI behavior:** OrdersTable shows "غير موجود في ERP" (gray chip) when `in_erp=0`.

---

## Why This Happens

**ERP lifecycle:**
- Draft → Invoice (moved out of draft-dt)
- Draft → Cancelled
- Draft → Deleted
- Draft → Proforma

**Our sync behavior:**
- We never delete orders from DB
- We only mark `in_erp=0` when order not found in ERP
- This preserves history even if ERP removes the draft

---

## What to Do

### Option 1: Keep them (recommended)
- These 49 orders are historical records
- They show what was synced but later removed from ERP
- UI already shows "غير موجود في ERP" indicator
- **Action:** None — this is expected behavior

### Option 2: Filter them out
- If you want to see only "active" ERP orders:
  ```sql
  SELECT * FROM orders WHERE source='erp' AND in_erp=1
  ```
- This would show only 143 orders (matching ERP)

### Option 3: Archive them
- Move `in_erp=0` orders to archived status
- Requires code change (not recommended — breaks history)

---

## Summary

**The gap is normal.** It means:
- 143 orders are currently active in ERP (draft status)
- 49 orders were synced before but are no longer in ERP draft list
- All 192 orders are preserved in DB for history
- The `in_erp` flag correctly identifies which ones are still in ERP

**No action needed** — this is the expected reconciliation behavior.
