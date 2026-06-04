# Call Center & Hub — All "Details" Data Keys by Entity

Each entity has its own details keys; they are not interchangeable. Use the right key for the right context.

---

## 1. Customer (local DB + Bosta sync)

| Key | Source | Meaning |
|-----|--------|--------|
| `address_details` | `customers` table, API `customers_create` / `customers_update` | Full address text (تفاصيل العنوان) — free text. |
| `governorate` | Same | المحافظة. |
| `city` | Same | المدينة. |
| `name` | Same | اسم العميل. |
| `phone` | Same | رقم الهاتف (normalized 01XXXXXXXXX). |
| `phone_secondary` | Same | رقم ثانوي. |
| `bosta_orders` | Same (JSON) | Bosta payload cached per customer. |

**API:** `GET /api/customers/search?phone=...` or `GET /api/customers/{id}`  
**Response shape (customer):** `id`, `name`, `phone`, `phone_secondary`, `governorate`, `city`, `address_details`, …

---

## 2. Call-center order (queue order)

| Key | Source | Meaning |
|-----|--------|--------|
| `order_description` | Backend `orders` / ERP | وصف الطلب أو عنوان الشحن من ERP (often same as address text). |
| `delivery_address` | Backend `orders` | عنوان التوصيل (raw). |
| `address_full` | Frontend only | Mapped from `row.delivery_address` for display. |
| `shipping_details` | Frontend only | Mapped from `row.order_description`. |
| `address_governorate` | Frontend | From `row.governorate`. |
| `address_city` | Frontend | From `row.city`. |
| `confirmation_snapshot` | Backend | Full snapshot at confirm: items, notes, `delivery_address`, `customer_phone`, etc. |

**API:** `GET /api/call-center/orders/{id}`, list orders, sync-from-erp.  
**Backend row:** `delivery_address`, `order_description`, `governorate`, `city`, `customer_phone`, `customer_name`, …

---

## 3. Bosta order (unified from Bosta API)

| Key | Source | Meaning |
|-----|--------|--------|
| `notes` | Bosta / converter | ملاحظات الطلب. |
| `order_description` | Bosta / converter | وصف من Bosta (e.g. package description). |
| `fullAddress` / address in `customerAddress` | Bosta API | تفاصيل العنوان من Bosta. |
| `customerAddress` | Bosta API | Object: city (governorate), zone (city), fullAddress (address_details). |

**API:** `GET /api/bosta/customer/{phone_number}/orders`  
**Response:** `{ orders: [...], totalOrders, types, processedAt }`. Each order in unified format has its own `notes`, `order_description`, and address fields from converter.

---

## 4. Call record (call-center call)

| Key | Source | Meaning |
|-----|--------|--------|
| `notes` | `calls` table | ملاحظات الاتصال. |
| `customer_phone` | Same | رقم العميل. |
| (no "address_details" on call) | — | Call does not store address; use order or customer. |

**API:** `GET /api/call-center/calls?customer_phone=...`  
**Response:** `data[]` with `id`, `status`, `notes`, `customer_phone`, `order_id`, `ticket_id`, `attempt_number`, …

---

## 5. Service ticket (hub)

| Key | Source | Meaning |
|-----|--------|--------|
| `customer_address` | JOIN `customers.address_details` | Alias for customer’s `address_details` in ticket responses. |
| `address_details` | Ticket update / confirm APIs | تفاصيل العنوان عند التأكيد (replacement/return/sell). |
| Ticket fields | `service_tickets` | e.g. `original_tracking`, `new_tracking_send`, `notes`, `reason`, … |

**API:** Tickets get by id, list; confirm endpoints send `address_details` in body. Customer blob on ticket includes `customer_address` (= customer’s `address_details`).

---

## 6. Summary — which "details" where

| Entity | Primary "details" key(s) | Notes |
|--------|--------------------------|--------|
| Customer | `address_details` | One key. |
| Order (queue) | `order_description`, `delivery_address` | Frontend: `address_full`, `shipping_details`. |
| Bosta order | `notes`, `order_description`, address in `customerAddress` | Per order from Bosta. |
| Call | `notes` only | No address. |
| Service ticket | `address_details` (body), `customer_address` (read) | From customer or confirm payload. |

---

## Example: building call session context for a phone

1. **Customer:** `GET /api/customers/search?phone=01013185600` → `address_details`, `governorate`, `city`, `name`, `phone`.  
2. **Bosta orders:** `GET /api/bosta/customer/01013185600/orders` → each order has its own `notes`, `order_description`, address.  
3. **Calls:** `GET /api/call-center/calls?customer_phone=01013185600` → call `notes` only.  
4. **Queue orders:** List orders and filter by `customer_phone` or get by order id; use `delivery_address` / `order_description` for that order’s details.

---

## Example: customer + orders for 01013185600 (from MCP)

**1. Customer** — `GET /api/customers/search?q=01013185600`

```json
[
  {
    "id": 20,
    "name": "حمدى محمد حسين",
    "phone": "01013185600",
    "phone_secondary": null,
    "governorate": "المنيا",
    "city": "بني مزار",
    "address_details": "العنوان: المنيا بنى مزار شارع العاشر من رمضان بجوار قاعه حورس ، معرض الحصاوي في وش شركة الحياة مقابل المنزل",
    "bosta_orders": [ { ... } ],
    "customer_services": [],
    "created_at": "...",
    "updated_at": "..."
  }
]
```

**Details keys on customer:** `address_details` (full text), `governorate`, `city`. No `order_description` — that is on orders.

---

**2. Bosta orders** — `GET /api/bosta/customer/01013185600/orders`

```json
{
  "data": {
    "orders": [
      {
        "trackingNumber": "4799895",
        "type": "Send",
        "customer": {
          "name": "حمدى محمد حسين",
          "phone": "+201013185600",
          "secondPhone": null
        },
        "customerAddress": {
          "city": "المنيا",
          "district": "بني مزار",
          "zone": "بني مزار",
          "fullAddress": "العنوان: المنيا بنى مزار شارع العاشر من رمضان بجوار قاعه حورس ، معرض الحصاوي في وش شركة الحياة مقابل المنزل"
        },
        "package": {
          "description": "1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)",
          "itemsCount": 1,
          "type": "Small"
        },
        "timestamps": { "created": "...", "scheduled": "...", "updated": "..." },
        "status": { "confirmed": false, "timeline": [] },
        "communication": { "attempts": 1, "calls": 4, "sms": 1 },
        ...
      }
    ],
    "totalOrders": 1,
    "types": ["Send"],
    "processedAt": "2025-10-12T00:00:00.000Z"
  }
}
```

**Details keys per Bosta order:** `customerAddress.fullAddress` (address), `package.description` (order/package description). Each order has its own `customerAddress` and `package`.

---

**3. Calls** — `GET /api/call-center/calls?customer_phone=01013185600`

```json
{ "calls": [] }
```

**Details key on call:** only `notes` (ملاحظات الاتصال). No address.

---

**Takeaway:** Same phone → customer has `address_details`; each Bosta order has `customerAddress.fullAddress` and `package.description`. Use customer for “تفاصيل العنوان” in FAB; use order for “وصف الطلب” / package description. They can be the same text but come from different keys.
