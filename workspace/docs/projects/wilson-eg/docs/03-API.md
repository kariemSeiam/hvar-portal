# API Reference

> All API endpoints for the Wilson Egypt Flask backend.

---

## Base URL

Development: `http://127.0.0.1:5004/api`

Authentication: JWT via `login` endpoint, token in `Authorization: Bearer <token>` header.

---

## Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Phone-based login/register — returns JWT (30-day) |
| GET | `/api/me` | Current user profile |
| PUT | `/api/me` | Update profile |
| GET | `/api/me/addresses` | User addresses |
| POST | `/api/me/addresses` | Add address |
| PUT | `/api/me/addresses/:id` | Update address |
| DELETE | `/api/me/addresses/:id` | Delete address |

---

## Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (paginated, filterable) |
| GET | `/api/products/:id` | Product detail with variants |
| GET | `/api/products/search` | Search products |
| GET | `/api/products/featured` | Featured products for homepage |
| GET | `/api/products/bestsellers` | Best-selling products |
| GET | `/api/categories` | List categories |
| GET | `/api/categories/:id/products` | Products by category |

### Product Filters
```
GET /api/products?category=stoves&min_price=10000&max_price=20000&sort=price_asc&page=1&per_page=20
```

### Product Response Shape
```json
{
  "id": 1,
  "name_ar": "ديب فريزر ويلسن WF240",
  "name_en": "Wilson Deep Freezer WF240",
  "slug": "wilson-deep-freezer-wf240",
  "category": "freezers",
  "base_price": 10300,
  "discount_price": null,
  "rating": 4.5,
  "rating_count": 10,
  "stock_status": "in_stock",
  "images": ["/uploads/products/freezers/wf240-1.jpg"],
  "variants": [
    {
      "id": 1,
      "specs": {"capacity": "240L", "color": "White"},
      "price_modifier": 0,
      "in_stock": true,
      "quantity": 5
    }
  ],
  "specs": {
    "model": "WF240",
    "capacity": "240L",
    "motor": "LG",
    "warranty_years": 5,
    "warranty_type": "full"
  },
  "features_ar": ["موتور LG", "إضاءة داخلية", "ضمان 5 سنوات"],
  "features_en": ["LG Motor", "Internal lighting", "5-year warranty"],
  "description_ar": "ديب فريزر أفقي بقدرة 240 لتر...",
  "description_en": "Horizontal deep freezer 240L capacity..."
}
```

---

## Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | User's orders |
| GET | `/api/orders/:id` | Order detail with items |
| POST | `/api/orders` | Create order |
| PUT | `/api/orders/:id/status` | Update order status |
| GET | `/api/orders/:id/tracking` | Order tracking timeline |

### Order Post Body
```json
{
  "items": [
    {"variant_id": 1, "quantity": 1}
  ],
  "address_id": 1,
  "payment_method": "cod",
  "notes": ""
}
```

---

## Favorites (Wishlist)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites` | User's wishlist |
| POST | `/api/favorites/toggle` | Toggle product favorite |
| GET | `/api/favorites/check/:productId` | Check if favorited |

---

## Coupons

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/coupons/validate` | Validate coupon code |
| GET | `/api/coupons` | List coupons (admin) |
| POST | `/api/coupons` | Create coupon (admin) |
| PUT | `/api/coupons/:id` | Update coupon (admin) |
| DELETE | `/api/coupons/:id` | Delete coupon (admin) |
| GET | `/api/coupons/statistics` | Coupon usage stats (admin) |

---

## Slides (Hero)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/slides` | Public slides |
| GET | `/api/slides/admin` | All slides (admin) |
| POST | `/api/slides` | Create slide (admin) |
| PUT | `/api/slides/:id` | Update slide (admin) |
| DELETE | `/api/slides/:id` | Delete slide (admin) |

---

## Admin Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard metrics |
| GET | `/api/admin/analytics` | Period analytics (sales, orders, customers) |
| GET | `/api/admin/top-products` | Top selling products |

### Dashboard Response
```json
{
  "total_orders": 156,
  "total_revenue": 1250000,
  "total_customers": 89,
  "pending_orders": 12,
  "orders_by_status": {"pending": 12, "confirmed": 34, "shipped": 45, "delivered": 50, "cancelled": 15},
  "revenue_today": 25000,
  "revenue_this_week": 180000,
  "revenue_this_month": 520000,
  "top_products": [...]
}
```

---

## Product Data Model (Appliance-Specific)

### Fields Added for Appliances

| Field | Type | Example |
|-------|------|---------|
| `energy_rating` | String | "A+", "A++" |
| `voltage_range` | String | "180-260V" |
| `capacity_liters` | Integer | 240 |
| `dimensions` | String | "60x90 cm" |
| `warranty_years` | Integer | 5 |
| `warranty_type` | String | "full", "compressor", "motor" |
| `installation_included` | Boolean | true |
| `delivery_free` | Boolean | true |

### Variant Spec (replaces shoe sizes)
```json
{
  "spec_type": "capacity",
  "spec_value": "340L",
  "in_stock": true,
  "quantity": 3
}
```
