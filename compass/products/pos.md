# POS Direction — هفار

> What you need to KNOW before touching the checkout. This is direction, not a developer reference.

---

## Naming Clarification

The `pos/` directory is the customer portal (hvarstore.com), not a POS terminal. The actual in-store POS terminal is **Ultimate POS**, a separate third-party application. When this document says "POS terminal," it means the Ultimate POS. When it says "hvarstore.com," "the portal," or "the site," it means what we build.

This naming conflict exists because the project was initially scoped around POS functionality. The directory name reflects that origin. Keep the distinction clear.

---

## The Portal's Checkout Layer

The checkout/payment system in hvarstore.com handles:

- **Cart to order** — building the order record, validating stock, computing totals
- **Payment initiation** — routing to Kashier (cards, installments, wallets), or recording COD
- **Payment confirmation** — receiving the Kashier callback, validating it, finalizing the order
- **ERP sync** — firing the webhook to the ERP so the draft transaction is created
- **Order tracking** — reading `bill_code` from the ERP and surfacing Bosta tracking to the customer

Everything downstream of checkout (stock deduction, Bosta shipment, MCRM confirmation) is delegated: to the ERP, to Kashier, to Bosta. The portal triggers and tracks. It does not own those processes.

---

## Payment Methods

Three categories, all routed through the checkout:

| Method | Mechanism | Portal role |
|--------|-----------|-------------|
| Card (debit/credit) | Kashier HPP | Initiate redirect, validate callback |
| Bank installments (aqsat / ValU / Souhoola / Aman) | Kashier HPP (installments mode) | Same as card — different `allowedMethods` param |
| Mobile wallets (Vodafone Cash, Fawry, etc.) | Kashier HPP (wallet mode) | Same as card — different `allowedMethods` param |
| Cash on Delivery | No external gateway | Record order immediately, `payment_status = 'unpaid'` |

Kashier is the only external payment gateway used. The site ships with 20+ gateway controllers inherited from Active eCommerce CMS, but only Kashier is configured and live.

---

## Kashier Integration — The Correct Model

### What Kashier Is

Kashier (kashier.io) is an Egyptian payment gateway operating as a **Hosted Payment Page (HPP)**. The customer leaves our site, pays on Kashier's servers, and Kashier redirects them back. We never handle raw card data.

**Credentials** — never commit live values; load from `.env` (gitignored):
```
KASHIER_MERCHANT_ID=MID-XXXXX-XXX
KASHIER_SECRET_KEY=<from-secret-store>
KASHIER_MODE=live
KASHIER_CURRENCY=EGP
```

In development: `KASHIER_MODE=test`, test card `5123450000000008`.

### The Full Flow

```
Customer clicks "Pay"
        │
        ▼
Backend generates:
  - orderId  (UUID format, see below)
  - HMAC-SHA256 hash
  - HPP redirect URL
        │
        ▼
Redirect to Kashier HPP
https://checkout.kashier.io?merchantId=...&orderId=...&amount=...&hash=...
        │
        ├── Customer pays ──────► Kashier redirects to:
        │                         /api/payments/kashier/callback?ref={orderId}
        │                         Header: x-kashier-signature: {signature}
        │
        └── Customer cancels ───► Redirect home, flash error
```

### orderId Strategy

**Never use `last_id + 1` as the orderId.** The current implementation does this and causes race conditions when two orders are placed concurrently. The correct approach:

Generate a UUID-based orderId before redirecting:

```python
payment_order_id = f"HVAR-{uuid.uuid4().hex[:12].upper()}"
# e.g. "HVAR-A3F7C291E8B4"
```

Write a `pending_payments` row with this ID before the redirect. This row is the bridge between the Kashier session and our internal order. The callback looks up by `payment_order_id`, not by session.

**Why the HVAR- prefix:** Kashier's dashboard shows the orderId. The prefix identifies the merchant in Kashier's multi-tenant system.

### The `pending_payments` Table

This table must exist before any Kashier traffic is processed:

```sql
CREATE TABLE pending_payments (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    payment_order_id   VARCHAR(64) NOT NULL UNIQUE,
    internal_order_id  INT NOT NULL,
    amount             DECIMAL(10,2) NOT NULL,
    payment_method     VARCHAR(32),
    created_at         DATETIME NOT NULL,
    expires_at         DATETIME NOT NULL,
    processed_at       DATETIME NULL,
    kashier_reference  VARCHAR(128) NULL,
    INDEX (payment_order_id),
    INDEX (internal_order_id),
    INDEX (expires_at)
);
```

`processed_at` is the idempotency gate. NULL = not yet confirmed. Non-null = already processed. If Kashier fires the callback twice (network retry), the second call finds a non-null `processed_at` and exits without creating a duplicate order.

### Hash Generation (Outbound)

The hash proves to Kashier that the redirect came from a legitimate merchant. Build it this way:

```python
import hmac, hashlib

def generate_kashier_hash(merchant_id, order_id, amount, secret_key):
    # amount must be a 2-decimal string: "1250.00"
    path = f"/?payment={merchant_id}.{order_id}.{amount}.EGP"
    return hmac.new(
        secret_key.encode('utf-8'),
        path.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
```

**Amount formatting:** always use exactly 2 decimal places. `1250` → `"1250.00"`. `99.9` → `"99.90"`. A decimal mismatch between the hash and the displayed amount causes Kashier to reject the payment.

### Signature Validation (Inbound)

The callback carries `x-kashier-signature` in the HTTP header. This is how we know the request actually came from Kashier and is not an attacker POSTing fake success callbacks.

**Validation must be the first thing that runs in the callback handler.** If validation fails, return 403 and log the attempt. Do not process the payment.

```python
import hmac, hashlib
from urllib.parse import quote

def validate_kashier_signature(data, signature_keys, secret_key, received_signature):
    sorted_keys = sorted(signature_keys)
    parts = []
    for key in sorted_keys:
        parts.append(f"{key}={quote(str(data[key]), safe='')}")
    query_string = "&".join(parts)

    expected = hmac.new(
        secret_key.encode('utf-8'),
        query_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, received_signature)
```

### The Correct Callback Handler — Step by Step

```
1. Extract x-kashier-signature from headers
2. Extract data and data.signatureKeys from body
3. VALIDATE SIGNATURE → fail: return 403, log, stop
4. Check paymentStatus:
   - "SUCCESS" → continue
   - anything else → return 200, set order status = failed, stop
5. Extract payment_order_id from ?ref= query param
6. Look up pending_payments WHERE payment_order_id = :ref
   - NOT FOUND → return 409, log "unknown orderId"
   - EXPIRED → return 409, log "payment received for expired session"
   - processed_at IS NOT NULL → return 200, log "duplicate callback — idempotent", stop
7. Mark payment processed: UPDATE pending_payments SET processed_at = NOW()
8. Finalize order:
   - Update order.payment_status = 'paid'
   - Store Kashier reference in pending_payments.kashier_reference
9. Fire order-confirmed event (email, ERP webhook)
10. Redirect customer to order confirmation page
```

### HPP URL Construction

```python
from urllib.parse import urlencode

def build_kashier_url(payment_order_id, hash_value, order):
    params = {
        'merchantId': KASHIER_MERCHANT_ID,
        'orderId': payment_order_id,
        'amount': format_amount(order['total']),
        'currency': 'EGP',
        'hash': hash_value,
        'mode': KASHIER_MODE,
        'merchantRedirect': f"{APP_URL}/api/payments/kashier/callback?ref={payment_order_id}",
        'display': 'ar',
        'allowedMethods': get_allowed_methods(order['payment_method']),
    }
    return f"https://checkout.kashier.io?{urlencode(params)}"

def get_allowed_methods(method):
    return {
        'kashier_card': 'card',
        'kashier_installments': 'installments',
        'kashier_wallets': 'wallet',
    }.get(method, 'card')
```

**The callback URL carries only `ref`.** The shipping info is already in the database. Do not embed it as query params — the current implementation does this and it is a bug (session state leakage, URL length issues, and fragility if the session dies between redirect and callback).

---

## The Five Bugs in the Current Implementation

These exist in the inherited Active eCommerce / Kashier controller. Do not replicate them.

| # | Bug | Effect |
|---|-----|--------|
| 1 | Signature validation commented out | Any HTTP POST to the callback endpoint creates an order — no Kashier verification |
| 2 | `orderId = max(id) + 1` | Concurrent orders get the same orderId — race condition |
| 3 | State stored in PHP session | Session expiry between HPP redirect and callback → orphaned payment |
| 4 | No idempotency check | Callback fired twice (network retry) → two orders created |
| 5 | Order created inside the callback | Payment confirmed but order write fails silently |

All five must not exist in the new implementation. The `pending_payments` table and the callback handler spec above fix all five.

---

## COD vs Online Payment — Key Divergence

COD and card payments diverge at checkout and converge only at delivery:

| Aspect | COD | Card / Installments / Wallet |
|--------|-----|------------------------------|
| Payment timing | On delivery | Before order confirmation |
| `payment_status` initial value | `unpaid` | `paid` (after callback) |
| Order creation timing | Immediate at checkout | After callback confirmation |
| Cancellation risk | Order can be cancelled before delivery | Refund must be initiated |
| ERP draft created | Yes, same webhook | Yes, same webhook |
| Bosta shipment | Created when MCRM confirms | Created when MCRM confirms |

COD orders are the majority of Hvar's volume. The COD path must be as fast and simple as possible — no redirects, no external dependencies. Validate stock, create order, fire ERP webhook, show confirmation.

---

## Bosta Shipping — What the Portal Controls

Bosta integration lives in the ERP, not the portal. The portal's role is minimal:

1. **Read `bill_code`** from `transactions WHERE website_order_id = our_order_id`
2. **Surface the tracking link** when `bill_code` is non-null:
   ```
   https://bosta.co/ar-eg/tracking-shipments?shipment-number={bill_code}
   ```
3. **Before `bill_code` exists**, show: `طلبك قيد التأكيد` — order being prepared

The portal does not call the Bosta API. It does not create shipments. It does not track statuses. It reads a single field that the ERP writes after MCRM confirms the order.

**Do not assume `bill_code` is populated immediately after the ERP transaction moves to `status='final'`**. The Bosta shipment creation is a subsequent step. Poll or refresh.

---

## ERP Sync — Order Webhook

When an order is confirmed (COD placed, or Kashier callback processed):

```
POST /websiteintegration/webHooksyncOrdersGet
```

The ERP creates `transactions` row: `type='sell'`, `status='draft'`, `website_order_id=our_id`.

The MCRM call center confirms → `status='final'` → stock deducted → Bosta auto-created.

When cancelling:
```
1. Set our order: status='cancelled', cancelled_at=NOW()
2. POST /websiteintegration/webHooksyncOrdersDelete { order_id: our_id }
3. ERP removes the draft transaction
```

Fire the cancel webhook BEFORE soft-deleting our record. Never rely on reading a cancelled status back from the ERP — the ERP hard-deletes cancelled drafts in some scenarios. Our `orders` table is the authority for order history.

---

## Security Rules for Checkout

These are non-negotiable:

1. **Kashier signature validation on every callback** — no exceptions, no environment bypass
2. **HTTPS only** — Kashier will not send callbacks to HTTP endpoints; the `APP_URL` must be HTTPS in production
3. **Idempotency via `processed_at`** — before processing any payment, check this field
4. **UUID orderId** — never sequential, never guessable
5. **No state in session** — all payment state lives in `pending_payments`, not PHP/Flask session
6. **Secret key in environment variable only** — never hardcoded, never in source control
7. **Amount match** — the amount in the hash, the amount displayed, and the amount in the callback must all match. Kashier rejects mismatches. Never recompute the amount from a different source in the callback.

---

## Key Gotchas

**Webhook replay.** Kashier will retry the callback if they do not receive a 200 response. Design the callback handler to be idempotent. If you return a 500 on the first callback due to a bug, Kashier will retry — potentially after you fix the bug — and the handler will run again on an already-processed payment. The `processed_at` check must be in the DB, not in memory.

**Currency.** Kashier is EGP-only for this merchant. Do not pass any other currency. The hash embeds `EGP` as a constant — if you ever try to use a different currency, the hash will fail.

**COD vs online divergence in ERP.** COD orders arrive in the ERP as drafts with `payment_status='unpaid'`. Online orders arrive as drafts with `payment_status='paid'`. The MCRM agent sees the difference and processes them accordingly. Make sure the ERP webhook payload includes the payment method so the ERP can set this correctly.

**Session death between redirect and callback.** The current implementation stores `combined_order_id` in the PHP session. If the customer's session expires (e.g., 30-minute idle) while on the Kashier HPP, the callback fires but the session is gone. The new implementation must store all needed state in `pending_payments` before the redirect. The session is irrelevant to the callback.

**Installments.** ValU, Souhoola, and Aman are bank installment programs available through Kashier's `installments` mode. They do not require separate credentials or APIs — they appear as options on the Kashier HPP when `allowedMethods=installments`. The portal just sets the right `allowedMethods` param and Kashier presents the available installment plans to the customer.

**Amount decimal precision.** The hash is computed from a string. `format_amount(1250)` must produce `"1250.00"`, not `"1250"`. If the hash was computed with `"1250.00"` and the callback reports `"1250"`, validation will fail. Use `f"{amount:.2f}"` consistently in every place the amount appears in a Kashier context.

---

## Stock and Concurrency

The POS terminal does not notify the portal when stock changes. There is no webhook, no event. The POS agent completes a sale → ERP deducts from `variation_location_details.qty_available` → the next portal read returns the new number.

**Never trust a stock quantity read at page load to be valid at checkout time.** Stock displayed on the product page is advisory. The `SELECT ... FOR UPDATE` at order creation is the only authoritative check.

---

## POS-Specific Naming Conventions

| Our term | ERP/POS term | Notes |
|----------|-------------|-------|
| Order | Transaction | `hvar_erp.transactions`, `type='sell'` |
| Order ID | `website_order_id` | We store our UUID-format ID as this field in the ERP |
| Customer | Contact | `hvar_erp.contacts`, `type='customer'` |
| Governorate | City | `hvar_erp.cities` — each row is a governorate |
| District / neighborhood | District | `hvar_erp.districts` — each row is what Egyptians call a city or neighborhood |
| Stock | `qty_available` | In `variation_location_details`, not `product_stocks` |
| In-store order | — | Same `transactions` table, no `website_order_id` |

---

## What Never to Assume

**POS transactions are soft-deleted.** They are not. The ERP hard-deletes cancelled drafts in some scenarios. A missing `transactions` row does not mean `status='cancelled'` — it means gone. Our `orders` table is the history of record.

**`bill_code` is populated immediately after `status='final'`.** It is not. Bosta creation is a subsequent async step.

**A `website_order_id` in the ERP always has a valid portal order behind it.** Failed webhooks, test orders, and deleted-order scenarios can leave orphaned `website_order_id` values. Handle the missing ERP transaction gracefully — show what we know from our `orders` table, note that ERP sync is pending.

**Phone formats are normalized in the POS.** They are not. Cashier entry is freeform. Normalize before every phone lookup, regardless of origin.
