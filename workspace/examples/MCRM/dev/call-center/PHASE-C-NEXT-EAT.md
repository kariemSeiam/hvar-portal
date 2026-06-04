# Phase C — Next Items (Eaten)

> **Purpose:** Spec for R/M/T leader-approve, Reject/Request-info UI, info_requested flow. Anatomy absorbed.
> **Source:** service_manager, OrdersTable, AuthContext, call_center_api
> **Update:** info_requested flow restructured — request-info → status=new, no tab; agent responds in call session. See REQUEST-INFO-RESTRUCTURE.md.

---

## 1. R/M/T in leader-approve

**Current:** Returns 501 for service_type ≠ sell.

**service_manager signatures:**
- `create_replacement_ticket(customer_id, items, user_id, notes, ...)` — items need: item_id, quantity, direction, condition
- `create_maintenance_ticket(..., items=None)` — items optional, same format
- `create_return_ticket(..., items=None)` — items optional, same format

**_create_ticket_and_items requires:** `item_id`, `quantity`, `direction`, `condition`. Direction: 'send' | 'receive'. Condition: 'valid' | 'damaged'.

**confirmation_snapshot for R/M/T:** Agent confirms with call_type in (replacement, maintenance, return). Snapshot has `items` — may be from CallSessionFAB. Need to ensure each item has direction (default 'send' for replacement send-items) and condition (default 'valid').

**Implementation:**
- Add `_items_for_rmt(snap_items)` helper: map to `{item_id, quantity, direction: 'send'|'receive', condition: 'valid'|'damaged'}`. Default direction='send', condition='valid'.
- In leader_approve: branch on service_type → replacement / maintenance / return. Call create_replacement_ticket, create_maintenance_ticket, create_return_ticket with customer params from snap.

**Sell fix:** `_items_for_sell` returns only item_id, quantity. create_sell_ticket → _create_ticket_and_items needs direction, condition. Add `direction='send'` and `condition='valid'` when building items for sell in leader_approve.

---

## 2. Reject / Request-info UI

**Current:** OrdersTable shows "Process to Hub" (معالجة للنظام) for confirmed orders. One action only.

**Auth:** `useAuth()` → `userInfo?.role`. `team_leader` exists in AuthContext (stub returns role: 'team_leader'). UserProfile shows role badge.

**Add:** When `order.status === 'confirmed'` and `userInfo?.role === 'team_leader'`:
- Approve — existing Process to Hub (leaderApprove)
- Reject — new button, opens modal (rejection_reason), calls leaderReject
- Request info — new button, opens modal (message), calls leaderRequestInfo

**Placement:** Same actions cell as Process to Hub. Could be a dropdown "المزيد" or three separate buttons. Genome: Approve green, Reject red, Request info amber.

**Files:** OrdersTable.jsx, CustomerServicePage (pass onReject, onRequestInfo? or extend onProcessToHub to multi-action).

---

## 3. info_requested flow

§3 is historical; current flow in REQUEST-INFO-RESTRUCTURE.md.

**Current:** leader_request_info sets status=info_requested. No UI for agent to respond.

**Need:**
- Tab or filter for info_requested orders (agent sees "يحتاج معلومات")
- Agent opens order, adds info (modal or inline), submits → status back to 'confirmed' (or new endpoint `POST /orders/:id/respond-to-info`)
- Order returns to leader queue

**Backend:** Add `POST /orders/:id/respond-to-info` — body: `{ notes, ... }` — sets status=confirmed, optionally appends to confirmation_snapshot or separate field.

**Simpler:** Reject sets status=new. Agent reworks and confirms again. For request-info, we could have the same — leader rejects with reason "need more info", agent fixes, confirms again. So no new endpoint if we treat reject as the path. Request-info could set status=new with a flag or separate status. Per leader-approval-workflow: request-info keeps in queue with notification. So we need status=info_requested and an agent response path. New endpoint: respond-to-info → status=confirmed (back to leader queue).

---

## 4. Sell items — direction + condition

**Bug:** leader_approve passes items from _items_for_sell which only has item_id, quantity. create_sell_ticket → _create_ticket_and_items requires direction and condition. Will fail.

**Fix:** In leader_approve, when building items for sell, enrich: `direction='send'`, `condition='valid'` for each item.

---

## Implementation Order

1. **Fix sell items** — Add direction/condition in leader_approve (blocking)
2. **R/M/T in leader_approve** — Add branches for replacement, maintenance, return
3. **Reject / Request-info UI** — Buttons + modals in OrdersTable for leaders
4. **respond-to-info endpoint** — Agent responds to info_requested
5. **info_requested tab/filter** — Show in queue for agents

---

## Files

| File | Changes |
|------|---------|
| `app/api/call_center_api.py` | Enrich sell items; add R/M/T branches; add respond-to-info |
| `app/models/order.py` | respond-to-info: status info_requested → confirmed |
| `front/src/components/call-center/OrdersTable.jsx` | Reject, Request-info buttons + modals (when leader) |
| `front/src/pages/CustomerServicePage.jsx` | Pass leaderReject, leaderRequestInfo; handle refresh |
| `front/src/api/callCenterAPI.js` | leaderRespondToInfo (new) |

---

*Eaten. Ready for build.*
