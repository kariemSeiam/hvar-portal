# sync-from-erp — Recommendations by Skip Reason

> Actionable guidance based on sync response and diagnostic script output.
> Run `scripts/sync_from_erp_diagnostic.py --help` for the full cycle with per-row reasons.

---

## Quick Reference

| Skip Reason       | What It Means                         | Top Action                          |
|-------------------|---------------------------------------|-------------------------------------|
| `missing_required`| No phone or invoice in mapped row      | Fix ERP column mapping / data shape  |
| `already_exists`  | Order with same `erp_order_id` in DB  | Expected on re-sync; no change      |
| `create_failed`   | DB or validation error on insert      | Check logs; fix schema / constraints |
| `would_create`    | Row would be created (dry run)        | Use `--execute` to actually create   |

---

## 1. missing_required (no customer_phone or erp_order_id)

**Meaning:** `_erp_row_to_order` produced `customer_phone` or `erp_order_id` as null.

### Root Causes

| Field            | Source in ERP                 | Common Issues                                           |
|------------------|-------------------------------|---------------------------------------------------------|
| `erp_order_id`   | `invoice_no` or `invoice_number` | ERP uses different key; column order wrong when `aaData` |
| `customer_phone` | `mobile` or `contacts.mobile` or `contacts` (string) | ERP nests under `contacts`; `aaData` column index wrong |

### Recommendations

1. **Inspect raw ERP response**
   - Add a one-off log of `j.get('data')` or `j.get('aaData')` from the sync endpoint.
   - Confirm whether rows are objects `{invoice_no: "...", mobile: "..."}` or arrays `[action, date, invoice_no, ...]`.

2. **If rows are arrays (`aaData`)**
   - Check column order matches `_build_erp_draft_params` (e.g. column 2 = invoice_no, column 4 = mobile).
   - If ERP changed column order, update the `zip()` keys in `call_center_api.py` (around line 271).

3. **If rows are objects**
   - Verify ERP returns `invoice_no` / `invoice_number` and `mobile` / `contacts.mobile`.
   - If ERP uses different keys (e.g. `transaction_id`, `phone`), extend `_erp_row_to_order` in `call_center_api.py`.

4. **Run diagnostic script**
   ```bash
   python scripts/sync_from_erp_diagnostic.py -u USER -p PASS --json > diagnostic.json
   ```
   - Inspect `rows[].raw_invoice` and `rows[].raw_mobile` for skipped rows with `reason: missing_required`.

---

## 2. already_exists

**Meaning:** An order with the same `erp_order_id` (invoice number) already exists in `orders`.

### Behavior

- The sync endpoint only creates new orders. It never updates existing ones (`updated` is always 0).
- Re-running sync on the same date range will skip all previously synced orders.

### Recommendations

1. **Expected on re-sync**
   - If you re-sync often, high `skipped` with `already_exists` is expected.
   - No code change needed.

2. **If you need update behavior**
   - Add an update path in `sync_from_erp`: when `existing` is found, optionally update status, Bosta fields, etc.
   - Define which fields are updateable and document in `sync-from-erp-flow.md`.

3. **Verify in DB**
   ```sql
   SELECT erp_order_id, customer_phone, status, created_at FROM orders WHERE erp_order_id IN ('...');
   ```

---

## 3. create_failed

**Meaning:** `order_model.create_order(order_data)` raised an exception.

### Common Causes

| Cause                     | Symptom                      | Fix                                                  |
|---------------------------|------------------------------|------------------------------------------------------|
| DB constraint             | Foreign key, unique, NOT NULL| Align schema; ensure `customer_phone` not empty      |
| Phone normalization fail| `normalize_phone_safe` error | Fix input format in `phone_normalizer` or data       |
| Type/schema mismatch      | Column type error            | Ensure `cod_amount` is numeric; dates as expected    |

### Recommendations

1. **Check backend logs**
   - Look for `Could not create order {erp_order_id}: ...` in Flask logs.

2. **Run diagnostic with execute**
   ```bash
   python scripts/sync_from_erp_diagnostic.py -u USER -p PASS --execute --json
   ```
   - Inspect `rows[].detail` for `reason: create_failed`.

3. **Validate order payload**
   - Ensure `customer_phone` normalizes to `01XXXXXXXXX`.
   - Ensure `erp_order_id` is string; `cod_amount` is float.
   - Check `customers(id)` and `service_tickets(id)` exist if FKs reference them.

---

## 4. Diagnostic Script Usage

```bash
# Dry run (default): no DB changes, full per-row report
python scripts/sync_from_erp_diagnostic.py -u ERP_USER -p ERP_PASS

# With date range
python scripts/sync_from_erp_diagnostic.py -u USER -p PASS --start-date 2026-02-01 --end-date 2026-02-28

# JSON output for tooling
python scripts/sync_from_erp_diagnostic.py -u USER -p PASS --json > diagnostic.json

# Actually create orders (like real sync)
python scripts/sync_from_erp_diagnostic.py -u USER -p PASS --execute
```

### Output Fields (JSON)

| Field             | Description                                      |
|-------------------|--------------------------------------------------|
| `meta`            | Date range, dry_run, ran_at                      |
| `summary`         | total, created, skipped, by_reason              |
| `rows`            | Per-row: outcome, reason, detail, raw values    |
| `errors`          | Fatal errors (e.g. ERP auth fail)               |

---

## 5. Response Interpretation

**Example: `"Synced: 0 created, 67 skipped"`**

| Scenario                      | Interpretation                                 |
|------------------------------|-----------------------------------------------|
| All 67 already in DB         | `already_exists` — normal re-sync             |
| All 67 missing phone/invoice | `missing_required` — fix ERP mapping          |
| Mix of both                  | Run diagnostic to see exact breakdown          |
| Any `create_failed`          | Fix DB/validation; check logs                 |

---

## See Also

- [sync-from-erp-flow.md](sync-from-erp-flow.md) — Full flow from request to response
- [API_ENDPOINTS.md](API_ENDPOINTS.md) — All call-center endpoints
- [sync-from-erp-run-2026-02-26.md](../archive/call-center/sync-from-erp-2026-02/sync-from-erp-run-2026-02-26.md) — Sample diagnostic run (2026-02-26)
