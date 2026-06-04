# Wilson Egypt — Documentation

Single place for all project docs. Current and legacy are separated.

## Structure

| Path | Purpose |
|------|--------|
| **api/** | API reference: endpoints, product data model, media/slides spec, verification checklists. |
| **brand/** | Brand identity: deep study, rebranding plan, brand character. |
| **design/** | Design tokens: palette (e.g. REAL-WILSON-PALETTE). |
| **development/** | Frontend/backend dev: project overview, backend study, UI-UX patterns, workflow. |
| **archive/** | Legacy — for reference only. plan/ (roadmap, sprints), progress/ (changelog, progress), IMPLEMENTATION-PLAN. Current state: see repo `CLAUDE.md` and `.venom/CONTEXT.md`. |

## Product data (root of docs/)

- `wilson-complete-data.json`, `wilson-complete-with-images.json` — product catalog for seeding.
- `wilson-summary.txt` — short summary.

## Quick links

- **Run the app:** see repo root `README.md` (Backend + Frontend).
- **DB cleanup / seed order:** `scripts/README.md` (wilson.db only; reset then seed_wilson_products → seed_categories → ensure_admin_user).
- **API usage:** `api/API-ENDPOINTS.md`.
- **Brand:** `brand/WILSON-DEEP-STUDY.md`.
