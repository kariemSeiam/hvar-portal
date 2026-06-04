## Risks — 2026-04-04

**Risk 1: Single-file backend (3450 lines)** — `project/backend/app.py` contains every model, route, helper, cache, and config in one file. Any change risks breaking unrelated endpoints. No module separation means no isolated testing, no targeted imports, high merge-conflict surface.

**Risk 2: Print-based error handling** — 8+ `print()` statements used for error logging in production (`get_admin_products`, `get_products`, `get_public_slides`, `login`, `get_favorites`, `create_order`). No structured logging, no log levels, no file/syslog output. Errors are invisible in production (gunicorn swallows stdout).

**Risk 3: No migration system** — Schema evolves via inline `_ensure_*` functions (e.g. `_ensure_offer_slide_placement_column()`). No Alembic, no versioned migrations. Deploying to a new instance or rolling back is manual and error-prone. `db.create_all()` in `init_db()` only adds tables, never alters columns.

**Risk 4: OTP login has no actual OTP** — `POST /api/auth/login` accepts only a phone number. No SMS provider, no code verification, no rate limiting. Anyone who knows a user's phone number can log in as them. The `0000000000` admin backdoor auto-escalates any login attempt to admin.

**Risk 5: SQLite in production** — `wilson.db` at repo root with WAL mode. Works for low traffic but has no connection pooling beyond SQLAlchemy's pool config (which is moot for SQLite). No read replicas, no horizontal scaling. The `deploy/pythonanywhere/` bundle confirms this is the production database.

**TODOs in critical paths:** None found (no TODO/FIXME/HACK comments in app.py).
