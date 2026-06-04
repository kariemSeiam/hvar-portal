# Call Center Date Filter — Eat + Fix

## What I Ate

**Resource:** Call center date filtering logic (CustomerServicePage, listOrders API, order model)
**Scope:** Frontend fetchOrders params, backend list_orders, _build_date_where, get_orders_counts_by_status

---

## Structure

```
CustomerServicePage
├── selectedDate (from day chip click) → used in fetchOrders
├── activeTab (الكل, جديدة, مجدولة, ...)
└── fetchOrders → listOrders(params)
    ├── isNewTab (activeTab === 'new') → params.date, params.start_date
    └── else → params.all_dates = true

listOrders (frontend)
├── all_dates → no date filter
└── else → date_from = date_to = params.date || params.start_date

Backend list_orders
├── all_dates → date_from = date_to = None (no filter)
└── else → _build_date_where(date_from, date_to, today)
```

---

## Key Finding: The Bug

**Day chips are visible on ALL order tabs** (الكل, جديدة, مجدولة, etc.) but **date filter only applies on "جديدة" (new) tab**.

When user is on **"الكل" (all)** tab:
- `params.all_dates = true` → backend ignores date
- Table shows ALL orders regardless of which day chip is selected
- User clicks Monday (9/3) or Tuesday (10/3) → **same 143 orders** (all with ١٠/٣/٢٠٢٦)
- Day chips appear to do nothing

**User complaint:** "both dates have date on table same of today" = clicking Monday or Tuesday shows the same orders, all with today's date.

---

## Root Cause

```javascript
// CustomerServicePage.jsx fetchOrders
if (isNewTab) {
  params.date = dateStr ?? todayStr;
  params.start_date = dateStr ?? todayStr;
} else {
  params.all_dates = true;  // ← BUG: ignores selectedDate for الكل, مجدولة, etc.
}
```

---

## Fix

Apply date filter for **all order tabs** when a day is selected. Day chips should filter the table regardless of tab.

**Change:** Use date filter whenever we have selectedDate (and we're on an order tab). Remove the `all_dates` path for order tabs.

---

## Risks

- **الكل tab with date filter:** Will show fewer orders (only that day). This is correct UX — user expects day chip to filter.
- **Counts:** orderCounts for الكل tab currently uses getOrderCounts(null) = all-time. May need to scope counts by date when date is selected. (Lower priority — fix table first.)

---

## Hot Paths

1. `fetchOrders` → `listOrders(params)` — add date to params for all tabs
2. Backend already supports date_from/date_to — no change needed
3. Day chip click → `handleDateChange` → `setSelectedDate` → `fetchOrders` re-runs — will now work

---

## Recommended Next Step

Apply the fix: use date filter for all order tabs when selectedDate is set.
