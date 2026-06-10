# Service Portal — Maintenance, Replacement, Return

> Compass direction for the service section of hvarstore.com.
> This is the customer-facing mirror of the MCRM hub — not a simple FAQ, a full request lifecycle.

---

## What the Service Portal Is

The service portal is the section of hvarstore.com where existing customers initiate and track post-sale requests. It is NOT a contact form. It is a structured ticket system that feeds directly into the MCRM queue.

Three request types are customer-facing:

| MCRM Code | Arabic Label | What the Customer Understands |
|-----------|-------------|-------------------------------|
| HVM | صيانة | My product stopped working or is behaving wrong — I need it repaired |
| HVR | استبدال | My product is defective and cannot be repaired — I need a replacement unit |
| HVT | مرتجع | I want to return the product and get my money back |

HVS (Sell) is internal. Customers never see it. MCRM agents create HVS tickets.

The WhatsApp number `01204444196` is always present as a fallback CTA across all service pages.

---

## Auth Approach

**Auth is required to open a ticket.** Phone-based JWT — same auth system as orders.

Rationale: The ticket must be linked to a `contact_id`. A customer who is not authenticated cannot be linked, and MCRM cannot work the ticket without knowing who submitted it.

Flow:
1. Customer lands on `/service/new` without a session → redirected to `/login?next=/service/new`
2. On login (phone + OTP or password), JWT is issued, `contact_id` is resolved
3. Customer is returned to the form, phone pre-filled and read-only
4. If the customer has previous orders, those orders are surfaced in the product selector

Phone-only lookup (no login) is **not sufficient** for ticket creation. It is acceptable for reading an already-created ticket if the customer provides the ticket reference number — but the primary flow assumes authentication.

---

## Customer-Facing Flow

### Step 1 — اختر نوع الطلب

Three cards, tap to select:

| Card | Icon | Label | Sub-label |
|------|------|-------|-----------|
| Card 1 | wrench | صيانة | المنتج لا يعمل بشكل صحيح |
| Card 2 | refresh | استبدال | منتج معيب يحتاج استبدال |
| Card 3 | return arrow | مرتجع | أريد إرجاع المنتج |

Selection is required to advance. No default.

### Step 2 — تفاصيل المشكلة

**المنتج المعني:**
- If customer has previous orders: dropdown/search from their order history. Selecting an order pre-fills `product_id` and sets `transaction_id`.
- If no order history or customer cannot find the order: free-text product name. No `transaction_id` set — MCRM handles lookup manually.

**وصف المشكلة (required):**
- Arabic text, minimum 20 characters.
- Placeholder: "صف المشكلة بالتفصيل لنتمكن من مساعدتك بشكل أفضل"
- Validation: enforce min length on blur and on submit.

**صور (optional):**
- Up to 3 images.
- Upload to server immediately on selection (not deferred to submit).
- Stored image URLs are attached to the ticket in `notes` or a dedicated field.

### Step 3 — بيانات التواصل والاستلام

- **رقم الهاتف:** pre-filled from session, read-only.
- **عنوان الاستلام:** Governorate dropdown → District dropdown (dependent). Free-text street address. If the customer has saved addresses, offer them as a starting point.
- **تاريخ مناسب للاستلام (optional):** Date picker, no validation — it is a preference, not a hard schedule.

**Submit button:** `إرسال الطلب`

On submit, POST to `/api/tickets`. On success, redirect to `/service/:id` — the ticket detail page for the newly created ticket.

---

## DB Write on Ticket Creation

```sql
INSERT INTO service_tickets (
  type,           -- 'HVM' | 'HVR' | 'HVT'
  status,         -- 'PENDING' always on creation
  contact_id,     -- contacts.id resolved from JWT
  transaction_id, -- orders.id if customer linked to an order; NULL otherwise
  product_id,     -- products.id if resolved from order or catalog; NULL if free-text
  notes,          -- customer's problem description (+ image URLs if uploaded)
  created_at,
  updated_at
)
```

MCRM sees the ticket immediately in their queue. No async delay.

---

## State Machines (Customer-Visible)

### صيانة (HVM)

```
PENDING → HUB_RECEIVED → IN_WORKSHOP → READY → CLOSED
                                              ↘ CANCELLED
                                              ↘ FAILED
```

| State | Customer-Facing Arabic | Expected Wait |
|-------|----------------------|--------------|
| PENDING | طلبك قيد المعالجة، سيتواصل معك فريقنا | ساعات |
| HUB_RECEIVED | وصل منتجك لمركز الخدمة، بدأنا التشخيص | ١ يوم عمل |
| IN_WORKSHOP | منتجك قيد الإصلاح الآن | ٢-٤ أيام عمل |
| READY | منتجك جاهز للاستلام أو الشحن | — |
| CLOSED | تم إغلاق الطلب بنجاح | — |
| CANCELLED | تم إلغاء الطلب | — |
| FAILED | تعذر إصلاح المنتج، تواصل معنا | — |

### استبدال (HVR)

```
PENDING → HUB_RECEIVED → DISPATCHED → READY → CLOSED
```

| State | Customer-Facing Arabic |
|-------|----------------------|
| PENDING | طلب الاستبدال قيد المراجعة |
| HUB_RECEIVED | وصل منتجك لمركز الخدمة |
| DISPATCHED | المنتج البديل في الطريق |
| READY | جاهز للاستلام |
| CLOSED | تم الاستبدال بنجاح |

### مرتجع (HVT)

```
PENDING → HUB_RECEIVED → INSPECTED → REFUNDED → CLOSED
```

| State | Customer-Facing Arabic |
|-------|----------------------|
| PENDING | طلب الإرجاع قيد المراجعة |
| HUB_RECEIVED | وصل المنتج لمركز الفحص |
| INSPECTED | تم الفحص، جاري معالجة الاسترداد |
| REFUNDED | تم رد المبلغ |
| CLOSED | تم إغلاق الطلب |

---

## State-to-Color Mapping

| State | Arabic | Tailwind Classes |
|-------|--------|-----------------|
| PENDING | قيد المعالجة | `text-slate-500 bg-slate-50` |
| HUB_RECEIVED | في المركز | `text-blue-600 bg-blue-50` |
| IN_WORKSHOP | قيد الإصلاح | `text-amber-600 bg-amber-50` |
| DISPATCHED | في الطريق | `text-purple-600 bg-purple-50` |
| INSPECTED | تم الفحص | `text-blue-600 bg-blue-50` |
| READY | جاهز | `text-green-600 bg-green-50` |
| REFUNDED | تم الرد | `text-green-600 bg-green-50` |
| CLOSED | مغلق | `text-emerald-600 bg-emerald-50` |
| CANCELLED | ملغي | `text-red-600 bg-red-50` |
| FAILED | تعذر | `text-red-600 bg-red-50` |

Use `StatusBadge` component. Never hardcode state colors inline.

---

## Tracking Page — `/service/:id`

### What the Customer Sees

A vertical timeline of all states for the ticket type. Completed states show a filled indicator and a timestamp. The current state is highlighted. Future states are grayed out.

```
✓  تم استلام الطلب          ١ يونيو، ٠٩:٠٠
✓  وصل المنتج لمركز الخدمة   ٢ يونيو، ١١:٣٠
●  قيد الإصلاح الآن          ٣ يونيو، ١٤:٠٠   ← CURRENT
○  جاهز للاستلام              —
○  تم الإغلاق                 —
```

Header shows: ticket type (Arabic), ticket reference number (e.g. `#HVM-2024-0087`), product name, open date.

If MCRM added public notes to the ticket: show them in a "ملاحظات من الفريق" block below the timeline.

If the ticket has a FAILED or CANCELLED terminal state: show the state in red with a WhatsApp CTA — "تواصل معنا لمعرفة التفاصيل".

### Data Query

```sql
SELECT st.*, c.name as customer_name, p.name as product_name,
       t.website_order_id as order_ref
FROM service_tickets st
LEFT JOIN contacts c ON c.id = st.contact_id
LEFT JOIN products p ON p.id = st.product_id
LEFT JOIN transactions t ON t.id = st.transaction_id
WHERE st.id = :id AND st.contact_id = :current_customer_id
```

The `AND st.contact_id = :current_customer_id` guard is mandatory — customers must not be able to view other customers' tickets by guessing IDs.

### Timeline Source

If `service_ticket_history` exists in the MCRM schema, use it — it logs state transitions with timestamps.

If it does not exist, derive the timeline from `created_at` (maps to PENDING) + `updated_at` (maps to current status). Future states have no timestamp. This is a degraded but acceptable fallback.

**API:** `GET /api/tickets/:id`

---

## Ticket List Page — `/service`

**URL:** `/service`

Filter tabs: `[الكل] [صيانة] [استبدال] [مرتجع]`

Each ticket card shows:
- Ticket reference number (e.g. `#HVM-2024-0087`)
- Product name
- Current state in Arabic with color badge
- Date opened (human-readable, Arabic numerals)
- "عرض التفاصيل" link → `/service/:id`

**API:** `GET /api/tickets?type=HVM&page=1`

Type filter is optional. No type param = all tickets for the authenticated customer.

---

## Error States

### Phone Not Found
Does not apply to ticket creation — the phone is taken from the authenticated JWT. If the JWT is invalid or expired, the customer is redirected to `/login`. There is no scenario where a logged-in customer's phone is "not found."

### Duplicate Request
If the customer already has an open ticket for the same product in the same category (PENDING or active state), show a warning before allowing submission:

> "لديك طلب مفتوح بالفعل لهذا المنتج (#HVM-2024-0087). هل تريد متابعة الطلب الحالي أم فتح طلب جديد؟"

Two actions: `[متابعة الطلب الحالي]` (link to existing ticket) and `[فتح طلب جديد]` (proceed with submission). The customer decides — do not block silently.

Duplicate detection query:
```sql
SELECT id FROM service_tickets
WHERE contact_id = :contact_id
  AND product_id = :product_id
  AND type = :type
  AND status NOT IN ('CLOSED', 'CANCELLED', 'FAILED')
LIMIT 1
```

If `product_id` is NULL (free-text product), skip duplicate check — MCRM handles it.

### Image Upload Failure
If an image fails to upload during Step 2, show an inline error on that image slot: "فشل رفع الصورة، حاول مرة أخرى". Do not block form submission — images are optional. The customer can remove the failed image and proceed.

### Submission Failure
If `POST /api/tickets` returns a server error, show a full-width error bar above the submit button:

> "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى أو التواصل معنا عبر واتساب."

WhatsApp link in the error message, pre-filled with the appropriate message for the request type.

---

## UX Rules Specific to the Service Portal

These differ from product browsing UX because the service portal is transactional and emotionally higher-stakes (the customer's product is broken or they want money back).

1. **No distractions.** The service request form (`/service/new`) has no product recommendations, no promotional banners, no cross-sells. Header is minimal — logo + account icon only.

2. **Show the form, not an explanation.** Do not front-load the page with policy text about what qualifies for maintenance vs replacement. Let the customer pick the type and fill the form. Policy clarification belongs in the FAQ on `/contact`.

3. **Progress indicator is visible at all times.** The 3-step indicator stays in the header of the form. The customer must always know where they are and how far they have to go.

4. **Inline validation, not submit-time errors.** Validate each field as the customer leaves it (on blur). Surface the error immediately. The submit button should almost never be the first time a customer learns a field is wrong.

5. **Pre-fill aggressively.** Phone from session, governorate from the customer's last order address if available. Every field that can be pre-filled should be — the customer is already frustrated.

6. **WhatsApp is always one tap away.** Every service page — list, detail, form — has a WhatsApp CTA visible without scrolling on mobile. This is the escape hatch. The pre-filled message changes per context:
   - On `/service/new`: `مرحباً، أريد فتح طلب [صيانة/استبدال/إرجاع] لمنتج [اسم المنتج]`
   - On `/service/:id`: `مرحباً، أريد الاستفسار عن طلبي رقم [#HVM-2024-0087]`
   - General: `مرحباً، أريد الاستفسار`

7. **Terminal states need a next action.** CLOSED and FAILED are dead ends. CLOSED shows a success message and a "تسوق مجدداً" link. FAILED shows a WhatsApp CTA with a pre-filled message referencing the ticket number.

8. **RTL layout is native, not retrofitted.** All timeline indicators flow right-to-left. The "current" indicator arrow points left. Form labels are right-aligned. No `text-align: left` overrides anywhere in this section.

9. **Ticket detail is read-only.** Customers cannot edit a submitted ticket. If they need to update information, they use WhatsApp. Do not add edit controls — it creates support confusion when the ticket is already being worked.

10. **No optimistic UI on ticket creation.** Wait for the server confirmation before redirecting to the ticket detail page. If the POST is slow, show a spinner on the submit button. A ticket that fails silently and never appears in MCRM is worse than a 2-second wait.

---

## WhatsApp Integration

Number: `01204444196`

URL format: `https://wa.me/201204444196?text={encodeURIComponent(message)}`

Pre-filled messages:

| Context | Pre-filled Arabic |
|---------|-------------------|
| New maintenance request | مرحباً، أريد فتح طلب صيانة لمنتج [اسم المنتج] |
| New replacement request | مرحباً، أريد فتح طلب استبدال لمنتج [اسم المنتج] |
| New return request | مرحباً، أريد إرجاع منتج [اسم المنتج] |
| Existing ticket inquiry | مرحباً، أريد الاستفسار عن طلبي رقم [#HVM-2024-0087] |
| General | مرحباً، أريد الاستفسار |

The WhatsApp FAB floats bottom-left (RTL: this is the secondary-action corner — WhatsApp sits here across the entire site, not just the service portal). It is always visible. It is not a replacement for the ticket system — it is the fallback and the human escalation path.

---

## API Routes

```
POST  /api/tickets               → Create ticket (JWT required)
GET   /api/tickets               → Customer's ticket list (JWT required)
                                   Query: ?type=HVM|HVR|HVT&page=1
GET   /api/tickets/:id           → Ticket detail + timeline (JWT required)
                                   Guard: contact_id must match JWT subject
```

No public ticket endpoints. No ticket lookup by phone without auth.

---

## Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| `ServiceRequestForm` | 3-step wizard, manages type/product/contact state, submits to `/api/tickets` |
| `TicketTimeline` | Renders state machine as vertical timeline; accepts ticket type + current state + history array |
| `StatusBadge` | Arabic state pill with color from the state-to-color table above |
| `TicketCard` | Summary row for `/service` list — ref, product, badge, date, detail link |
| `DuplicateTicketWarning` | Inline warning when open ticket detected; two action buttons |
| `ServiceTypeSelector` | Step 1 card grid; manages selected type, emits to parent |
| `ProductPicker` | Order history dropdown + free-text fallback; resolves product_id and transaction_id |
