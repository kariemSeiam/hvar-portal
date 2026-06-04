# Database Reference

> Key tables, columns, and relationships in the POS database.
> The schema is managed by the Active eCommerce installer, not Laravel migrations.
> Only 5 migration files exist — the rest is set up during installation.

---

## Core Business Tables

### `users`

Standard Laravel users table with extensions:

```sql
id, name, email, password, address, city, postal_code, phone, country,
provider_id, email_verified_at, verification_code, user_type (admin/seller/customer/delivery_boy)
```

**Relations:** Seller, Customer, Staff, Shop, Addresses, Orders, Carts, Wallets, Reviews

### `sellers`

```sql
id, user_id, shop_id, verification_status, verification_info,
cash_on_delivery_status, admin_to_payment, seller_commission,
commission_percentage, delivery_charge, delivery_range
```

### `customers`

```sql
id, user_id
```

### `shops`

```sql
id, user_id, name, logo, sliders, address, phone, facebook, google, twitter,
youtube, slug, meta_title, meta_description, pickup_point_id, shipping_cost
```

### `addresses`

```sql
id, user_id, address, country_id, state_id, city_id, postal_code, phone,
set_default, latitude, longitude
```

---

## Product Tables

### `products`

```sql
id, name, added_by (admin/seller), user_id, category_id, brand_id,
unit_price, purchase_price, unit, min_qty, max_qty,
discount, discount_type, discount_start_date, discount_end_date,
featured, published, approved, slug, description, photos, thumbnail_img,
video_provider, video_link, tags, barcode, digital, file_name, file_path,
num_of_sale, rating, auction_product, external_link, external_link_btn,
tax, tax_type, shipping_type, shipping_cost,
est_shipping_days, lowest_offers, meta_title, meta_description,
id_from_pos  ← CUSTOM: maps to ERP product ID
```

### `categories`

```sql
id, name, parent_id (self-referential), slug, meta_title, meta_description,
digital, commission_rate, category_icon, cover_image
```

**Relations:** `childrenCategories()` → self-referential, `parentCategory()` → self

### `brands`

```sql
id, name, logo, slug, meta_title, meta_description
```

### `attributes`

```sql
id, name
```

### `attribute_values`

```sql
id, attribute_id, value
```

### `product_stocks`

```sql
id, product_id, variant, sku, price, qty, image, wholesale_price, suits
```

**This is the stock table** — single `qty` column per product/variant.
Also stores `price` which can override the product's `unit_price`.

### `product_translations`

```sql
id, product_id, name, lang
```

### `product_taxes`

```sql
id, product_id, tax_id, tax, tax_type (percent/amount)
```

---

## Order Tables

### `orders`

```sql
id, combined_order_id, user_id, guest_id, seller_id, code, shipping_address (JSON),
shipping_barcode, turbo_status, payment_type, payment_status, payment_status_viewed,
delivery_status, delivery_viewed, pickup_point_id, carrier_id,
coupon_discount, grand_total, date, delivery_history_date,
delivery_history_time, assign_delivery_boy, manual_payment,
manual_payment_data, payment_details
```

### `order_details`

```sql
id, order_id, seller_id, product_id, variation, price, tax, shipping_cost,
quantity, payment_status, delivery_status, shipping_type, pickup_point_id,
product_referral_code
```

### `combined_orders`

```sql
id, user_id, combined_order_id, code, shipping_address (JSON), grand_total
```

---

## Cart

### `carts`

```sql
id, user_id, temp_user_id, owner_id, product_id, variation, quantity,
price, tax, shipping_cost, discount, coupon_code, coupon_applied,
address_id, product_referral_code
```

### `cart_products`

```sql
id, cart_id, product_id, quantity
```

---

## Payment & Wallet

### `wallets`

```sql
id, user_id, amount, payment_method, payment_details, transaction_id,
approval, offlines_payment_request, approved_by, offline_payment
```

### `payments`

```sql
id, seller_id, amount, payment_method, transaction_id, txn_code
```

---

## Marketing

### `coupons`

```sql
id, type (cart_base/product_base), code, details, discount, discount_type,
start_date, end_date
```

### `flash_deals`

```sql
id, title, start_date, end_date, status, banner, slug
```

### `flash_deal_products`

```sql
id, flash_deal_id, product_id, discount, discount_type
```

---

## Shipping

### `cities`

```sql
id, name, state_id, cost, status
```

### `states`

```sql
id, name, country_id
```

### `countries`

```sql
id, name, code, status
```

### `carriers`

```sql
id, name, logo, transit_time, free_shipping, Zip_codes, country, tax, status
```

---

## Affiliate

### `affiliate_users`

```sql
id, user_id, status, paypal_email, bank_information
```

### `affiliate_logs`

```sql
id, user_id, affiliate_by, affiliate_type (user/admin), amount, order_id
```

---

## Club Points

### `club_points`

```sql
id, user_id, points, order_id, convert_status
```

---

## Delivery Boy

### `delivery_boys`

```sql
id, user_id, order_id, delivery_status, cash_collection, paid_by,
collection_from_customer, total_collection, total_earning, earned
```

### `delivery_histories`

```sql
id, delivery_boy_id, order_id, delivery_status, note, created_at
```

---

## Settings

### `business_settings`

Key-value store for system settings:

```sql
id, type, value
```

Examples: `pos_activation_for_seller`, `minimum_order_amount`, `system_default_currency`

### `currencies`

```sql
id, name, symbol, exchange_rate, code, status
```

---

## Key Relationships

```
User ──hasOne──► Seller
User ──hasOne──► Customer
User ──hasOne──► Shop
User ──hasMany──► Address
User ──hasMany──► Order
User ──hasMany──► Cart
User ──hasMany──► Wishlist
User ──hasMany──► Review
User ──hasMany──► Wallet (transactions)
User ──hasMany──► AffiliateUser
User ──hasMany──► ClubPoint
User ──hasMany──► Conversation
User ──hasOne──► DeliveryBoy

Product ──belongsTo──► Category
Product ──belongsTo──► Brand
Product ──hasMany──► ProductStock
Product ──hasMany──► ProductTax
Product ──hasMany───► Review
Product ──hasMany───► OrderDetail
Product ──hasMany───► Wishlist
Product ──belongsToMany──► Attribute [via attribute_category]

Order ──belongsTo──► User
Order ──hasMany──► OrderDetail
Order ──belongsTo──► Shop (via seller_id)
Order ──belongsTo──► Carrier
Order ──belongsTo──► PickupPoint

OrderDetail ──belongsTo──► Order
OrderDetail ──belongsTo──► Product
```
