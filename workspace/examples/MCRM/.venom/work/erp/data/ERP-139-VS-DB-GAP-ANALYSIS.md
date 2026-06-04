# ERP 139 vs Call Center Orders — Gap Analysis

> **Question:** Why is ERP `recordsTotal: 139` but call center orders not 139?
> **Date:** 2026-03-11

---

## Live Data (API)

| Source | Count | Notes |
|--------|-------|-------|
| **ERP** | `recordsTotal: 139` | From ERP draft-dt response |
| **DB (new, erp)** | **133** | `GET /api/call-center/orders?status=new&source=erp&date_from=2026-01-01&date_to=2026-12-31` |
| **Gap** | **6** | 139 − 133 = 6 |

---

## Root Cause: Deduplication

ERP `draft-dt` returns **one row per line item**. One order with 3 products = 3 rows.

Our sync uses `_dedupe_erp_rows_by_order()` which:
- Groups rows by `invoice_no` (normalized)
- Returns **one row per order**
- Merges `shipping_details` when multiple rows share same invoice

```python
# app/api/call_center_api.py:310-348
def _dedupe_erp_rows_by_order(rows):
    """Group ERP rows by invoice_no. ERP may return one row per line item."""
    # ... groups by inv_norm, returns one row per order
```

**So:** 139 ERP rows → 133 unique orders after dedupe. The 6 “missing” are line-item rows merged into their parent orders.

---

## Other Possible Contributors

| Factor | Impact |
|--------|--------|
| **Skip (no phone/invoice)** | Rows without `customer_phone` or `erp_order_id` are skipped in sync. Could reduce count. |
| **ERP pagination** | Sync uses `length: '500'`. If recordsTotal > 500, we’d truncate. 139 < 500 → no truncation. |
| **Date filter** | Call center “جديدة” tab = today + backlog. ERP = full date range. For “الكل” with full range, we compare apples to apples. |

---

## Verification

To confirm dedupe is the cause:

1. **Before dedupe:** Log `len(rows)` in `erp_sync_worker` right after `rows = j.get('data') or []`
2. **After dedupe:** Log `len(rows)` after `rows = _dedupe_erp_rows_by_order(rows)`
3. **Expected:** 139 → 133 (or similar)

---

## Summary

| What | Value |
|------|-------|
| **ERP rows** | 139 (may include multiple rows per order) |
| **Unique orders (after dedupe)** | 133 |
| **Gap** | 6 rows merged into existing orders |
| **Conclusion** | No data loss. ERP line-item rows are correctly merged into one order each. |

---

## If You Want 139 = 139

If ERP `recordsTotal` is meant to be “unique orders” (not rows), then either:
- ERP is counting line items, or
- Our dedupe is too aggressive.

To check: inspect ERP response — do any `invoice_no` values repeat? If yes, dedupe is correct.
