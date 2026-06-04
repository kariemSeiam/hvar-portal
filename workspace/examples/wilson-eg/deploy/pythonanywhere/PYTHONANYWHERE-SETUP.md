# Wilson Egypt — Full setup on PythonAnywhere (free account)

One Flask app, one port: API at `/api`, uploads at `/uploads`, frontend SPA from `dist/`. Paste this guide into a new PythonAnywhere free account and follow the steps.

---

## Prerequisites

- A **new PythonAnywhere free account** at [pythonanywhere.com](https://www.pythonanywhere.com).
- The **deploy/pythonanywhere** folder deployed (upload as zip or clone via Git). It must contain:
  - `app.py`, `wsgi.py`, `requirements.txt`
  - `dist/` with the built frontend (index.html + assets). If empty, build locally with base `/` and copy from `project/frontend/dist/` (see “Build and copy frontend” below).
  - Optional: `instance/`, `uploads/` (can be empty at first).

---

## Free tier limits

- **512 MiB** disk space.
- **1 web app**, 1 web worker, **100 CPU seconds per day**.
- Web app **expires after 1 month** — renew from the **Web** tab when prompted.
- **New accounts (created from 2026):** No MySQL. Use **SQLite only** (this project uses SQLite by default).
- 2 consoles; no SFTP on free tier (use Files upload or Git).

---

## Step 1: Get the code on PythonAnywhere

### Option A — Upload a zip

1. On your PC, zip the `deploy/pythonanywhere` folder (include `app.py`, `wsgi.py`, `requirements.txt`, `dist/`, `instance/`, `uploads/`).
2. In PythonAnywhere, open the **Files** tab and go to your home directory (`/home/wilsoneg/`).
3. Click **Upload a file**, choose the zip.
4. Open a **Bash** console and run:

```bash
cd ~
unzip deploy/pythonanywhere.zip
# If the zip created a nested folder, rename or move so project is at ~/deploy/pythonanywhere
ls deploy/pythonanywhere
# You should see app.py, wsgi.py, requirements.txt, dist/, instance/, uploads/
```

### Option B — Git clone

1. Push `deploy/pythonanywhere` to a Git repo (or the whole repo and use the subfolder).
2. In a PythonAnywhere **Bash** console:

```bash
cd ~
git clone https://github.com/YOUR_USER/YOUR_REPO.git
cd YOUR_REPO/deploy/pythonanywhere
pwd
# Note this path, e.g. /home/wilsoneg/YOUR_REPO/deploy/pythonanywhere
```

Use this path wherever the guide says `~/deploy/pythonanywhere` (replace with your actual path if different).

---

## Step 2: Virtualenv

In a **Bash** console:

```bash
# Create virtualenv (Python 3.10 or 3.11 or 3.12 — match the version you’ll choose in the Web tab)
mkvirtualenv --python=/usr/bin/python3.12 wilson-venv

# Go to project and install dependencies
cd ~/deploy/pythonanywhere
pip install -r requirements.txt
```

Your prompt will show `(wilson-venv)`. The virtualenv path is: `/home/wilsoneg/.virtualenvs/wilson-venv`.

---

## Step 3: Environment variables

You must set:

- **SECRET_KEY** — long random string (e.g. `openssl rand -hex 32` on your PC).
- **SQLALCHEMY_DATABASE_URI** (optional if you’re fine with default) — e.g.  
  `sqlite:////home/wilsoneg/deploy/pythonanywhere/instance/wilson.db`  
  (four slashes: `sqlite:///` + absolute path.)
- **EXTRA_CORS_ORIGINS** (optional but recommended) — your PA site URL, e.g.  
  `https://wilsoneg.pythonanywhere.com`

**Where to set them:**

- If the **Web** tab has an **“Environment variables”** or similar section, add them there.
- Otherwise, edit the **WSGI file** (Step 4) and add **before** the line `from app import app`:

```python
import os
os.environ['SECRET_KEY'] = 'your-long-random-secret-key'
os.environ['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////home/wilsoneg/deploy/pythonanywhere/instance/wilson.db'
os.environ['EXTRA_CORS_ORIGINS'] = 'https://wilsoneg.pythonanywhere.com'
```

Replace the secret key with your own. Do not commit real secrets to Git.

---

## Step 4: Web app and WSGI

1. Open the **Web** tab and click **Add a new web app**.
2. Choose **Manual configuration** (not the “Flask” wizard) and select **Python 3.12** (or the same version you used for the virtualenv).
3. In **Virtualenv**, enter the path to your virtualenv:  
   `/home/wilsoneg/.virtualenvs/wilson-venv`  
   Click the checkmark; it should turn green.
4. Click the link to **edit the WSGI configuration file**.
5. Replace its contents (or the Flask section) with something like this, **fixing the path** to your project:

```python
import sys
import os

path = '/home/wilsoneg/deploy/pythonanywhere'
if path not in sys.path:
    sys.path.insert(0, path)
os.chdir(path)

# Optional: set env vars here if not set in the Web tab
# os.environ['SECRET_KEY'] = 'your-secret-key'
# os.environ['EXTRA_CORS_ORIGINS'] = 'https://wilsoneg.pythonanywhere.com'

from app import app as application
```

6. Save the file.
7. **Create the database and admin user once** — in a Bash console:

```bash
workon wilson-venv
cd ~/deploy/pythonanywhere
python -c "from app import init_db; init_db()"
```

8. Back on the **Web** tab, click **Reload** for your web app.

---

## Step 5: Static files (optional)

Serving `dist/assets/` via the Web tab can reduce load on the Flask worker:

- **URL:** `/assets/`
- **Directory:** `/home/wilsoneg/deploy/pythonanywhere/dist/assets`

Then click **Reload**. If you skip this, Flask will still serve everything from `dist/`; this is fine for the free tier.

---

## Step 6: Reload and test

1. **Reload** the web app (Web tab).
2. Open: `https://wilsoneg.pythonanywhere.com/`  
   You should see the Wilson Egypt frontend.
3. Open: `https://wilsoneg.pythonanywhere.com/api/products`  
   You should get JSON (product list or empty array).
4. If the frontend gets CORS errors when calling the API, ensure `EXTRA_CORS_ORIGINS` includes `https://wilsoneg.pythonanywhere.com` (and that you reloaded after changing it).

---

## Build and copy frontend (local)

The `dist/` folder must contain the built React app with **base `/`** (not `/wilson-egypt/`). Set `VITE_BASE=/` when building so asset paths are correct.

**Option 1 — Script (from repo root):**

- **Windows (PowerShell):** `.\deploy/pythonanywhere\build-and-copy-dist.ps1`
- **Linux / Mac:** `bash deploy/pythonanywhere/build-and-copy-dist.sh`

**Option 2 — Manual (from repo root):**

**Windows (PowerShell):**

```powershell
cd project\frontend
$env:VITE_BASE = '/'
npm run build
cd ..\..
xcopy /E /Y project\frontend\dist\* deploy\pythonanywhere\dist\
```

**Linux / Mac:**

```bash
cd project/frontend && VITE_BASE=/ npm run build && cd ../..
cp -r project/frontend/dist/* deploy/pythonanywhere/dist/
```

Then zip or push `deploy/pythonanywhere` (including the new `dist/`) and re-upload or pull on PythonAnywhere.

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| **502 / 504** | WSGI path and virtualenv path on the Web tab; that the virtualenv has `pip install -r requirements.txt`; the **Errors** tab for the web app. |
| **500** | **Web** tab → **Error log**. Fix traceback (missing env var, wrong path, import error). |
| **CORS errors in browser** | Add `https://wilsoneg.pythonanywhere.com` to `EXTRA_CORS_ORIGINS` and reload the web app. |
| **“Frontend not built” / 503** | `dist/index.html` is missing. Build the frontend with base `/` and copy `project/frontend/dist/*` into `deploy/pythonanywhere/dist/`, then re-upload. |
| **DB errors** | Run `python -c "from app import init_db; init_db()"` from the project directory with the virtualenv active. Ensure `instance/` exists and `SQLALCHEMY_DATABASE_URI` points to the correct path. |
| **Web app expired** | Free tier web app expires after 1 month. Open the **Web** tab and follow the renewal link. |

---

## References

- [Setting up Flask on PythonAnywhere](https://help.pythonanywhere.com/pages/Flask/)
- [Static files mappings](https://help.pythonanywhere.com/pages/StaticFiles/)
- [Free account features](https://help.pythonanywhere.com/pages/FreeAccountsFeatures/)
- [Uploading and downloading files](https://help.pythonanywhere.com/pages/UploadingAndDownloadingFiles/)

---

*Username `wilsoneg` is pre-filled for this account. Change if using a different PythonAnywhere account.*
