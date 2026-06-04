# ERP Draft vs Calls vs Bosta — Full Data Analysis

> **Purpose:** Map all data that exists on ERP drafts, all call data, and the gap causing bad behavior when orders already delivered on Bosta still appear in our queue.
> **Eaten:** 2026-03-09 | venom-eat + venom-codebase protocols

---

## 1. ERP Draft Data — What Exists (Realtime)

**Source:** `GET /api/erp/drafts` → proxies to `ERP_BASE_URL/sells/draft-dt` (DataTables)

### 1.1 Response Envelope

| Key | Type | Example |
|-----|------|---------|
| `draw` | int | 1 |
| `recordsTotal` | int | 172 |
| `recordsFiltered` | int | 172 |
| `data` | array | Row objects (30 keys each) |

### 1.2 All 30 Keys Per Row (ERP draft-dt)

| # | Key | Type | We Use? | Our Field |
|---|-----|------|---------|-----------|
| 1 | `invoice_no` | str | ✅ | `erp_order_id` |
| 2 | `mobile` | str | ✅ | `customer_phone` |
| 3 | `contact_name_text` | str | ✅ | `customer_name` |
| 4 | `shipping_address` | str | ✅ | `delivery_address` |
| 5 | `shipping_state` | str | ✅ | `governorate` |
| 6 | `shipping_city` | str | ✅ | `city` |
| 7 | `shipping_details` | str | ✅ | `order_description` |
| 8 | `final_total` | str (HTML) | ✅ | `cod_amount` (parse `data-orig-value`) |
| 9 | `total_items` | str | ❌ | — |
| 10 | `total_quantity` | str | ❌ | Frontend `items_count` only |
| 11 | `transaction_date` | str | ❌ | — |
| 12 | `contact_id` | int | ❌ | — |
| 13 | `contact_name` | str (HTML) | ❌ | — |
| 14 | `business_location` | str | ❌ | — |
| 15 | `is_direct_sale` | int | ❌ | — |
| 16 | `sub_status` | str\|null | ❌ | — |
| 17 | `commission_agent_name` | str | ❌ | — |
| 18 | `coupon_code` | str\|null | ❌ | — |
| 19 | `added_by` | str | ❌ | — |
| 20 | `is_export` | int | ❌ | — |
| 21 | `postpone_button` | str | ❌ | — |
| 22 | `postponed_days` | int | ❌ | — |
| 23 | `postponed_at` | str\|null | ❌ | — |
| 24 | `postponed_to` | str | ❌ | — |
| 25 | `postponed_status` | str\|null | ❌ | — |
| 26 | `marketing_source` | str | ❌ | — |
| 27 | `commission_agent` | str | ❌ | — |
| 28 | `supplier_business_name` | str\|null | ❌ | — |
| 29 | `action` | str (HTML) | ❌ | — |
| 30 | `DT_RowAttr` | dict | ❌ | — |

**ERP has NO Bosta status.** ERP only knows: draft sell order, needs confirmation. It does not know if Bosta delivered it.

---

## 2. Calls Data — What We Store

**Table:** `calls`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | INT | PK |
| `linked_to_order_id` | INT NULL | Order this call belongs to |
| `linked_to_ticket_id` | INT NULL | Ticket (follow-up calls) |
| `call_type` | ENUM | ask, sell, replacement, maintenance, return |
| `status` | ENUM | confirmed, scheduled, no_answer, canceled |
| `attempt_number` | INT | 1, 2, 3... |
| `agent_id` | INT | Who made the call |
| `customer_phone` | VARCHAR(20) | Snapshot at call time |
| `scheduled_callback_at` | DATETIME NULL | When status=scheduled |
| `next_action_at` | DATETIME NULL | When status=no_answer (+4h) |
| `notes` | TEXT | Agent notes |
| `cancellation_reason` | VARCHAR(100) | If canceled |
| `created_at`, `updated_at` | DATETIME | Audit |

**Queries:**
- `get_calls_by_order_id(order_id)` — all calls for an order
- `get_calls_by_ticket_id(ticket_id)` — follow-up calls on ticket
- `get_calls_by_customer_phone(phone, limit)` — 360° call history
- `list_ask_calls(date_from, date_to)` — ASK-only (no order)

**Calls do NOT store Bosta status.** They store outcome (confirmed/scheduled/no_answer/canceled), not delivery state.

---

## 3. Orders Data (DB) — Synced from ERP

**Table:** `orders`

| Column | Source | Notes |
|--------|--------|-------|
| `erp_order_id` | ERP `invoice_no` | Unique per sync |
| `customer_phone` | ERP `mobile` | Normalized 01XXXXXXXXX |
| `customer_name` | ERP `contact_name_text` | |
| `delivery_address` | ERP `shipping_address` | |
| `governorate` | ERP `shipping_state` | |
| `city` | ERP `shipping_city` | |
| `order_description` | ERP `shipping_details` | Items text |
| `cod_amount` | ERP `final_total` | Parsed from HTML |
| `bosta_tracking` | Bosta enrich | First order by phone |
| `bosta_order_id` | Bosta enrich | First order by phone |
| `status` | — | new, scheduled, confirmed, converted, canceled |
| `source` | — | erp, direct, bosta |

**We do NOT store Bosta status on orders.** We store `bosta_tracking` and `bosta_order_id` from first Bosta match by phone. No `bosta_status` or `is_delivered` column.

---

## 4. Bosta Data — Realtime (API)

**Source:** `GET /api/bosta/customer/{phone}/orders` → `get_customer_orders_unified(phone)`

**Unified order format (per Bosta delivery):**

| Field | Content |
|-------|---------|
| `trackingNumber` | Link key |
| `status.confirmed` | **boolean** — `isConfirmedDelivery` from Bosta |
| `status.timeline` | Array of events |
| `customer.phone` | Links to our customer |
| `customerAddress` | city, zone, fullAddress |
| `financial.cod` | COD amount |
| `type` | SEND, RETURN TO ORIGIN, etc. |

**Bosta `status.confirmed === true`** = delivered to customer. That's the signal we need.

---

## 5. The Gap — Bad Behavior Root Cause

### 5.1 What Happens Today

```
ERP draft-dt     → 172 rows (sell orders needing confirmation)
     ↓
sync-from-erp   → For each row:
                    - Skip if erp_order_id already in DB
                    - Bosta enrich: get_customer_orders_unified(phone)
                    - Take FIRST order only (orders[0])
                    - Store bosta_tracking, bosta_order_id
                    - INSERT orders
     ↓
Agent sees queue → Orders with status=new
     ↓
Agent calls      → Customer: "I already got it yesterday"
```

### 5.2 Why It Breaks

| Issue | Detail |
|-------|--------|
| **No Bosta status check at sync** | We never check `status.confirmed` or timeline. We sync all ERP drafts. |
| **First order only** | `_bosta_enrich_order` takes `orders[0]`. Customer can have 5 Bosta orders. We match by phone, not by ERP invoice. |
| **No ERP↔Bosta link** | ERP has `invoice_no` (DR2026/32807). Bosta has `trackingNumber`. No shared key. We link only by phone. |
| **One phone, many orders** | Example: جيهان عامر — 1 delivered (21093432) + 1 not (49411164). We might attach the wrong one. |
| **Delivered orders still in queue** | If Bosta says delivered, we should NOT create order or should auto-complete. We don't. |

### 5.3 Data Flow Summary

```
ERP (realtime)          DB (orders)              Bosta (realtime)
─────────────────       ─────────────────       ─────────────────
draft-dt                orders                   /deliveries/search
invoice_no              erp_order_id             by phone
mobile                  customer_phone           orders[]
contact_name_text       customer_name            [].status.confirmed
shipping_*              delivery_address         [].trackingNumber
final_total             cod_amount
                        bosta_tracking  ←──────  first order only
                        bosta_order_id  ←──────  (no status check)
```

**ERP does not know Bosta state.** Bosta does not know ERP invoice. We are the reconciliation layer — but we don't use Bosta delivery status at sync time.

---

## 6. ERP Realtime vs DB vs Existing

| Source | What It Has | When |
|-------|-------------|------|
| **ERP realtime** | 172 draft rows, 30 keys each, no Bosta | `GET /api/erp/drafts` |
| **DB orders** | Synced subset, 8 ERP keys + bosta_tracking | After `sync-from-erp` |
| **DB calls** | Call attempts, outcomes, no Bosta | When agent closes call |
| **Bosta API** | All deliveries by phone, status.confirmed | `GET /api/bosta/customer/{phone}/orders` |

**ERP realtime ≠ DB.** DB is a snapshot. Re-sync skips `already_exists` (same erp_order_id). We never update existing orders with Bosta status.

---

## 7. What "Done" Means — Three Systems

| System | "Done" Signal |
|--------|---------------|
| **ERP** | Order leaves draft-dt (moved to confirmed/shipped in ERP) — we don't get this |
| **Bosta** | `status.confirmed === true` or timeline has delivered event |
| **Our DB** | `order.status = 'converted'` (ticket created) or `'canceled'` |

**Orders that reached client (Bosta delivered) but are still "new" in our queue** = the bad behavior. We never check Bosta at sync. We never auto-skip or auto-complete.

---

## 8. Recommended Fixes (Priority)

### P1 — Skip delivered at sync

In `sync_from_erp`, after `_bosta_enrich_order`:

```python
# If we got a Bosta order, check if it's already delivered
if bosta_tr:
    data = get_customer_orders_unified(order_data['customer_phone'])
    orders = data.get('orders') or []
    # Find order matching this tracking
    for o in orders:
        if (o.get('trackingNumber') or o.get('tracking_number')) == bosta_tr:
            if o.get('status', {}).get('confirmed') is True:
                skipped += 1  # reason: bosta_already_delivered
                continue
            break
```

**Caveat:** We match by phone. One phone can have multiple Bosta orders. We don't know which Bosta order corresponds to which ERP invoice. Matching by COD amount + address + date is heuristic.

### P2 — Match ERP to Bosta (heuristic)

- ERP: `invoice_no`, `cod_amount`, `transaction_date`, `mobile`
- Bosta: `trackingNumber`, `financial.cod`, `timestamps.created`, `customer.phone`
- Match: same phone + same COD + created date within 24h of ERP transaction_date

### P3 — Store Bosta status on order

Add `bosta_status` or `bosta_delivered_at` to orders. Update when we fetch Bosta. Use in queue: gray out or auto-complete delivered orders.

### P4 — getOrderCallContext: highlight delivered

When agent opens call, `getOrderCallContext` already fetches Bosta orders. Frontend shows "تم التسليم" for delivered. **Add:** If the order's Bosta match is delivered → show prominent "الطلب وصل للعميل — تأكيد فقط" so agent doesn't re-verify unnecessarily.

---

## 9. MCP Tools Available

| Operation | Path | Purpose |
|-----------|------|---------|
| `erp_get_drafts` | GET /api/erp/drafts | ERP realtime drafts (needs ERP_DEFAULT_USERNAME/PASSWORD) |
| `bosta_customer_orders` | GET /api/bosta/customer/{phone}/orders | Bosta orders by phone, includes status.confirmed |
| `call_center_list_orders` | GET /api/call-center/orders | DB orders (synced) |
| `call_center_sync_from_erp` | POST /api/call-center/orders/sync-from-erp | Sync ERP → DB |

---

## 10. Files Reference

| Layer | File | What |
|-------|------|------|
| ERP sync | `app/api/call_center_api.py` | `_erp_row_to_order`, `_bosta_enrich_order`, `sync_from_erp` |
| Bosta | `app/services/bosta_service.py` | `get_customer_orders_unified`, `search_deliveries` |
| Converter | `app/utils/bosta_converter.py` | `status.confirmed` from `isConfirmedDelivery` |
| Calls | `app/models/call.py` | create_call, get_calls_by_* |
| Context | `front/src/api/callCenterAPI.js` | `getOrderCallContext` → Bosta + customer |
| Docs | `docs/call-center/` | erp-draft-dt-response-shape, ERP-KEYS-OUR-USAGE, calls-model |

---

*Analysis complete. Next: implement P1 (skip delivered at sync) or P4 (UI hint) first?*
