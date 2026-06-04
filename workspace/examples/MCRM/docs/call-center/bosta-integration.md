# Bosta Integration

> External shipping API. Searchable by phone. Source of customer + order data.
> Files: `app/api/bosta_api.py` · `app/services/bosta_service.py` · `app/utils/bosta_converter.py` · `app/utils/phone_normalizer.py`

---

## 4 Order Types

| Code | Name | Arabic | Direction | Address Source | Description Source |
|------|------|--------|-----------|----------------|-------------------|
| 10 | SEND | إرسال | Business → Customer | `dropOffAddress` | `specs.packageDetails` |
| 20 | RETURN TO ORIGIN | إرجاع للمصدر | Customer → Business | `dropOffAddress` | `specs.packageDetails` |
| 25 | CUSTOMER RETURN PICKUP | استرجاع العميل | Customer → Business (pickup) | `pickupAddress` | `returnSpecs.packageDetails` |
| 30 | EXCHANGE | استبدال | Both ways | `dropOffAddress` | `specs.packageDetails` |

⚠️ **Type 25 is different**: address comes from `pickupAddress`, description from `returnSpecs` (not `specs`).

---

## Phone Normalization

All searches normalized to `01XXXXXXXXX` before any lookup.

```
+201234567890  → strip → 201234567890 → remove 20 → 01234567890 ✓
201234567890   → same
01234567890    → already correct
1234567890     → add 0 → 01234567890 ✓
```

Validates: `/^01[0-9]{9}$/`
Code: `app/utils/phone_normalizer.py` → `normalize_to_local_phone(phone)`

---

## Search Flow

```
Agent inputs phone
  → normalize_to_local_phone()
  → SELECT * FROM customers WHERE phone = '01...'
      FOUND → return customer + bosta_orders JSON
      NOT FOUND → POST /api/bosta/search { mobilePhones: [...] }
          FOUND → convert → upsert customer → return
          NOT FOUND → "Customer not found" → prompt create
```

---

## Unified Order Format

All 4 Bosta types convert to this shape:

```javascript
{
  type: "SEND",                    // Human-readable type
  trackingNumber: "BOS123456789",
  status: { confirmed: true, timeline: [...] },
  customer: { phone, secondPhone, name },
  customerAddress: { city, zone, district, fullAddress },  // city = governorate, zone = city
  package: { type, description, itemsCount },
  financial: {
    cod,                  // COD as returned by Bosta/unified converter
    bostaFees,            // Backward-compatible alias of gross fees
    bostaFeesNet,         // Net fees before VAT
    bostaFeesGross,       // Gross fees (matches "مستحقات بوسطة")
    feesSource            // cash_cycle | shipment_fees_plus_vat | pricing_fallback
  },
  communication: { calls, sms, attempts, lastCall },
  timestamps: { created, updated, collected, scheduled }
}
```

**Address mapping gotcha** — Bosta `city` = Egyptian governorate, Bosta `zone` = Egyptian city:
```
Bosta.dropOffAddress.city.nameAr  → customers.governorate
Bosta.dropOffAddress.zone.nameAr  → customers.city
Bosta.dropOffAddress.firstLine    → customers.address_details
```

---

## Customer Sync

When Bosta orders found, upsert customer:
```sql
INSERT INTO customers (name, phone, phone_secondary, governorate, city, address_details, bosta_orders, ...)
ON DUPLICATE KEY UPDATE name=..., bosta_orders=..., updated_at=NOW()
```

`bosta_orders` = JSON array of all Bosta orders cached locally.

Caching: **no expiration** — use `force_sync=true` to refresh.

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/bosta/health` | Check token + API connectivity |
| POST | `/api/bosta/search` | Search by phone/name/tracking |
| GET | `/api/bosta/order/{tracking}` | Single order details |
| GET | `/api/bosta/customer/{phone}/orders` | All orders for customer |
| POST | `/api/bosta/customer/{phone}/sync` | Sync customer to local DB |

### POST /api/bosta/search
```json
{ "phone": "01012345678", "limit": 10, "page": 1, "group": false }
```
Errors: `400` invalid phone · `401` bad token · `503` token not configured

### GET /api/bosta/order/{tracking}
Cache-first. `?force_sync=true` to bypass.

---

## Error Codes

| Scenario | HTTP | Arabic message |
|----------|------|----------------|
| Invalid phone | 400 | رقم الهاتف غير صحيح. يجب أن يكون 11 رقم يبدأ بـ 01 |
| Customer not found | 404 | العميل غير موجود في النظام |
| API timeout | 503 | انتهت مهلة طلب Bosta. يرجى المحاولة مرة أخرى |
| Token not configured | 503 | خطأ في إعدادات Bosta. يرجى التواصل مع الدعم الفني |
| Auth error | 401 | خطأ في المصادقة مع Bosta |

**Timeouts**: search=12s · order=10s · health=5s

**Fallback**: always offer manual entry if Bosta API fails.

---

## Known Gotchas

- Type 25 `pickupAddress` — do NOT use `dropOffAddress` for this type
- Type 25 description in `returnSpecs.packageDetails` — NOT in `specs`
- Cache never expires — stale data possible; force_sync when needed
- `bosta_orders` JSON in customers table — full array, can be large for high-volume customers
