# Stock Filters & Bars — Architecture & Creative Design

> Eaten: backend stock API, frontend stock pages (Products, Parts, Movements), current filter/toolbar patterns.  
> Goal: best REST alignment, full backend↔frontend integration, **creative** bar design (no “everything is a dropdown”).

---

## 1. Backend — What the API Actually Supports

### GET `/api/stock/items`

| Param        | Type   | Supported | Notes                                      |
|-------------|--------|-----------|--------------------------------------------|
| `type`      | string | ✅        | `part` \| `product`                        |
| `offset`    | int    | ✅        | Pagination                                 |
| `active_only` | bool | ✅        | Default true (hides deleted)               |
| `limit`     | int    | ❌ ignored | Backend comment: "limit is ignored, all items returned" |
| **search** | —      | ❌        | Not implemented                            |
| **category** | —     | ❌        | `stock_items` has no category column       |
| **part_type** | —    | ❌        | `stock_items` has no part_type column      |

So: **items list is type + active_only + offset only.** Any search or “category”/“part type” is client-side today (filter in memory after fetch).

### GET `/api/stock/movements`

| Param             | Type   | Supported | Notes |
|-------------------|--------|-----------|--------|
| `item_id`         | int    | ✅        | Single item |
| `movement_type`   | string | ✅        | Single or comma-separated (SEND, RECEIVE, MANUAL, RESERVE) |
| `reference_type`  | string | ✅        | service_ticket, manual_adjustment |
| `reference_id`    | int    | ✅        | |
| `created_by`      | string | ✅        | |
| `condition`       | string | ✅        | valid \| damaged |
| `item_type`       | string | ✅        | product \| part |
| `service_type`    | string | ✅        | replacement, maintenance, return (single or comma) |
| `start_date`      | date   | ✅        | YYYY-MM-DD |
| `end_date`        | date   | ✅        | YYYY-MM-DD |
| `limit` / `offset`| int    | ✅        | Max 100 per page |
| `order_by`        | string | ✅        | id, created_at, movement_type, quantity |
| `order_direction` | string | ✅        | ASC, DESC |

Movements API is **rich and server-side**: all main filters are supported. Frontend can drive them directly.

### Other stock endpoints (reference)

- `POST /api/stock/items` — create item  
- `GET/PUT/DELETE /api/stock/items/<id>` — get/update/delete  
- `POST /api/stock/items/<id>/adjust` — quantity delta  
- `POST /api/stock/manual` — manual adjustment by SKU  
- `POST/DELETE /api/stock/items/<id>/components` — product components  
- `GET /api/stock/export?item_type=` — Excel export (product \| part)  

---

## 2. Frontend — Current State per Tab

### Products tab (`StockProducts.jsx`)

- **Search:** single input, client-side filter on name/SKU (debounced).  
- **Status:** chips (الكل، متوفر، منخفض، نفد) — **not dropdowns.**  
- **Actions:** Export (Excel), Add product.  
- **Data source:** Page state → `stockAPI.getProducts(params)`. Params sent: `type=product`, `page`, `limit`; `category` and `search` are **not** sent to API (filtering is client-side).

### Parts tab (`StockParts.jsx`)

- Same pattern: search (client), status chips, Export, Add part.  
- API: `stockAPI.getParts(params)` — only `type=part` + pagination; no backend search or part_type.

### Movements tab (`StockMovements.jsx`)

- **Data source:** **`useHub()`** — component does **not** use props from `StockManagementPage` (ignores `movements`, `pagination`, `onRefresh`). So Movements tab has its own state in hub context.  
- **Search:** client-side on item name / SKU / notes.  
- **Filters (server-side):** movement type chips, item type chips (منتجات/قطع), condition chips (سليم/تالف), **one date dropdown** (presets + custom range), export, clear.  
- **Service type:** backend supports it; UI has `serviceTypeOptions` but **service type chips are not rendered** in the current toolbar (only movement type, item type, condition, date).  
- **Date:** single dropdown with presets (الكل، اليوم، أمس، هذا الأسبوع، …، مخصص) — only “dropdown” left; rest are chips.

---

## 3. Gaps & Risks

| Gap | Impact | Recommendation |
|-----|--------|-----------------|
| **Items API has no search** | With many items, all are loaded then filtered in browser. | Add optional `q` or `search` (name/SKU ILIKE) on GET `/api/stock/items` and use it from Products/Parts bars. |
| **Items API has no category / part_type** | Frontend `globalFilters.category` / `partType` are never sent to backend. | Either add columns + API params later, or remove from page-level “global” filters so one source of truth. |
| **StockMovements uses useHub(), page passes props** | Movements tab state lives in hub; page’s `stockMovements` / `loadStockMovements` / `pagination.movements` are unused by the tab. | Unify: either Movements takes props from page (and page owns data), or document that Movements is hub-scoped and page does not control it. |
| **Service type filter missing in Movements toolbar** | Backend supports `service_type`; UI has options but no chips. | Add service-type chips to Movements bar when you want to filter by استبدال/صيانة/إرجاع. |
| **Single date dropdown on Movements** | Only remaining “classic” dropdown. | Replace with creative pattern: e.g. preset chips (اليوم، أمس، 7 أيام، الشهر، مخصص) + inline date range when “مخصص” (no dropdown). |

---

## 4. Creative Bar Design — “Rest Elements After the Search Bar”

Principle: **one search bar, then everything else is chips / inline controls / clear actions.** No generic dropdown rows.

### Shared bar structure (all three tabs)

1. **Search** — one rounded-full input, RTL, same height (h-11 sm:h-12), placeholder by tab.  
2. **Context filters** — chips only (toggle multi-select where backend allows).  
3. **One primary action** — Export (green, same style).  
4. **Secondary action** — Add (products/parts) or “مسح” (movements when filters active).  
5. **Optional:** small “active filters” strip (tags with ×) when more than one filter is on.

### Products bar (after search)

- **Status:** الكل | متوفر | منخفض | نفد — chips (already done).  
- **Export** — button.  
- **Add product** — button.  
- No dropdowns.  
- Optional: when backend gets search, add “نتائج البحث: N” strip and “مسح البحث” as now.

### Parts bar (after search)

- **Status:** same chip set (الكل، متوفر، منخفض، نفد).  
- **Export**, **Add part**.  
- If later you add `part_type` to backend: **Part type** as chips (محرك، مكون، …), not a dropdown.

### Movements bar (after search)

- **Movement type:** الكل | إرسال | استلام | تعديل يدوي | حجز — chips (already).  
- **Item type:** الكل | منتجات | قطع — chips (already).  
- **Condition:** الكل | سليم | تالف — chips (already).  
- **Service type (new):** الكل | استبدال | صيانة | إرجاع — chips; send `service_type` in API when selected.  
- **Date:** replace dropdown with:  
  - **Preset chips:** اليوم | أمس | آخر 7 أيام | هذا الشهر | الشهر الماضي | مخصص.  
  - When “مخصص” is selected: show **inline** two date inputs (من / إلى) in the bar or directly under it (no popover/dropdown).  
- **Export**, **مسح** when any filter active.

So: **no dropdowns** — date becomes chips + optional inline range.

### Visual consistency

- Same 8pt grid, gap-3, h-11 sm:h-12 for controls.  
- Chips: same active state (brand-blue fill + ring), same inactive (stone border + hover).  
- Export: accent-green, same across tabs.  
- RTL and font-cairo everywhere; respect `prefers-reduced-motion`.

---

## 5. REST Alignment — Summary

| Area | Current | Target |
|------|---------|--------|
| **Items list** | type + offset only; search/category client-side | Add `q` (search) on GET `/api/stock/items`; use it from Products/Parts. Optionally later: category/part_type if schema added. |
| **Movements list** | Full server-side filters used by frontend | Keep; add service_type chips and pass through. |
| **Pagination** | Items: limit ignored (all returned). Movements: offset/limit + has_more. | Items: either enforce limit+offset and document, or add search so client doesn’t need to load all. |
| **Data ownership** | Movements from useHub(); page props ignored | Either Movements from page props (single source of truth) or document hub as owner for Movements tab. |

---

## 6. Implementation Priorities

1. **Unify Movements data source** — Decide: page-owned (props) or hub-owned; then remove the other so one source of truth and correct pagination/refresh.  
2. **Movements bar** — Add service_type chips; replace date dropdown with preset chips + inline “مخصص” range.  
3. **Backend: optional search for GET /api/stock/items** — e.g. `q` for name/SKU; then Products/Parts send `search`/`q` and avoid loading full list when searching.  
4. **Shared StockBar or filter strip component** — Optional: one component that takes `tabId`, `searchValue`, `onSearch`, `filterChipsConfig`, `primaryAction`, `secondaryAction` to keep all three tabs visually and behaviorally aligned.  
5. **Remove or use globalFilters** — Page-level `globalFilters.category` / `partType` either get backend support or are removed so filters live only inside each tab and match API.

---

## 7. File Reference

| File | Role |
|------|------|
| `app/api/stock_api.py` | All stock endpoints; list_items (type, offset, active_only); list_movements (full filters). |
| `app/models/stock.py` | get_stock_items_by_type (no search); get_stock_movements + count (full filters). |
| `front/src/api/stockAPI.js` | getStockItems, getProducts, getParts, getStockMovements, exportStockItems; transforms. |
| `front/src/pages/StockManagementPage.jsx` | Tabs, global state for products/parts/movements, passes props to StockMovements (which ignores them if using useHub). |
| `front/src/components/stock/StockProducts.jsx` | Products bar: search + status chips + export + add; client-side filter/sort. |
| `front/src/components/stock/StockParts.jsx` | Parts bar: same pattern. |
| `front/src/components/stock/StockMovements.jsx` | Movements bar: useHub(); search + movement/item/condition chips + date dropdown + export + clear; add service_type chips and replace date with chips + inline range. |
| `front/src/components/stock/StockSearchBar.jsx` | Reusable search+status+export bar; used or replaceable by inline bars in each tab. |

---

*Eaten and structured for full backend↔frontend alignment and creative, dropdown-free filter bars across all stock pages.*
