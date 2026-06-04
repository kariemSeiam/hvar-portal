# sync-from-erp — Full Flow

> Traces `POST /api/call-center/orders/sync-from-erp` from request through ERP fetch, Bosta enrichment, DB insert, to response.

---

## Overview

```
Client (POST) → Flask (sync_from_erp) → ERP (draft-dt) → Row loop → Bosta (optional) → MySQL (orders) → JSON response
```

---

## 1. Request

**Endpoint:** `POST /api/call-center/orders/sync-from-erp`  
**Body (JSON):**

| Field       | Required | Default       | Description                        |
|------------|----------|---------------|------------------------------------|
| `username` | ✓        | —             | ERP login username                 |
| `password` | ✓        | —             | ERP login password                 |
| `start_date` | No     | `2026-01-01` | Draft date range start (YYYY-MM-DD) |
| `end_date`   | No     | `2026-12-31` | Draft date range end (YYYY-MM-DD)   |

**Validation:** Missing `username` or `password` → `400 MISSING_CREDENTIALS`.

---

## 2. ERP Authentication

**File:** `app/api/erp_api.py` — `ERPAuth`

1. **Init** — `ERPAuth(username, password)` creates a `requests.Session`.
2. **`get_auth_headers()`** — If session expired (> 1h), calls `login()`.
3. **`login()`**:
   - `GET https://erp.hvarstore.com/login` → extract CSRF from `<input name="_token">` or `<meta name="csrf-token">`
   - `POST /login` with `username`, `password`, `_token`
   - Store `csrf_token` and `last_login_time`
4. **Headers** — `X-CSRF-TOKEN`, `X-Requested-With: XMLHttpRequest`, `Accept: application/json...`

---

## 3. ERP Fetch

**URL:** `https://erp.hvarstore.com/sells/draft-dt`  
**Method:** `GET` (params in query string)

**Params** (`_build_erp_draft_params`):

- DataTables params: `draw`, `columns[0..14]`, `order[0][column]`, `order[0][dir]`, `start`, `length`
- **Date range:** `start_date`, `end_date` from request body
- **Columns requested:** action, transaction_date, **invoice_no**, contact_name, **mobile**, whatsapp, business_location, total_items, added_by, commission_agent, shipping_state, shipping_city, shipping_address, shipping_details, coupon_code

**Response parsing:**

```python
j = resp.json()
rows = j.get('data') or j.get('aaData') or []
```

ERP can return rows as:
- **Array of objects:** `{"invoice_no": "...", "mobile": "01...", ...}` (column names as keys)
- **Array of arrays (aaData):** `[action, transaction_date, invoice_no, contact_name, mobile, ...]` → mapped to the above keys by position

**On 401/403:** Retry login once, then re-fetch.

**On non-200:** Return `ERP_API_ERROR` + status code.

---

## 4. Row Normalization

If `row` is a list (ERP `aaData`), it's converted to a dict:

```python
row = dict(zip(
    ['action', 'transaction_date', 'invoice_no', 'contact_name', 'mobile',
     'whatsapp', 'business_location', 'total_items', 'added_by', 'commission_agent',
     'shipping_state', 'shipping_city', 'shipping_address', 'shipping_details', 'coupon_code'],
    row[:15]  # pads with None if shorter
))
```

---

## 5. Row → Order Mapping (`_erp_row_to_order`)

| ERP field(s)     | Order field       | Fallbacks                               | Required |
|------------------|-------------------|-----------------------------------------|----------|
| `invoice_no` / `invoice_number` | `erp_order_id` | —                                       | ✓        |
| `mobile` / `contacts.mobile` / `contacts` (str) | `customer_phone` | —   | ✓        |
| `contact_name` / `name`          | `customer_name`  | —                                       | No       |
| `shipping_address` / `delivery_address` | `delivery_address` | — | No       |
| `shipping_state` / `governorate`  | `governorate`     | —                                       | No       |
| `shipping_city` / `city`         | `city`            | —                                       | No       |
| `cod_amount` / `cod` / `total` / `final_total` | `cod_amount` | 0.0                     | No       |

**Fixed:** `source='erp'`, `service_type='sell'`, `status='new'`, `attempt_count=0`

---

## 6. Per-Row Processing Loop

### 6.1 Skip: Missing phone or invoice

```python
if not order_data.get('customer_phone') or not order_data.get('erp_order_id'):
    skipped += 1
    continue
```

**Reasons:** ERP row has no `invoice_no`/`invoice_number`, or no `mobile`/`contacts.mobile` (or wrong column order when using array format).

---

### 6.2 Skip: Order already exists

```python
existing = order_model.get_order_by_erp_order_id(order_data['erp_order_id'])
if existing:
    skipped += 1
    continue
```

**Reason:** `SELECT * FROM orders WHERE erp_order_id = %s` returns a row → order was synced before. **No update logic** — existing orders are never modified.

---

### 6.3 Bosta enrichment

```python
bosta_tr, bosta_oid = _bosta_enrich_order(order_data['customer_phone'])
if bosta_tr:
    order_data['bosta_tracking'] = bosta_tr
if bosta_oid:
    order_data['bosta_order_id'] = bosta_oid
```

**`_bosta_enrich_order(phone)`:**

1. Calls `get_customer_orders_unified(phone)` → Bosta API search by phone
2. Parses `orders` from `data.orders` / `data.customers[0].orders` / `data.data`
3. Takes first order’s `trackingNumber` / `tracking_number` and `id` / `bosta_order_id`
4. Returns `(bosta_tracking, bosta_order_id)` or `(None, None)` on failure (logged, no error thrown)

Enrichment is best-effort; missing Bosta data does not block order creation.

---

### 6.4 Create order

```python
try:
    order_model.create_order(order_data)
    created += 1
except Exception as e:
    logger.warning(f"Could not create order {order_data.get('erp_order_id')}: {e}")
    skipped += 1
```

**`create_order(data)`** (`app/models/order.py`):

1. **Phone normalization:** `customer_phone` → `normalize_phone_safe()` (Egyptian format `01XXXXXXXXX`)
2. **Filter columns:** Only known fields; `customer_phone` required, `source` default `direct`, `status` default `new`, `attempt_count` default `0`
3. **Insert:** `INSERT INTO orders (columns) VALUES (placeholders)`

**On failure:** Exception caught → `skipped += 1`, warning logged.

---

## 7. Response

**Success (200):**

```json
{
    "success": true,
    "created": 0,
    "updated": 0,
    "skipped": 67,
    "message": "Synced: 0 created, 67 skipped"
}
```

**Note:** `updated` is always `0` — there is no update path in the current implementation.

**Errors:**

| Status | Code              | When                                           |
|--------|-------------------|------------------------------------------------|
| 400    | MISSING_CREDENTIALS | No username or password                       |
| 4xx/5xx| ERP_API_ERROR     | ERP response status ≠ 200                      |
| 500    | SYNC_FAILED       | Unhandled exception (login, fetch, loop, etc.)  |

---

## 8. Skip Summary

| Skip reason                    | Line / logic                                  |
|--------------------------------|-----------------------------------------------|
| Missing `customer_phone` or `erp_order_id` | `_erp_row_to_order` yields null for one of them |
| Order already in DB            | `get_order_by_erp_order_id` returns a row     |
| DB/validation error on insert  | `create_order` raises → caught, `skipped += 1` |

---

## 9. Diagnostic Script

Run the full cycle with per-row skip reasons (no DB writes by default):

```bash
python scripts/sync_from_erp_diagnostic.py -u ERP_USER -p ERP_PASS [--start-date YYYY-MM-DD] [--end-date YYYY-MM-DD] [--json] [--execute]
```

See [sync-from-erp-recommendations.md](sync-from-erp-recommendations.md) for interpretation and actions.

---

## 10. File References

| Role              | File                           |
| Sync endpoint     | `app/api/call_center_api.py` (242–308) |
| ERP auth + fetch  | `app/api/erp_api.py` (ERPAuth) |
| Row mapping       | `app/api/call_center_api.py` (_erp_row_to_order, _build_erp_draft_params) |
| Bosta enrich      | `app/api/call_center_api.py` (_bosta_enrich_order) |
| Bosta API         | `app/services/bosta_service.py` (get_customer_orders_unified) |
| Order model       | `app/models/order.py` (create_order, get_order_by_erp_order_id) |
| Phone normalize   | `app/utils/phone_normalizer.py` (normalize_phone_safe) |
| Diagnostic script | `scripts/sync_from_erp_diagnostic.py` |
