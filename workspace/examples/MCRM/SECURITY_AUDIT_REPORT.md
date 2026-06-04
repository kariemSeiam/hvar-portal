# 🔴 MCRM Backend Security Audit Report

**Date:** 2026-05-11  
**Scope:** `/root/Hvar-Hub/app/` — Full Flask/Python backend  
**Auditor:** Hermes Agent (Automated)  
**Production URL:** mcrm.hvarstore.com  

---

## CRITICAL — Immediate Exploitation Possible

### C1. Plaintext Password Storage
- **Files:** `app/api/auth_api.py` lines 48, 89, 151, 220
- **Description:** Passwords are stored and compared as **plaintext** in the MySQL `users` table. No hashing algorithm (bcrypt, argon2, pbkdf2, or werkzeug `generate_password_hash`) is used anywhere in the codebase. Login compares `user['password'] != password` directly. Registration stores passwords via `INSERT INTO users (phone, password, name, role) VALUES (%s, %s, %s, %s)`. Password reset sets `password = %s` directly.
- **Impact:** Any database read (SQL injection, backup leak, insider threat, DB compromise) instantly reveals all user passwords. Cross-service credential reuse attacks become trivial.
- **PoC:** `SELECT phone, password, name, role FROM users` returns all plaintext passwords.
- **Fix:** Hash all passwords with `werkzeug.security.generate_password_hash()` on insert/reset. Compare with `check_password_hash()`. Run a one-time migration to hash existing passwords.

### C2. No Authentication on API Endpoints (Header Spoofing)
- **Files:** `app/__init__.py` (all blueprints), `app/api/auth_api.py` line 16-21, ALL API files
- **Description:** The system uses `X-User-Phone` and `X-User-Id` headers for identity, but there is **no JWT, session token, or any server-side validation**. The `_require_admin()` function in `auth_api.py` simply reads `request.headers.get('X-User-Phone')` and compares it to a hardcoded admin phone. **No endpoint** (except admin-only ones) checks any auth header at all. The login endpoint returns user data without issuing any token.
- **Impact:** Any unauthenticated user can call ANY endpoint (create tickets, modify stock, receive packages, dispatch orders, adjust quantities, create customers) by simply not sending auth headers — the endpoints don't check them. The admin check can be bypassed by setting `X-User-Phone: 01033939828`.
- **PoC:** `curl -X POST https://mcrm.hvarstore.com/api/tickets/create -H "Content-Type: application/json" -d '{"type":"maintenance","name":"test","phone":"01111111111","user_id":1}'` — creates a ticket with no auth. `curl -X GET https://mcrm.hvarstore.com/api/auth/users -H "X-User-Phone: 01033939828"` — bypasses admin check.
- **Fix:** Implement JWT-based authentication. Login should issue a signed JWT. A `@login_required` decorator should validate the JWT on every protected endpoint. The admin check should verify a `role` claim from the JWT, not a spoofable header.

### C3. Admin Phone Hardcoded in Source Code
- **File:** `app/api/auth_api.py` line 13
- **Description:** `ADMIN_PHONE = '01033939828'` is hardcoded. This is the sole admin identifier. Combined with C2 (header spoofing), anyone who knows this phone number (which is in the source code) gains full admin access.
- **Impact:** Full admin compromise — list all users (with plaintext passwords!), create users, delete users, reset passwords.
- **PoC:** `curl -H "X-User-Phone: 01033939828" https://mcrm.hvarstore.com/api/auth/users` returns all users with passwords.
- **Fix:** Remove hardcoded admin phone. Use database-backed role checks verified via JWT claims. Store admin role in the `users` table `role` column.

---

## HIGH — Significant Risk

### H1. Plaintext Passwords Exposed in API Responses
- **File:** `app/api/auth_api.py` lines 110-121 (list_users), 155-164 (create_user)
- **Description:** The `GET /api/auth/users` endpoint explicitly returns `"password": r['password']` in the response for every user. The `POST /api/auth/users` (create user) also returns `"password": user['password']`.
- **Impact:** Admin API response leaks all user passwords in plaintext. If logs, browser dev tools, or any proxy captures this response, all credentials are exposed.
- **Fix:** Never include `password` in any API response. Remove the `password` field from all response serialization (lines 115, 161).

### H2. No Rate Limiting on Any Endpoint
- **Files:** All API files — no rate limiting library imported or configured anywhere
- **Description:** There is zero rate limiting on login, registration, password reset, or any API endpoint. No `flask-limiter`, no custom rate check, no nginx-level limiting detected.
- **Impact:** Brute-force attacks on login are trivial. An attacker can try thousands of password combinations per second. Registration endpoint can be abused to create unlimited accounts. ERP proxy endpoint can be abused for credential stuffing against the ERP system.
- **Fix:** Implement `flask-limiter` with at minimum: 5 login attempts/minute per IP, 3 registration attempts/hour per IP, 100 general API requests/minute per IP.

### H3. No Authentication on Hub Operations (Receive/Dispatch/Complete)
- **File:** `app/api/hub_api.py` lines 120-266
- **Description:** `POST /api/hub/scan/receive`, `POST /api/hub/scan/dispatch`, `POST /api/hub/workshop/complete`, `POST /api/hub/workshop/mark-ready` — none check any authentication. Anyone can receive, dispatch, complete maintenance, or mark tickets ready.
- **Impact:** An attacker could receive non-existent packages, dispatch items to wrong addresses, or fraudulently complete maintenance tickets. This could disrupt physical warehouse operations.
- **Fix:** Add `@login_required` decorator with role check (e.g., `hub` role required).

### H4. No Authentication on Stock Management
- **File:** `app/api/stock_api.py` (all endpoints)
- **Description:** Stock items can be created, updated, deleted, and quantities adjusted without any authentication.
- **Impact:** An attacker could delete all stock items, set quantities to negative values, or create phantom inventory.
- **Fix:** Add `@login_required` with appropriate role checks for stock operations.

### H5. No Authentication on Ticket Creation and Management
- **File:** `app/api/service_api.py` (all endpoints)
- **Description:** Tickets can be created, confirmed, cancelled, and actioned without any authentication check.
- **Impact:** An attacker could create fraudulent tickets, confirm fake replacements, or cancel legitimate service tickets.
- **Fix:** Add `@login_required` decorator. Validate that the user performing actions has appropriate role.

### H6. No Authentication on Customer Data
- **File:** `app/api/customer_api.py` (all endpoints)
- **Description:** All customer data (names, phones, addresses, order history) is accessible without authentication. Customer search triggers Bosta API calls without auth.
- **Impact:** Complete customer PII exposure — names, phone numbers, addresses, order history for all customers.
- **Fix:** Add `@login_required` decorator to all customer endpoints.

### H7. ERP Credentials Passed in GET Query Parameters
- **File:** `app/api/erp_api.py` lines 159-161
- **Description:** `GET /api/erp/drafts` accepts `username` and `password` as **query parameters**: `request.args.get('username')` and `request.args.get('password')`. These appear in server logs, browser history, proxy logs, and referrer headers.
- **Impact:** ERP credentials logged in plaintext across multiple systems. Credentials visible in URLs.
- **Fix:** Accept ERP credentials only in POST request body. Better yet, use server-side stored credentials (via environment variables) and require MCRM auth to access the endpoint.

### H8. SSL Verification Disabled for ERP Connection
- **File:** `app/api/erp_api.py` lines 11, 57, 74, 121, 139
- **Description:** `urllib3.disable_warnings()` is called globally. All ERP requests use `verify=False`, disabling SSL certificate verification.
- **Impact:** Man-in-the-middle attacks on the ERP connection. An attacker on the network could intercept ERP credentials and data.
- **Fix:** Use a proper SSL certificate for the ERP server, or pin the self-signed certificate. Remove `verify=False`.

---

## MEDIUM — Should Fix

### M1. Weak Default SECRET_KEY
- **File:** `app/config.py` line 26
- **Description:** `SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-change-in-production'` — if the env var is missing, a well-known default is used. While currently JWT isn't implemented, this key would be used for session signing, CSRF protection, etc.
- **Impact:** If JWT or Flask sessions are implemented later without changing this, tokens can be forged.
- **Fix:** Make `SECRET_KEY` required via `_required('SECRET_KEY')`. Fail fast if missing.

### M2. No Input Length Validation
- **Files:** All API endpoints
- **Description:** No endpoint validates string length. Notes, names, addresses, phone numbers — all accept arbitrarily long strings. The `validate_string_length` utility exists in `validators.py` but is never called in any endpoint.
- **Impact:** Potential DoS via extremely large JSON payloads. Database storage bloat.
- **Fix:** Add max-length validation on all string inputs. Use `validate_string_length()` from validators.py. Add a global request size limit.

### M3. No Numeric Validation on Quantity Fields
- **Files:** `app/api/stock_api.py`, `app/api/hub_api.py`, `app/services/stock_manager.py`
- **Description:** Quantity fields (`quantity_on_hand`, `quantity_delta`, `quantity_needed`) accept any value from the API. While the DB likely enforces integer types, there's no application-level validation for negative quantities or unreasonably large values.
- **Impact:** Negative stock adjustments could be used to drain inventory. Extremely large values could cause integer overflow or excessive DB operations.
- **Fix:** Validate all quantity inputs are non-negative integers with reasonable bounds.

### M4. Customer Search LIKE Injection (Low Risk — Parameterized)
- **File:** `app/models/customer.py` lines 261, 267, 271, 277
- **Description:** Customer search uses `f"%{query}%"` for LIKE patterns. While the query itself is parameterized (safe from SQL injection), the `%` and `_` characters in user input are not escaped. A user searching for `%` or `_` would get unexpected LIKE matches.
- **Impact:** Minor — unexpected search results, not a security breach since queries are parameterized.
- **Fix:** Escape LIKE wildcard characters in user input before constructing LIKE patterns.

### M5. Database User/Version Exposed in Health Endpoint
- **File:** `app/__init__.py` lines 148-154
- **Description:** `GET /api/health/db` returns `user` (DB connection user) and `version` (MySQL version) in the response. No authentication required.
- **Impact:** Information disclosure — reveals DB user account name and exact MySQL version for targeted attacks.
- **Fix:** Remove `user` and `version` from the response, or require authentication for the detailed health check.

### M6. Exception Details Leaked in Error Responses
- **Files:** Multiple — `app/api/hub_api.py` lines 158, 188, 198, 207, 237, 266; `app/api/customer_api.py` lines 102, 145, 162, 339; `app/api/erp_api.py` line 299; `app/api/bosta_service.py` line 273
- **Description:** Many endpoints return `str(e)` directly in error responses: `jsonify({"error": str(e)})`. This can expose stack traces, SQL errors, file paths, and internal implementation details.
- **Impact:** Information disclosure aids attackers in understanding the system's internals. SQL error messages can reveal table/column names.
- **Fix:** Catch all exceptions and return generic error messages. Log the full exception server-side only.

### M7. Bosta API Token Logged in Plain Text
- **File:** `app/services/bosta_service.py` line 218
- **Description:** `logger.info(f"Bosta API request to {url}: {json.dumps(payload, indent=2)}")` — while this doesn't log the token directly, the headers (containing the token) could appear in debug logs. The token is stored in environment variables which is correct, but the `get_headers()` method constructs auth headers.
- **Impact:** If logs are accessible, the Bosta API token could be extracted.
- **Fix:** Ensure auth headers are never logged. Audit all logging statements for sensitive data.

### M8. No Password Strength Validation
- **File:** `app/api/auth_api.py` lines 33-35, 73-74, 133-134, 211
- **Description:** Passwords are validated only for non-empty strings. No minimum length, complexity, or common password checks.
- **Impact:** Users can set trivially weak passwords (e.g., "1", "a", "123").
- **Fix:** Enforce minimum 8 characters, require mix of characters.

### M9. No Password Change for Current User
- **File:** `app/api/auth_api.py`
- **Description:** There is no endpoint for a user to change their own password. Only admin can reset passwords via `PATCH /api/auth/users/:id/reset-password`. Users must contact admin to change their password.
- **Impact:** Poor security hygiene — users can't rotate compromised credentials.
- **Fix:** Add a `PATCH /api/auth/change-password` endpoint that requires current password verification.

### M10. No Input Validation on `user_id` Field
- **Files:** All endpoints accepting `user_id`
- **Description:** The `user_id` parameter is passed directly from request JSON to database operations and service managers without verifying the user exists or matches the authenticated user.
- **Impact:** A user could attribute actions to other users, or use non-existent user IDs.
- **Fix:** Validate `user_id` exists in the `users` table. For non-admin endpoints, ensure `user_id` matches the authenticated user.

### M11. CORS Configuration Has No Wildcard Protection
- **File:** `app/__init__.py` lines 22-28
- **Description:** CORS origins are properly restricted to specific domains (good). However, `supports_credentials=True` combined with specific origins is correct. This is noted as a positive finding — CORS is properly configured. However, the `http://mcrm.hvarstore.com` (non-HTTPS) origin is allowed, which weakens the protection.
- **Impact:** If an attacker can perform a MITM on HTTP, they can make credentialed cross-origin requests.
- **Fix:** Remove `http://mcrm.hvarstore.com` from allowed origins. Use HTTPS only.

### M12. `send_file` for Static Assets Without Sanitization
- **File:** `app/__init__.py` lines 190-197, 201-222
- **Description:** The `serve_assets` and `serve_frontend` routes use `send_from_directory` which has built-in path traversal protection. However, the catch-all route at line 201 accepts arbitrary paths. While `send_from_directory` prevents traversal, it's worth verifying.
- **Impact:** Low — `send_from_directory` is safe by default. No path traversal vulnerability found.
- **Fix:** No immediate action needed, but consider adding explicit path validation for defense-in-depth.

---

## LOW — Best Practice

### L1. No Automated Tests
- **Description:** No test files found in the repository. No pytest, unittest, or integration tests exist.
- **Fix:** Add unit tests for authentication, input validation, and authorization logic.

### L2. No Request Size Limit
- **Description:** Flask default `MAX_CONTENT_LENGTH` is not set. Extremely large JSON payloads could be sent.
- **Fix:** Set `app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024` (1MB).

### L3. No Security Headers
- **Description:** No `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, `Strict-Transport-Security` headers are set.
- **Fix:** Use `flask-talisman` or add headers via `@app.after_request`.

### L4. No Audit Logging
- **Description:** Sensitive operations (ticket creation, stock adjustment, user management) are logged with Python's `logging` module but there's no structured audit trail with user identification.
- **Fix:** Implement structured audit logging that captures user_id, action, resource, timestamp, and IP address.

### L5. Database Connection Logs Credentials on Failure
- **File:** `app/utils/db.py` line 29
- **Description:** `logger.info(f"Database connection established to {host}:{port}")` — this is fine, but error messages on lines 37-48 include the DB user and host.
- **Fix:** Reduce logging verbosity for connection errors. Don't log credentials.

### L6. `traceback.print_exc()` in Production Code
- **File:** `app/services/bosta_service.py` line 273
- **Description:** `traceback.print_exc()` outputs to stdout/stderr. In production, this could end up in logs with full stack traces.
- **Fix:** Use `logger.exception()` instead, which respects log levels.

### L7. ERP Sync Worker Stores State in Memory
- **File:** `app/workers/erp_sync_worker.py` lines 14-15
- **Description:** Sync job state is stored in an in-memory dict. If the process restarts, all job state is lost.
- **Fix:** For a single-process deployment this is acceptable. Consider Redis or DB storage for multi-process deployments.

### L8. No Input Sanitization on `name` Fields
- **Description:** Customer names and notes accept any characters including HTML/JavaScript. If data is ever rendered in a web view without escaping, this could lead to stored XSS.
- **Impact:** Currently low since the API returns JSON (not HTML). Frontend must handle escaping.
- **Fix:** Frontend should use React's built-in XSS protection. Consider server-side sanitization for defense-in-depth.

---

## Summary Statistics

| Severity | Count | Key Themes |
|----------|-------|------------|
| **CRITICAL** | 3 | Plaintext passwords, no auth, hardcoded admin |
| **HIGH** | 8 | No auth on all endpoints, no rate limiting, credential exposure |
| **MEDIUM** | 12 | Input validation, info disclosure, weak defaults |
| **LOW** | 8 | No tests, no security headers, logging issues |

## Positive Findings

1. ✅ **No SQL injection** — All SQL queries use parameterized queries via pymysql's `%s` placeholders. Dynamic SQL in models builds column names from trusted sources (hardcoded lists), not user input.
2. ✅ **CORS properly configured** — Specific origin allowlist, no wildcard `*`.
3. ✅ **`.env` in `.gitignore`** — Secrets not committed to repository.
4. ✅ **No file upload endpoints** — No path traversal risk.
5. ✅ **`send_from_directory`** used safely for static files.
6. ✅ **Phone normalization** — Consistent phone number handling reduces data quality issues.
7. ✅ **Transaction management** — Critical operations use database transactions.
8. ✅ **Input validation utilities exist** — `validators.py` has comprehensive validators, they're just not consistently used.

## Priority Remediation Order

1. **IMMEDIATE:** Implement JWT authentication (C2) — this single fix addresses C2, C3, H3, H4, H5, H6
2. **IMMEDIATE:** Hash all passwords (C1) — migration script + update login/register/reset
3. **TODAY:** Remove password from API responses (H1)
4. **THIS WEEK:** Add rate limiting (H2) — especially on login
5. **THIS WEEK:** Fix ERP credential handling (H7, H8)
6. **NEXT SPRINT:** Input validation (M2, M3, M8, M10)
7. **NEXT SPRINT:** Security headers and error handling (M6, L3)
8. **ONGOING:** Add tests (L1), audit logging (L4)
