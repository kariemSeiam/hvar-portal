# ERP draft-dt — Raw Response Shape

> Inspected 2026-02-26. Source: `scripts/inspect_erp_response.py` · Raw sample: [archive/call-center/sync-from-erp-2026-02/erp-draft-dt-raw-2026-02-26.json](../archive/call-center/sync-from-erp-2026-02/erp-draft-dt-raw-2026-02-26.json)

---

## Top-Level Structure

| Key | Type | Description |
|-----|------|--------------|
| `draw` | int | DataTables draw counter |
| `recordsTotal` | int | Total records (e.g. 67) |
| `recordsFiltered` | int | Filtered count |
| `data` | list | Array of row objects (not `aaData`) |

**Row source:** `data` (ERP returns full objects, not arrays).

---

## Row Object — All Keys

| Key | Type | Example | Notes |
|-----|------|---------|-------|
| `transaction_date` | str | `"08/02/2026 04:33 PM"` | |
| `invoice_no` | str | `"DR2026/30809"` | Use for `erp_order_id` |
| `contact_id` | int | `49865` | |
| `contact_name` | str | `"<a href=\"...\">يسري الحصري</a>"` | HTML link |
| **`contact_name_text`** | str | `"يسري الحصري"` | Plain text — use for customer_name |
| **`mobile`** | str | `"01555512082"` | Direct at row level — use for customer_phone |
| `supplier_business_name` | str\|null | null | |
| `business_location` | str | `"مخزن اون لاين"` | |
| `is_direct_sale` | int | 1 | |
| `sub_status` | str\|null | null | |
| `commission_agent_name` | str | `" رحمه "` | |
| `shipping_state` | str | `"الاسكندريه"` | governorate |
| `shipping_city` | str | `"المنشيه"` | |
| `shipping_address` | str | Full address text | |
| `shipping_details` | str | `"1 * كبه هفار 2000 وات..."` | |
| `final_total` | str | `"<span class=\"final-total\" data-orig-value=\"1850.0000\">EGP 1,850.00</span>"` | HTML — parse `data-orig-value` for numeric |
| `coupon_code` | str\|null | null | |
| `total_items` | str | `"1.00"` | |
| `total_quantity` | str | `"1.00"` | |
| `added_by` | str | `" محمد راشد "` | |
| `is_export` | int | 0 | |
| `postpone_button` | str | HTML entity-escaped | |
| `postponed_days` | int | 9 | |
| `postponed_at` | str\|null | `"2026-02-09 12:11:49"` | |
| `postponed_to` | str | `"19/02/2026 12:00 AM"` | |
| `postponed_status` | str\|null | `"postponed"` | |
| `marketing_source` | str | `"<i class=\"fab fa-facebook\"></i> Facebook"` | |
| `commission_agent` | str | `"رحمه"` | |
| `action` | str | Long HTML button markup | |
| `DT_RowAttr` | dict | `{"data-href": "https://erp.hvarstore.com/sells/67751"}` | |

---

## Key Findings for Mapper

| Our Field | ERP Key | Current Mapper | Status |
|-----------|---------|----------------|--------|
| `customer_phone` | `mobile` | `row.get('mobile')` | Correct — mobile at row level |
| `erp_order_id` | `invoice_no` | `row.get('invoice_no')` | Correct |
| `customer_name` | `contact_name_text` | `row.get('contact_name')` (HTML) | Prefer `contact_name_text` for plain text |
| `delivery_address` | `shipping_address` | `row.get('shipping_address')` | Correct |
| `governorate` | `shipping_state` | `row.get('shipping_state')` | Correct |
| `city` | `shipping_city` | `row.get('shipping_city')` | Correct |
| `cod_amount` | `final_total` | `row.get('final_total')` | Needs parse — value is HTML with `data-orig-value="1850.0000"` |

---

## No `contacts` Object

The ERP does **not** nest mobile under `contacts`. `mobile` is at row level. The mapper's fallback `row.get('contacts', {}).get('mobile')` is unused for this endpoint.

---

## `final_total` Parsing

Raw:
```html
<span class="final-total" data-orig-value="1850.0000">EGP 1,850.00</span>
```

Extract numeric: `import re; m = re.search(r'data-orig-value="([\d.]+)"', s); float(m.group(1)) if m else 0`

---

## Sample Row (First)

```json
{
  "transaction_date": "08/02/2026 04:33 PM",
  "invoice_no": "DR2026/30809",
  "contact_id": 49865,
  "contact_name": "<a href=\"https://erp.hvarstore.com/contacts/49865\">يسري الحصري</a>",
  "contact_name_text": "يسري الحصري",
  "mobile": "01555512082",
  "business_location": "مخزن اون لاين",
  "shipping_state": "الاسكندريه",
  "shipping_city": "المنشيه",
  "shipping_address": "العنوان: ٣ شارع الشوربجي...",
  "shipping_details": "1 * كبه هفار 2000 وات اسود b (5070+b)",
  "final_total": "<span class=\"final-total\" data-orig-value=\"1850.0000\">EGP 1,850.00</span>"
}
```

---

## Raw JSON

Sample (archived): [erp-draft-dt-raw-2026-02-26.json](../archive/call-center/sync-from-erp-2026-02/erp-draft-dt-raw-2026-02-26.json)

Re-inspect:
```bash
python scripts/inspect_erp_response.py -u USER -p PASS -o docs/call-center/erp-draft-dt-raw.json
```
