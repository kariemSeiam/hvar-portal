# POS Terminal

> The in-person point-of-sale screen built into the admin and seller panels.
> **This is not a standalone app** — it's a feature of the e-commerce CMS.

---

## Routes

**File:** `routes/pos.php` (18 routes)

```
GET    /pos/products                          → search
POST   /add-to-cart-pos                       → addToCart
POST   /update-quantity-cart-pos              → updateQuantity
POST   /remove-from-cart-pos                  → removeFromCart
POST   /get_shipping_address                  → getShippingAddress
POST   /get_shipping_address_seller           → getShippingAddressForSeller
POST   /setDiscount                           → setDiscount
POST   /setShipping                           → setShipping
POST   /set-shipping-address                  → set_shipping_address
POST   /pos-order-summary                     → get_order_summary
POST   /pos-order                             → order_store

Admin:
GET    /admin/pos                             → admin_index
GET    /admin/pos-activation                  → pos_activation

Seller:
GET    /seller/pos                           → seller_index
```

---

## Controller

**File:** `app/Http/Controllers/PosController.php`

The POS terminal uses **session-based cart** (not DB carts like the storefront):

```php
// Cart is stored in the session, not in the cart table
Session::get('pos.cart');  // Collection of cart items
Session::get('pos.shipping_info');
Session::get('pos.shipping');
Session::get('pos.discount');
```

---

## POS Screen Flow

```
┌─────────────────────────────────────────────────────┐
│  POS Terminal                                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌─────────────────────────────────┐  │
│  │ SEARCH   │  │  Product Grid                    │  │
│  │ 🔍       │  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐   │  │
│  │ Category │  │  │P1  │ │P2  │ │P3  │ │P4  │   │  │
│  │ ▼dropdown│  │  │$10 │ │$20 │ │$15 │ │$30 │   │  │
│  │ Brand    │  │  └────┘ └────┘ └────┘ └────┘   │  │
│  │ ▼dropdown│  │                                 │  │
│  └──────────┘  └─────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  Cart (session-based)                        │   │
│  │  ┌────────────────────────────────────┐      │   │
│  │  │ Item    Qty  Price   Total   ✕     │      │   │
│  │  │ Product A  2   $10    $20    [x]   │      │   │
│  │  │ Product B  1   $15    $15    [x]   │      │   │
│  │  └────────────────────────────────────┘      │   │
│  │  Discount: [___]  Shipping: [___]            │   │
│  │  TOTAL: $35                                  │   │
│  │                              [Place Order]   │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Search

Products are fetched via `ProductStock` → `Product` join:

```php
ProductStock::join('products', 'product_stocks.product_id', '=', 'products.id')
    ->select(
        'products.*',
        'product_stocks.id as stock_id',
        'product_stocks.variant',
        'product_stocks.price as stock_price',
        'product_stocks.qty as stock_qty',
        'product_stocks.image as stock_image'
    );
```

Filtered by: category (with children), brand, keyword/barcode.
Paginated: 16 items per page via `PosProductCollection`.

---

## Add to Cart

```php
function addToCart(Request $request)
{
    $stock = ProductStock::find($request->stock_id);
    $product = $stock->product;

    // Calculate price with discount
    $price = $stock->price;
    if ($discount_applicable) {
        if ($product->discount_type == 'percent') {
            $price -= ($price * $product->discount) / 100;
        } elseif ($product->discount_type == 'amount') {
            $price -= $product->discount;
        }
    }

    // Calculate tax
    foreach ($product->taxes as $product_tax) {
        if ($product_tax->tax_type == 'percent') {
            $tax += ($price * $product_tax->tax) / 100;
        }
    }

    // Add to session cart
    $data = [
        'stock_id' => $request->stock_id,
        'id' => $product->id,
        'variant' => $stock->variant,
        'quantity' => $product->min_qty,
        'price' => $price,
        'tax' => $tax,
    ];
}
```

---

## Order Placement

**File:** `PosController@order_store`

1. **Validates** shipping info is present (name, phone, address)
2. **Creates Order** with:
   - Guest ID (if no user) or User ID
   - Shipping address (JSON encoded)
   - Payment type + status
   - Auto-generated code: `Ymd-His-rand`
3. **Deducts stock** from `product_stocks.qty`
4. **Creates OrderDetails** for each cart item
5. **Calculates totals** (subtotal + tax + shipping - discount)
6. **Sends invoice emails** to customer + admin + sellers
7. **Clears session** cart
8. **Returns success** or error message

**Stock is deducted at time of sale** in POS terminal (unlike e-commerce storefront).

---

## POS Activation

The POS feature can be toggled:
- Admin: `/admin/pos-activation` → sets `pos_activation_for_seller`
- Seller POS only works if `get_setting('pos_activation_for_seller') == 1`

---

## Views

| View | Purpose |
|------|---------|
| `resources/views/pos/index.blade.php` | Admin POS terminal |
| `resources/views/pos/cart.blade.php` | Partial — cart display |
| `resources/views/pos/order_summary.blade.php` | Order summary |
| `resources/views/pos/shipping_address.blade.php` | Customer address form |
| `resources/views/pos/guest_shipping_address.blade.php` | Guest address form |
| `resources/views/pos/variants.blade.php` | Product variant selector |
| `resources/views/pos/pos_activation.blade.php` | Activation settings |
| `resources/views/pos/frontend/seller/pos/*.blade.php` | Seller POS views |
