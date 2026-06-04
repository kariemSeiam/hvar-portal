# Payment Gateways

> Hvar-POS ships with 20+ payment gateway integrations. Each follows the same
> pattern: initiate → redirect → callback → order creation.

---

## Gateway List

| Gateway | File | Country/Region | Type |
|---------|------|---------------|------|
| **Kashier** | `Payment/KashierController.php` | Egypt | Card, Wallet, Installments |
| Aamarpay | `Payment/AamarpayController.php` | Bangladesh | Card, Mobile |
| Authorize.net | `Payment/AuthorizenetController.php` | USA | Card |
| bKash | `Payment/BkashController.php` | Bangladesh | Mobile Wallet |
| Cash on Delivery | `Payment/CashOnDeliveryController.php` | Any | Cash |
| Flutterwave | `Payment/FlutterwaveController.php` | Africa | Card, Mobile Money |
| Instamojo | `Payment/InstamojoController.php` | India | Card, Wallet |
| Iyzico | `Payment/IyzicoController.php` | Turkey | Card, Installments |
| Kashier | `Payment/KashierController.php` | Egypt | Card, Wallet, Installments |
| Mercado Pago | `Payment/MercadopagoController.php` | Latin America | Card, Pix |
| M-Pesa | `Payment/MpesaController.php` | Kenya/Tanzania | Mobile Money |
| MyFatoorah | `Payment/MyfatoorahController.php` | Middle East | Card, Wallet |
| Nagad | `Payment/NagadController.php` | Bangladesh | Mobile Wallet |
| N-Genius | `Payment/NgeniusController.php` | UAE/Europe | Card |
| Payfast | `Payment/PayfastController.php` | South Africa | Card, EFT |
| Payhere | `Payment/PayhereController.php` | Sri Lanka | Card, Wallet |
| Payku | `Payment/PaykuController.php` | Latin America | Card |
| PayMob | `Payment/PayMobController.php` | Middle East/Africa | Card, Wallet |
| PayPal | `Payment/PaypalController.php` | Global | Card, PayPal |
| Paystack | `Payment/PaystackController.php` | Nigeria/Africa | Card, Bank Transfer |
| Paytm | `Payment/PaytmController.php` | India | Wallet, Card |
| Razorpay | `Payment/RazorpayController.php` | India | Card, UPI, Wallet |
| SSLCommerz | `Payment/SslcommerzController.php` | Bangladesh | Card, Mobile |
| Stripe | `Payment/StripeController.php` | Global | Card |
| Toyyibpay | `Payment/ToyyibpayController.php` | Malaysia | Card, FPX |
| Voguepay | `Payment/VoguepayController.php` | Global | Card, Mobile |
| Wallet | `Payment/WalletController.php` | Internal | Store credit |

---

## Common Pattern

All payment gateways follow the same flow:

```
┌──────────────────────┐
│ CheckoutController   │
│ @checkout()          │
│                      │
│ if payment_option == │
│   "gateway_name":    │
│   → GatewayController│
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ GatewayController    │
│ @initiatePayment()   │
│                      │
│ 1. Validate amount   │
│ 2. Generate order ID │
│ 3. Build redirect    │
│    URL with params   │
│ 4. Redirect to       │
│    payment page      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Payment Provider     │
│ (Hosted page or SDK) │
└──────┬───────────────┘
       │
       ├── SUCCESS ──────► Callback URL
       │                  │
       │                  ▼
       │           ┌──────────────────┐
       │           │ @payment_status  │
       │           │ if SUCCESS:      │
       │           │   store order    │
       │           │   redirect to    │
       │           │   confirmation   │
       │           └──────────────────┘
       │
       └── FAILED ───────► Redirect home
                           with error message
```

---

## Checkout Routing

**File:** `app/Http/Controllers/CheckoutController.php` (line 251-277)

```php
public function checkout(CheckoutRequest $request)
{
    // ...
    if ($request->payment_option != null) {
        // Route to specific gateway based on payment_option value
        if ($request->payment_option == "kashier_card" || ...) {
            return (new KashierController)->initiatePayment($request);
        }
        if ($request->payment_option == "paypal") {
            // PayPal flow
        }
        // etc.
    }
}
```

---

## Cash on Delivery

File: `app/Http/Controllers/Payment/CashOnDeliveryController.php`

Simplest gateway — just confirms the order with `payment_status = 'unpaid'`.
The order is created and marked for cash collection on delivery.

---

## Wallet Payments

File: `app/Http/Controllers/Payment/WalletController.php`

Uses the internal `wallet` model (`app/Models/Wallet.php`) to deduct from user's
store credit balance before creating the order.

---

## Route Files per Gateway

Some gateways have separate route files for callbacks:

| Route File | Gateways |
|-----------|----------|
| `routes/paytm.php` | Paytm |
| `routes/african_pg.php` | African payment gateways |
| `routes/offline_payment.php` | Manual/offline payments |

Others handle callbacks within their controller (like Kashier's `payment_status` method).

---

## Security Notes

- Most gateways validate callbacks via HMAC signatures or webhook secrets
- Kashier's signature validation is **currently disabled** (commented out)
- PayPal, Stripe, Razorpay have industry-standard validation
- COD has no validation (by nature — cash is verified on delivery)
