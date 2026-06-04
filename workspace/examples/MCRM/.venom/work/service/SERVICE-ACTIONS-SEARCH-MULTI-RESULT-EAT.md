# Eat: Service Actions Search — Multi-Result UX

> **Date:** 2026-03-08  
> **Scope:** Search on Service Actions page (external/Bosta mode). Goal: creative UI/UX when **more than one result** (customer or order). No code changes — read everything, test endpoints in mind, think.

---

## 1. Anatomy (What Exists)

### Entry point
- **Page:** `ServiceActionsPage.jsx` (`/services`)
- **Modes:** **Internal** (table search: tickets, customer, tracking, phone) | **External** (Bosta: phone or tracking)
- **External search flow:** Search bar → `handleSearch` → `searchCustomers(searchQuery)` from `useHub()` → API → `customerData` + `customerOrders` → `BostaSearchResultScreen`

### Frontend chain (external only)
| Layer | File | Role |
|-------|------|------|
| Context | `hub.js` | `useHub()`: `searchCustomers(query)`, `customerData`, `customerOrders`, `isSearching`, `clearCustomerSearch` |
| API | `hub.js` (inline) + `customerAPI.js` | GET `/api/customers/search?q=...&type=phone|tracking` → returns `response.data` (array or error) |
| Hook | `useServiceCreation.js` | Consumes hub state; `selectedOrder`, `selectedActionType`, `availableOrders`, create flow |
| UI | `BostaSearchResultScreen` | Two panels: **BostaIdentityPanel** (one customer) + **BostaContentPanel** (orders grid + tickets tab) |
| Orders grid | `BostaOrdersGrid.jsx` | Renders `customerOrders[]`; one **selectedOrder** via `onOrderSelect`; cards show locked (تذكرة) vs selectable |

### Backend chain
| Endpoint | File | Behavior |
|----------|------|----------|
| GET `/api/customers/search?q=&type=&limit=20&offset=0` | `app/api/customer_api.py::search_customers_endpoint` | 1) Local DB search → `customer_model.search_customers(query, limit, offset)` → **returns list** (0..N). 2) If empty and type=phone/tracking → Bosta sync → `jsonify([synced_customer])`. 3) Errors → `jsonify({"error": "..."})` |
| Model | `app/models/customer.py::search_customers` | LIKE on name, phone, phone_secondary; **limit 20**. Can return **multiple rows** (e.g. name "أحمد", or duplicate phone entries). |
| Bosta | `app/services/bosta_service.py` | `sync_customer_data(phone)` → one customer created/updated; orders attached. No multi-customer from Bosta path. |

### Other endpoints (for completeness)
- **GET `/api/bosta/customer/<phone>/orders`** — used by call center (callCenterAPI.js); not used by Service Actions external search.
- **POST `/api/bosta/search`** — phone/name/tracking, returns deliveries; **not used** by Service Actions; they go through customer search only.

---

## 2. Current Behavior (Multi-Result)

### When backend returns **multiple customers**
- **Backend:** `jsonify(customers)` → array of customer objects, each with `id`, `name`, `phone`, `bosta_orders`, etc.
- **Frontend (hub.js):**  
  `if (result.data && result.data.length > 0) { const fetchedCustomer = result.data[0]; setCustomerData(fetchedCustomer); setCustomerOrders(fetchedCustomer.bosta_orders || []); }`  
  → **Only first customer is used.** No UI to choose.
- **Toast:** "تم العثور على X طلب للعميل {name}" — shows first customer’s name and order count.

### When one customer has **multiple orders**
- **Already supported.** `customerOrders` is an array; `BostaOrdersGrid` renders all; user clicks one → `onOrderSelect(order)` → `selectedOrder`; then action type → create ticket. Selection is clear (border, ring). Locked orders (existing ticket) are non-clickable.

### When **no** results
- `customerData = null`, `customerOrders = []` → BostaSearchResultScreen shows "عميل جديد" + NewCustomerForm; user can create customer then re-search.

---

## 3. Endpoint Contract (Verified)

| Scenario | Backend returns | Frontend today |
|----------|-----------------|----------------|
| Local DB: 0 matches, type=phone | Bosta sync → `[synced_customer]` or `[]` | [0] or empty state |
| Local DB: 0 matches, type=tracking | Bosta sync via order’s phone → `[synced_customer]` or 404/[] | [0] or error |
| Local DB: 1 match | `[customer]` | [0] ✓ |
| Local DB: N matches (name/phone LIKE) | `[c1, c2, ...]` (up to limit 20) | **Only [0]** — rest ignored |
| Error (Bosta fail, etc.) | `{"error": "..."}` | result.success false → toast.error |

So the **only gap** is: **multiple customers** — no way to see or select among them.

---

## 4. Logic Summary

- **Search type detection (frontend):** `detectSearchType(query)` → `"phone"` (if looks like phone), `"tracking"` (6+ alphanumeric), else `null` (general).
- **Normalization:** Phone → `normalizeEgyptPhone` to `01XXXXXXXXX` before sending.
- **Backend:** Phone normalized in model; name search is raw LIKE `%query%` on name/phone/phone_secondary.
- **Bosta orders:** Stored per customer in `customers.bosta_orders` (JSON), filled by sync. One customer → one set of orders; selection is **order-level** in UI already.

---

## 5. Creative UX Thinking (Multi-Result Selection)

### Goal
When search returns **more than one customer**, the user should be able to **see and choose** which customer (and then, as today, which order and action type). The experience should feel solid, RTL-friendly, and on-brand (Bosta/identity panel, cards, design tokens).

### Option A — **Customer picker step before current screen**
- After search, if `result.data.length > 1`: show an **intermediate “اختر العميل”** step.
- List/grid of **customer cards** (avatar, name, phone, order count, maybe governorate). One selected → set as `customerData` → then current two-panel (identity + orders) as today.
- Pros: Clear separation: “who?” then “which order?”. Cons: Extra click; need space for N cards (pagination or scroll if many).

### Option B — **Inline customer switcher in identity panel**
- Keep two-panel layout. If multiple customers: in **BostaIdentityPanel** show a compact **carousel or dropdown** (“X عملاء” / “العميل 1 من N”) to switch `customerData`; content panel updates (orders + tickets) for selected customer.
- Pros: No extra full-screen step; stays in context. Cons: Switcher can be cramped on small screens; need to design so it’s obvious there are more than one.

### Option C — **Unified “results” list: customers + orders in one scroll**
- One list: first block “عملاء” (customer rows), then “طلبات” (orders). Selecting a customer expands/filters to their orders; or selecting an order implies its customer. Less like “pick customer then pick order” and more like “pick the row that represents who/what you want.”
- Pros: Single scroll, flexible. Cons: Mixed semantics (customer vs order); could confuse “هل أختار عميل أم طلب؟”

### Option D — **Bottom sheet / modal “نتائج البحث”**
- When `result.data.length > 1`, open a **modal or bottom sheet** titled “نتائج البحث (N)” with customer cards; tap one → close sheet, set customer, show current two-panel.
- Pros: Focused, doesn’t reshape the whole page. Cons: Modal can feel heavy; need clear close/back.

### Recommendation (direction)
- **Prefer A or D:** Explicit “choose customer” moment when N > 1, then keep existing “choose order → choose action type” flow. Matches mental model: one customer → many orders → one order → one action.
- **Design details to align:** Same card language as BostaOrdersGrid (accent strip, icon, status/count, RTL); use design tokens; ensure “لا نتائج” and “عميل واحد” don’t show the picker. Consider **A** if the list is often short (e.g. ≤5); **D** if you want to avoid layout shift and keep the rest of the page stable.

---

## 6. What to Test (When You Implement)

1. **Backend:** Call `GET /api/customers/search?q=أحمد&type=` (or a name that matches 2+ rows) → confirm response is array of 2+ customers with `bosta_orders` each.
2. **Backend:** Call with `q=01XXXXXXXXX` (one phone) → usually 1 or 0; after Bosta sync, 1.
3. **Frontend:** Today, any N > 1: only first is used; toast shows first customer’s name.
4. **After UX change:** When N > 1, picker is shown; selecting customer N sets identity + orders; selecting order and creating ticket uses selected customer id/phone.

---

## 7. Files to Touch (When You Code)

| Area | File(s) | Change |
|------|---------|--------|
| State | `hub.js` | When `result.data.length > 1`, either set a “candidates” state and leave `customerData` null until selection, or set `customerData = result.data[0]` and add `customerCandidates = result.data` for picker. |
| Picker UI | New component or section in `BostaSearchResultScreen` | “اختر العميل” list/sheet when `customerCandidates?.length > 1`. On select: set `customerData`, clear candidates (or keep for switch). |
| Hook | `useServiceCreation.js` | If you add `customerCandidates`, may need to pass through or derive “has multiple customers” for showing picker. |
| API | No backend change for “multiple” — backend already returns array. | Optional: add `?limit=5` for picker to avoid huge lists. |

---

**Eat complete.** Logic, endpoints, and current behavior are mapped. Multi-result gap is **multiple customers only**; order selection is already solid. Creative direction: explicit customer picker (A or D), then keep existing order + action flow.

---

## 8. Implementation (2026-03-08)

**Done.** Full workflow implemented:

- **hub.js:** `customerCandidates` state; when search returns 2+ → set candidates, toast "تم العثور على N عملاء — اختر العميل". `selectCustomerFromCandidates(customer)`, `clearCustomerCandidates()`. `clearCustomerSearch` clears candidates.
- **useServiceCreation.js:** Exposes `customerCandidates`, `selectCustomerFromCandidates`, `clearCustomerCandidates` from useHub.
- **ServiceActionsPage.jsx — inline dropdown (no modal):** When `searchMode === 'external' && customerCandidates?.length > 1`, an **inline results panel** appears **directly under the search bar** (same width, `absolute top-full`). Max **5 items** shown; header "اختر العميل" + "(عرض 5 من N)" if more than 5; compact rows (red strip + name + phone + "X طلب"); X button to dismiss. On row click → `selectCustomerFromCandidates(customer)`. Panel uses `rounded-2xl`, `border-2`, `shadow-xl` to match search bar. CustomerPickerModal removed and file deleted.
