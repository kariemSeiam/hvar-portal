# Bosta Orders Data Structure — Multi-Phone Diagnostic (2026-03-09)

## What I Ate

Bosta integration: converter, service, API flow. Tested with 7 phones (01003580830, 01226635140, 01201133753, 01224383359, 01050010662, 01024700105, 01210404848). Report: `.venom/work/bosta/BOSTA-DIAGNOSTIC-ALL-PHONES.json`.

## Why COD + Bosta Fees Were Zero (FIXED)

**Root cause:** Converter only read `wallet.cashCycle.cod` and `wallet.cashCycle.bosta_fees`. But:
- **Search endpoint**: No `wallet` at all. Has top-level `cod` (int, e.g. 1700). No `shipmentFees`.
- **Business endpoint**: `wallet.cashCycle` is `null`. Has top-level `cod` and `shipmentFees` (67).

**Fix applied:** Converter now falls back to `data.cod` and `data.shipmentFees` when wallet.cashCycle is missing or null. COD now populates from search. Bosta fees: search has no `shipmentFees`, so still 0 from search; business would have it.

---

## API Response Shape (GET /api/bosta/customer/{phone}/orders)

### 01090574426 — 1 order

```json
{
  "data": {
    "orders": [
      {
        "communication": { "attempts": 0, "calls": 0, "lastCall": null, "sms": 0 },
        "creationTimestamp": 1773019785960,
        "customer": {
          "name": "محمد جمال عبد الفتاح",
          "phone": "+201090574426",
          "secondPhone": "01126755762"
        },
        "customerAddress": {
          "city": "القاهره",
          "district": "حلوان",
          "fullAddress": "العنوان :محافظه القاهرة حلوان 15مايو مجاورة 9 ابراج المستثمرين برج 13 أمام المستعمرة",
          "zone": "حلوان"
        },
        "deliveryAttemptsLength": 0,
        "financial": { "bostaFees": 0.0, "cod": 0.0 },
        "package": {
          "description": "1 * كبه هفار 6.5 لتر 2000 وات 4 سرعات (5070+04)",
          "itemsCount": 1,
          "type": "Small"
        },
        "pickupAttemptsLength": 0,
        "proofImages": [],
        "returnAttemptsLength": 0,
        "star": {},
        "status": { "confirmed": false, "timeline": [] },
        "ticketCount": 0,
        "timestamps": {
          "collected": "",
          "collectedFromConsignee": "",
          "created": "Mon Mar 09 2026 01:29:45 GMT+0000",
          "scheduled": "",
          "updated": "Mon Mar 09 2026 01:29:47 GMT+0000"
        },
        "trackingNumber": "38080170",
        "type": "Send"
      }
    ],
    "totalOrders": 1,
    "types": ["Send"],
    "processedAt": "2025-10-12T00:00:00.000Z"
  }
}
```

### 01228013318 — 4 orders (all same structure)

| Key | Value |
|-----|-------|
| `trackingNumber` | 29719895, 67713593, 44799556, 77124604 |
| `financial.cod` | From top-level cod (1700 for 29719895) after converter fix |
| `financial.bostaFees` | 0 from search (no shipmentFees in search payload) |
| `type` | Send |
| `package.description` | varies per order |
| `timestamps.created` | Mon Mar 09 2026 01:22–01:23 |

---

## Data Keys (Unified Order)

| Key | Type | Source | Notes |
|-----|------|--------|-------|
| `trackingNumber` | string | Bosta | e.g. "29719895" |
| `type` | string | Bosta | "Send", "Return", etc. |
| `financial.cod` | number | wallet.cashCycle.cod or data.cod | Fallback to top-level cod |
| `financial.bostaFees` | number | wallet.cashCycle.bosta_fees or data.shipmentFees | Search has no shipmentFees |
| `customer` | object | receiver | name, phone, secondPhone |
| `customerAddress` | object | dropOffAddress/pickupAddress | city, zone, district, fullAddress |
| `package` | object | specs/returnSpecs | description, itemsCount, type |
| `status` | object | isConfirmedDelivery, timeline | confirmed, timeline[] |
| `timestamps` | object | createdAt, etc. | created, updated, collected, scheduled |
| `star` | object | star | name, phone (مندوب) |
| `communication` | object | callsNumber, etc. | attempts, calls, sms, lastCall |

---

## Bosta API Data Keys (Real vs Expected)

### Search endpoint (POST /deliveries/search) — 01228013318

| Key | Present | Value |
|-----|---------|-------|
| wallet | No | — |
| cod | Yes (top-level) | 1700 (int) |
| pricing | Yes | {} (empty) |
| shipmentFees | No | — |

### Business endpoint (GET /deliveries/business/{tracking})

| Key | Present | Value |
|-----|---------|-------|
| wallet | Yes | `{"cashCycle": null, ...}` |
| wallet.cashCycle | null | — |
| cod | Yes (top-level) | 1700 |
| shipmentFees | Yes | 67 |
| pricing | Yes | `{"insuranceFee": {...}}` |

### Converter logic (updated)

```python
# 1. Try wallet.cashCycle first
# 2. Fallback: data.cod (top-level) for COD
# 3. Fallback: data.shipmentFees for Bosta fees
# Search has cod, no shipmentFees → COD fixed, fees still 0 from search
```

---

## Remaining Gaps

| Data | Search | Business | Fix |
|------|--------|----------|-----|
| COD | Top-level `cod` | Top-level `cod` | Converter fallback — DONE |
| Bosta fees | Not in search | `shipmentFees` | Search has no fees. Options: (a) hybrid fetch business for visible orders, (b) ERP enrichment when order exists |

## Order Type Codes (bosta_converter)

| Code | Value | Address source |
|------|-------|----------------|
| 10 | Send | dropOffAddress |
| 20 | Return to Origin | dropOffAddress |
| 25 | Customer Return Pickup | pickupAddress |
| 30 | Exchange | dropOffAddress |

## Multi-Phone Diagnostic (7 Phones)

**Script:** `scripts/bosta_diagnostic_all_phones.py`  
**Report:** `.venom/work/bosta/BOSTA-DIAGNOSTIC-ALL-PHONES.json`

| Metric | Value |
|--------|-------|
| Search keys | 46 |
| Business keys | 66 |
| Keys only in business | 27 |
| Type codes seen | 10, 20, 25, 30 |
| Financial samples | 118 |

### Keys Only in Business (not in search)

`POSDelivery`, `POSReceiptNo`, `addedToRouteDate`, `assignedHub`, `deliveryAttemptsLength`, `finalDeliveryGeoLocation`, `firstHub`, `goodsInfo`, `insurancePlanInfo`, `isBostaBoxDelivery`, `isExternalFulfillmentOrder`, `lastChanceToDeliverDate`, `log`, `maskedState`, `nextWorkingDayAfterRescheduledAt`, `nextWorkingDayAfterScheduledAt`, `payWithBostaCredits`, `pickupAttemptsLength`, `returnAddress`, `returnAttemptsLength`, `returnSpecs`, `shipmentFees`, `starProofOfReturnedPackages`, `state_before`, `ticketCount`, `timeline`, `wallet`

### Keys Only in Search (not in business)

`confirmedDeliveryAt`, `isBostaFulfillmentOrder`, `isFulfillmentOrder`, `isOmnifulFulfillmentOrder`, `oldType`, `productInfo`, `type_before` (business has `state_before` instead)

### Converter Hardening (2026-03-09)

| Key / Path | Search | Business | Converter handling |
|------------|--------|----------|--------------------|
| cod | int (top-level) | int (top-level) | wallet.cashCycle.cod → data.cod |
| shipmentFees | — | float/int | wallet.cashCycle.bosta_fees → data.shipmentFees → pricing.deliveryFees |
| attemptsCount | int | int | Used for communication.attempts |
| numberOfAttempts | int | — | Fallback for attempts (search) |
| deliveryAttemptsLength | — | int | attemptsCount/numberOfAttempts fallback (search) |
| productInfo | list | — | Fallback for package.description (search) |
| goodsInfo | — | dict | Fallback for package.description + itemsCount (business) |
| confirmedDeliveryAt | str | — | Added to timestamps.confirmedDelivery |
| ticketCount | — | int | _safe_int |
| creationTimestamp | int | int | _safe_int |

### Diagnostic Scripts

- `scripts/bosta_diagnostic_all_phones.py` — Multi-phone key/type collection
