# Wilson Egypt — PythonAnywhere deployment

Single-port deploy: Flask serves **API** (`/api/*`), **uploads** (`/uploads/*`), and the **frontend SPA** from `dist/`.

## Quick start

1. **Build and copy frontend** (from repo root):  
   `.\deploy/pythonanywhere\build-and-copy-dist.ps1` (Windows) or  
   `bash deploy/pythonanywhere/build-and-copy-dist.sh` (Linux/Mac).

2. **Full setup on a new PythonAnywhere free account:**  
   Follow **[PYTHONANYWHERE-SETUP.md](PYTHONANYWHERE-SETUP.md)** (paste-ready).

## Contents

| Path | Purpose |
|------|---------|
| `app.py` | Backend + SPA serving (refactored from root `app.py`) |
| `wsgi.py` | WSGI entry for PythonAnywhere |
| `requirements.txt` | Python deps |
| `dist/` | Frontend build (copy from `project/frontend/dist` after building with `VITE_BASE=/`) |
| `instance/` | SQLite DB and settings |
| `uploads/` | Product images, slides |

## Env (see `.env.example`)

- `SECRET_KEY` — required in production  
- `SQLALCHEMY_DATABASE_URI` — optional (default: `instance/wilson.db`)  
- `EXTRA_CORS_ORIGINS` — e.g. `https://wilsoneg.pythonanywhere.com`
