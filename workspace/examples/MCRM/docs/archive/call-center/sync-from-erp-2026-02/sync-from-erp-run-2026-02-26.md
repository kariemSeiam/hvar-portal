# sync-from-erp Diagnostic Run — 2026-02-26

> Credentials: `kariemseiam` · Date range: 2026-01-01 to 2026-12-31 · Dry run

---

## Summary

| Metric | Value |
|--------|-------|
| Total rows from ERP | 67 |
| Created | 0 |
| Skipped | 0 |
| **Would create** | **67** |

**Conclusion:** After inspecting raw ERP shape and fixing mapper, all 67 rows now map correctly. `mobile` at row level; `contact_name_text` for plain name; `final_total` parsed for `cod_amount`.

---

## Root Cause (Resolved)

**Inspection:** [erp-draft-dt-response-shape.md](../../call-center/erp-draft-dt-response-shape.md) · Raw JSON: [erp-draft-dt-raw-2026-02-26.json](erp-draft-dt-raw-2026-02-26.json)

The ERP returns `mobile` at row level (e.g. `"01555512082"`). Initial diagnostic showed null due to response/request variance. Mapper updated to:

1. **`contact_name_text`** — use for plain name (ERP provides this alongside HTML `contact_name`)
2. **`whatsapp`** — fallback for `mobile`
3. **`final_total`** — parse `data-orig-value` for numeric `cod_amount`

---

## Sample Rows (Would Create)

| # | erp_order_id | customer_phone | customer_name |
|---|--------------|---------------|---------------|
| 1 | DR2026/30809 | 01555512082 | يسري الحصري |
| 2 | DR2026/31069 | 01066447317 | هشام حامد ابوالخير |
| 3 | DR2026/31203 | 01067806329 | ا نشوي حمدي رزق |
| 4 | DR2026/31753 | 01273523785 | مؤمن حامد زكريا |
| 5 | DR2026/32044 | 01011301257 | رهف اشرف |

---

## Recommendations (Applied)

1. **Inspect raw ERP response** — Done. See [erp-draft-dt-response-shape.md](erp-draft-dt-response-shape.md)
2. **Mapper updates** — `contact_name_text`, `whatsapp` fallback, `final_total` parse
3. **Re-run sync** — Use `--execute` to actually create orders, or call `POST /api/call-center/orders/sync-from-erp`

---

## Raw Data

Full diagnostic JSON: [sync-from-erp-diagnostic-2026-02-26.json](sync-from-erp-diagnostic-2026-02-26.json)

Run again:
```bash
python scripts/sync_from_erp_diagnostic.py -u kariemseiam -p 123123 --json
```
