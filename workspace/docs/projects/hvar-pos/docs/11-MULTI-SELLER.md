# Multi-Seller Marketplace

> Hvar-POS is a **multi-seller e-commerce platform**. Sellers have their own dashboard,
> products, orders, and commission structure.

---

## Seller Types

| Type | Can Sell | Can Use POS | Commission |
|------|----------|-------------|------------|
| **Admin (in-house)** | Yes — all products | Yes (admin POS) | N/A |
| **Seller** | Yes — own products | Yes (seller POS) | Commission per sale |
| **Customer** | No — buy only | No | N/A |

---

## Seller Dashboard

**Route prefix:** `/seller/` (89 routes)

### Sections

| Section | Controllers | Purpose |
|---------|-------------|---------|
| Dashboard | `Seller/DashboardController` | Sales stats, charts |
| Products | `Seller/ProductController` | CRUD own products |
| Digital Products | `Seller/DigitalProductController` | Digital product management |
| Bulk Upload | `Seller/ProductBulkUploadController` | CSV/Excel product import |
| Orders | `Seller/OrderController` | View/manage own orders |
| Invoices | `Seller/InvoiceController` | Print invoices |
| Coupons | `Seller/CouponController` | Create/manage coupons |
| Reviews | `Seller/ReviewController` | View product reviews |
| Payments | `Seller/PaymentController` | Payment history |
| Withdrawals | `Seller/SellerWithdrawRequestController` | Withdraw earnings |
| Shop | `Seller/ShopController` | Shop profile settings |
| Profile | `Seller/ProfileController` | Personal info |
| Messages | `Seller/ConversationController` | Customer messages |
| Support | `Seller/SupportTicketController` | Support tickets |
| Product Queries | `Seller/ProductQueryController` | Customer questions |
| Commission History | `Seller/CommissionHistoryController` | Commission records |

### Seller POS

Sellers can use the POS terminal if enabled:

```php
if (get_setting('pos_activation_for_seller') == 1) {
    return view('pos.frontend.seller.pos.index', compact('customers'));
}
```

---

## Commission System

### Admin to Seller

The admin sets a `seller_commission` percentage on the seller's account.
When a seller's product sells, the commission is deducted:

- **Commission types:** Percentage or fixed
- **Commission targets:** Per seller or global
- **Payout:** Sellers request withdrawals

### Affiliate Commission

Separate from seller commission. Users can become affiliates and earn
commission for referring sales through unique links.

---

## Withdrawal System

Sellers request withdrawals:

```
Seller requests withdrawal
    → Admin reviews
    → Admin marks as paid
    → Payment recorded
```

**Tables:**
- `seller_withdraw_requests` — Withdrawal requests
- `commission_histories` — Commission records

---

## Seller Verification

Sellers must be verified before they can sell:

- Upload verification documents
- Admin reviews and approves/declines
- `sellers.verification_status` tracks state
- Verified sellers get a badge on the storefront

---

## Seller Login

Separate seller login page:

```
GET /seller-login → Seller login form
POST /seller-login → Authenticate
```

Handled by `Seller\Auth\LoginController`

---

## Order Fulfillment (Multi-Seller)

When a customer places an order with products from multiple sellers:

1. **CombinedOrder** created (single order for customer)
2. **Individual Orders** created per seller (linked by `combined_order_id`)
3. Each seller sees only their own order items in their dashboard
4. Emails sent to each seller individually
5. Payment split: admin receives payment, then pays sellers minus commission

```php
// In PosController@order_store and CheckoutController@checkout:
foreach ($seller_products as $key => $seller_product) {
    Mail::to(User::find($key)->email)->queue(new InvoiceEmailManager($array));
}
```
