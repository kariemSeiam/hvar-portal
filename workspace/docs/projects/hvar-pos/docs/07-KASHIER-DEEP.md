# Kashier Payment Gateway — Deep Dive

> **Kashier** is an Egyptian payment gateway supporting card payments, mobile wallets, and installments.
> This is a **custom Hvar addition** — NOT part of the original Active eCommerce CMS.

---

## File Location

`app/Http/Controllers/Payment/KashierController.php`

---

## Configuration (.env)

```env
KASHIER_SECRET_KEY=b610de5f-0b4e-4320-979a-e5293714a23f
KASHIER_API_KEY=             # Optional — falls back to secret if empty
KASHIER_MERCHANT_ID=MID-27070-591
KASHIER_CURRENCY=EGP
KASHIER_MODE=live             # or test
```

The controller logs its config on every instantiation:

```php
\Log::info('Kashier Configuration Loaded', [
    'merchant_id' => $this->mid,
    'mode' => $this->mode,
    'currency' => $this->currency,
    'secret_key_format' => 'UUID: ' . (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
        $this->secret) ? 'valid' : 'invalid'),
    'api_key_configured' => !empty($this->apiKey) ? 'YES' : 'NO',
]);
```

---

## Payment Methods Map

Kashier supports 3 payment modes, mapped from POS payment options:

| POS Payment Option | Kashier `allowedMethods` | Mode |
|--------------------|--------------------------|------|
| `kashier_card` | `card` | Credit/debit card |
| `kashier_installments` | `installments` | Bank installments |
| `kashier_wallets` | `wallet` | Mobile wallets (e.g., Vodafone Cash) |
| `card` | `card` | Generic card |
| `wallet` | `wallet` | Generic wallet |

There's also commented-out alternatives for installments:
```php
// 'bank_installments' => 'installment_plan',
// 'bank_installments' => 'karmaly',
// 'bank_installments' => 'valu',
```

---

## Full Payment Flow

```
┌──────────┐
│ Customer │
│ checks   │
│ out      │
└────┬─────┘
     │
     ▼
┌───────────────────────────────────────────────────┐
│ CheckoutController@checkout()                     │
│                                                   │
│ if payment_option starts with "kashier_":         │
│     return (new KashierController)->initiatePayment($request) │
└──────────────────────┬────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────┐
│ KashierController@initiatePayment($request)        │
│                                                    │
│  1. Generates a new Order ID (last order id + 1)  │
│  2. Maps payment option → allowedMethods           │
│  3. Generates HMAC-SHA256 hash                     │
│  4. Builds HPP URL with:                           │
│     - merchantId, orderId, mode                    │
│     - amount, currency, hash                       │
│     - merchantRedirect (callback URL)              │
│     - allowedMethods (card/installments/wallet)    │
│  5. Redirects customer to Kashier checkout page    │
└──────────────────────┬────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────┐
│ Kashier Checkout Page (hosted by Kashier)          │
│                                                    │
│  https://checkout.kashier.io                       │
│  ?merchantId=...&orderId=...&amount=...            │
│  &hash=...&merchantRedirect=...&display=ar         │
└──────────────────────┬────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
   Payment SUCCESS            Payment FAILED
          │                         │
          ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│ Redirect back to │    │ Redirect home    │
│ /payment-status  │    │ with error flash │
│ with SUCCESS     │    │                  │
└──────┬───────────┘    └──────────────────┘
       │
       ▼
┌───────────────────────────────────────────────────┐
│ KashierController@payment_status($request)         │
│                                                    │
│  if paymentStatus == "SUCCESS":                    │
│     1. Calls OrderController@store($request)       │
│        → Creates Order + OrderDetails in DB        │
│     2. Finds order by combined_order_id            │
│     3. Sets order.payment_status = "paid"          │
│     4. Saves payment details (status, orderId,     │
│        currency) as JSON in payment_details        │
│     5. Redirects to order_confirmed                │
│                                                    │
│  else:                                             │
│     Logs error, flashes message, redirects home    │
└───────────────────────────────────────────────────┘
```

---

## Hash Generation

The HMAC-SHA256 hash is critical for security. It's generated as:

```php
$path = "/?payment=" . $mid . "." . $orderId . "." . $amount . "." . $this->currency;
$hash = hash_hmac('sha256', $path, $apiKey, false);
```

**Hash string format:**
```
/?payment=MID-XXXXX-XXX.ORDERID.AMOUNT.EGP
```

The `$apiKey` defaults to `$this->secret` (the secret key) if no separate API key is configured.

---

## Callback Validation

The controller has a `validateKashierOrderHash()` method that:

1. Reads `x-kashier-signature` header from the request
2. Processes the `data.signatureKeys` array (sorted alphabetically)
3. Builds a query string from the sorted keys using RFC3986 encoding
4. Computes `hash_hmac('sha256', $queryString, $apiKey, false)`
5. Compares computed hash with the header value

**❗ Currently DISABLED** — validation is commented out:

```php
// if (!$this->validateKashierOrderHash($request)) {
//     \Log::error('Kashier callback validation failed - rejecting payment');
//     return response('Unauthorized', 403);
// }
```

This means the callback endpoint accepts any request without verifying the signature.
This is a **security gap**.

---

## The `payment_status` Callback Endpoint

**Route:** Defined in CheckoutController → called after Kashier redirects back

The callback URL is built as:

```php
$callbackUrl = urlencode(env('APP_URL') . 'payment-status?' . http_build_query([
    'owner_id' => $request->owner_id,
    'name' => $request->name,
    'phone' => $request->phone,
    'state_id' => $request->state_id,
    'city' => $request->city,
    'address' => $request->address,
    'country_id' => $request->country_id,
    'orderId' => $orderId,
    'amount' => $amount,
    'payment_option' => $allow_methods,
]));
```

**Important detail:** The callback passes `orderId` (auto-incremented ID, NOT the real order ID from DB) and the customer's shipping info as query parameters. The actual order is only created INSIDE the callback when `paymentStatus === "SUCCESS"`.

This means:
- `orderId` = `last order id + 1` (a guess, not verified)
- The real `combined_order_id` comes from the session (set during checkout)
- If the session is lost, the payment succeeds but the order creation fails

---

## Logging

The controller is **heavily instrumented** with debug logging:

| Log Point | What's Logged |
|-----------|---------------|
| Constructor | Merchant ID, mode, currency, key validation |
| `initiatePayment` | Request data, amount, payment option |
| Hash generation | Hash string, key type, full hash |
| URL generation | Full HPP URL, all params |
| Callback | All incoming data, payment status, headers |
| Validation | Calculated vs received signature |
| Failure | Error message, merchant order ID, full request |

All logs go to the default Laravel log channel (`storage/logs/laravel.log`).

---

## Checkout Integration

**File:** `app/Http/Controllers/CheckoutController.php` (line 253)

```php
if ($request->payment_option == "kashier_card"
    || $request->payment_option == "kashier_installments"
    || $request->payment_option == "kashier_wallets"
    || $request->payment_option == "wallet"
    || $request->payment_option == "card") {
    return (new \App\Http\Controllers\Payment\KashierController)->initiatePayment($request);
}
```

5 payment options from the POS frontend trigger Kashier. The first 3 are Kashier-specific
(`kashier_card`, `kashier_installments`, `kashier_wallets`), while `wallet` and `card`
are generic options that also route through Kashier.

---

## Edge Cases & Gaps

| Issue | Impact | Status |
|-------|--------|--------|
| Signature validation disabled | Any request to callback is accepted | ❌ Open |
| `orderId` is guessed (last ID + 1) | Race condition if concurrent orders | ⚠️ Fragile |
| Session-dependent `combined_order_id` | Session loss = orphaned payment | ⚠️ Fragile |
| No idempotency check | Same callback called twice = 2 orders | ⚠️ Missing |
| Hardcoded test keys in constructor | `b610de5f-...` and `MID-27070-591` as defaults | ⚠️ Dev config in code |
| `display=ar` hardcoded | Always shows Arabic checkout page | ⚠️ Fixed |
