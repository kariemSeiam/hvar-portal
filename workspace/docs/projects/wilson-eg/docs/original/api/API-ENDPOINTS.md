# Wilson Egypt — API Endpoints Reference

Single source of truth for backend API. Base URL: `/api` (Flask app at `app.py`). Auth: JWT in `Authorization: Bearer <token>`; admin routes require JWT + admin role.

---

## Public (no auth)

| Method | Path | Required | Optional | Notes |
|--------|------|----------|----------|--------|
| GET | `/api/products` | — | category, search, minPrice, maxPrice, size, color, code, sort, page | sort: popular, newest, price-asc, price-desc. per_page fixed 150. |
| GET | `/api/products/<identifier>` | identifier (UUID or SKU) | — | Single product; increments views. |
| GET | `/api/categories` | — | — | All categories + productCount. |
| GET | `/api/categories/<slug>` | slug | — | Category by slug. |
| GET | `/api/slides` | — | — | All active slides by position (home hero and product offers). |
| POST | `/api/auth/login` | phone | — | Returns token + user. |
| POST | `/api/contact` | name, phone, message | — | No auth. |

---

## Customer (JWT required)

| Method | Path | Required | Optional | Notes |
|--------|------|----------|----------|--------|
| GET | `/api/profile` | — | — | Profile + addresses, ordersCount, favoritesCount. |
| PUT | `/api/profile` | — | name | Update name. |
| POST | `/api/addresses` | governorate, district, details | — | First address becomes default. |
| PUT | `/api/addresses/<address_id>` | address_id (path) | governorate, district, details, is_default | Ownership checked. |
| DELETE | `/api/addresses/<address_id>` | address_id (path) | — | Ownership checked. |
| POST | `/api/favorites` | product_id | — | Toggle favorite. |
| GET | `/api/favorites` | — | page, perPage (max 50) | Paginated. |
| GET | `/api/favorites/<product_id>/status` | product_id (path) | — | Returns isFavorite, productId. |
| POST | `/api/orders` | items | addressId, paymentMethod, coupon | items: [{ variant_id, quantity, size? }]. `size` optional when variant has exactly one size (inferred). Default address if no addressId. |
| GET | `/api/orders` | — | page, perPage | User's orders. |
| GET | `/api/orders/<order_id>/track` | order_id (path) | — | Returns id, status, tracking_steps. |
| POST | `/api/orders/<order_id>/cancel` | order_id (path) | — | Only pending/processing. |
| POST | `/api/coupons/validate` | code, subtotal | — | Returns valid, code, discountType, discountValue, discountAmount, message. |

---

## Admin (JWT + admin)

| Method | Path | Required | Optional | Notes |
|--------|------|----------|----------|--------|
| GET | `/api/admin/products` | — | search, code, category, sort, page | Returns products, total, pages, currentPage, **summary** (totalProducts, statusCounts, totalOrders, lowStockCount, activeOfferSlides). Per product: full to_dict + productNumber, totalStock, lowStockSizes, outOfStockSizes, orderCount, offerSlides. sort: newest, oldest, price-asc, price-desc, views, sales, rating, product-number. per_page 150. |
| GET | `/api/admin/products/<product_id>` | product_id (path) | — | Single product, same shape as one list item (for edit/detail). |
| POST | `/api/admin/products` | category, basePrice | name/nameAr/nameEn, descriptionAr/descriptionEn, discountPrice, tag, tagColor, status, featuresAr/featuresEn, variants | Code auto-generated. |
| PUT | `/api/admin/products/<product_id>` | product_id (path), category, basePrice | (same as create + variant id/images) | Full product update; send full variants array. |
| DELETE | `/api/admin/products/<product_id>` | product_id (path) | — | Deletes product + uploads folder. |
| PUT | `/api/admin/products/<product_id>/inventory` | product_id (path), variants | — | variants: [{ id, sizes [{ size, quantity }] }]. |
| POST | `/api/admin/products/upload-images` | productCode, colorName, image (file) | — | multipart/form-data. |
| GET | `/api/admin/categories` | — | — | All categories + sortOrder, productCount. |
| POST | `/api/admin/categories` | slug, nameAr, nameEn | sortOrder | Slug normalized. |
| PUT | `/api/admin/categories/<category_id>` | category_id (path) | slug, nameAr, nameEn, sortOrder | Slug change updates Product.category. |
| DELETE | `/api/admin/categories/<category_id>` | category_id (path) | — | 400 if products use category. |
| GET | `/api/admin/slides` | — | — | All slides by position. |
| POST | `/api/admin/slides` | title, image (file) | description, productId | productId optional. multipart/form-data. |
| PUT | `/api/admin/slides/<slide_id>` | slide_id (path) | title, description, productId, position, status, image (form) | JSON or multipart. |
| DELETE | `/api/admin/slides/<slide_id>` | slide_id (path) | — | — |
| GET | `/api/admin/customers` | — | page, perPage, search | Paginated users. |
| GET | `/api/admin/customers/<customer_id>` | customer_id (path) | — | Single customer; same shape as list item. |
| GET | `/api/admin/orders` | — | userId, status, startDate, endDate, search, page, perPage | userId = customer id (filter by customer). Dates ISO. |
| GET | `/api/admin/orders/<order_id>` | order_id (path) | — | Single order; same shape as list item. |
| PUT | `/api/admin/orders/<order_id>/status` | order_id (path), status | — | — |
| POST | `/api/admin/coupons` | discountType, discountValue, startDate, endDate | code, maxUses, status, specificUsers | specificUsers: [{ phone, maxUses }]. |
| PUT | `/api/admin/coupons/<coupon_id>` | coupon_id (path) | discountType, discountValue, maxUses, startDate, endDate, status, specificUsers | — |
| GET | `/api/admin/coupons` | — | status, search, type, page, perPage | type = discount_type. |
| DELETE | `/api/admin/coupons/<coupon_id>` | coupon_id (path) | — | Used → inactive; else delete. |
| GET | `/api/admin/coupons/stats` | — | — | Aggregates. |
| GET | `/api/admin/analytics/dashboard` | — | period | period: today, week, month, year, all. |
| GET | `/api/admin/settings` | — | — | JSON file. |
| PUT | `/api/admin/settings` | — | (any key from store settings) | Merge with existing. |

---

## Static / uploads

| Method | Path | Notes |
|--------|------|--------|
| GET | `/uploads/slides/<path:filename>` | Serves from SLIDES_FOLDER. |
| GET | `/uploads/<path:filename>` | UPLOAD_FOLDER; `slides/` delegated to serve_slide. |

---

## Example requests and responses

### POST /api/auth/login

**Request:**
```json
{ "phone": "01234567890" }
```

**Response (200):**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "uuid",
    "phone": "01234567890",
    "name": null,
    "role": "user",
    "isProfileComplete": false,
    "createdAt": "2025-01-01T00:00:00"
  }
}
```

**Error (400):** `{ "message": "Phone number is required" }`

---

### GET /api/products (with args)

**Request:** `GET /api/products?category=ac&sort=price-asc&page=1&minPrice=100&maxPrice=5000`

**Response (200):**
```json
{
  "products": [ { "id": "...", "name": "...", "basePrice": 1999, ... } ],
  "total": 42,
  "pages": 1,
  "currentPage": 1
}
```

---

### POST /api/orders

**Request (JWT required):**
```json
{
  "items": [
    { "variant_id": "variant-uuid", "size": "Large", "quantity": 2 }
  ],
  "addressId": "address-uuid",
  "paymentMethod": "cod",
  "coupon": "SAVE10"
}
```

**Response (201):**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "order-id",
    "subtotal": 3998,
    "shipping": 0,
    "discount": 400,
    "total": 3598,
    "status": "pending",
    "coupon": { "code": "SAVE10", "discountType": "percentage", "discountValue": 10, "discountAmount": 400 }
  }
}
```

**Error (400):** e.g. `{ "message": "No delivery address found. Please add an address." }` or `{ "message": "Insufficient inventory for ..." }`

---

### POST /api/coupons/validate

**Request (JWT required):**
```json
{ "code": "SAVE10", "subtotal": 5000 }
```

**Response (200):**
```json
{
  "valid": true,
  "code": "SAVE10",
  "discountType": "percentage",
  "discountValue": 10,
  "discountAmount": 500,
  "message": "Coupon applied successfully"
}
```

**Error (400):** `{ "valid": false, "message": "..." }` or `{ "message": "..." }`  
**Error (404):** `{ "valid": false, "message": "هذا الكوبون غير صالح للاستخدام" }`

---

### GET /api/orders/<order_id>/track

**Response (200):**
```json
{
  "id": "order-id",
  "status": "pending",
  "tracking_steps": [
    { "status": "pending", "description": "تم استلام طلبك بنجاح", "timestamp": "2025-01-01T12:00:00", "completed": false }
  ]
}
```

Note: Backend returns `id`, not `order_id`. Frontend should accept both for compatibility.
