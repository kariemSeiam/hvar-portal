# API Verification Checklist

Use this to confirm each endpoint works with minimal, full, and edge/invalid requests. Fill **Result** and **Notes** as you run checks.

| Endpoint | Minimal request | Full args request | Edge/invalid request | Result | Notes |
|----------|-----------------|-------------------|----------------------|--------|--------|
| GET /api/products | `?page=1` | `?category=ac&search=x&minPrice=100&maxPrice=5000&size=M&color=Red&code=COD-&sort=price-asc&page=2` | `?page=0` (normalized to 1), `?sort=invalid` (falls back) | | |
| GET /api/products/<id> | `GET /api/products/<valid-uuid>` | Same (no query) | Non-existent id → 404 | | |
| GET /api/categories | `GET /api/categories` | — | — | | |
| GET /api/categories/<slug> | `GET /api/categories/ac` | — | Bad slug → 404 | | |
| GET /api/slides | `GET /api/slides` | — | — | | |
| POST /api/auth/login | `{"phone":"01234567890"}` | — | `{}` → 400 | | |
| POST /api/contact | `{"name":"A","phone":"0","message":"Hi"}` | — | Missing field → 400 | | |
| GET /api/profile | With JWT | — | No JWT → 401 | | |
| PUT /api/profile | With JWT, `{"name":"X"}` | — | Empty body / no JSON → handle | | |
| POST /api/addresses | JWT + `{"governorate":"Cairo","district":"X","details":"Y"}` | — | Missing field → 400 | | |
| PUT /api/addresses/<id> | JWT + path + `{"district":"Y"}` | All body fields | Wrong user → 404 | | |
| DELETE /api/addresses/<id> | JWT + path | — | Wrong user → 404 | | |
| POST /api/favorites | JWT + `{"product_id":"<id>"}` | — | No product_id → 400; bad product_id → 404 | | |
| GET /api/favorites | JWT | `?page=1&perPage=20` | perPage>50 capped | | |
| GET /api/favorites/<product_id>/status | JWT + path | — | Bad product_id → 404 | | |
| POST /api/orders | JWT + `{"items":[{"variant_id":"x","size":"M","quantity":1}]}` (and address) | addressId, paymentMethod, coupon | No items / bad variant → 400/404 | | |
| GET /api/orders | JWT | `?page=1&perPage=20` | — | | |
| GET /api/orders/<id>/track | JWT + path | — | Wrong user → 404 | | |
| POST /api/orders/<id>/cancel | JWT + path | — | Wrong user → 404; status not cancellable → 400 | | |
| POST /api/coupons/validate | JWT + `{"code":"X","subtotal":100}` | — | Missing code/subtotal → 400; invalid code → 404/400 | | |
| GET /api/admin/products | Admin JWT | search, code, sort, page | No admin → 401 | | |
| POST /api/admin/products | Admin JWT + category, basePrice, name | Full body with variants/features | Missing required → 500/400 | | |
| PUT /api/admin/products/<id> | Admin JWT + path + body | Full body | 404 if product missing | | |
| DELETE /api/admin/products/<id> | Admin JWT + path | — | 404 if missing | | |
| PUT /api/admin/products/<id>/inventory | Admin JWT + path + `{"variants":[...]}` | — | Invalid variant/size shape → 400 | | |
| POST /api/admin/products/upload-images | Admin JWT + form: productCode, colorName, image | — | Missing field / no file → 400 | | |
| GET /api/admin/categories | Admin JWT | — | — | | |
| POST /api/admin/categories | Admin JWT + slug, nameAr, nameEn | icon, sortOrder | Duplicate slug → 400 | | |
| PUT /api/admin/categories/<id> | Admin JWT + path + slug/nameAr/nameEn | — | 404; duplicate slug → 400 | | |
| DELETE /api/admin/categories/<id> | Admin JWT + path | — | Products use category → 400 | | |
| GET /api/admin/slides | Admin JWT | — | — | | |
| POST /api/admin/slides | Admin JWT + form: title, image | description, productId, placement | No image / wrong content-type → 400 | | |
| PUT /api/admin/slides/<id> | Admin JWT + path + JSON body (title, etc.) | Form with image | — | | |
| DELETE /api/admin/slides/<id> | Admin JWT + path | — | 404 | | |
| GET /api/admin/customers | Admin JWT | page, perPage, search | — | | |
| GET /api/admin/orders | Admin JWT | status, startDate, endDate, search, page, perPage | Invalid date format → 400 | pass | startDate/endDate validated; 400 on invalid ISO. |
| PUT /api/admin/orders/<id>/status | Admin JWT + path + `{"status":"processing"}` | — | 404; invalid status → handle | | |
| POST /api/admin/coupons | Admin JWT + discountType, discountValue, startDate, endDate | code, maxUses, status, specificUsers | Duplicate code → 400 | | |
| PUT /api/admin/coupons/<id> | Admin JWT + path + body fields | — | 404 | | |
| GET /api/admin/coupons | Admin JWT | status, search, type, page, perPage | — | | |
| DELETE /api/admin/coupons/<id> | Admin JWT + path | — | Used → 200 + deactivated | | |
| GET /api/admin/coupons/stats | Admin JWT | — | — | | |
| GET /api/admin/analytics/dashboard | Admin JWT | period (today/week/month/year/all) | — | | |
| GET /api/admin/settings | Admin JWT | — | — | | |
| PUT /api/admin/settings | Admin JWT + body (partial keys) | — | Empty body → 400 | | |
| GET /uploads/slides/<path> | — | — | Missing file → 404 | | |
| GET /uploads/<path> | — | — | Missing file → 404 | | |

After running: update **Result** (pass/fail) and **Notes** (e.g. "date 400 fixed", "order create 400 for missing items").

**Resolved:** Order create validates items (400 if missing/empty). Admin orders date parsing returns 400 on invalid ISO. Profile PUT, addresses POST/PUT, favorites POST, order status PUT use get_json(silent=True) and return 400 on invalid/missing body. SQLAlchemy: User/Category/Product/Variant use db.session.get(); totalOrders uses count(distinct(product_id)) for SQLite.
