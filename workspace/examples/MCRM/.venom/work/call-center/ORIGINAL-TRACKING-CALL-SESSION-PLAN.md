# Plan: original_tracking from Call Session Bosta Selection

> Agent selects a Bosta card before confirming → `original_tracking` flows to ticket for all service types (sell, replacement, maintenance, return).

---

## What I Ate

- CallSessionFAB flow (confirm, direct confirm)
- confirm-by-customer API (snapshot structure)
- leader-approve API (original_tracking source)
- getOrderCallContext / getCustomerContextByPhone (Bosta orders in context)
- Bosta cards UI (display-only, no selection)
- service_manager.create_*_ticket (all accept original_tracking)

---

## Current State

| Layer | Behavior | Gap |
|-------|----------|-----|
| **CallSessionFAB** | Bosta cards display-only; confirmPayload has no original_tracking | No selection, no payload |
| **confirm-by-customer** | Snapshot: items, customer, address, cod_amount, notes, cost_adjustment | No original_tracking in snapshot |
| **leader-approve** | `original_tracking = order.bosta_tracking` for R/M/T only; sell = None | Ignores snapshot; sell excluded |
| **order.bosta_tracking** | From ERP sync / Bosta enrich; may be null for direct calls | Agent cannot choose which Bosta |

---

## Target State

1. Agent can **select** one Bosta card before confirming (or none).
2. Selected Bosta → `original_tracking` = `trackingNumber` or `tracking_number`.
3. `original_tracking` flows: FAB → confirmPayload → confirm-by-customer → snapshot → leader-approve → ticket.
4. **All service types** (sell, replacement, maintenance, return) support `original_tracking` on ticket creation.
5. **Optional snapshot fields**: items and `original_tracking` — only include when present. Don't pass empty/null.

---

## Structure (Existing Patterns to Follow)

### Frontend
- **Selection pattern**: Match `ServiceModalViewer` / `BostaOrdersGrid` — selected order has ring/border (see `BostaOrdersGrid.jsx` line 36: `original_tracking === trackingNumber`).
- **State**: `selectedBostaOrder` or `selectedOriginalTracking` (string | null).
- **Payload**: Same shape as `UnifiedServiceActionModal` — `original_tracking` in formData.

### Backend
- **Snapshot**: Add `original_tracking` alongside existing keys. **Optional** — like items, only include when present. Don't pass null/empty.
- **leader-approve**: Prefer `snap.get('original_tracking')` over `order.get('bosta_tracking')`; remove sell exclusion.

### Data Flow
```
customerContext.orders (Bosta API)
    → Agent clicks card → selectedBostaOrder
    → trackingNumber = selectedBostaOrder?.trackingNumber || selectedBostaOrder?.tracking_number
    → confirmPayload.original_tracking = trackingNumber
    → POST confirm-by-customer
    → snapshot.original_tracking = data.get('original_tracking')
    → leader-approve: original_tracking = snap.get('original_tracking') ?? order.get('bosta_tracking')
    → create_*_ticket(..., original_tracking=...)
```

---

## Changes by File

### 1. Frontend: CallSessionFAB.jsx

| Change | Location | Notes |
|--------|----------|-------|
| Add state | ~line 77 | `const [selectedBostaOrder, setSelectedBostaOrder] = useState(null)` |
| Make Bosta cards selectable | ~line 1359 | Add `onClick` → `setSelectedBostaOrder(bostaOrder)`; visual: ring when `selectedBostaOrder === bostaOrder` (or compare by trackingNumber) |
| Reset on close/order change | useEffect | `setSelectedBostaOrder(null)` when `orderId` or `directCallKey` changes |
| handleConfirm (existing order) | ~line 676 | `if (selectedBostaOrder) { const tr = selectedBostaOrder.trackingNumber \|\| selectedBostaOrder.tracking_number; if (tr) confirmPayload.original_tracking = String(tr).trim(); }` |
| handleConfirmDirect | ~line 795 | Same: add `original_tracking` from `selectedBostaOrder` to confirmPayload (only when selected) |
| Fallback for existing order | handleConfirm | If no selection and `order?.bosta_tracking_number || order?.bosta_tracking`, use that as fallback (optional — or rely on backend order.bosta_tracking) |
| **Optional payload** | Both handlers | Only add `original_tracking` to confirmPayload when agent selected a Bosta. Don't send key if null. |

**Section hint** (above Bosta cards, when `bostaOrders.length > 0`):

🔗 اختر شحنة Bosta لربطه (اختياري)

### 2. Frontend: callCenterAPI.js — confirmOrder

| Change | Notes |
|--------|-------|
| Pass-through | `confirmOrder` already forwards `data` to backend. No change if payload includes `original_tracking`. |
| createDirectOrder | Check if backend supports `original_tracking` on order create. If not, it flows via confirmPayload only (order created first, then confirm-by-customer with snapshot). |

### 3. Backend: call_center_api.py — confirm_by_customer

| Change | Location | Notes |
|--------|----------|-------|
| Accept original_tracking | ~line 570 | `original_tracking = data.get('original_tracking')` — strip/trim if string |
| Add to snapshot | ~line 611 | Only if present: `if original_tracking and str(original_tracking).strip(): snapshot['original_tracking'] = str(original_tracking).strip()` — **optional**, don't add key when empty |

### 4. Backend: call_center_api.py — leader_approve

| Change | Location | Notes |
|--------|----------|-------|
| Source | ~line 706-708 | `original_tracking = snap.get('original_tracking') if snap.get('original_tracking') is not None else order.get('bosta_tracking')` |
| Remove sell exclusion | Delete | `if st not in ('sell', 's') else None` — allow for sell too |
| Uniqueness | Already | `_check_original_tracking_not_used` in service_manager — no change |

### 5. Backend: createDirectOrder (if used for direct flow)

| Change | Notes |
|--------|-------|
| Optional | Direct flow: create order → confirm. Order may not need `bosta_tracking`; snapshot carries `original_tracking` to ticket. So no change to createDirectOrder unless we want order to store it for display. |

---

## Edge Cases

| Case | Handling |
|------|----------|
| No Bosta orders | No selection; don't pass `original_tracking`. Snapshot omits it. Backend unchanged. |
| Agent selects then deselects | Click same card to toggle. `selectedBostaOrder = null` → omit `original_tracking` from payload. |
| Items empty / not passed | Snapshot items optional for some flows; backend already handles. Same pattern for tracking. |
| Order already has bosta_tracking | leader-approve fallback: use `order.bosta_tracking` when snapshot has none. |
| Tracking already used | service_manager `_check_original_tracking_not_used` raises; user sees error. No change. |
| Sell + original_tracking | Currently excluded. Plan: allow. Sell ticket can link to a Bosta delivery (e.g. COD for that shipment). |

---

## Hot Paths

1. **Confirm (existing order)**: handleConfirm → confirmOrder → POST confirm-by-customer → snapshot stored.
2. **Confirm (direct)**: handleConfirmDirect → createDirectOrder → confirmOrder → same.
3. **Leader approve**: leader_approve → snap.get('original_tracking') → create_*_ticket(original_tracking=...).

---

## Risks / Gaps

| Risk | Mitigation |
|------|------------|
| Bosta card click conflicts with existing link | Use `onClick` on card container; `e.stopPropagation()` on link. Or: separate "select" button. |
| selectedBostaOrder in deps | Add to handleConfirm useCallback deps. |
| Backend order model | Confirm `orders` table has `bosta_tracking` (it does). Snapshot is separate from order update. |

---

## Recommended Implementation Order

1. **Backend first**: confirm-by-customer accepts `original_tracking`, stores in snapshot. leader-approve uses `snap.get('original_tracking')` and allows sell.
2. **Frontend**: Add state, make cards selectable, add `original_tracking` to confirmPayload.
3. **Test**: Confirm order with Bosta selected → leader approve → ticket has `original_tracking`.

---

## Ready for Eat

This plan follows existing structure:
- Snapshot = source of truth at confirmation (like cod_amount).
- Bosta selection = same pattern as ServiceModalViewer order selection.
- No new APIs; only payload and snapshot extensions.

Want me to implement this?
