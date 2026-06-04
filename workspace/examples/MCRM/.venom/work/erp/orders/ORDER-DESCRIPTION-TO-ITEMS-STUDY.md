# order_description → Items Auto-Action Study

> Study only. No code changes. Design for dynamic, creative matching based on stock + ERP patterns.

---

## What I Ate

| Resource | Type | Scope |
|----------|------|-------|
| ERP draft-dt data | Live + archived | 50+ orders, shipping_details format |
| call_center_api, stock_api | Backend | _erp_row_to_order, stock model |
| callCenterAPI.js | Frontend | parseDescriptionText, matchItemsWithStock, autoMatchItems |
| OrderItemsEditor, CallSessionFAB | Frontend | وصف الطلب display, items block |
| stock_items schema | DB | sku, name, type, price_customer |
| ERP-50-ORDERS-KEYS-MAPPING.md | Report | Full key mapping |

---

## 1. ERP Data in Call Center

### Keys We Use (Backend → Frontend)

| ERP Key | Our Key | Where Used |
|---------|---------|------------|
| invoice_no | erp_order_id | order_number |
| mobile | customer_phone | customer.phone |
| contact_name_text | customer_name | customer.name |
| shipping_address | delivery_address | address_full |
| shipping_state | governorate | address_governorate |
| shipping_city | city | address_city |
| **shipping_details** | **order_description** | وصف الطلب, autoMatchItems, confirm |
| final_total (parsed) | cod_amount | cod_amount |

### All 30 ERP Keys (Available per Row)

`invoice_no`, `transaction_date`, `contact_id`, `contact_name`, `contact_name_text`, `mobile`, `supplier_business_name`, `business_location`, `is_direct_sale`, `sub_status`, `commission_agent_name`, `commission_agent`, `shipping_state`, `shipping_city`, `shipping_address`, `shipping_details`, `final_total`, `coupon_code`, `total_items`, `total_quantity`, `added_by`, `is_export`, `postpone_button`, `postponed_days`, `postponed_at`, `postponed_to`, `postponed_status`, `marketing_source`, `action`, `DT_RowAttr`

---

## 2. order_description — Format Analysis

### Observed Patterns (from 50+ ERP drafts)

| Pattern | Example | Regex Today? |
|---------|---------|--------------|
| `Qty * Name (SKU)` | `1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)` | ✅ Partial |
| `Qty * Name (SKU)` | `1 * هاند بلندر هفار 1500 وات 4*1 (5057)` | ✅ Partial |
| `Qty * Name (SKU)` | `1 * مضرب بيض 500 وات (1101)` | ✅ |
| `Qty * Name (SKU)` | `1 * كبه هفار 2000 وات اسود b (5070+b)` | ❌ SKU `5070+b` |
| `Name * Qty` (reversed) | `كبه هفار  6.5 لتر 2000 وات  اسود -نيو  *1` | ❌ No parens |
| Multi-item same line | `1 * كبه (5070+04) 1 * هاند (5057)` | ❌ Only first |
| Pipe separator | `خلاط هفار 8000 وات 2*1  *1 \| كبه هفار 1000 وات تربو  أبيض  *1` | ❌ |
| `Qty * Name (SKU)` | `2 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)` | ✅ |

### SKU Format in ERP

| SKU in ERP | Current parse captures | Stock match |
|------------|------------------------|-------------|
| `5070+b` | `5070` (regex `(\d+)` only) | ❌ Wrong |
| `5070+04` | `5070` | ❌ Wrong |
| `5057` | `5057` | ✅ |
| `1101`, `1104` | `1101`, `1104` | ✅ |
| `7720`, `10011` | `7720`, `10011` | ✅ |

### Current parseDescriptionText Regex

```js
/(\d+)\s*\*\s*(.+?)\s*\((\d+)\)/
```

**Gaps:**
- SKU: `(\d+)` only — misses `+b`, `+04`, letters
- Single line: `\n` split — multi-item on one line fails
- Reversed format: no `(SKU)` in pattern
- Pipe `|` separator: not handled

---

## 3. Stock Structure

### stock_items Schema

| Column | Type | Notes |
|--------|------|-------|
| id | INT | PK |
| sku | VARCHAR | Unique, e.g. "5070+b", "5070+04", "5057" |
| name | VARCHAR | Arabic product name |
| type | ENUM | 'part', 'product' |
| quantity_on_hand | INT | |
| price_customer | DECIMAL | |
| price_merchant | DECIMAL | |
| active | BOOL | Soft delete |

### API

- `GET /api/stock/items` — all active items (type=product|part optional)
- No search param — autoMatchItems loads full list
- `get_stock_item_by_sku(sku)` — exact match

### Stock Seed (from Excel)

- Parts: `stock_قطع_*.xlsx` → type=part
- Products: `stock_منتجات_*.xlsx` → type=product
- SKUs in stock must align with ERP SKU format for matching

---

## 4. Current Auto-Match Flow

```
order_description (text)
    → parseDescriptionText(desc)  [regex: qty, name, sku]
    → matchItemsWithStock(parsed, stockItems)
        [match by: si.sku === item.sku]
    → { items, match_summary }
```

**Called from:**
- CallSessionFAB: on mount, autoMatchItems(orderId, order.order_description)
- CallSessionPage: getOrderItems → autoMatchItems
- getOrderItems: confirmation_snapshot else autoMatchItems

---

## 5. Auto-Action Design (Dynamic, No Code Yet)

### 5.1 Parse Patterns (Config-Driven)

Extract from observed samples:

| Pattern ID | Regex | Priority | Notes |
|------------|-------|----------|-------|
| P1 | `(\d+)\s*\*\s*(.+?)\s*\(([^)]+)\)` | 1 | SKU = `[^)]+` (any chars in parens) |
| P2 | `(.+?)\s*\*\s*(\d+)\s*$` | 2 | Reversed: name * qty, no SKU |
| P3 | Split by ` | ` or `  ` (double space) | 3 | Multi-item lines |
| P4 | Split by `\d+\s*\*\s*` lookahead | 4 | "1 * item1 1 * item2" on same line |

### 5.2 SKU Normalization

| ERP SKU | Normalized | Stock lookup |
|---------|------------|--------------|
| `5070+b` | `5070+b`, `5070B` | Try both |
| `5070+04` | `5070+04`, `507004` | Try both |
| `5057` | `5057` | Exact |
| `1104` | `1104` | Exact |

### 5.3 Match Strategy (Tiered)

1. **Exact SKU** — stock.sku === parsed.sku
2. **Normalized SKU** — try variants (5070+b → 5070B)
3. **SKU prefix** — `5070` matches `5070+b` or `5070+04` if only one
4. **Name contains** — if SKU fails: stock.name includes parsed.name (Arabic substring)
5. **Fuzzy name** — token overlap: "كبه هفار" in stock.name

### 5.4 Output Shape

```js
{
  items: [
    { item_id: 123, sku: "5070+04", name: "...", order_quantity: 1, match_status: "exact" },
    { item_id: null, sku: "???", name: "مضرب بيض 500 وات", order_quantity: 1, match_status: "not_found", suggestions: [...] }
  ],
  match_summary: { total, matched, not_found, confidence: 0.85 }
}
```

### 5.5 Stock Index for Matching

- **Products only** for sell orders (type=product)
- Build SKU→item map + name→items map (for fuzzy)
- Optional: cache in session or localStorage for call session

---

## 6. Risks / Gaps

| Risk | Mitigation |
|------|------------|
| SKU format drift (ERP vs stock) | Normalization rules + alias table |
| New product in ERP, not in stock | Return not_found + suggestions from name |
| Ambiguous match (5070 prefix → 2 products) | Return both, let agent pick |
| Performance: full stock load | Add `?type=product` to reduce; later: search endpoint |

---

## 7. Hot Paths

| Path | File | What |
|------|------|------|
| Parse | callCenterAPI.js | parseDescriptionText |
| Match | callCenterAPI.js | matchItemsWithStock |
| Stock fetch | callCenterAPI.js | GET /api/stock/items |
| Display | CallSessionFAB | وصف الطلب; OrderItemsEditor items |
| Confirm | CallSessionFAB | confirmation_snapshot with items |

---

## 8. Full Analysis Results (Live ERP + Stock)

**Source:** `scripts/erp_and_stock_full_analysis.py` — 146 ERP drafts, 355 stock items

| Metric | Value |
|--------|-------|
| ERP drafts | 146 |
| Stock products | 42 |
| Stock parts | 313 |
| ERP SKUs with exact stock match | 11/11 (100%) |
| Parse: with_sku | 129 |
| Parse: no_sku (reversed) | 4 |

**ERP SKUs in use:** 5070+04 (64), 5057 (16), 7720 (16), 10011 (13), 1101 (10), 1104 (7), 5062 (7), 1115 (4), 5027 (2), 10002 (1), 5070+b (1)

**No-SKU samples (name match needed):**
- `كبه هفار  6.5 لتر 2000 وات  اسود -نيو  *1` → stock 5070 (كبه هفار 6.5 لتر 2000 وات اسود -نيو)
- `خلاط هفار 8000 وات 2*1  *1` → stock 5062
- `مكواه بخار هفار 2800 وات بخزان 250 مل  *1` → stock 1115 (مكواه 2800 هفار New)

---

## 9. Recommended Next Step

1. **Parse fix** — SKU regex: `\(([^)]+)\)` to capture `5070+b`, `5070+04`
2. **Multi-item line** — split by `\s+\d+\s*\*\s*` or regex global match
3. **Reversed format** — add pattern for `name * qty` (no SKU) → match by name (Arabic substring)
4. **Stock filter** — `?type=product` for sell orders
5. **Name fallback** — when no SKU: normalize name (strip, collapse spaces), find stock where name contains tokens

---

## 10. Multi-Item Same Line

Format: `1 * item1 (SKU1) 1 * item2 (SKU2)` — no separator. Use **regex findall** for `(\d+)\s*\*\s*(.+?)\s*\(([^)]+)\)` (global) instead of split-then-match. Non-greedy `.+?` stops at first `(` so each match is one item.

---

## 11. Creative / Dynamic Options

- **Parse pattern registry** — add patterns as new ERP formats appear, no schema change
- **SKU alias table** — `erp_sku → stock_sku` for manual overrides
- **Confidence scoring** — exact=1, prefix=0.8, name=0.5; show low-confidence as "suggested"
- **Learn from confirm** — when agent picks item from suggestions, store in alias for next time
