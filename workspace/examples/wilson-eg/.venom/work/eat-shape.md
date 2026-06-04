## Shape — Wilson E-commerce — 2026-04-04

**Language:** Python 3.x (Flask backend), TypeScript 5.9 (React frontend)

**Framework:** 
- Backend: Flask 2.3+ with Flask-SQLAlchemy 3.0+, Werkzeug 2.3+
- Frontend: React 18 + Vite 5 + Tailwind CSS 3.4 + shadcn/ui

**Key dependencies:**
- Flask — Web framework for REST API
- SQLAlchemy 2.0+ — ORM with SQLite backend
- PyJWT 2.8+ — JWT authentication
- Flask-CORS 4.0+ — Cross-origin support
- Pillow 10+ — Image handling
- React Query 5 — Data fetching/caching on frontend
- React Router 6 — Client-side routing

**Scripts:**
- Backend start: `python project/backend/app.py` (port 5004)
- Production: `gunicorn -b 0.0.0.0:5004 -w 4 --threads 2 app:app`
- Frontend dev: `cd project/frontend && npm run dev` (port 3000)
- Frontend build: `cd project/frontend && npm run build`
- Test backend: `python -m pytest tests/ -v`
- Test frontend: `cd project/frontend && npm run test`
- E2E: `cd project/frontend && npm run test:e2e`

**Entry points:**
- Backend: `project/backend/app.py` (Flask app, all routes inline)
- Frontend: `project/frontend/src/main.tsx` → `App.tsx`

**Scale:**
- Backend: Single file (~3000+ lines), all models + routes in one file
- Frontend: React SPA with ~15+ pages, standard Vite structure
- Database: SQLite (`wilson.db` at repo root)
- Deploy: PythonAnywhere bundle in `deploy/pythonanywhere/`
- Scripts: 12 files (seeders, scrapers, admin tools)
- Tests: 1 backend test file, frontend vitest + playwright
