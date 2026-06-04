<div align="center">
  <br/>
  <pre style="color:#d43533;font-size:1.2rem;line-height:1.3">
██╗  ██╗██╗   ██╗ █████╗ ██████╗ ███████╗████████╗ ██████╗ ██████╗ ███████╗
██║  ██║██║   ██║██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗██╔════╝
███████║██║   ██║███████║██████╔╝███████╗   ██║   ██║   ██║██████╔╝█████╗  
██╔══██║╚██╗ ██╔╝██╔══██║██╔══██╗╚════██║   ██║   ██║   ██║██╔══██╗██╔══╝  
██║  ██║ ╚████╔╝ ██║  ██║██║  ██║███████║   ██║   ╚██████╔╝██║  ██║███████╗
╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝
  </pre>

  <h1 align="center">
    <span>hvarstore.com</span>
  </h1>

  <p align="center">
    <strong>مطبخك في كل مكان</strong>
    <br/>
    <em>The Egyptian appliance storefront — premium feel, value trust, open source.</em>
  </p>

  <p align="center">
    <a href="#-vision"><code>الرؤية</code></a>
    ·
    <a href="#-design"><code>التصميم</code></a>
    ·
    <a href="#-stack"><code>التقنية</code></a>
    ·
    <a href="#-architecture"><code>المعمارية</code></a>
    ·
    <a href="#-features"><code>المميزات</code></a>
    ·
    <a href="#-quick-start"><code>تشغيل سريع</code></a>
    ·
    <a href="#-wilson-patterns"><code>أنماط ويلسون</code></a>
  </p>

  <br/>

  <!-- Badges -->
  <p>
    <img alt="Status" src="https://img.shields.io/badge/Status-Building-e84a4a?style=flat-square&labelColor=1a1a1a"/>
    <img alt="Hono" src="https://img.shields.io/badge/Hono-4-e84a4a?style=flat-square&logo=hono&labelColor=1a1a1a"/>
    <img alt="Bun" src="https://img.shields.io/badge/Bun-1.2-141414?style=flat-square&logo=bun&labelColor=1a1a1a"/>
    <img alt="Astro" src="https://img.shields.io/badge/Astro-5-e84a4a?style=flat-square&logo=astro&labelColor=1a1a1a"/>
    <img alt="React" src="https://img.shields.io/badge/React-19-58c4dc?style=flat-square&logo=react&labelColor=1a1a1a"/>
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&labelColor=1a1a1a"/>
    <img alt="Tailwind v4" src="https://img.shields.io/badge/Tailwind_v4-06b6d4?style=flat-square&logo=tailwindcss&labelColor=1a1a1a"/>
    <img alt="Drizzle" src="https://img.shields.io/badge/Drizzle_ORM-c5f74f?style=flat-square&logo=drizzle&labelColor=1a1a1a"/>
    <img alt="MySQL" src="https://img.shields.io/badge/MySQL_8-4479a1?style=flat-square&logo=mysql&labelColor=1a1a1a"/>
    <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ed?style=flat-square&logo=docker&labelColor=1a1a1a"/>
    <img alt="Kashier" src="https://img.shields.io/badge/Kashier-00d4aa?style=flat-square&labelColor=1a1a1a"/>
    <img alt="Bosta" src="https://img.shields.io/badge/Bosta-f97316?style=flat-square&labelColor=1a1a1a"/>
    <img alt="License" src="https://img.shields.io/badge/License-MIT-d9d9d9?style=flat-square&labelColor=1a1a1a"/>
  </p>

  <br/>
</div>

---

## 👁️ Vision

**hvarstore.com** is the open-source customer portal for [**Hvar**](https://hvaregypt.com/) — Egypt's fastest-growing kitchen appliance brand. Two windows into one system:

| 🏪 hvarstore.com · هذا المتجر | 🧾 MCRM · إدارة المتجر |
|---|---|
| Customer-facing storefront | Staff/admin portal |
| Browse · Buy (COD / Kashier) · Track orders · Open service tickets | Manage orders, inventory, customers |
| **hvar_site** DB (Drizzle ORM) | **hvar_erp** DB (Ultimate POS) |

> **The insight:** Hvar's growth is driven by chef endorsements (Chef Sara Abdelsalam), recipe/demo culture, and the kitchen as the heart of the Egyptian home. This storefront is built to *feel* the warmth of that kitchen while closing with the trust mechanics that convert the COD-first buyer.

---

## 🎨 Design

> **"المطبخ الدافئ × هفار لوكس"** — Direction C as the system, Direction A's warmth, Direction B's trust architecture. One identity, three strengths.

### Themed Environments

| Theme | Canvas | Accent | Vibe |
|---|---|---|---|
| **هفار الأحمر** (light) | Warm ivory `#FBF7F1` | Hvar red `#d43533` + brass `#C8893B` | Premium warmth, editorial kitchen |
| **هفار الليل** (dark) | Charcoal `hsl(20 10% 7%)` | Glowing red `hsl(2 75% 58%)` | Cosy evening, appliance glow |

### Signature Components

```text
HeroMesh        — Red mesh radiance + grain     → Home hero, category headers
ApplianceDoodle — Hvar motifs (chopper, blender,
                  air fryer, kettle, iron)       → Hero, footer, nav drawer
ProductCard     — Diagonal red shine on hover    → Catalog grid
ProductViewport — Auto-cycle Pdp gallery, breath → Product detail page
CtaActionBar    — [Qty] [Add] [WhatsApp] [Remove] → Pdp action zone
TrustLine       — ضمان سنتين · شحن مجاني · افحص قبل الدفع → Under every CTA
ServiceStepper  — Timeline connecting dot states  → Ticket tracking
CartFAB         — Fixed bottom circle + badge     → Mobile cart
ChefStrip       — Recipe/demo + chef endorsement  → Home pages
```

### Typography

| Role | Font | Usage |
|---|---|---|
| Arabic UI + Display | **Cairo** (400/600/700/900) | Headlines, navigation, body |
| Prices & data | **Inter** `tabular-nums` | Prices, quantities, SKUs |
| Order codes | **JetBrains Mono** | Tracking numbers, references |

> RTL-first: `dir="rtl"`, `lang="ar"`, logical CSS properties — never hard left/right.

---

## 🧱 Stack

```text
📱 web/  ─── Astro 5 + React 19 islands + Tailwind v4 + Nanostores
                                   │
                             🌐 API (Hono v4)
                                   │
                   ┌───────────────┴───────────────┐
                   │                               │
            🗄️ hvar_site                     🗄️ hvar_erp
          (Drizzle ORM)                    (raw SQL reads)
     customers · addresses                products · variations
     orders · order_items                 contacts · transactions
     pending_payments                     categories · service_tickets
```

| Layer | Technology | Role |
|---|---|---|
| **API** | [Hono v4](https://hono.dev/) on [Bun](https://bun.sh/) | TypeScript end-to-end, JWT (jose), bcrypt, mysql2 |
| **Frontend** | [Astro 5](https://astro.build/) + [React 19](https://react.dev/) islands | Zero-JS static catalog pages, hydrated cart/checkout/auth |
| **Styling** | [Tailwind v4](https://tailwindcss.com/) + `@theme` CSS variables | Hvar design tokens, utility-first, RTL logical props |
| **ORM** | [Drizzle](https://orm.drizzle.team/) | Our tables (`hvar_site`), schema in `migrations/schema/` |
| **ERP reads** | Raw parameterized SQL | `hvar_erp` — products, stock, orders, contacts, tickets |
| **State** | [Nanostores](https://github.com/nanostores/nanostores) | 1KB cart state for React islands |
| **Forms** | `react-hook-form` + Zod | Validation on checkout, auth, account |
| **Data** | TanStack Query | Server state in React islands |
| **Auth** | JWT (`jose`) + bcrypt | Phone+password, no OTP at launch |
| **Payments** | Kashier HPP | HMAC-SHA256 signed, `pending_payments` as durable bridge |
| **Shipping** | Bosta API | Tracking via bill_code from ERP transactions |
| **Infra** | Docker Compose + Caddy + MySQL 8 | Production-ready |

---

## 🏗️ Architecture

```text
                        ┌─────────────┐
                        │   Caddy     │  ← Reverse proxy, TLS, static assets
                        │  (:443/80)  │
                        └──────┬──────┘
                               │
               ┌───────────────┼───────────────┐
               │               │               │
        ┌──────┴──────┐  ┌────┴────┐  ┌───────┴───────┐
        │  web (Astro) │  │   API   │  │  Caddy static  │
        │  :4321 dev   │  │  :5000  │  │  (assets, WAF) │
        └──────┬───────┘  └────┬────┘  └───────────────┘
               │               │
               │        ┌──────┴────────┐
               │        │  mysql2 pool  │
               │        └──────┬────────┘
               │               │
        ┌──────┴───────┐  ┌────┴────────────┐
        │  hvar_site   │  │   hvar_erp      │
        │  (Drizzle)   │  │  (raw queries)  │
        └──────────────┘  └─────────────────┘
```

### Customer Journey

```text
BROWSE   products + variations        → stock from variation_location_details
SEARCH   by name, category, price     → filter + facet query
BUY      cart (localStorage)          → COD or Kashier HPP redirect
AUTH     phone + password             → JWT, auto-create/load ERP contact
ORDER    hvar_site.orders + webhook   → ERP creates transaction (draft)
TRACK    bill_code from ERP           → Bosta tracking link
SERVICE  open ticket (R/M/T/S)        → service_tickets state machine
```

### Service Ticket States

```text
            ┌─────────────────────────────────────────────────────┐
            │   PENDING ──→ HUB_RECEIVED ──→ IN_WORKSHOP ──→     │  ← HVM (Maintenance)
            │                           └──→ DISPATCHED ──→       │  ← HVR (Replacement)
            │                           └──→ INSPECTED ──→        │  ← HVT (Return)
            │                           each → READY/REFUNDED     │
            │                                     ↓               │
            │                                 CLOSED              │
            │   Any state ──→ CANCELLED / FAILED                  │
            └─────────────────────────────────────────────────────┘
```

---

## ✨ Features

| Area | Capabilities |
|---|---|
| **Catalog** | Browse, category filter, price search, featured products, variation selection |
| **PDP** | Image gallery (breath animation), variant picker, CTA action bar, trust line, installment calculator (ValU/Souhoola/Aman) |
| **Cart** | LocalStorage cart, quantity controls, CartFAB on mobile, RTL door-swing drawer |
| **Checkout** | COD (cash on delivery) or Kashier card/installments, address dropdowns (gov → district), guest checkout |
| **Auth** | Phone + password, JWT, auto-create ERP contact, profile + address book |
| **Orders** | Order history, detail view, pending-to-shipped timeline, Bosta tracking link |
| **Service** | Open maintenance/replacement/return tickets, state timeline stepper |
| **Trust** | COD-inspect-before-pay badge, 2yr warranty seal, 14-day return, free shipping cues at every risk moment |
| **RTL** | Full Arabic-first: `dir="rtl"`, Cairo font, logical CSS, Arabic UI copy |
| **Dark mode** | Class-based `هفار الليل` theme with glowing red accents |
| **SEO** | Zero-JS static catalog pages, meta tags, JSON-LD, OpenGraph |

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) ≥ 1.2
- [Docker](https://docker.com/) + [Docker Compose](https://docs.docker.com/compose/)
- MySQL 8 instance (or the Docker Compose one)
- Access to `hvar_erp` database (read-only credentials)

### 1. Clone

```bash
git clone https://github.com/kariemSeiam/hvar-portal.git
cd hvar-portal/hvarstore
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env with your DB credentials, JWT secret, Kashier keys, Bosta API key
```

### 3. Install & Run

```bash
# Install all workspace dependencies
bun install

# Start dev infrastructure (MySQL + Caddy)
docker compose up -d

# Run migrations (creates hvar_site tables)
bun run migrate

# Start API server + Astro dev server
bun run dev
```

API at `http://localhost:5000` · Web at `http://localhost:4321`

### With Docker (full stack)

```bash
docker compose --profile full up -d
```

---

## 📁 Repo Structure

```text
hvarstore/
├── api/               # Hono v4 API server (Bun)
│   ├── src/
│   │   ├── routes/    # products, categories, locations, auth, orders, payments, tickets
│   │   ├── lib/       # db.ts, auth.ts, phone.ts, bosta.ts
│   │   └── middleware/ # JWT auth, error handling
│   └── Dockerfile
├── web/               # Astro 5 frontend
│   ├── src/
│   │   ├── components/ # React islands + Astro components
│   │   ├── layouts/    # Base.astro (RTL, design tokens)
│   │   ├── pages/      # Astro pages (zero-JS where possible)
│   │   └── styles/     # global.css with Hvar design tokens
│   └── Dockerfile
├── shared/             # Zod schemas + TypeScript types (cross-package)
├── migrations/         # Drizzle ORM schema + migrations
│   ├── schema/         # customers, addresses, orders, items, pending_payments
│   └── drizzle.config.ts
├── docker-compose.yml  # MySQL + Caddy dev setup
├── Caddyfile           # Reverse proxy config
└── package.json        # Workspace root
```

---

## 🧩 Wilson Patterns

The storefront UI is built on a battle-tested library of **13 CSS-first patterns** from the Wilson design system, adapted for Hvar:

| # | Pattern | Hvar Application |
|---|---|---|
| P1 | Appliance doodle BG | SVG appliance silhouettes at 0.18–0.22 opacity |
| P2 | Grain texture overlay | `::before` SVG noise, `opacity:0.04`, `mix-blend-mode:overlay` |
| P3 | Grid system | `radial-gradient` CSS grids for catalog pages |
| P4 | Red mesh hero | `radial-gradient` glow at hero top |
| P5 | 3D door-swing menu | CSS `rotateY` RTL-aware nav drawer |
| P6 | Card shine | `::after` diagonal gradient sweep on hover |
| P7 | Scroll reveals | IntersectionObserver + staggered reveal classes |
| P8 | Product viewport | Auto-cycle PDP gallery with breath animation |
| P9 | Trust line | Three trust signals under every CTA |
| P10 | Service stepper | `::before` gradient line connecting state dots |
| P11 | CTA action bar | Horizontal: [qty] [add] [WhatsApp] [remove] |
| P12 | Cart FAB | Fixed bottom circle with badge count |
| P13 | Staggered menu | `animation-delay` per nav item + doodle overlay |

All respect `prefers-reduced-motion`. All CSS custom properties — no hardcoded values.

---

## 🗺️ Roadmap

- [x] Stack research & monorepo scaffold
- [x] DB schema (Drizzle — 5 tables)
- [x] API route stubs + JWT auth + mysql2 pools
- [x] Astro scaffold + RTL layout + design tokens
- [x] Docker Compose + Caddy production config
- [ ] Schema recon (mysqldump → reconcile column names)
- [ ] **Vertical slice:** products → detail → cart → COD checkout → order confirm
- [ ] Auth: register/login + phone normalization + JWT flow
- [ ] Kashier HPP integration + HMAC callback validation
- [ ] Bosta tracking display + link
- [ ] Service portal: ticket CRUD + state timeline UI
- [ ] Wilson pattern integration (P1–P13 into components)
- [ ] Dark mode toggle + theme persistence
- [ ] Deployment: VPS with Caddy + Docker

---

## 📚 Documentation

| Resource | Location |
|---|---|
| Build spec (7 files) | `workspace/docs/dev/` |
| Design system & tokens | `.venom/DESIGN_DIRECTIONS.md` |
| Project context & decisions | `.venom/CONTEXT.md` |
| VENOM memory & stances | `.venom/MEMORY.md` |
| Wilson pattern catalog | `workspace/docs/design/patterns/` |
| Reference projects | `workspace/examples/` (MCRM, wilson-eg, Hvar-Catalog) |

---

## 🤝 Contributing

This is a solo-built portal for Kariem Seiam's Hvar brand. Contributions, feedback, and recipe ideas welcome.

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-idea`
3. Commit changes
4. Push & open a PR

---

## 📄 License

MIT © [Kariem Seiam](https://github.com/kariemSeiam)

---

<div align="center">
  <sub>
    Built with 🐍 VENOM · <a href=".venom">Context</a> ·
    <a href="https://hvaregypt.com">Hvar Egypt</a>
  </sub>
  <br/>
  <sub>
    <em>مطبخك في كل مكان</em>
  </sub>
</div>
