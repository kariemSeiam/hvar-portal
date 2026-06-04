## Skeleton — 2026-04-04

**Core entities:**
- **User** — phone-based auth, role (user/admin), addresses, orders, favorites
- **Product** — bilingual (AR/EN), category, pricing, variants with colors/sizes/images, features, views/sales tracking
- **ProductVariant** — color variants with images and size/stock inventory
- **VariantSize** — per-variant size with quantity and in_stock flag
- **ProductFeature** — bilingual feature bullet points per product
- **Category** — slug, bilingual names, sort order
- **Order** — user, items, tracking, coupon usage, status lifecycle (pending→processing→shipped→delivered/cancelled)
- **OrderItem** — links order to product variant + size + price snapshot
- **OrderTracking** — status history with Arabic descriptions
- **Coupon / CouponUser / CouponUsage** — percentage or fixed discounts, user targeting, usage tracking
- **OfferSlide** — hero/offer carousel with product linkage
- **Address** — Egyptian governorate/district structure
- **Favorite** — user-product bookmarks
- **ContactMessage** — contact form submissions

**Data model:**
Phone-based authentication (no passwords). Users identified by phone, auto-created on first login. Products have a three-level hierarchy: Product → Variants (colors) → Sizes (inventory). Orders capture a price snapshot at checkout time. Coupons support percentage/fixed discounts with per-user targeting and usage history. All IDs are UUID strings. SQLite with WAL mode and busy_timeout=5000.

**Schema location:**
- `project/backend/app.py` — all SQLAlchemy models defined inline (lines ~256-522)
- `wilson.db` — SQLite database at repo root, created automatically
- No migration files — schema evolves via `_ensure_offer_slide_placement_column()` pattern

**Notable constraints:**
- Product code auto-generated as `COD-NNNNNN` with sequential `product_number`
- `Product.category` is a plain string (not FK to Category table) — slug mismatch risk
- Variant images stored as URLs in filesystem (`uploads/products/`)
- Orders lock inventory with `with_for_update()` during checkout
- Coupon validation happens after order creation (savepoint pattern)
- Admin backdoor: phone `0000000000` auto-escalates to admin role
