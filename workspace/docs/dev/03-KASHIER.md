# Kashier Integration — The Correct Implementation

> The current live implementation has 5 known bugs. This document is the correct spec.
> Do not copy the old code. Follow this document.

---

## What Kashier Is

Kashier is an Egyptian payment gateway used by hvarstore.com for:
- Card payments (debit + credit)
- Bank installments (aqsat)
- Mobile wallets (Vodafone Cash, Fawry, etc.)

**Merchant credentials:**
```
KASHIER_MERCHANT_ID=MID-27070-591
KASHIER_SECRET_KEY=b610de5f-0b4e-4320-979a-e5293714a23f
KASHIER_MODE=live
KASHIER_CURRENCY=EGP
```

---

## The Five Bugs in the Current Implementation

| # | Bug | Impact | Where |
|---|-----|--------|-------|
| 1 | **Signature validation disabled** | Any HTTP request to the callback creates an order | `validateKashierOrderHash()` is commented out |
| 2 | **orderId = last_db_id + 1** | Race condition: two concurrent orders → same orderId → collision | `$orderId = Order::max('id') + 1` |
| 3 | **Session-dependent state** | If session expires between redirect and callback → orphaned payment | `combined_order_id` stored in PHP session |
| 4 | **No idempotency check** | Same callback fired twice → two orders created | No deduplication on `orderId` |
| 5 | **Order created INSIDE callback** | Payment confirmed but order creation fails silently | Order writes happen only on SUCCESS callback |

All five must be fixed in the new implementation.

---

## Kashier Hosted Payment Page (HPP) Flow

```
Customer clicks "Pay"
        │
        ▼
Backend generates:
  - orderId (UUID — see below)
  - HMAC-SHA256 hash
  - Redirect URL
        │
        ▼
Redirect to Kashier HPP:
https://checkout.kashier.io?merchantId=...&orderId=...&amount=...&hash=...
        │
        ├── Customer pays ──────► Kashier redirects to:
        │                         {merchantRedirect}?paymentStatus=SUCCESS
        │                         Header: x-kashier-signature: {signature}
        │
        └── Customer cancels ───► Kashier redirects to:
                                  {merchantRedirect}?paymentStatus=FAILURE
```

---

## Hash Generation (Outbound — for HPP redirect)

**Purpose:** Proves to Kashier that the redirect is from a legitimate merchant.

```python
import hmac
import hashlib

def generate_kashier_hash(merchant_id: str, order_id: str, amount: str, secret_key: str) -> str:
    # Amount must be formatted as a decimal string: "1250.00"
    path = f"/?payment={merchant_id}.{order_id}.{amount}.EGP"
    return hmac.new(
        secret_key.encode('utf-8'),
        path.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
```

**Hash string format — exactly:**
```
/?payment=MID-27070-591.{uuid}.{amount}.EGP
```

The amount must match exactly what is shown to the customer. No rounding. No formatting differences.

---

## Signature Validation (Inbound — for callback verification)

**Purpose:** Proves to us that the callback is from Kashier, not an attacker.

The callback includes:
- URL parameter: `paymentStatus=SUCCESS`
- HTTP Header: `x-kashier-signature: {hash}`
- Request body: JSON with `data` object containing payment details

```python
import hmac
import hashlib
from urllib.parse import quote

def validate_kashier_signature(data: dict, signature_keys: list, secret_key: str, received_signature: str) -> bool:
    # Sort keys alphabetically
    sorted_keys = sorted(signature_keys)

    # Build query string from sorted keys using RFC3986 encoding
    parts = []
    for key in sorted_keys:
        value = str(data[key])
        encoded_value = quote(value, safe='')
        parts.append(f"{key}={encoded_value}")

    query_string = "&".join(parts)

    # Compute expected signature
    expected = hmac.new(
        secret_key.encode('utf-8'),
        query_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, received_signature)
```

**This validation must be the FIRST thing that runs in the callback handler.** If validation fails, return 403 and log the attempt.

---

## The Correct orderId Strategy

**Rule: Generate orderId BEFORE redirecting, persist it, and use it as the lookup key in the callback.**

```python
import uuid

def initiate_payment(order_data: dict) -> dict:
    # 1. Generate idempotent orderId
    payment_order_id = f"HVAR-{uuid.uuid4().hex[:12].upper()}"
    # e.g. "HVAR-A3F7C291E8B4"

    # 2. Save the mapping BEFORE redirecting
    db.execute("""
        INSERT INTO pending_payments (
            payment_order_id,
            internal_order_id,
            amount,
            created_at,
            expires_at
        ) VALUES (
            :payment_order_id,
            :internal_order_id,
            :amount,
            NOW(),
            DATE_ADD(NOW(), INTERVAL 30 MINUTE)
        )
    """, {
        'payment_order_id': payment_order_id,
        'internal_order_id': order_data['id'],
        'amount': order_data['total']
    })

    # 3. Generate hash using the UUID-based orderId
    hash_value = generate_kashier_hash(
        KASHIER_MERCHANT_ID,
        payment_order_id,
        format_amount(order_data['total']),
        KASHIER_SECRET_KEY
    )

    # 4. Build redirect URL
    redirect_url = build_kashier_url(payment_order_id, hash_value, order_data)

    return {
        'payment_order_id': payment_order_id,
        'redirect_url': redirect_url
    }
```

**Why UUID prefix with "HVAR-":** Kashier's orderId must be unique per merchant. The UUID guarantees no collision. The "HVAR-" prefix identifies the merchant in Kashier's dashboard.

---

## The Correct Callback Handler

```
1. Extract x-kashier-signature from headers
2. Extract data and data.signatureKeys from body
3. VALIDATE SIGNATURE → if fails: return 403, log, stop
4. Check paymentStatus:
   - "SUCCESS" → continue
   - anything else → return 200 (acknowledged), set order status = failed
5. Extract payment_order_id from query params or body
6. Look up pending_payments WHERE payment_order_id = :id
   - NOT FOUND → return 409, log "unknown orderId"
   - EXPIRED → return 409, log "payment received for expired session"
   - ALREADY PROCESSED (processed_at IS NOT NULL) → return 200, log "duplicate callback — idempotent"
7. Mark payment as processed: UPDATE pending_payments SET processed_at = NOW()
8. Finalize order:
   - Update order.payment_status = 'paid'
   - Store payment reference in transaction_payments
9. Fire order-confirmed event (email, ERP webhook)
10. Redirect customer to order confirmation page
```

**The idempotency check at step 6 handles the "fired twice" bug.** If Kashier fires the callback twice (network retry), the second call finds `processed_at IS NOT NULL` and returns 200 without creating a duplicate order.

---

## The pending_payments Table (New Schema)

Add this table to the new storefront's DB (or to `hvar_erp` as a new migration):

```sql
CREATE TABLE pending_payments (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    payment_order_id   VARCHAR(64) NOT NULL UNIQUE,  -- "HVAR-A3F7C291E8B4"
    internal_order_id  INT NOT NULL,                  -- our order ID
    amount             DECIMAL(10,2) NOT NULL,
    payment_method     VARCHAR(32),                   -- 'card', 'wallet', 'installments'
    created_at         DATETIME NOT NULL,
    expires_at         DATETIME NOT NULL,
    processed_at       DATETIME NULL,                 -- NULL = not yet confirmed
    kashier_reference  VARCHAR(128) NULL,             -- Kashier's transaction reference
    INDEX (payment_order_id),
    INDEX (internal_order_id),
    INDEX (expires_at)
);
```

---

## HPP URL Construction

```python
from urllib.parse import urlencode

def build_kashier_url(payment_order_id: str, hash_value: str, order: dict) -> str:
    base = "https://checkout.kashier.io"
    params = {
        'merchantId': KASHIER_MERCHANT_ID,
        'orderId': payment_order_id,
        'amount': format_amount(order['total']),
        'currency': 'EGP',
        'hash': hash_value,
        'mode': KASHIER_MODE,
        'merchantRedirect': build_callback_url(payment_order_id),
        'display': 'ar',
        'allowedMethods': get_allowed_methods(order['payment_method']),
    }
    return f"{base}?{urlencode(params)}"

def get_allowed_methods(method: str) -> str:
    mapping = {
        'kashier_card': 'card',
        'kashier_installments': 'installments',
        'kashier_wallets': 'wallet',
    }
    return mapping.get(method, 'card')
```

---

## Callback URL Construction

The callback URL should be clean. Do NOT embed shipping info as query params (current bug #3).
The shipping info is already in the database at this point.

```python
def build_callback_url(payment_order_id: str) -> str:
    # Clean URL — only the payment_order_id is needed to look up everything
    return f"{APP_URL}/api/payments/kashier/callback?ref={payment_order_id}"
```

---

## Amount Formatting

Kashier expects the amount as a string with exactly 2 decimal places.

```python
def format_amount(amount: float) -> str:
    return f"{amount:.2f}"
    # 1250 → "1250.00"
    # 99.9 → "99.90"
```

The hash is computed from this string. If the displayed amount and hash amount differ even by a decimal place, Kashier rejects the payment.

---

## Environment Variables

```env
KASHIER_MERCHANT_ID=MID-27070-591
KASHIER_SECRET_KEY=b610de5f-0b4e-4320-979a-e5293714a23f
KASHIER_MODE=live
KASHIER_CURRENCY=EGP
```

In production: `KASHIER_MODE=live`. In development: `KASHIER_MODE=test` (uses Kashier's test environment).

---

## Testing Kashier Locally

1. Set `KASHIER_MODE=test`
2. Use test card: `5123450000000008` (Mastercard), any future expiry, any CVV
3. Verify the `x-kashier-signature` header is present and validation passes
4. Verify the `pending_payments` row is marked `processed_at IS NOT NULL` after successful payment
5. Verify no duplicate order is created if you POST to the callback URL twice with the same `ref`

---

## Summary of Changes vs Current Implementation

| Current | New |
|---------|-----|
| `orderId = max(id) + 1` | `orderId = "HVAR-{uuid4}"` |
| Signature validation commented out | Signature validation on every callback |
| State in PHP session | State in `pending_payments` table |
| Order created inside callback | Order created at checkout initiation, confirmed in callback |
| No idempotency check | `processed_at` check prevents duplicate processing |
| Shipping info in callback URL | Only `ref` (payment_order_id) in callback URL |
