# Frontend (React + Vite)

React 18, Vite 6, TailwindCSS. RTL Arabic-first. PWA, QR scan. Design tokens: `src/styles/design-tokens.css`.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (default 5173) |
| `npm run build` | Production build → `dist/` |
| `npm run build:prod` | Prod build with env |
| `npm run preview` | Preview prod build |

---

## Entry

`src/App.jsx` — routes, lazy-loaded pages. `src/index.css` — imports design-tokens, Tailwind, base.

---

## Layout

| Path | Role |
|------|------|
| `src/pages/` | Route-level pages (Hub, Stock, CustomerService, Demo, NotFound) |
| `src/components/` | call-center, hub, modals, service, stock, ui, layout, filters, forms |
| `src/api/` | callCenterAPI, ticketsAPI, serviceActionAPI, axios |
| `src/contexts/` | Auth, Theme, CallSession |
| `src/styles/` | design-tokens.css (source of truth), scrollbar, index.css |

See [src/README.md](src/README.md) · [src/pages/README.md](src/pages/README.md) · [src/styles/README.md](src/styles/README.md).
