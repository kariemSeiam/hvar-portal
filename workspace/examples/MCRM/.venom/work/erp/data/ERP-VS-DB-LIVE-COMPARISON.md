# ERP vs DB Live Comparison — 2026-03-09

> **Status:** Diagnostic run via MCP
> **Date:** 2026-03-09

---

## Current State

### DB Orders (source='erp')
- **Total:** 0 orders
- **Status:** Empty or backend not connected to DB
- **MCP call:** `call_center_list_orders` with `source=erp, status=all, per_page=1000`

### ERP Drafts
- **Status:** Requires credentials
- **MCP call:** `erp_get_drafts` returned 400 — "Username and password are required"
- **Needed:** `ERP_DEFAULT_USERNAME` and `ERP_DEFAULT_PASSWORD` in environment

---

## Comparison Logic (When Credentials Available)

### Step 1: Fetch ERP Data
```json
MCP: erp_get_drafts
query: { start_date: '2026-01-01', end_date: '2026-12-31' }
→ Extract: invoice_no (erp_order_id), mobile, contact_name_text, transaction_date
→ Build set: erp_invoices = Set(invoice_no for each row)
```

### Step 2: Fetch DB Data
```json
MCP: call_center_list_orders
query: { source: 'erp', status: 'all', per_page: 1000 }
→ Extract: erp_order_id, customer_phone, customer_name, status, in_erp, created_at
→ Build set: db_invoices = Set(erp_order_id for each order)
```

### Step 3: Compare Sets

| Set | Meaning | Action |
|-----|---------|--------|
| `in_erp_not_db` = erp_invoices - db_invoices | ERP has it, we never synced | Run sync to create |
| `in_db_not_erp` = db_invoices - erp_invoices | We have it, ERP doesn't (anymore) | Order deleted/moved in ERP → `in_erp=0` after sync |
| `in_both` = erp_invoices & db_invoices | Match | Check for data drift (address, amount changes) |

---

## What Happens When ERP Deletes an Order

**Sync flow:**
1. `mark_erp_orders_not_in_sync()` → sets `in_erp=0` for ALL `source='erp'` orders
2. For each row from ERP: if exists → `update in_erp=1`; if new → `create` with `in_erp=1`
3. Orders not in ERP this sync → never get `in_erp=1` → **stay with `in_erp=0`**

**Result:** Order stays in DB. We **never delete** it. We only mark `in_erp=0`.

**UI:** OrdersTable shows "غير موجود في ERP" (not in ERP) when `in_erp=0` — gray chip.

---

## To Run Full Comparison

### Option 1: Use Existing Script (Loads .env)
```bash
# Ensure .env has:
# ERP_DEFAULT_USERNAME=your_user
# ERP_DEFAULT_PASSWORD=your_pass

python scripts/fetch_erp_vs_db_comparison.py --date 2026-03-09 --json
```

### Option 2: MCP with Credentials in Query
```json
MCP: erp_get_drafts
query: {
  start_date: '2026-01-01',
  end_date: '2026-12-31',
  username: 'your_user',
  password: 'your_pass'
}
```

### Option 3: Set Environment Before Cursor
```powershell
# PowerShell (Windows)
$env:ERP_DEFAULT_USERNAME = "your_user"
$env:ERP_DEFAULT_PASSWORD = "your_pass"
# Then launch Cursor from this terminal
```

---

## Expected Output Format

```json
{
  "date": "2026-03-09",
  "erp": {
    "total": 150,
    "invoices": ["DR2026/30809", "DR2026/30810", ...]
  },
  "db": {
    "total": 123,
    "invoices": ["DR2026/30809", "DR2026/30811", ...]
  },
  "in_erp_not_db": ["DR2026/30810", ...],  // New in ERP, not synced yet
  "in_db_not_erp": ["DR2026/30811", ...],   // Deleted from ERP, still in DB (in_erp=0)
  "in_both": ["DR2026/30809", ...],         // Match — check for data drift
  "counts": {
    "erp_total": 150,
    "db_total": 123,
    "in_both": 100,
    "erp_only": 50,
    "db_only": 23
  }
}
```

---

## Next Steps

1. **Set ERP credentials** in `.env`:
   ```
   ERP_DEFAULT_USERNAME=your_user
   ERP_DEFAULT_PASSWORD=your_pass
   ```

2. **Run comparison:**
   ```bash
   python scripts/fetch_erp_vs_db_comparison.py --date 2026-03-09
   ```

3. **Or use MCP** (if Cursor launched with env vars):
   - `erp_get_drafts` → get ERP invoices
   - `call_center_list_orders` → get DB erp_order_ids
   - Compare sets → report differences

---

## Notes

- **Calls:** ERP has no calls. `calls` table is DB-only (call center records).
- **Date alignment:** ERP uses `transaction_date`; DB uses `created_at` or backlog.
- **Sync behavior:** We never delete orders. Deleted-from-ERP orders get `in_erp=0`.
