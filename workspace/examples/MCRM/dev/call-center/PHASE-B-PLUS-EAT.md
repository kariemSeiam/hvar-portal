# Phase B+ — Direct Call Confirm (sell/R/M/T) — Eaten

> **Purpose:** Implementation spec for Confirm(sell/R/M/T) in direct call mode. Anatomy absorbed.
> **Source:** PHASE-B-EAT, workflow, call-session-cycle, CallSessionFAB, confirmOrder, leader_approve, service-types-reference

---

## What Phase B+ Is

**Journey B typed:** Agent opens direct call → searches by phone → reclassifies to sell/R/M/T → enters items/address → Confirm → order created + confirmed → leader queue.

| Outcome | Flow |
|---------|------|
| Confirm(sell) | createDirectOrder → confirmOrder(orderId, { items, delivery_date, address, call_type: 'sell' }) |
| Confirm(R) | createDirectOrder → confirmOrder(orderId, { items, ..., call_type: 'replacement' }) |
| Confirm(M) | createDirectOrder → confirmOrder(orderId, { items?, ..., call_type: 'maintenance' }) |
| Confirm(T) | createDirectOrder → confirmOrder(orderId, { items?, ..., call_type: 'return' }) |

**Items requirement:** Sell + R = required. M + T = optional (backend allows empty).

---

## What's Ready

| Piece | Status |
|-------|--------|
| POST /api/call-center/orders | ✓ Exists |
| createDirectOrder | ✓ Exists |
| getCustomerContextByPhone | ✓ Exists |
| askOnly | ✓ Exists |
| New inquiry button + modal | ✓ Exists |
| CallSessionFAB order=null | ✓ Exists |
| OrderItemsEditor | ✓ Exists, uses searchStockItems |
| confirm-by-customer backend | ✓ Accepts R/M/T with optional items |
| leader_approve | ✓ Handles sell, R, M, T |
| customerContext.orders (Bosta) | ✓ Available in session |

---

## What's Missing

### 1. CallSessionFAB — Confirm(sell/R/M/T) flow

**Current:** Click Confirm when direct + typed → toast "قريباً".

**Need:** Open confirm modal. On submit: createDirectOrder → confirmOrder(newOrderId, data) → end session.

| Step | Action |
|------|--------|
| 1 | User selects sell/R/M/T, adds items (OrderItemsEditor already shown), sets delivery date |
| 2 | Clicks Confirm → open confirm modal (same as order flow) |
| 3 | Modal: delivery_date required; items from editableItems |
| 4 | Submit → createDirectOrder({ customer_phone, customer_name, service_type: callType, delivery_address, governorate, city, cod_amount }) |
| 5 | confirmOrder(newOrder.id, { items: editableItems, delivery_date, total: editableTotal, call_type: callType, history: editableNotes }) |
| 6 | onComplete() → end session |

### 2. confirmOrder API — Relax items for R/M/T

**Current:** `if (!items.length) throw new Error(...)` — always requires items.

**Need:** When call_type in ['replacement','maintenance','return'], allow empty items. Backend already allows it.

```js
// In confirmOrder: only enforce items when call_type === 'sell'
if (callType === 'sell' && !items.length) throw new Error('items required for sell');
```

### 3. createDirectOrder — Full payload

**Current:** Accepts customer_phone, customer_name, delivery_address, governorate, city, cod_amount, service_type.

**Need:** Ensure we pass service_type from callType. Already supported. Map customer from customerContext.

### 4. Validation before Confirm

| call_type | Items | Address |
|-----------|-------|---------|
| sell | Required | Required |
| replacement | Required | Required |
| maintenance | Optional | Required |
| return | Optional | Required |

Customer phone always required (we have it from context).

### 5. Address source for direct

customerContext.customer has: governorate, city, address_details. order has delivery_address. For direct, use customer fields. Editable in session — agent can correct. OrderItemsEditor + customer card already show editable fields. For createDirectOrder we need: delivery_address (combine governorate + city + address_details or use single field), governorate, city, cod_amount.

---

## Implementation Checklist

### 1. callCenterAPI.js — confirmOrder

- [x] Only require items when `data.call_type === 'sell'`. For R/M/T allow empty items array.

### 2. CallSessionFAB — handleConfirmDirect

- [x] New handler: `handleConfirmDirect`. Runs when isDirectCall && callType !== 'ask'.
- [x] Validate: phone, address (governorate or delivery_address), items for sell/R.
- [x] createDirectOrder({ customer_phone, customer_name, source: 'direct', service_type: callType, delivery_address, governorate, city, cod_amount: editableTotal })
- [x] confirmOrder(newOrder.id, { items: editableItems, delivery_date: deliveryDate || customDeliveryDate || today, total: editableTotal, call_type: callType, history: editableNotes })
- [x] onComplete()

### 3. CallSessionFAB — Confirm button

- [x] When isDirectCall && callType !== 'ask': onClick → setShowConfirmModal(true) (remove "قريباً" toast).
- [x] Confirm modal submit: if isDirectCall call handleConfirmDirect, else handleConfirm.

### 4. CallSessionFAB — delivery_date for direct

- [x] Use deliveryDate or customDeliveryDate. Default: today. Same as order flow.

### 5. CallSessionFAB — Address/customer for direct

- [ ] customerContext.customer: name, phone, governorate, city, address_details.
- [ ] Build delivery_address: `${customer?.address_details || ''} ${customer?.city || ''} ${customer?.governorate || ''}`.trim() or allow agent to edit. OrderItemsEditor doesn't have address — we have it in the customer card. For createDirectOrder we need to pass it. Add optional editableAddress state for direct call if we want agent to edit.

**Simpler:** Use customer from context. delivery_address = customer?.address_details or concatenate. createDirectOrder accepts delivery_address, governorate, city. Pass from customer.

---

## Edge Cases

| Case | Handling |
|------|----------|
| No items for sell/R | Toast "يجب إضافة عناصر" before submit |
| No address for direct | Toast "العنوان مطلوب" — require governorate or delivery_address |
| createDirectOrder fails | Toast error, don't call confirmOrder |
| confirmOrder fails after create | Order exists but not confirmed. Could retry or show error. |

---

## Files to Touch

| File | Changes |
|------|---------|
| `front/src/api/callCenterAPI.js` | confirmOrder: allow empty items for R/M/T |
| `front/src/components/call-center/CallSessionFAB.jsx` | handleConfirmDirect; Confirm button → open modal for direct typed; modal submit branch |

---

## Order of Work

1. confirmOrder — relax items for R/M/T.
2. handleConfirmDirect — createDirectOrder + confirmOrder.
3. Confirm button — open modal for direct typed (remove قريباً).
4. Modal submit — branch: isDirectCall ? handleConfirmDirect : handleConfirm.

---

*Eaten. Ready for build.*
