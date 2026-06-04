# Call Session Modal (FAB) — Data Keys & Why Some Fields Are Empty

Reference for مودال جلسة الاتصال: كل مفاتيح البيانات، استجابة الـ ERP، واستجابة الـ API. ولماذا تظهر "لا يوجد" في بعض الحقول.

---

## 1. Why You See "لا يوجد" (Empty Data)

The FAB shows:

| UI label      | Source (priority order) | Why empty |
|---------------|-------------------------|-----------|
| **المحافظة**  | `customer?.governorate` → `order?.address_governorate` → `'لا يوجد'` | Order from DB has `governorate = NULL` **and** (no customer from customer API, or customer has no `governorate`). |
| **المدينة**   | `customer?.city` → `order?.address_city` → `'لا يوجد'` | Same: `order.city` is NULL and customer has no city. |
| **التفاصيل**  | `customer?.address_details` → `order?.address_full` → `'لا يوجد'` | `order.delivery_address` is NULL and customer has no `address_details`. |
| **وصف الطلب** | `order.order_description` | `order.order_description` is NULL or empty in DB. |
| **آخر المكالمات** | `getOrderCalls(order.id)` | No rows in `calls` for this order. |

**Root cause for order-based session:**  
The **order** row in our DB has `governorate`, `city`, `delivery_address`, `order_description` as NULL or empty. That happens when:

1. **Synced from ERP** — ERP draft-dt response for that order had empty `shipping_state`, `shipping_city`, `shipping_address`, `shipping_details`; we map them 1:1 in `_erp_row_to_order` (see `app/api/call_center_api.py`).
2. **Direct order** — Created via POST `/api/call-center/orders` without those fields.
3. **Customer** — Call context also loads a “customer” by phone via customer API (`searchCustomers(phone)`). If no customer found or customer record has no governorate/city/address_details, the second fallback is missing too.

So: **empty in modal = empty in DB for that order + no customer address to fall back to.**

---

## 2. All Data Keys — ERP Draft-dt Response (What ERP Sends)

ERP endpoint: draft-dt (DataTables). We request these columns and get back a row per draft. **Full list of 30 keys** per row (see `docs/call-center/ERP-FIRST5-FULL-KEYS.md`):

| # | ERP key | We use in sync? | Mapped to (DB) |
|---|--------|-----------------|----------------|
| 1 | `invoice_no` | Yes | `erp_order_id` |
| 2 | `mobile` | Yes | `customer_phone` |
| 3 | `contact_name_text` | Yes | `customer_name` |
| 4 | `shipping_address` | Yes | `delivery_address` |
| 5 | `shipping_state` | Yes | `governorate` |
| 6 | `shipping_city` | Yes | `city` |
| 7 | `shipping_details` | Yes | `order_description` |
| 8 | `final_total` | Yes (parse HTML) | `cod_amount` |
| 9 | `total_quantity` | No (display only) | — |
| 10 | `total_items` | No | — |
| 11 | `transaction_date` | No | — |
| 12 | `contact_name` (HTML) | No | — |
| 13 | `contact_id` | No | — |
| 14 | `DT_RowAttr` | No | — |
| 15 | `action` | No | — |
| 16 | `added_by` | No | — |
| 17 | `business_location` | No | — |
| 18 | `commission_agent` | No | — |
| 19 | `commission_agent_name` | No | — |
| 20 | `coupon_code` | No | — |
| 21 | `is_direct_sale` | No | — |
| 22 | `is_export` | No | — |
| 23 | `marketing_source` | No | — |
| 24 | `postpone_button` | No | — |
| 25 | `postponed_at` / `postponed_days` / `postponed_status` / `postponed_to` | No | — |
| 26 | `sub_status` | No | — |
| 27 | `supplier_business_name` | No | — |

Sync mapping: `_erp_row_to_order(row)` in `app/api/call_center_api.py`. If ERP sends empty string or omits a key, we store NULL/empty.

---

## 3. All Data Keys — Our API Response (What the Modal Uses)

### 3.1 GET `/api/call-center/orders/{order_id}` (Backend response)

**Response body:**

```json
{
  "order": { /* see order keys below */ },
  "calls": [ /* call objects */ ],
  "ticket": null | { /* ticket object */ }
}
```

**`order` object keys** (from DB row; dates as ISO strings, `cod_amount` as float):

| Key | Type | Description |
|-----|------|-------------|
| `id` | integer | Primary key. |
| `erp_order_id` | string \| null | From ERP `invoice_no`. |
| `customer_phone` | string | Normalized phone. |
| `customer_name` | string \| null | From ERP `contact_name_text`. |
| `delivery_address` | string \| null | From ERP `shipping_address`. |
| `governorate` | string \| null | From ERP `shipping_state`. |
| `city` | string \| null | From ERP `shipping_city`. |
| `order_description` | string \| null | From ERP `shipping_details` (items/notes text). |
| `cod_amount` | number | From ERP `final_total`. |
| `status` | string | new, scheduled, confirmed, canceled, converted. |
| `source` | string | erp \| direct. |
| `service_type` | string | sell, replacement, maintenance, return, ask. |
| `attempt_count` | integer | |
| `next_action_at` | string \| null | ISO datetime. |
| `scheduled_callback_at` | string \| null | ISO datetime. |
| `last_attempt_at` | string \| null | ISO datetime. |
| `cancellation_reason` | string \| null | |
| `bosta_tracking` | string \| null | |
| `bosta_order_id` | string \| null | |
| `customer_id` | integer \| null | |
| `converted_to_ticket_id` | integer \| null | |
| `created_at` | string | ISO datetime. |
| `updated_at` | string \| null | ISO datetime. |

**`calls` array:** each element has `id`, `order_id`, `customer_phone`, `status`, `notes`, `created_at`, `attempt_number`, `agent_id`, etc. (serialized; dates as ISO).

**`ticket`:** present only if order is converted; shape from `service_tickets` + Bosta enrichment.

---

### 3.1.1 Example: real response that produces "لا يوجد" everywhere

This is the **actual JSON shape** returned by the backend when the modal shows exactly what you described (اسم + رقم فقط، والباقي "لا يوجد"، ولا محاولات سابقة):

**1) GET `/api/call-center/orders/{order_id}` response:**

```json
{
  "order": {
    "id": 12345,
    "erp_order_id": "DR2026/32999",
    "customer_phone": "01099702419",
    "customer_name": "محمد يسرى عرب عرابي",
    "delivery_address": null,
    "governorate": null,
    "city": null,
    "order_description": null,
    "cod_amount": 0.0,
    "status": "new",
    "source": "erp",
    "service_type": "sell",
    "attempt_count": 0,
    "next_action_at": "2026-03-07T00:00:00",
    "scheduled_callback_at": null,
    "last_attempt_at": null,
    "cancellation_reason": null,
    "bosta_tracking": null,
    "bosta_order_id": null,
    "customer_id": null,
    "converted_to_ticket_id": null,
    "created_at": "2026-03-07T10:00:00",
    "updated_at": "2026-03-07T10:00:00"
  },
  "calls": [],
  "ticket": null
}
```

**2) Call context also uses customer API by phone.** If no customer found or customer has no address, you get:

```json
{
  "customer": {
    "id": null,
    "name": "محمد يسرى عرب عرابي",
    "phone": "01099702419",
    "phone_secondary": null,
    "governorate": null,
    "city": null,
    "address_details": null
  },
  "orders": [],
  "services": [],
  "order": { /* frontend-mapped order from 1) */ }
}
```

**Result in UI:**  
نوع المكالمة = من `order.service_type` (بيع). الاسم والرقم من `order.customer_name` / `order.customer_phone`. المحافظة / المدينة / التفاصيل = `customer?.governorate || order?.address_governorate` → كلهم null → "لا يوجد". وصف الطلب = `order.order_description` → null → "لا يوجد وصف". آخر المكالمات = `calls` فاضي → "لا توجد محاولات سابقة".

---

### 3.2 Call context (what the FAB actually loads)

The FAB does **not** call a separate “call-context” URL. It:

1. Calls **GET `/api/call-center/orders/{order_id}`** → gets `order`, `calls`, `ticket`.
2. Maps `order` with **`mapOrderFromBackend`** → frontend order shape (see below).
3. Uses **phone** from order to:
   - **GET `/api/bosta/customer/{phone}/orders`** → Bosta orders.
   - **Customer API `searchCustomers(phone)`** → one customer; used for `governorate`, `city`, `address_details` fallback.

So “call context” = **order (from our API) + Bosta orders + customer (from customer API)**. All response keys for the **order** part are in the table above.

---

### 3.3 Frontend order shape (after `mapOrderFromBackend`)

Used in FAB and queue:

| Frontend key | From backend `order` |
|--------------|----------------------|
| `id` | `order.id` |
| `order_number` | `order.erp_order_id` or `order.id` |
| `customer` | `{ name: order.customer_name, phone: order.customer_phone }` |
| `address_governorate` | `order.governorate` or `'غير محدد'` |
| `address_city` | `order.city` or `'غير محدد'` |
| `address_full` | `order.delivery_address` or `'غير محدد'` |
| `order_description` | `order.order_description` or `''` |
| `shipping_details` | same as `order_description` |
| `cod_amount`, `status`, `service_type`, `source`, `confirmation_snapshot`, etc. | same keys |

FAB display logic: **customer?.governorate || order?.address_governorate || 'لا يوجد'** (and similarly for city and details). So if backend `order.governorate` / `order.city` / `order.delivery_address` are null, and customer has no data, the UI shows "لا يوجد".

---

## 4. Summary Table — One Place for “All Keys”

| Source | Keys that feed المحافظة / المدينة / التفاصيل / وصف الطلب |
|--------|--------------------------------------------------------|
| **ERP row** | `shipping_state`, `shipping_city`, `shipping_address`, `shipping_details` |
| **Our DB order** | `governorate`, `city`, `delivery_address`, `order_description` |
| **GET order response** | Same as DB: `governorate`, `city`, `delivery_address`, `order_description` |
| **Customer (customer API)** | `governorate`, `city`, `address_details` (fallback only) |
| **FAB display** | `customer` then `order` then `'لا يوجد'` |

If you want no "لا يوجد" for address/description: either ensure ERP sends and we sync `shipping_state`, `shipping_city`, `shipping_address`, `shipping_details`, or ensure the customer record (by phone) has `governorate`, `city`, `address_details`, or allow editing in the modal and persist to order/customer.

---

## 5. MCP / API manifest

The full **GET `/api/call-center/orders/{order_id}`** response shape (order keys, `calls`, `ticket`) is documented in `docs/system/api-manifest.json` under `call_center_get_order` with `response_schema`. Use that for MCP or tooling that needs the exact response structure.
