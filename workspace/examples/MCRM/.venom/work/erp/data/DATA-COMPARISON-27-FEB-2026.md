# Data Comparison — الجمعة 27/2 & الإثنين 9/3

> **Source:** MCP `hub_mcrm_api_call` + API live fetch
> **Date:** 2026-03-09

---

## Data Keys Availability %

| Key | 27 Feb (123 orders) | 9 Mar (718 orders) |
|-----|---------------------|---------------------|
| **Core (ERP-synced)** | | |
| erp_order_id | 100% | 100% |
| customer_phone | 100% | 100% |
| customer_name | 100% | 100% |
| delivery_address | 100% | 100% |
| governorate | 100% | 100% |
| city | 100% | 100% |
| cod_amount | 100% | 100% |
| **Bosta (enrichment)** | | |
| bosta_tracking | 0% | 0% |
| bosta_order_id | 0% | 0% |
| **Workflow** | | |
| id, created_at, status, source, service_type | 100% | 100% |
| next_action_at | 100% | 100% |
| attempt_count | 100% (all 0) | 100% |
| approved_at, approved_by | 0% | 0% |
| confirmation_snapshot | 0% | 0% |
| converted_to_ticket_id | 0% | 0% |
| customer_id | 0% | 0% |
| last_attempt_at | 0% | 0% |
| scheduled_callback_at | 0% | 0% |

**Core keys avg:** 100% both dates. **Bosta keys:** 0% — no Bosta enrichment at sync.

| Date | Orders | Core % | Bosta % |
|------|--------|--------|---------|
| الجمعة 27/2 | 123 | 100 | 0 |
| الإثنين 9/3 | 718 | 100 | 0 |

---

## 1. DB Orders (27 Feb — backlog + created that day)

**Endpoint:** `GET /api/call-center/orders`  
**Params:** `date_from=2026-02-27 00:00:00`, `date_to=2026-02-27 23:59:59`, `today=2026-02-27`

| Metric | Value |
|--------|-------|
| **Total** | 123 orders |
| **Pages** | 2 (100 per page) |
| **Source** | All `erp` |
| **Service type** | All `sell` |

### Sample (first 5)

| id | erp_order_id | customer_name | customer_phone | cod_amount | governorate | created_at |
|----|--------------|---------------|----------------|------------|-------------|------------|
| 120 | DR2026/32646 | ام محمد | 01207350266 | 1850 | الاسكندريه | 2026-02-27 21:25:54 |
| 121 | DR2026/32647 | وائل الفقي | 01117919656 | 1850 | القليوبيه | 2026-02-27 21:25:54 |
| 122 | DR2026/32648 | مازن محمد | 01009366619 | 3500 | القاهره | 2026-02-27 21:25:54 |
| 123 | DR2026/32649 | ... | ... | ... | ... | 2026-02-27 21:25:53 |
| ... | ... | ... | ... | ... | ... | ... |

### Created-at distribution

- **Batch 1:** ~00:50–00:56 (6 orders)
- **Batch 2:** ~02:32 (6 orders)
- **Batch 3:** ~21:25 (bulk sync — 100+ orders)

**Note:** `created_at` = when we synced to DB, not ERP `transaction_date`.

---

## 1b. DB Orders (9 Mar — backlog + created that day)

**Params:** `date_from=2026-03-09 00:00:00`, `date_to=2026-03-09 23:59:59`, `today=2026-03-09`

| Metric | Value |
|--------|-------|
| **Total** | 718 orders |
| **Data keys** | Same availability as 27 Feb (core 100%, Bosta 0%) |

---

## 2. Ask-Only Calls (27 Feb)

**Endpoint:** `GET /api/call-center/calls?call_type=ask&date_from=2026-02-27&date_to=2026-02-28`

| Metric | Value |
|--------|-------|
| **Total** | 3 calls |
| **All** | status=confirmed, customer_phone=01273523785 |

| id | created_at | notes |
|----|------------|-------|
| 7 | 2026-02-27 00:18:50 | استفسار |
| 6 | 2026-02-27 00:13:53 | سشبسشلسشلشلشلشلشلسشلسشل |
| 5 | 2026-02-27 00:13:00 | الفنان عاوز يشتري كبه |

**Note:** Order-linked calls (sell/R/M/T) are not exposed by this endpoint. Only `call_type=ask` with date range.

---

## 3. ERP Drafts (27 Feb) — Requires Credentials

**Endpoint:** `GET /api/erp/drafts`  
**Params:** `start_date=2026-02-27`, `end_date=2026-02-27`, `username`, `password`

**Status:** MCP call returned 400 — `Username and password are required`.

**To fetch ERP data:**
1. Set `ERP_DEFAULT_USERNAME` and `ERP_DEFAULT_PASSWORD` in env, then MCP will use them.
2. Or run:
   ```bash
   python scripts/fetch_erp_vs_db_comparison.py -u USER -p PASS --date 2026-02-27
   ```

---

## 4. Comparison Logic (ERP vs DB)

| In ERP only | In DB only | In both |
|-------------|------------|---------|
| Drafts with `transaction_date` 27 Feb that we never synced | Orders we created (from any sync) that match 27 Feb backlog/created | ERP invoice_no = DB erp_order_id |

**ERP date filter:** ERP uses `start_date`/`end_date` in its request. Our sync uses same params. ERP `transaction_date` format: `DD/MM/YYYY HH:MM AM/PM`.

**DB date filter:** We use `created_at` (when we inserted) or backlog (open orders from before). So "27 Feb" in DB = orders we created on 27 Feb + backlog that was open on 27 Feb.

---

## 5. erp_order_id Range (from DB 27 Feb sample)

From the 123 orders, `erp_order_id` values span roughly:
- Early: DR2026/32xxx (e.g. 32578, 32646, 32647...)
- Late: DR2026/32985

**Full list:** Extract from API response or run:
```bash
# From orders JSON
jq '.data.data[].erp_order_id' < orders_27feb.json | sort -u
```

---

## 6. What's Missing (Gaps)

| Data | Status |
|------|--------|
| ERP drafts for 27 Feb | Needs credentials |
| Order-linked calls (sell/R/M/T) | No list-by-date endpoint; need order_id or customer_phone |
| Bosta status per order | Not stored; fetch via `GET /api/bosta/customer/{phone}/orders` |
| Tickets created from these orders | `converted_to_ticket_id` on order; all null in sample |

---

## 7. Next Steps

1. **Run ERP fetch** with credentials to get full ERP vs DB comparison.
2. **Add `scripts/fetch_erp_vs_db_comparison.py`** — fetches ERP + DB, outputs diff (in_erp_not_db, in_db_not_erp, both).
3. **Optional:** Extend calls API to list by date without call_type=ask (requires backend change).
