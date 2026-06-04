# ERP vs DB Comparison Result — 2026-03-09

> **Run via:** MCP `erp_get_drafts` + `call_center_list_orders`
> **Credentials:** Provided
> **Date:** 2026-03-09

---

## Summary

| Source | Count | Status |
|--------|-------|--------|
| **ERP drafts** | 143 orders | ✅ Fetched successfully |
| **DB orders** | 0 orders | ⚠️ Empty or backend not connected |

---

## ERP Data

**Total records:** 143 (from `recordsTotal`)
**Unique invoices:** 143

**Sample invoices:**
- 53879
- 54725
- DR2026/31203
- DR2026/32301
- DR2026/32558
- DR2026/32701
- DR2026/32807
- DR2026/32827
- DR2026/32904
- DR2026/32918
- DR2026/32973
- DR2026/32974
- DR2026/32975
- DR2026/32984
- DR2026/33006
- DR2026/33016
- DR2026/33049
- DR2026/33063
- DR2026/33066
- DR2026/33092
- ... (143 total)

**ERP structure:** Each row has:
- `invoice_no` → our `erp_order_id`
- `mobile` → our `customer_phone`
- `contact_name_text` → our `customer_name`
- `shipping_address` → our `delivery_address`
- `shipping_state` → our `governorate`
- `shipping_city` → our `city`
- `final_total` (HTML with `data-orig-value`) → our `cod_amount`
- `shipping_details` → our `order_description`
- `transaction_date` → ERP date (not stored in DB)

---

## DB Data

**Total orders:** 0

**Possible reasons:**
1. Backend not running on port 5050
2. Database empty (no syncs yet)
3. Database connection issue

---

## Comparison Result

| Set | Count | Meaning |
|-----|-------|---------|
| **in_erp_not_db** | 143 | All ERP orders — none synced to DB yet |
| **in_db_not_erp** | 0 | No orders in DB |
| **in_both** | 0 | No matches |

**Conclusion:** DB is empty. All 143 ERP orders need to be synced.

**Action:** Run sync-from-erp to populate DB. After sync, re-run comparison to track:
- New orders in ERP (not yet synced)
- Orders deleted from ERP (will have `in_erp=0`)
- Data drift (same invoice, different address/amount)

---

## What Happens When ERP Changes

### Order Deleted from ERP
- **Current sync:** Sets `in_erp=0` for all `source='erp'` orders
- **Then:** Only orders returned by ERP get `in_erp=1`
- **Result:** Deleted orders stay in DB with `in_erp=0`
- **UI:** Shows "غير موجود في ERP" (gray chip)

### Order Updated in ERP
- **Sync:** Updates `order_description`, `delivery_address`, `governorate`, `city`, `cod_amount`
- **Also:** Sets `in_erp=1`

### New Order in ERP
- **Sync:** Creates new order with `in_erp=1`
- **Bosta:** Auto-enriches if phone matches

---

## Next Steps

1. **Sync ERP to DB:**
   ```bash
   # Via API
   POST /api/call-center/orders/sync-from-erp
   Body: { username: 'kariemseiam', password: '123123', start_date: '2026-01-01', end_date: '2026-12-31' }
   ```

2. **After sync, re-run comparison** to see:
   - `in_erp_not_db` → new orders in ERP
   - `in_db_not_erp` → orders deleted from ERP (will have `in_erp=0`)
   - `in_both` → matches (check for data drift)

3. **Monitor `in_erp` flag:**
   - `in_erp=1` → order exists in ERP
   - `in_erp=0` → order deleted/moved in ERP (still in DB)

---

## Notes

- **Calls:** ERP has no calls. `calls` table is DB-only (call center records).
- **Date range:** ERP query used `start_date=2026-01-01, end_date=2026-12-31` (full year).
- **Sync behavior:** We never delete orders. Deleted-from-ERP orders get `in_erp=0`.
