# Phase B — Direct Call / New Inquiry (Eaten)

> **Purpose:** Implementation spec for Journey B (Direct Call). Anatomy absorbed. Ready for build.
> **Source:** DESIGN-TRANSFORMATION-PHASES, API_ENDPOINTS, call-session-cycle, CallSessionFAB, CallSessionContext

---

## What Phase B Is

**Journey B:** Agent receives call. No order exists. Agent searches by phone → Bosta lookup → opens call session with `order=null`. May classify as ASK or sell/replacement/maintenance/return.

| Outcome | Flow |
|---------|------|
| Confirm(ASK) | POST ask-only — call log only, no order |
| Confirm(sell/R/M/T) | POST create order → POST confirm-by-customer |
| Schedule / No answer / Cancel | Require order first. Phase B minimal: create order then use existing endpoints. Or defer. |

---

## Anatomy (Absorbed)

### Backend

| Endpoint | Status | Notes |
|----------|--------|------|
| POST `/api/call-center/orders` | **Missing** | Docs say it exists. Blueprint has GET only. Add. |
| POST `/api/call-center/calls/ask-only` | **Exists** | Needs: `customer_phone`, `call_type='ask'`, `notes`, `agent_id` |

**order.create_order** (app/models/order.py): Accepts `source`, `customer_phone`, `customer_name`, etc. `customer_phone` required. Normalizes phone.

### Frontend

| Piece | Status | Notes |
|-------|--------|------|
| `createDirectOrder` | Missing | Need POST /orders |
| `askOnly` | Missing | Need POST /calls/ask-only |
| `getCustomerContextByPhone(phone)` | Missing | getOrderCallContext needs orderId. Direct call needs phone-only lookup. |
| CallSessionContext | OK | `startCallSession(order, customerContext)` — accepts `order=null` |
| CallSessionFAB | Needs work | Assumes order exists. `order=null` → loadData returns early, no lock, no context. |

**getOrderCallContext flow:** Fetch order → get phone → Bosta `/api/bosta/customer/{phone}/orders` + customer search → return `{ customer, orders, services, order }`.

**For direct call:** Need `getCustomerContextByPhone(phone)` — same Bosta + customer search, no order fetch. Return `{ customer, orders, services }`.

---

## Implementation Checklist

### 1. Backend

- [ ] **POST /api/call-center/orders** — Create direct order. Body: `source`, `call_type`, `customer_phone`, `customer_name`, `notes`. Use `order_model.create_order`. Return created order.

### 2. Frontend API (callCenterAPI.js)

- [ ] **createDirectOrder** — POST `/api/call-center/orders`. Params: `{ source: 'direct', call_type, customer_phone, customer_name, notes }`. Map response to frontend order shape.
- [ ] **askOnly** — POST `/api/call-center/calls/ask-only`. Params: `{ customer_phone, call_type: 'ask', notes, agent_id }`.
- [ ] **getCustomerContextByPhone(phone)** — Bosta lookup + customer search. Same logic as getOrderCallContext but phone-first. Return `{ customer, orders, services }`.

### 3. New Inquiry Entry

- [ ] **Button** — "استفسار جديد" in PageHeader rightControls (RTL left). Genome: `bg-brand-red-600` or `bg-brand-blue-500`, icon Phone/Plus, `rounded-lg font-cairo`.
- [ ] **Flow** — Click → open modal or inline with phone input → user enters phone → call `getCustomerContextByPhone(phone)` → `startCallSession(null, context)` → CallSessionFAB opens.

### 4. CallSessionFAB order=null Mode

- [ ] **Detect** — `!order` → direct-call mode.
- [ ] **Skip** — No `lockOrder`, no `getOrderCallContext`. Use `customerContext` from `activeCallSession`.
- [ ] **Call type** — Default `ASK`. Show all five types when `order=null`.
- [ ] **Customer section** — If no customerContext: empty state "ابحث عن رقم العميل" with search. If context from session: show customer card.
- [ ] **Outcomes:**
  - Confirm(ASK) → `askOnly(customer_phone, notes)` → end session, toast.
  - Confirm(sell/R/M/T) → `createDirectOrder` → then `confirmByCustomer(newOrder.id, ...)` → end session. *Note: confirm-by-customer requires `items` (line 311). Phase B minimal: support Confirm(ASK) only. Confirm(typed) needs item entry UI — Phase B+.*
  - Schedule / No answer / Cancel — For order=null, either: (a) grey out, (b) create minimal order first then call existing endpoints, or (c) defer to Phase B+.

### 5. Design (from DESIGN-TRANSFORMATION-PHASES)

- [ ] New inquiry button: genome primary/secondary, rounded-lg font-cairo.
- [ ] CallSessionFAB order=null: empty state "ابحث عن رقم العميل", search-first layout.
- [ ] ASK in dropdown when order=null; all five types visible.

---

## Edge Cases

| Case | Handling |
|------|----------|
| Phone lookup returns nothing | Show empty customer. Agent can type name. Bosta orders = []. |
| Confirm(sell) without items | confirm-by-customer API may require items. Either relax backend or require items before confirm. Check API. |
| Agent closes FAB without outcome | endCallSession. No backend call. |
| left_message | User asked to remove. Phase B scope: not included. Separate fix. |

---

## Files to Touch

| File | Changes |
|------|---------|
| `app/api/call_center_api.py` | Add POST /orders |
| `front/src/api/callCenterAPI.js` | createDirectOrder, askOnly, getCustomerContextByPhone |
| `front/src/pages/CustomerServicePage.jsx` | New inquiry button, handler → modal/inline → getCustomerContextByPhone → startCallSession(null, context) |
| `front/src/components/call-center/CallSessionFAB.jsx` | order=null branch: no lock, use customerContext, default ASK, outcomes: askOnly / createDirectOrder+confirm |

---

## Confirm-by-Customer Req

Backend (`call_center_api.py` L311): `items` required for sell. Returns 400 if empty. So:
- **Phase B minimal:** Confirm(ASK) only — askOnly works.
- **Phase B+:** Confirm(sell/R/M/T) — needs item entry UI in CallSessionFAB for order=null, then createDirectOrder → confirmByCustomer(orderId, { items, address, ... }).

---

*Eaten. Ready for go.*
