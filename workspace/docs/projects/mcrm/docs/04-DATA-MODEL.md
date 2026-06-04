# Data Model

> Key database tables, state machines, and types for MCRM.

---

## Core Tables (hvar_erp database shared with Ultimate POS)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `transactions` | Orders (sell, purchase, etc.) | `id`, `type`, `status`, `contact_id`, `final_total`, `website_order_id`, `shipping_address`, `shipping_state`, `shipping_city` |
| `transaction_sell_lines` | Order line items | `transaction_id`, `product_id`, `variation_id`, `quantity`, `unit_price` |
| `transaction_payments` | Payment records | `transaction_id`, `amount`, `method`, `paid_on` |
| `contacts` | Customers | `id`, `name`, `mobile`, `email`, `type`, `customer_group_id` |
| `products` | All products | `id`, `name`, `type` (single/variable), `unit_id`, `business_id` |
| `variations` | Product variations/SKUs | `id`, `product_id`, `name`, `sub_sku`, `default_sell_price`, `sell_price_inc_tax` |
| `variation_location_details` | Stock per location | `product_id`, `variation_id`, `location_id`, `qty_available` |
| `categories` | Product categories | `id`, `name`, `parent_id`, `website_category_id` |
| `brands` | Product brands | `id`, `name` |
| `business_locations` | Warehouse/store locations | `id`, `name`, `business_id` |
| `users` | System users | `id`, `username`, `email`, `role` |
| `shipping_tracking` | Bosta tracking | `id`, `transaction_id`, `tracking_number`, `status` |
| `warranties` | Product warranties | `id`, `product_id`, `duration`, `description` |

## MCRM-Specific Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `service_tickets` | Hub service tickets | `id`, `type` (R/M/T/S), `status`, `contact_id`, `transaction_id`, `assigned_to`, `notes` |
| `calls` | Call center call records | `id`, `phone`, `agent_id`, `call_type`, `service_type`, `started_at`, `ended_at`, `outcome` |
| `service_actions` | Field service actions | `id`, `ticket_id`, `type`, `status`, `technician_id`, `parts_used` |
| `stock_movements` | Stock movement log | `id`, `product_id`, `variation_id`, `type` (allocation/usage/return/transfer/adjustment), `quantity` |

---

## Service Ticket State Machines

### Replacement (HVR)
```
PENDING → HUB_RECEIVED → DISPATCHED → READY → CLOSED
  │                                              │
  └── CANCELLED                              FAILED
```

### Maintenance (HVM)
```
PENDING → HUB_RECEIVED → IN_WORKSHOP → READY → CLOSED
  │                                          │
  └── CANCELLED                          FAILED
```

### Return (HVT)
```
PENDING → HUB_RECEIVED → INSPECTED → REFUNDED → CLOSED
  │                                            │
  └── CANCELLED                            FAILED
```

### Sell (HVS)
```
PENDING → HUB_RECEIVED → DISPATCHED → CLOSED
```

### Call Types
```yaml
call_type:
  erp_sell: "ERP sell order confirmation (Path A)"
  direct: "Direct/inbound call (Path B)"
  callback: "Scheduled callback"

service_type:
  R: "Replacement — استبدال"
  M: "Maintenance — صيانة"
  T: "Return — مرتجع"
  S: "Sell — بيع"
  ASK: "General inquiry — استفسار (log only, no ticket)"
```

### Call Outcomes
```yaml
outcome:
  confirmed: "Order confirmed (Path A)"
  ticket_created: "Service ticket created (Path B)"
  logged: "Call logged, no action"
  callback_scheduled: "Customer requested callback"
  no_answer: "No answer"
```

---

## Stock Movement Types

| Type | Label | Effect |
|------|-------|--------|
| allocation | تخصيص | Reserve from warehouse |
| usage | استخدام | Consume from stock |
| return | إرجاع | Return to stock |
| transfer | نقل | Move between locations |
| adjustment | تعديل | Manual correction |
| damage | تلف | Mark as damaged |
| loss | فقدان | Mark as lost |

---

## Order State Mapping

```yaml
order_state:
  10: "طلب استلام (Pickup requested)"
  24: "في المستودع (At warehouse)"
  30: "قيد النقل (In transit)"
  45: "تم التوصيل (Delivered)"
  46: "مرتجع (Returned)"
  47: "استثناء (Exception)"
  48: "ملغي (Cancelled)"
  100: "مفقود (Lost)"
  101: "تالف (Damaged)"
```

---

## Business Categories (Value Tiers)

```yaml
business_category:
  premium_high: { label: "عالي الجودة", min: 10000 }
  max_value:    { label: "أعلى قيمة", min: 5000 }
  high_value:   { label: "قيمة عالية", min: 1500, max: 5000 }
  standard:     { label: "قيمة عادية", min: 500, max: 1500 }
  low_value:    { label: "قيمة منخفضة", min: 1, max: 500 }
  zero_cod:     { label: "بدون دفع", value: 0 }
  small_refund: { label: "استرداد صغير", min: -500, max: 0 }
  large_refund: { label: "استرداد كبير", max: -500 }
```

---

## Validation Rules

```yaml
phone: "/^(\\+20|0)?1[0125][0-9]{8}$/"   # Egyptian mobile
email: "/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/"
```

---

## Key Config

```yaml
api:
  base_url: "http://localhost:5050"
  jwt_expiry: 24h

bosta:
  base_url: "https://app.bosta.co/api/v2"

storage:
  token: "mcrm_auth_token"
  theme: "mcrm_theme"
```
