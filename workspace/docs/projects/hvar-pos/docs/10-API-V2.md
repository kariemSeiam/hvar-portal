# API V2 — Mobile (Flutter)

> REST API consumed by the Flutter mobile app. Fully authenticated via Sanctum.

---

## Base URL

All endpoints under `/api/v2/`

## Auth

**File:** `app/Http/Controllers/Api/V2/AuthController.php`

```
POST /auth/login              → Email + password
POST /auth/signup             → Register
POST /auth/social-login       → Apple, Google, Facebook
POST /auth/password/forget_request
POST /auth/password/confirm_reset
POST /auth/resend_code
POST /auth/confirm_code
GET  /auth/logout             → (auth:sanctum)
GET  /auth/user               → (auth:sanctum)
GET  /auth/account-deletion   → (auth:sanctum)
```

## Products

```
GET  /products                    → Paginated product list
GET  /products/{id}               → Product details
GET  /products/related/{id}       → Related products
GET  /categories/top              → Top-level categories
GET  /categories                  → All categories
GET  /sub-categories              → Sub-categories
GET  /sub-sub-categories          → Sub-sub-categories
GET  /brands                      → All brands
GET  /colors                      → Colors
GET  /search                      → Search products
GET  /flash-deal-products/{id}    → Flash deal items
GET  /auction/products            → Auction items
GET  /auction/products/{id}       → Auction details
```

## Cart (Authenticated)

```
GET    /carts                     → Get cart (POST instead)
POST   /carts                    → Get cart list
POST   /carts/add                → Add to cart
POST   /carts/change-quantity    → Update quantity
DELETE /carts/{id}               → Remove from cart
POST   /carts/process            → Process cart
GET    /cart-summary             → Cart totals
GET    /cart-count               → Item count
```

## Checkout & Orders (Authenticated)

```
POST /order/store                    → Place order
GET  /purchase-history              → User orders
GET  /purchase-history-details/{id} → Order detail
GET  /purchase-history-items/{id}   → Order items
GET  /delivery-info                 → Estimate delivery
POST /coupon-apply                  → Apply coupon
POST /coupon-remove                 → Remove coupon
```

## User Profile (Authenticated)

```
GET    /profile/counters         → Stats
POST   /profile/update           → Update info
POST   /profile/update-image     → Avatar
POST   /profile/image-upload     → Upload photo
POST   /profile/update-device-token
POST   /profile/check-phone-and-email
```

## Addresses (Authenticated)

```
GET    /user/shipping/address
POST   /user/shipping/create
POST   /user/shipping/update
POST   /user/shipping/update-location
POST   /user/shipping/make_default
GET    /user/shipping/delete/{id}
POST   /update-address-in-cart
POST   /update-shipping-type-in-cart
GET    /get-home-delivery-address
```

## Payments (Authenticated)

```
POST  /payments/pay/cod         → Cash on delivery
POST  /payments/pay/wallet      → Wallet payment
POST  /payments/pay/manual      → Offline payment
GET   /wallet/history           → Wallet transactions
```

## Wishlist (Authenticated)

```
GET   /wishlists
GET   /wishlists-add-product
GET   /wishlists-remove-product
GET   /wishlists-check-product
```

## Reviews (Authenticated)

```
POST  /reviews/submit
```

## Delivery Boy (Authenticated)

```
GET  /delivery-boy/dashboard-summary/{id}
GET  /delivery-boy/deliveries/completed/{id}
GET  /delivery-boy/deliveries/cancelled/{id}
GET  /delivery-boy/deliveries/on_the_way/{id}
GET  /delivery-boy/deliveries/picked_up/{id}
GET  /delivery-boy/deliveries/assigned/{id}
GET  /delivery-boy/collection-summary/{id}
GET  /delivery-boy/earning-summary/{id}
POST /delivery-boy/change-delivery-status
```

## Seller API

**File:** `routes/api_seller.php` (62 routes)

```
Products CRUD, orders management, coupon management,
payment history, withdraw requests, shop profile
```

## Chat (Authenticated)

```
GET   /chat/conversations
GET   /chat/messages/{id}
POST  /chat/insert-message
GET   /chat/get-new-messages/{conv_id}/{last_msg_id}
POST  /chat/create-conversation
```

## ERP Integration (no auth)

```
GET  /v2/erp_integration/all-categories
GET  /v2/erp_integration/all-attributes
GET  /v2/erp_integration/all-brands
GET  /v2/erp_integration/all-products
GET  /v2/erp_integration/all-orders
GET  /v2/erp_integration/products-stocks
POST /v2/erp_integration/update-product-stock
```

## Public / Anonymous

```
GET  /settings                        → App settings
GET  /languages                       → Available languages
GET  /currencies                      → Currency list
GET  /banners                         → Home banners
GET  /sliders                         → Sliders
GET  /policy/{type}                   → Terms/privacy
GET  /shipping/cost                   → Shipping cost calc
```
