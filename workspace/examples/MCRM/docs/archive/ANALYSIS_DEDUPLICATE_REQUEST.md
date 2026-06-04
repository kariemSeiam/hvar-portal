# Deep Analysis: `deduplicateRequest` — Root Causes and Whether It Masks Errors

## TL;DR

- **What it does:** Shares in-flight requests and caches responses by `(url, params)` so identical concurrent or recent calls hit the network once.
- **Does it hide errors?** It does **not** hide HTTP/network errors (failed requests are removed from in-flight and not cached). It **can** hide the **fact** that duplicate calls are happening, so you don’t see “why are we calling this twice?” in the network tab.
- **Root causes of duplicates:** Multiple components/pages calling the same API with the same params (e.g. stock products/parts from several modals), one component calling the same API from several code paths (e.g. `getCustomerById` in multiple places in ServiceModalViewer), and effects that can fire multiple times (tab/filter change + debounce) before the first request finishes. There is **no React Strict Mode** in this app, so double-mount is not a cause.
- **Recommendation:** Keep deduplication as a safety net. Add **optional dev logging** when a request is deduplicated (in-flight or cache hit) so you can see when and where duplicates would have occurred. Then fix **call-site bugs** (unnecessary duplicate calls) where possible; do not remove deduplication before those fixes.

---

## 1. What `deduplicateRequest` Does

**File:** `front/src/utils/requestDeduplication.js`

- **Key:** `createCacheKey(url, params)` → `${url}?${JSON.stringify(sortedParams)}`.
- **In-flight:** If the same key is already in `inFlightRequests`, the existing **Promise** is returned (no second HTTP request).
- **Cache:** If `useCache` and not `forceRefresh`, a previous successful result for that key within `ttl` is returned (no HTTP request).
- **On success:** Result is cached (if `useCache`), then the key is removed from in-flight after 100 ms.
- **On error:** Key is removed from in-flight; cache is not updated. Next caller gets a **new** request.

So: **failed requests are not hidden**. Only **duplicate identical successful (or in-flight) calls** are merged.

---

## 2. Where It’s Used

| API module      | Functions wrapped |
|-----------------|-------------------|
| `ticketsAPI.js` | `listTickets`, `getTicket`, `listReplacements`, `listMaintenance`, `listReturns`, `listTicketsByServiceType`, `getTicketCounts` |
| `stockAPI.js`   | `getStockItems`, `getStockItemById`, `getStockMovements`, `getItems` |
| `customerAPI.js`| `getCustomerById`, `searchCustomers`, `listCustomers` |
| `hubAPI.js`     | `scanTracking`, `getWorkshopQueue`, `getPendingDispatchQueue` |

---

## 3. Root Causes of Duplicate Requests (Why Deduplication Exists)

### 3.1 Same API, same params, from multiple places (stock)

- **`getStockItems({ type: 'product', limit: 1000 })`** (and same for `type: 'part'`) is called from:
  - `ServiceActionConfirmationModal` (Promise.all products + parts)
  - `ServiceWorkflowActionModal` (multiple Promise.all in different branches)
  - `ItemsSelectionSection` (loadProducts + loadParts, and again in loadProductsAndParts)
  - `NewTicketsDemoPage` (Promise.all products + parts)
  - `ClassificationModal` (getStockItems for parts, getItems)
- **Cause:** Several modals/pages each fetch products/parts when they mount or when the user opens them. No shared data layer (e.g. React Query). Duplicates are **structural**: multiple consumers, same params.
- **Deduplication:** Merges concurrent identical calls; cache (e.g. 30s TTL) avoids repeat requests when opening another modal shortly after.

### 3.2 Same API from multiple code paths in one component (customer)

- **`getCustomerById(customerId)`** in **ServiceModalViewer** is used:
  - When loading customer for the ticket (priority 1: by `ticket.customer_id`)
  - In other branches (e.g. lines 372, 396, 617) for the same or related ticket.
- **`searchCustomers(phone, { type: 'phone' })`** is used when `customer_id` is missing or fails.
- **Cause:** One modal, but several code paths that can trigger the same request (e.g. same `ticket.customer_id`). Re-renders or multiple code paths can trigger the same call more than once.
- **Deduplication:** Same key → one request; others get the same promise/cache.

### 3.3 Tickets list: effect + debounce + many callers

- **ServiceActionsPage** calls **`listTickets(params)`** from:
  - A **useEffect** with 300 ms debounce when `activeStatus`, `activeSubTab`, filters, etc. change
  - `loadFilteredTickets`, `handleLoadMore`, `handleRefresh`, after confirmations, etc.
- **Component-level guard:** `isFetchingRef` + early return in `fetchTickets` to avoid overlapping fetches for the **same** logical action. Ref is reset when the previous fetch finishes.
- **Cause:** Tab/filter change can schedule a fetch; user or another effect can trigger another fetch with the **same** params before the first one completes. Ref helps when calls are sequential in one component; it doesn’t help if two effects or two code paths run almost at once. **listTickets** is also called from other places (e.g. `listTickets({ customer_id })` for “load existing customer tickets”).
- **Deduplication:** If two callers actually call `listTickets` with the **same** `params` (same key), only one HTTP request is made. So it fixes “same list request fired twice in a short window.”

### 3.4 Hub: scanTracking

- **scanTracking(trackingNumber)** is used from **ManualChangeModal** and **HubPage**.
- **Cause:** Same scan could theoretically be triggered from two UI entry points with the same number; or the same scan retriggered quickly.
- **Deduplication:** Same tracking number → one in-flight request.

### 3.5 No React Strict Mode

- **main.jsx** renders `<App />` without `<StrictMode>`.
- So **double-mount** (Strict Mode’s double-invocation of effects) is **not** a source of duplicates in this app. Any duplicates are from the call patterns above, not from Strict Mode.

---

## 4. Does Deduplication “Hide” Errors?

### It does **not** hide:

- **HTTP/API errors:** On failure, the promise rejects and the key is removed from in-flight. The next call does a new request. You still see and handle errors.
- **Backend bugs:** If the backend returns 200 with wrong data, that wrong data is cached; but the “error” is wrong data, not duplicate requests. Deduplication doesn’t create that.

### It **can** hide:

- **Observability:** You don’t see “two identical requests” in the network tab, because only one is sent. So you lose the signal that “we’re calling this API twice with the same params” and may not look for the duplicate call sites.
- **Logic bugs:** If the **correct** design is “this should only be called once from one place,” deduplication can make the app behave “ok” even when two places incorrectly call it. The bug (redundant call) is still there; you just don’t see duplicate network traffic.

So: **deduplicateRequest does not hide the error that “the request failed.”** It can hide the **symptom** that “we are issuing duplicate requests,” which can delay fixing the **cause** (architecture or effect/callback design).

---

## 5. Recommendations

### 5.1 Keep deduplication

- Removing it without fixing call sites would increase duplicate requests and load, and could surface race conditions (e.g. list overwritten by an older response). So **keep it** as a safety net.

### 5.2 Make duplicates visible in development

- In **requestDeduplication.js**, when we return an in-flight promise or cached data we call `logDedupeHit(cacheKey, 'inFlight'|'cache')` (enabled via `window.__DEDUPE_DEBUG__ = true` or `VITE_DEDUPE_DEBUG=true` in .env).
- Open DevTools → Console and look for `[dedupe hit] inFlight <key>` or `[dedupe hit] cache <key>`; use the key to trace which API and call sites are causing duplicate calls (e.g. “listTickets is deduped often when changing tabs” or “getStockItems is deduped when opening a second modal”).

### 5.3 Fix root causes where it’s clearly a bug

- **Stock:** Consider a small **shared cache/context** for “products and parts list” (or use React Query / TanStack Query) so that modals read from one source instead of each calling `getStockItems` on open. That reduces duplicates by design; deduplication remains for any remaining overlap.
- **ServiceActionsPage:** The existing `isFetchingRef` + debounce is good. Ensure `fetchTickets` is not called with the same params from two effects in the same tick (review effect deps and any “load on mount” + “load on filter change” overlap). Deduplication then only handles edge cases.
- **ServiceModalViewer:** Ensure you don’t call `getCustomerById(ticket.customer_id)` from multiple code paths without need (e.g. centralize “load customer for this ticket” in one place and reuse the result). Deduplication is still useful if the same modal re-opens or re-renders.

### 5.4 Optional: central data layer

- Longer term, a **data layer** (e.g. React Query) with keys like `['tickets', params]` and `['stock', type]` would make “same query” explicit and give request deduplication, caching, and invalidation in one place. Then you could rely less on a custom deduplication layer, but that’s a larger refactor.

---

## 6. Summary Table

| Question | Answer |
|----------|--------|
| Does deduplicateRequest hide HTTP/backend errors? | No. Errors are not cached; in-flight is cleared on failure. |
| Does it hide the fact that we’re making duplicate calls? | Yes. Only one request appears in the network tab for the same key. |
| Why do duplicates happen? | Multiple components/pages with same params (stock), multiple code paths (customer), effects + multiple triggers (tickets), no shared data layer. |
| Is React Strict Mode a cause? | No. Strict Mode is not used. |
| Should we remove deduplication? | No. Keep it; add dev logging to see when it triggers; fix call-site bugs where possible. |

---

*Document generated from codebase analysis. See `front/src/utils/requestDeduplication.js` and API modules under `front/src/api/`.*
