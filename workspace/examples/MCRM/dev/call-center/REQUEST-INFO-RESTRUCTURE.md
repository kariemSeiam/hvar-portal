# Request-Info Restructure — Think-Through

> **Goal:** Remove "يحتاج معلومات" tab. When leader chooses "request info", order goes back to **new** and the info request appears as a **section inside the call session**. Agent edits notes / order data / customer info there, then confirms again → back to leader queue.

---

## Current State (What I Fed On)


| Layer            | Current behavior                                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Backend**      | `POST request-info` → `status=info_requested`, stores leader message in `confirmation_snapshot.info_request_message`. `POST respond-to-info` → agent sends notes only → `status=confirmed` (back to leader). |
| **Frontend**     | Tab "يحتاج معلومات" (info_requested). OrdersTable: badge "يحتاج معلومات", button "رد على طلب المعلومات" → modal (textarea) → `respondToInfo` API.                                                            |
| **Call session** | No use of `confirmation_snapshot` or `info_request_message`. Order shape from `mapOrderFromBackend` does not include snapshot.                                                                               |


```markdown
# Deep review: استفسارات tab — why it still exists

```

---

## Desired Model

1. **Leader action "request info"**
  Order leaves leader queue and becomes **actionable by agent again** — state `**new`** (so it appears in "جديدة" / "الكل"), with the leader’s message **kept** so the call session can show it.
2. **No dedicated tab**
  Remove the "يحتاج معلومات" tab. These orders are just `new` with a stored message.
3. **Call session = single place to respond**
  When agent opens that order, the call session shows a clear **section**: "المشرف طلب معلومات: [message]. عدّل البيانات أو الملاحظات ثم أعد التأكيد."  
   Agent edits notes, order data (items, address, COD), or customer info, then uses the **existing Confirm** flow → `confirm-by-customer` → `status=confirmed` → back to leader queue.
4. **No separate "respond to info" action**
  Responding = editing in the call session + confirming. No dedicated respond-to-info modal/endpoint needed for the new flow (endpoint can stay for legacy or be removed later).

---

## Backend Changes

### 1. `POST /orders/:id/request-info`

- **Today:** `status=info_requested`, `confirmation_snapshot.info_request_message = message`.
- **New:**  
  - Set `**status='new'`** (order returns to agent queue).  
  - **Keep** `confirmation_snapshot` and set `confirmation_snapshot.info_request_message = message` (so call session can show it).  
  - Do **not** clear the rest of the snapshot (leader may have seen items/address; keeping them gives agent context).

### 2. `OPEN_STATUSES` and date logic

- In `app/models/order.py`, `OPEN_STATUSES` currently includes `'info_requested'`.  
- After this change, orders that were "request info" are `new`, so they are already included in backlog/new date logic.  
- You can **keep** `info_requested` in `OPEN_STATUSES` for any existing DB rows, or remove it once you’re sure no rows use it. No functional requirement to remove it immediately.

### 3. `respond-to-info`

- **Option A:** Remove `POST respond-to-info`. New flow is only: open order → edit in call session → confirm.  
- **Option B:** Keep it for backward compatibility (e.g. old links or legacy orders still `info_requested`). If you keep it, it can stay as-is: only when `status=info_requested`, accept notes (and optional items), set `status=confirmed`.  
- Recommendation: **keep for now**, remove tab and primary UI path; deprecate later if no one uses it.

### 4. Counts

- Backend already returns `info_requested` in counts. After the change, no new orders will be `info_requested`, so the count will stay 0. No backend change required for counts.

---

## Frontend Changes

### 1. Remove "يحتاج معلومات" tab

- **CustomerServicePage.jsx:** Remove the tab object `{ id: 'info_requested', label: 'يحتاج معلومات', ... }` from the `tabs` array.  
- Any logic that uses `activeTab === 'info_requested'` (e.g. warm styling) can be removed or left harmless.

### 2. Pass snapshot into order shape and call session

- **callCenterAPI.js — `mapOrderFromBackend`:**  
Add `confirmation_snapshot` to the mapped order. Backend returns it as JSON string or object; normalize to object (e.g. `typeof row.confirmation_snapshot === 'string' ? JSON.parse(row.confirmation_snapshot || '{}') : (row.confirmation_snapshot || {})`).
- **CallSessionFAB:**  
  - Read `order.confirmation_snapshot?.info_request_message`.  
  - If present, render a **section** (e.g. at top of main content or above outcome buttons):  
    - Title: e.g. "طلب المشرف" or "المشرف طلب معلومات".  
    - Body: leader message text.  
    - Short line: "عدّل البيانات أو الملاحظات ثم اضغط تأكيد لإعادة الإرسال للمشرف."
  - No extra submit path: agent uses existing notes/items/customer fields and **Confirm** → same `confirmOrder` → `confirm-by-customer`. Backend already allows confirm when status is `new`.

### 3. OrdersTable: remove info_requested-specific UI

- Remove the "يحتاج معلومات" badge and the "رد على طلب المعلومات" button (and the respond-to-info modal path for this tab).  
- If an order is still `info_requested` (legacy), it won’t appear in the new tab list; you can either leave it invisible until backend migrates those rows to `new`, or add a one-time migration that sets `status='new'` and keeps `confirmation_snapshot.info_request_message`.  
- Optional: keep a small visual hint on the row when `order.confirmation_snapshot?.info_request_message` is set (e.g. "طلب معلومات سابق") so agents see it in the table too; not required for MVP.

### 4. Leader modal

- Leader flow stays: leader clicks "طلب معلومات", modal with message field, `leaderRequestInfo` → backend now sets `new` + snapshot. No change to leader UI except that after success, the order disappears from "مؤكدة" and appears in "جديدة" for agents.

---

## Data Flow Summary

```
Leader: "طلب معلومات" + message
  → POST request-info
  → Backend: status=new, confirmation_snapshot.info_request_message=message

Agent: opens order from "جديدة" / "الكل"
  → Call session opens with order (with confirmation_snapshot in shape)
  → Section shows: "المشرف طلب معلومات: [message]. عدّل ثم أعد التأكيد."
  → Agent edits notes / items / customer / address
  → Agent clicks Confirm
  → POST confirm-by-customer
  → Backend: status=confirmed, new snapshot (overwrites; optional: keep info_request_message in snapshot for history)
  → Order back in "مؤكدة" for leader
```

---

## Optional: Preserve info request in snapshot on confirm

When agent confirms after editing, `confirm-by-customer` builds a new snapshot. If you want the leader to see that this was a "request info" follow-up, you can:

- When building the new snapshot in `confirm_by_customer`, if the **current** order has `confirmation_snapshot.info_request_message`, copy it into the new snapshot as e.g. `info_request_message_previous` or keep `info_request_message` so the leader still sees what they asked for. Then clear or keep it per product preference.

---

## Implementation Order

1. **Backend:** Change `leader_request_info` to set `status='new'` and keep (or set) `confirmation_snapshot.info_request_message`.
2. **Frontend API:** Add `confirmation_snapshot` to `mapOrderFromBackend` (with safe JSON parse).
3. **CallSessionFAB:** Add "المشرف طلب معلومات" section when `order.confirmation_snapshot?.info_request_message` is present.
4. **CustomerServicePage:** Remove tab `info_requested`.
5. **OrdersTable:** Remove respond-to-info button/modal for info_requested (and any badge "يحتاج معلومات").
6. **Optional:** Migrate existing `info_requested` orders to `new` (UPDATE orders SET status='new' WHERE status='info_requested') so they appear in "جديدة".
7. **Optional:** Deprecate or remove `respond-to-info` after a while.

---

## Edge Cases

- **Order already converted:** request-info and confirm-by-customer already reject when `converted_to_ticket_id` is set. No change.  
- **Leader message empty:** Backend can allow empty message (order still goes to `new` with no message) or require a message; product choice.  
- **RTL/Arabic:** Section text is Arabic; use existing RTL styles.  
- **Existing info_requested rows:** Either migrate to `new` once, or keep respond-to-info and a way for agents to see those orders (e.g. keep tab until migration). Prefer one-time migration so one mental model: "request info = order goes to new".

---

*Eaten: call_center_api (request-info, respond-to-info, confirm-by-customer), order model (OPEN_STATUSES, list_orders, get_order_by_id), CustomerServicePage tabs, OrdersTable respond modal, CallSessionFAB, mapOrderFromBackend. Ready for implementation.*

---

# End Workflow — One-Page View

> **Read top to bottom. Each box = one step. Arrows = what happens next.**

---

## 1. Leader sees order in "مؤكدة" (confirmed)

```
┌─────────────────────────────────────────────────────────────┐
│  تبويب: مؤكدة                                                │
│  الطلب #42 — عميل: أحمد — مبيعات                             │
│  [ معالجة للنظام ]  [ رفض ]  [ طلب معلومات ]                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Leader clicks "طلب معلومات" and writes message

```
┌─────────────────────────────────────────────────────────────┐
│  ما المعلومات المطلوبة من الوكيل؟                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ تأكد من العنوان والكميات مع العميل                   │    │
│  └─────────────────────────────────────────────────────┘    │
│  [ تأكيد ]                                                  │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
    POST /api/call-center/orders/42/request-info
    Body: { "message": "تأكد من العنوان والكميات مع العميل" }
                    │
                    ▼
    Backend: status = new
             confirmation_snapshot.info_request_message = "تأكد من..."
```

**Result:** Order disappears from "مؤكدة". It now appears in **جديدة** / **الكل** (no separate tab).

---

## 3. Agent sees order in "جديدة" or "الكل"

```
┌─────────────────────────────────────────────────────────────┐
│  تبويب: جديدة  (أو الكل)                                    │
│  الطلب #42 — أحمد — مبيعات   [فتح الجلسة]                    │
└─────────────────────────────────────────────────────────────┘
```

Agent clicks the order → **call session** opens.

---

## 4. Call session opens — "طلب المشرف" section at top

```
┌─────────────────────────────────────────────────────────────┐
│  جلسة اتصال — الطلب #42                                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─ طلب المشرف ─────────────────────────────────────────┐  │
│  │ المشرف طلب معلومات:                                  │  │
│  │ تأكد من العنوان والكميات مع العميل                   │  │
│  │ عدّل البيانات أو الملاحظات ثم اضغط تأكيد لإعادة       │  │
│  │ الإرسال للمشرف.                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  نوع المكالمة: [ مبيعات ▼ ]                                 │
│  العميل: أحمد   الهاتف: 01xxx   العنوان: ...                │
│  المنتجات / القطع: [قائمة قابلة للتعديل]                    │
│  ملاحظات: [________________________]                        │
│                                                             │
│  [ تأكيد ]  [ جدولة ]  [ لم يرد ]  [ إلغاء ]                │
└─────────────────────────────────────────────────────────────┘
```

Agent edits what’s needed (عنوان، كميات، ملاحظات، بيانات العميل), then clicks **تأكيد**.

---

## 5. Agent clicks "تأكيد" (Confirm)

```
    POST /api/call-center/orders/42/confirm-by-customer
    Body: { call_type, items, customer_name, address, notes, ... }
                    │
                    ▼
    Backend: status = confirmed
             confirmation_snapshot = new snapshot (items, address, notes)
                    │
                    ▼
    Order leaves "جديدة" and goes back to "مؤكدة"
```

---

## 6. Leader sees order again in "مؤكدة"

```
┌─────────────────────────────────────────────────────────────┐
│  تبويب: مؤكدة                                                │
│  الطلب #42 — أحمد — مبيعات (الوكيل أضاف المعلومات)          │
│  [ معالجة للنظام ]  [ رفض ]  [ طلب معلومات ]                 │
└─────────────────────────────────────────────────────────────┘
```

Leader can approve (معالجة للنظام) or request info again.

---

## Flow in one diagram

```
  LEADER                          ORDER STATE              AGENT
     │                                 │                      │
     │  مؤكدة (confirmed)              │                      │
     │  [ طلب معلومات ] + message       │                      │
     │ ───────────────────────────────► │                      │
     │                                  │ status = new         │
     │                                  │ snapshot has message │
     │                                  │                      │
     │                                  │ ◄──────────────────  │  جديدة / الكل
     │                                  │    يفتح الطلب        │
     │                                  │    يرى "طلب المشرف"   │
     │                                  │    يعدّل البيانات    │
     │                                  │    يضغط تأكيد        │
     │                                  │ ──────────────────► │
     │                                  │ status = confirmed   │
     │  مؤكدة (يرى الطلب مرة أخرى)     │                      │
     │ ◄──────────────────────────────  │                      │
```

---

## Tabs after restructure (no "يحتاج معلومات")


| Tab       | Arabic    | What it shows                          |
| --------- | --------- | -------------------------------------- |
| الكل      | الكل      | All active (new + scheduled)           |
| جديدة     | جديدة     | New + **returned from "request info"** |
| مجدولة    | مجدولة    | Scheduled callbacks                    |
| مؤكدة     | مؤكدة     | Confirmed, waiting for leader          |
| مكتملة    | مكتملة    | Converted to ticket                    |
| ملغاة     | ملغاة     | Canceled                               |
| استفسارات | استفسارات | Ask-only calls                         |


**Removed:** يحتاج معلومات (orders that need info are just **جديدة** with a message in the call session).

---

# Deep review: استفسارات tab — why it still exists

**استفسارات** and **يحتاج معلومات** are **not** the same.


| Tab / concept     | What it is                                                                | Data source                                             | We removed?                                                                                 |
| ----------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **يحتاج معلومات** | Orders that leader asked for more info (agent had to respond)             | `orders.status = info_requested`                        | **Yes** — those orders now appear in **جديدة** with the leader message in the call session. |
| **استفسارات**     | **Ask-only calls** — calls where type=ASK, no order created (inquiry log) | `calls` with `call_type=ask`, `linked_to_order_id` NULL | **No** — different feature.                                                                 |


**Why استفسارات exists (by design):**

- In PATH B, when the agent keeps the call as **ASK** (inquiry only), we do **not** create an order or ticket — we only create a **call** row (`calls.call_type='ask'`, no `linked_to_order_id`).
- The **استفسارات** tab is the **list of those ask-only calls**: phone, date, notes, and "اتصل مجدداً" (call again). So it’s the call log for inquiries, not an order queue.

**Backend:** `GET /api/call-center/calls?call_type=ask&date_from=&date_to=` → `call_model.list_ask_calls()` (calls where `linked_to_order_id IS NULL`, `linked_to_ticket_id IS NULL`, `call_type = 'ask'`).

**Frontend:** `getAskCalls({ date_from, date_to })` when the استفسارات tab is active; `InquiriesTable` shows the list.

**Conclusion:** استفسارات is correct to keep — it’s the inquiry **call log**. If you want to **remove** the استفسارات tab (e.g. you don’t need a dedicated view for ask-only calls), that’s a product decision; the restructure only removed the **يحتاج معلومات** tab.

---

# No state `info_requested` — correct cycle (dev)

**Design:** There is **no** order status `info_requested` in the active cycle. Leader "request info" is an **action** that sets the order to **new** and stores the message in the snapshot. Order in مؤكدة → leader clicks طلب معلومات → order moves to **جديدة**; agent sees message in call session, edits, confirms → back to مؤكدة.

**Backend:** `OPEN_STATUSES` = `('new', 'scheduled', 'confirmed')`. `POST request-info` → `status=new`. Counts API does not return `info_requested`. `respond-to-info` is legacy-only.

**Migration (one-time):** `UPDATE orders SET status = 'new' WHERE status = 'info_requested';`