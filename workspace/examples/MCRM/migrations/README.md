# Migrations

Database migrations for HUB-MCRM. Runner: `python migrations/run_migrations.py`.

## Production Deploy (001 + 003 → Current)

**Use `004_production_to_current.sql`** when deploying to production that has `001_initial_schema.sql` AND `003_add_sell_service_type.sql` applied (live mcrm_hvar_hub_2026_3_14).

```bash
# 1. Backup production first
python migrations/backup_database.py

# 2. Run migrations (applies 004 only)
python migrations/run_migrations.py up

# 3. Verify
python migrations/run_migrations.py status
```

### Import Production Backup (MariaDB → MySQL)

The phpMyAdmin backup uses MariaDB syntax. Fix it first:

```powershell
python migrations/fix_backup_for_mysql.py
```

Then reset and import:

```powershell
# 1. Drop and recreate DB (as root)
mysql -u root -p -e "DROP DATABASE IF EXISTS mcrm_hvar_hub; CREATE DATABASE mcrm_hvar_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Import (PowerShell: use cmd for redirection)
cmd /c "mysql -u mcrm_hvar_user -p mcrm_hvar_hub < migrations\mcrm_hvar_hub_2026_3_14_mysql.sql"

# 3. Run migrations
python migrations/run_migrations.py up
```

### Verify Before Deploy (Local Test)

```powershell
.\migrations\verify_production_migration.ps1
```

Requires: MySQL user with CREATE DATABASE. If access denied, run as root:
```sql
CREATE DATABASE mcrm_hvar_hub_verify;
GRANT ALL ON mcrm_hvar_hub_verify.* TO 'mcrm_hvar_user'@'localhost';
```

### Data Migration: Phone Normalization

If production has customers with non-normalized phones (+201, 201, etc.), run **before** deploy:

```bash
python migrations/002_normalize_phone_numbers.py
```

This is a one-time data fix. Not run by `run_migrations` (Python script, not SQL).

## Local Dev

- **Fresh install:** `001` then `004`.
- **Already has 001–009 applied:** Schema is current. To clear the "pending" 004 without running it:
  ```sql
  INSERT INTO migrations_history (migration_name, checksum) VALUES ('004_production_to_current.sql', 'manual');
  ```

## Files

| File | Purpose |
|------|---------|
| `001_initial_schema.sql` | Base schema (customers, service_tickets, stock, bosta_orders, etc.) |
| `004_production_to_current.sql` | Consolidated: orders, calls, leader workflow, users, ERP dedup, etc. |
| `002_normalize_phone_numbers.py` | Data migration: normalize phones to 01XXXXXXXXX (run manually) |
| `run_migrations.py` | CLI: `status`, `up`, `down`, `reset` |
| `archive/` | Old migrations 002–009 (reference only) |

## Config

Uses `.env`: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`.

**Important:** Use `127.0.0.1` not `localhost` on Windows (PyMySQL WinError 10054).
