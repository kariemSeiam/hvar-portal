# Wilson Seed Scripts

Runtime API lives at **`project/backend/app.py`**; default DB file is **`wilson.db`** at the **repository root**. Optional **`scrape_*.py`** / **`scrape-*.mjs`** tools refresh catalog JSON and images; they are **not** required to serve the site.

## DB cleanup (wilson.db only)

- **Single DB file:** Use only `wilson.db` (default in `project/backend/app.py` and `.env.example`). Remove or ignore any old `shoesy.db`.
- **Clean state (full reset):** Delete `wilson.db`, run `python project/backend/app.py` once to create an empty DB, then run in order:
  1. `python scripts/seed_wilson_products.py`
  2. `python scripts/seed_categories.py`
  3. `python scripts/ensure_admin_user.py`

## Seed Products from Scraped Data

Populates the backend database with all 24 Wilson products from `docs/wilson-complete-data.json`.

```bash
python scripts/seed_wilson_products.py
```

**What it does:**
- Adds `name_ar`, `name_en` columns to Product if missing
- Deletes existing products (cascade clears variants, features)
- Inserts products with: name_ar, name_en (persona-aligned overrides when set; see `docs/brand/product-copy-rules.md`), specs→description, specs→features, variants (1 default per product), correct status (active/out_of_stock), prices (base + discount when on sale)

**Run after:** Backend DB is initialized (`python project/backend/app.py` once to create wilson.db).

## Ensure Admin User

Creates or upgrades the admin user (phone `0000000000`) so you can access the admin panel.

```bash
python scripts/ensure_admin_user.py
```

**When to run:** After a fresh DB, or if admin login redirects to home instead of the admin panel. Restart the backend (`python project/backend/app.py`) after pulling changes so `/api/profile` returns `role`.
