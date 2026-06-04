# HVAR CRM — Memory Log

## 2026-04-15 — 500 Internal Server Error: Missing cryptography Package
- **Decision/Fix:** `pip install cryptography` in venv
- **Why:** MySQL uses `caching_sha2_password` auth. `pymysql` needs the `cryptography` package for RSA encryption during authentication. Without it, every DB call throws `ConnectionError`.
- **Context:** Affects all API routes that hit the database. Root `/` works because it serves the static frontend. The error surfaces as 500 on login and ERP sync worker.
- **Never do:** Forget to include `cryptography` in requirements or assume `pymysql` alone is sufficient for MySQL 8+ auth.
