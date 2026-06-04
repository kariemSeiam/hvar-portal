# Local setup

Prerequisites: Python 3.8+, Node.js 18+, MySQL 8.0.

---

## 1. MySQL

**Windows:** Service name is often `MySQL84` (not MySQL80). `net start MySQL84` or `Start-Service MySQL84`.

**Create DB and user:**

```sql
CREATE DATABASE IF NOT EXISTS mcrm_hvar_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'mcrm_hvar_user'@'localhost' IDENTIFIED WITH mysql_native_password BY '1618';
CREATE USER IF NOT EXISTS 'mcrm_hvar_user'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY '1618';
GRANT ALL PRIVILEGES ON mcrm_hvar_hub.* TO 'mcrm_hvar_user'@'localhost';
GRANT ALL PRIVILEGES ON mcrm_hvar_hub.* TO 'mcrm_hvar_user'@'127.0.0.1';
FLUSH PRIVILEGES;
```

**If you get error 2013 "Lost connection during query":** Your user may use `caching_sha2_password`. Switch to `mysql_native_password`:

```sql
ALTER USER 'mcrm_hvar_user'@'localhost' IDENTIFIED WITH mysql_native_password BY '1618';
ALTER USER 'mcrm_hvar_user'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY '1618';
FLUSH PRIVILEGES;
```

---

## 2. Dependencies

```bash
pip install -r requirements.txt
cd front && npm install && cd ..
```

---

## 3. Config

Root `.env` — copy from `.env.example` or create with:

```env
FLASK_ENV=development
SECRET_KEY=your_secret_key
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=mcrm_hvar_user
DATABASE_PASSWORD=1618
DATABASE_NAME=mcrm_hvar_hub
BOSTA_API_KEY=...
BOSTA_TOKEN=...
ERP_DEFAULT_USERNAME=...
ERP_DEFAULT_PASSWORD=...
```

*If `.env` is missing, app uses local MySQL defaults (localhost, mcrm_hvar_user, mcrm_hvar_hub).*

*ERP creds:* Used by sync-from-erp, MCP `erp_get_drafts`, and `scripts/fetch_erp_vs_db_comparison.py`.

`front/.env`: `VITE_APP_API_URL=http://localhost:5050`

---

## 4. Migrations

```bash
python migrations/run_migrations.py
```

---

## 5. Run

| Terminal | Command |
|----------|---------|
| Backend | `python run.py` → http://localhost:5050 |
| Frontend | `cd front && npm run dev` → http://localhost:5173 |

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| MySQL connection lost | Start MySQL service (`MySQL84` not `MySQL80`). |
| Error 2013 / WinError 10054 | Run the `ALTER USER ... mysql_native_password` SQL above. Use `DATABASE_HOST=127.0.0.1` in `.env`. |
| Access denied | Re-run DB/user SQL. |
| Port in use | [RUN_WSGI.md](RUN_WSGI.md) (kill 5050) or change port in `run.py`. |
| Proxy error (Vite) | Ensure Flask is running on 5050. |

See [docs/INDEX.md](docs/INDEX.md) for full docs.
