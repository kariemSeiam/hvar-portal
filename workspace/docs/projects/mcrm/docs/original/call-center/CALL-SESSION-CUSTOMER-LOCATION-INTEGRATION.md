# Call Session — Customer & Location UI + Real Persistence

Plan for aligning call-session customer/location with Bosta search result panel and wiring edits to the backend.

---

## 1. Goal

- **UI/UX:** Use the same customer + location blocks as the Bosta search result panel (CustomerCard + LocationCard). Remove the existing custom inline customer/address blocks in the call session FAB so the experience is consistent and clean.
- **Integration:** Edits in the call session must **persist to the customer record** (and, where applicable, reflect on the order). No UI-only actions.

---

## 2. Current State

| Where | Customer / location | Persistence |
|-------|---------------------|-------------|
| **Bosta search result** | BostaIdentityPanel → CustomerCard + LocationCard | Bosta panel: `onSaveCustomer` / `onSaveAddress` are no-ops in current Bosta usage; parent can wire real save. |
| **Service ticket modal** | CustomerCard + LocationCard | Real: `customerAPI.updateCustomer(customerId, …)` then refresh profile. |
| **Call session FAB** | Custom divs (name, phone chips, address chips) + non-functional Edit icons | Read-only. No API calls on “edit”. |

---

## 3. Target State

- **Call session FAB:** Reuse **CustomerCard** and **LocationCard** (same as Bosta search result panel). No duplicate custom customer/address markup.
- **Persistence:**
  - If `customerContext.customer.id` exists → `PUT /api/customers/:id` with the changed fields (name, phone, phone_secondary for customer card; governorate, city, address_details for location card). Then refresh context (e.g. `getCustomerById` and update `customerContext`).
  - If there is **no** customer id (e.g. order from ERP with no linked customer, or direct call with only phone): on first save, **create** customer via `POST /api/customers/` with name, phone, and optionally phone_secondary, governorate, city, address_details; then set the returned customer in context so subsequent edits use update.
- **Order:** Optionally, when the open session is order-based, backend could later support updating the order’s `customer_id`, `customer_phone`, `customer_name`, address fields when the agent edits customer/location (so queue and downstream flows see the same data). This can be a follow-up.

---

## 4. Implementation Summary

1. **CallSessionFAB**
   - Import: `CustomerCard`, `LocationCard` from `ServiceModalViewer`, and `customerAPI`.
   - Remove: the existing custom “Profile Header” customer block and the “Address Section” block (the two cards with Edit2 that do nothing).
   - Add: a single “customer + location” block that renders:
     - **CustomerCard** with `ticket` and `customerProfile` derived from `customerContext?.customer` and `order`; `onSaveCustomer` and `onSaveAddress` implemented (see below); `copiedPhone` / `onCopyPhone` from existing FAB state; `saving` from local state.
     - **LocationCard** (when `callType !== 'ask'`) with same `ticket` / `customerProfile` and `onSaveAddress` / `saving`.
   - State: `savingCustomer`, `savingAddress` (or one `savingCustomerOrAddress`), optional `customerError` (or use toast only).
   - **handleSaveCustomer(payload, onDone):**
     - If `customerContext?.customer?.id`: `customerAPI.updateCustomer(id, { name, phone, phone_secondary })` → on success fetch `getCustomerById(id)` and `setCustomerContext(prev => ({ ...prev, customer: data.data ?? data }))`; on error toast; then `onDone()`.
     - If no `customer.id`: require at least phone (from payload or current context). `customerAPI.createCustomer({ name, phone, phone_secondary, ... })` → on success set new customer in context; on error toast; then `onDone()`.
   - **handleSaveAddress(payload, onDone):**
     - If `customerContext?.customer?.id`: `customerAPI.updateCustomer(id, { governorate, city, address_details })` → on success fetch and update customer in context; `onDone()`.
     - If no `customer.id`: same as customer card — create customer first with minimal identity (name, phone from context) plus address fields, then set customer in context; `onDone()`.
   - **Refresh:** After any successful update or create, replace `customerContext.customer` with the full customer object from the API so the cards and confirm/schedule flows see up-to-date data.

2. **BostaIdentityPanel**
   - No change required for this plan. It already uses CustomerCard + LocationCard; if in the future the Bosta flow needs to persist edits, the parent can pass the same pattern of `onSaveCustomer` / `onSaveAddress` that call the customer API and refresh.

3. **Backend**
   - Already supports: `PUT /api/customers/<id>`, `POST /api/customers/`. No backend change for this phase. Optional later: PATCH order with `customer_id` / address when agent edits in call session.

---

## 5. Edge Cases

- **Direct call, no customer:** Context may be `{ customer: { id: null, name: '', phone: '...' } }`. First save (customer or address) creates the customer; subsequent saves update.
- **Order with no linked customer:** Same as above: create on first save using order phone/name if needed.
- **Phone change on existing customer:** Backend normalizes phone. If the backend enforces unique phone, changing to an existing number may return 409; show error in UI/toast and do not clear context.

---

## 6. Files Touched

- `front/src/components/call-center/CallSessionFAB.jsx` — replace customer/location UI with CustomerCard + LocationCard; add save handlers and context refresh.
- (Optional) `front/src/components/service/BostaSearchResultScreen/BostaIdentityPanel.jsx` — later, wire real save when used in a flow that should persist (e.g. when creating a ticket from Bosta search).

---

*Plan agreed; implementation in CallSessionFAB only for this phase.*
