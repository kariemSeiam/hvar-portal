## Nervous System — 2026-04-04

**API surface** (all under `/api/*`, Flask app at `project/backend/app.py:3450 lines`):

| Prefix | Purpose | Auth |
|--------|---------|------|
| `GET /api/products` | Product listing — cached (LRU 60s), paginated, filtered | None |
| `GET /api/products/<id|code>` | Product detail — increments view count | None |
| `GET /api/categories` | Category list | None |
| `GET /api/categories/<slug>` | Single category | None |
| `GET /api/slides` | Hero/offer carousel — cached (LRU 300s) | None |
| `POST /api/auth/login` | Phone-based OTP login (no password) | None |
| `GET /api/profile` | User profile + addresses + orders | Required |
| `PUT /api/profile` | Update name | Required |
| `POST /api/addresses` | Add shipping address | Required |
| `PUT/DELETE /api/addresses/<id>` | Manage addresses | Required |
| `POST /api/favorites` | Toggle favorite | Required |
| `GET /api/favorites` | List favorites | Required |
| `POST /api/orders` | Checkout — locks inventory, validates stock, applies coupons | Required |
| `GET /api/orders` | User's order history | Required |
| `GET /api/orders/<id>/track` | Track single order | Required |
| `POST /api/orders/<id>/cancel` | Cancel order (if pending) | Required |
| `POST /api/coupons/validate` | Validate coupon code | Required |
| `POST /api/contact` | Contact form submission | None |
| `GET/POST/PUT/DELETE /api/admin/products` | Product CRUD | Admin |
| `PUT /api/admin/products/<id>/inventory` | Update stock | Admin |
| `POST /api/admin/products/upload-images` | Image upload with validation | Admin |
| `GET/POST/PUT/DELETE /api/admin/categories` | Category CRUD | Admin |
| `GET/POST/PUT/DELETE /api/admin/slides` | Hero slides CRUD | Admin |
| `GET /api/admin/customers` | Customer list with order stats | Admin |
| `GET/PUT /api/admin/orders/<id>` | View/update order status | Admin |
| `GET/POST/PUT/DELETE /api/admin/coupons` | Coupon management | Admin |
| `GET /api/admin/coupons/stats` | Coupon usage stats | Admin |
| `GET /api/admin/analytics/dashboard` | Dashboard metrics (revenue, orders, top products) | Admin |
| `GET/PUT /api/admin/settings` | Store settings | Admin |

**Static serving:**
- `/uploads/<path>` — product images, slides
- `/uploads/slides/<path>` — slide images (separate route for path resolution)

**Internal events:** None. No event emitters, no pub/sub, no signals beyond Flask's `@event.listens_for(Engine, "connect")` for SQLite pragmas.

**External integrations:** None. No payment gateways, no email services, no SMS providers, no webhooks. OTP login is simulated (no actual SMS send — phone-only auth with auto-create).

**Async patterns:** None. Fully synchronous request-response. No Celery, no cron, no background workers. Database auto-initializes on first request via `init_db()` at line 3432.
