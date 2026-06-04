# ERP vs DB Diagnostic — Realtime Comparison (No Code Change)

> **Purpose:** Understand what exists in ERP vs DB, when ERP changes its data, and what happens to orders deleted from ERP.
> **Method:** MCP `user-hub-mcrm-api` + existing API. Read-only.

---

## 1. Data Sources

| Source | MCP Operation | Endpoint | Key |
|-------|--------------|----------|-----|
| **ERP (realtime)** | `erp_get_drafts` | GET /api/erp/drafts | `invoice_no` → our `erp_order_id` |
| **DB orders** | `call_center_list_orders` | GET /api/call-center/orders | `erp_order_id` |
| **Calls** | — | ERP has no calls | Calls are DB-only (call center records) |

**ERP scope:** Draft sell orders (`sells/draft-dt`) filtered by `start_date`/`end_date`. ERP returns DataTables format: `data[]` with `invoice_no`, `mobile`, `contact_name_text`, `shipping_*`, etc.

**DB scope:** Orders with `source='erp'`. Match key: `erp_order_id` = ERP `invoice_no`.

---

## 2. MCP Call Sequence (No Code Change)

```
1. erp_get_drafts
   query: { start_date, end_date, username?, password? }
   → If username/password omitted, MCP uses ERP_DEFAULT_USERNAME, ERP_DEFAULT_PASSWORD from env.
   → Returns: { data: [...], recordsTotal, recordsFiltered }

2. call_center_list_orders
   query: { source: 'erp', status: 'all', per_page: 500, date_from?, date_to?, today? }
   → Returns: { data: [...], pagination }
```

**ERP credentials:** Add to root `.env` (copy from `.env.example`):
```
ERP_DEFAULT_USERNAME=your_user
ERP_DEFAULT_PASSWORD=your_pass
```
Flask and MCP load from `.env`. Or pass in query: `{ username, password, start_date, end_date }`.

---

## 3. Comparison Logic

| Set | Meaning |
|-----|---------|
| **in_erp_not_db** | ERP has it, we never synced → run sync to create |
| **in_db_not_erp** | We have it, ERP doesn't (anymore) → order was deleted/moved in ERP |
| **in_both** | Match — both have it |

**Date alignment:**
- **ERP:** Uses `transaction_date` (DD/MM/YYYY) within `start_date`/`end_date` filter.
- **DB:** Uses `created_at` (when we inserted) or backlog (open orders). `date_from`/`date_to`/`today` control which orders we list.

---

## 4. When ERP Changes Its Data — What Happens

### 4.1 Order deleted from ERP

**Sync flow:**
1. `mark_erp_orders_not_in_sync()` → sets `in_erp=0` for ALL `source='erp'` orders.
2. For each row from ERP: if exists → `update in_erp=1`; if new → `create` with `in_erp=1`.
3. Orders not in ERP this sync → never get `in_erp=1` → **stay with `in_erp=0`**.

**Result:** Order stays in DB. We **never delete** it. We only mark `in_erp=0`.

**UI:** OrdersTable shows "غير موجود في ERP" (not in ERP) when `in_erp=0` — gray chip.

### 4.2 Order updated in ERP (address, amount, etc.)

**Sync flow:** If order exists (`get_order_by_erp_order_id`), we refresh:
- `order_description`, `delivery_address`, `governorate`, `city`, `cod_amount`
- `in_erp=1`

**Result:** DB gets updated. No new row.

### 4.3 New order in ERP

**Sync flow:** No existing order → `create_order` with `in_erp=1`. Bosta enrichment if phone matches.

**Result:** New row in DB.

### 4.4 ERP date filter changes

ERP `start_date`/`end_date` limits what we fetch. If you sync 2026-01-01..2026-03-09, orders outside that range are not "seen" → their `in_erp` stays 0 after that sync (if they were previously synced, they get marked 0 at sync start, then not re-marked 1).

---

## 5. Existing Script (No Code Change)

```bash
python scripts/fetch_erp_vs_db_comparison.py -u USER -p PASS --date 2026-03-09
# or with env:
export ERP_DEFAULT_USERNAME=... ERP_DEFAULT_PASSWORD=...
python scripts/fetch_erp_vs_db_comparison.py --date 2026-03-09
```

**Output:**
- `erp_total`, `db_total`, `in_both`, `erp_only`, `db_only`
- Lists: `in_erp_not_db`, `in_db_not_erp`, `in_both`

**Add `--json`** for machine-readable output.

---

## 6. MCP Live Run (Current State)

| Call | Result |
|------|--------|
| `erp_get_drafts` (no creds) | 400 — Username and password required |
| `erp_get_drafts` (with env creds) | MCP auto-injects from `ERP_DEFAULT_*` if set |
| `call_center_list_orders` | 200 OK — 0 orders (DB empty or backend not on 5050) |

**To run full diagnostic:**
1. Backend running: `python run.py` → http://localhost:5050
2. Set `ERP_DEFAULT_USERNAME`, `ERP_DEFAULT_PASSWORD` in env (or pass in MCP query)
3. MCP `erp_get_drafts` + `call_center_list_orders` → compare `invoice_no` vs `erp_order_id`

---

## 7. Calls — Clarification

**ERP:** No calls. ERP has orders (drafts) only.

**DB calls:** `calls` table = call center records (linked to orders or tickets, or ask-only). Fetched via:
- `GET /api/call-center/orders/{id}` → includes `calls` for that order
- No bulk "list all calls by date" for order-linked calls (only `call_type=ask` has date filter)

**Comparison scope:** ERP orders vs DB orders. Calls are orthogonal — they're our call-center activity log.

---

## 8. Summary

| Question | Answer |
|----------|--------|
| Old order deleted from ERP — what happens? | Stays in DB. `in_erp=0` after next sync. UI shows "غير موجود في ERP". |
| Do we delete orders when ERP removes them? | No. We never delete. |
| How to get realtime ERP vs DB? | MCP `erp_get_drafts` + `call_center_list_orders` → diff by `invoice_no`/`erp_order_id`. |
| Code change needed? | No. Use script or MCP with env creds. |
