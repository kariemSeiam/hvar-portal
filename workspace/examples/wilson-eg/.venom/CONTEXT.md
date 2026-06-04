# Wilson Egypt — Context

**Stack:** Python 3.x + Flask 2.3+ (backend, 3450-line single file), React 18 + Vite 5 + TypeScript + Tailwind + shadcn/ui (frontend). SQLite with WAL mode. PyJWT for auth. Gunicorn for production. Deployed on PythonAnywhere.

**Structure:** `project/backend/app.py` — entire Flask API (models, routes, helpers inline). `project/frontend/` — React SPA with ~15 pages, React Query, React Router, Zod validation. `deploy/pythonanywhere/` — production bundle. `scripts/` — seeders, scrapers, admin tools. `tests/` — single unittest file covering ~20 API endpoints.

**Hot paths:** `GET /api/products` (line 1067) — product listing with LRU cache (60s TTL), joinedload eager-loading, pagination. Runs on every storefront visit. `POST /api/orders` (line 2349) — checkout flow: locks inventory with `with_for_update()`, validates stock, calculates shipping/coupons, creates order + tracking in single transaction. `POST /api/auth/login` (line 1904) — phone-only auth, auto-creates users, no OTP verification.

**Conventions:** UUID string IDs. Bilingual AR/EN fields on products and categories. Product code auto-generated as `COD-NNNNNN`. `Product.category` is a plain string (not FK). Error handling via `print()` statements, no structured logging. Synchronous only — no async, no background jobs. Frontend uses axios + React Query for data fetching.

**Risks:**
1. Phone-only login with no OTP verification — anyone with a phone number can impersonate that user
2. Admin backdoor: phone `0000000000` auto-escalates to admin role
3. Single-file backend (3450 lines) — no module separation, high change-risk surface
4. No migration system — schema evolves via inline `_ensure_*` functions
5. Print-based error handling invisible in production (gunicorn swallows stdout)

**Last eaten:** 2026-04-04
