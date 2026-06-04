# Bosta Selection → Items Display — Eat

> **User issue:** When selecting a Bosta order on the call session, the original items don't appear. Want: (1) items from selected Bosta order shown by default, (2) hint with tracking number that this call order is based on.

---

## What I Ate

| Resource | Scope |
|----------|------|
| CallSessionFAB.jsx | Bosta cards, selectedBostaOrder, items flow |
| callCenterAPI.js | autoMatchItems, parseDescriptionText, matchItemsWithStock |
| BOSTA-ORDERS-DATA-STRUCTURE.md | package.description, itemsCount (no items array) |
| ORDER-DESCRIPTION-TO-ITEMS-STUDY.md | parse format, auto-match flow |
| ORIGINAL-TRACKING-CALL-SESSION-PLAN.md | selectedBostaOrder → original_tracking |
| CallCenterItemsSelection, OrderItemsEditor | Item format, direction |

---

## Root Cause

**selectedBostaOrder** is used only for `original_tracking` in the confirm payload. There is **no connection** between selecting a Bosta card and populating the items section.

| What exists | What's missing |
|-------------|----------------|
| Bosta cards are selectable (onClick → setSelectedBostaOrder) | No useEffect: selectedBostaOrder → items |
| selectedBostaOrder flows to confirmPayload.original_tracking | Items stay from loadData (snapshot / autoMatch / empty) |
| Bosta order has package.description (ERP format: "1 * كبه (5070+04)") | That text is never passed to autoMatchItems when user selects |
| Reset selectedBostaOrder on order change | No auto-select when order.bosta_tracking matches a Bosta order |

---

## Data Flow Today

```
loadData (mount)
  → confirmation_snapshot? → getOrderItemsFromSnapshot → items
  → else isRMT? → items = [] (empty)
  → else → autoMatchItems(orderId, order.order_description) → items

User clicks Bosta card
  → setSelectedBostaOrder(bostaOrder)
  → Nothing else. Items unchanged.
```

---

## Bosta Order Structure

Bosta API returns:
- `package.description` — text like "1 * كبه هفار 6.5 لتر 2000 وات (5070+04)" — **same format as ERP shipping_details**
- `package.itemsCount` — number
- **No** `package.items` array — items are embedded in description text

`parseDescriptionText` + `matchItemsWithStock` can parse this format. `autoMatchItems(orderId, description)` accepts description as 2nd param; when provided, it never fetches order (orderId can be null for direct call).

---

## Item Format Requirements

| Call type | Component | Format |
|-----------|-----------|--------|
| sell | OrderItemsEditor | `{ item_id, sku, name, quantity, price_customer, type }` |
| R/M/T | CallCenterItemsSelection | itemsToSend / itemsToReceive: `{ item_id, sku, name, quantity, type, direction, condition }` |

For R/M/T, Bosta order = "original" (what customer has). So:
- **itemsToReceive** = items from selected Bosta order (direction: 'receive', condition: 'valid' default)
- **itemsToSend** = empty (agent adds manually for replacement)

---

## Hot Paths

| Path | File | Line |
|------|------|------|
| Bosta card click | CallSessionFAB.jsx | 1381 |
| selectedBostaOrder state | CallSessionFAB.jsx | 78 |
| Reset on order change | CallSessionFAB.jsx | 404–406 |
| loadData items logic | CallSessionFAB.jsx | 310–392 |
| autoMatchItems | callCenterAPI.js | 1740 |
| parseDescriptionText | callCenterAPI.js | 1037 |
| matchItemsWithStock | callCenterAPI.js | 1106 |

---

## Required Changes (No Code Yet — Plan Only)

### 1. Sync selectedBostaOrder → Items

**New useEffect** in CallSessionFAB:
- When `selectedBostaOrder` changes and has `package.description`:
  - Call `autoMatchItems(order?.id ?? null, packageDescription)`
  - For **sell**: set editableItems, editableTotal, editableDescription
  - For **R/M/T**: set itemsToReceive (with direction: 'receive', condition: 'valid'), itemsToSend unchanged
- **Skip when**: hasSnapshotItems (confirmed order — snapshot is source of truth)
- **Direct call** (order=null): autoMatchItems(null, desc) works — it never calls getOrder when desc is provided

### 2. Auto-select on Load

**In loadData** (after setCustomerContext):
- If `order` exists and `order.bosta_tracking_number || order.bosta_tracking` matches a Bosta order in `context.orders`:
  - `setSelectedBostaOrder(matchingBostaOrder)`
- This runs after loadData completes. Reset effect runs first (null), then loadData sets context. We add the auto-select at end of loadData so it runs after. But reset runs on mount too — so when we open order 169, reset sets null. loadData async completes, we set match. Good.

### 3. Hint with Tracking Number

**Above items section** (when `selectedBostaOrder` is set):
- Show: `مبني على شحنة: #{trackingNumber}` (or similar)
- Placement: inside the items editor card, above OrderItemsEditor / CallCenterItemsSelection
- Style: subtle chip or badge, e.g. `bg-brand-red-50 dark:bg-brand-red-900/20 text-brand-red-700`

### 4. Don't Overwrite Snapshot

When `hasSnapshotItems` is true, do **not** apply selectedBostaOrder → items. Snapshot is the materialized truth. Only apply when:
- New call (no snapshot), or
- User explicitly selects a different Bosta (could overwrite — but risky. Safer: only apply Bosta items when we have no snapshot items.)

---

## Blast Radius (venom-audit)

| Target | Direct callers | Risk |
|--------|----------------|------|
| CallSessionFAB.jsx | CustomerServicePage (via CallSessionContext) | 🟡 Medium — add useEffect, loadData change |
| callCenterAPI.js | CallSessionFAB, others | 🟢 Low — no signature change; autoMatchItems(null, desc) already works |
| CallCenterItemsSelection | CallSessionFAB | 🟢 Low — receives itemsToReceive, no prop change |
| OrderItemsEditor | CallSessionFAB | 🟢 Low — receives editableItems, no prop change |

**Safe to proceed:** Yes. Changes are additive. No API or model changes.

---

## Edge Cases

| Case | Handling |
|------|----------|
| User selects then deselects Bosta | selectedBostaOrder = null → don't clear items (user might have edited). Or: clear and revert to loadData state? Revert is complex. Safer: only apply when selecting; deselect leaves items as-is. |
| Bosta order has no package.description | Skip. Don't call autoMatchItems. |
| autoMatchItems returns empty | Set empty items. User can add manually. |
| Direct call + select Bosta | autoMatchItems(null, packageDescription) — works. |
| Order has bosta_tracking but no matching Bosta in context | Don't auto-select. Bosta API might not have returned it (different phone, etc.). |

---

## Recommended Implementation Order

1. **Add useEffect: selectedBostaOrder → items** — core fix
2. **Add hint chip** — above items when selectedBostaOrder set
3. **Auto-select on load** — when order.bosta_tracking matches a Bosta order

---

## Summary

| Gap | Fix |
|-----|-----|
| Selecting Bosta doesn't update items | useEffect: selectedBostaOrder → autoMatchItems(package.description) → set items |
| No visual hint for "based on this shipment" | Chip: "مبني على شحنة: #{tracking}" above items |
| Order has bosta_tracking but card not pre-selected | In loadData: match and setSelectedBostaOrder |

Ready for implementation when you say go.
