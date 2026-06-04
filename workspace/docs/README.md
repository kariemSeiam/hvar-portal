# Hvar — Documentation Hub

> Centralized documentation, design analysis, and competitor research for the Hvar ecosystem.

```
docs/
├── README.md                          ← You are here
├── projects/                          ← Project documentation (moved from each repo)
│   ├── hvar-pos/                      ← POS terminal + Laravel backend
│   ├── hvar-catalog/                  ← Consumer-facing catalog
│   ├── hvar-old/                      ← Internal ERP dashboard
│   ├── mcrm/                          ← Service CRM (mcrm.hvarstore.com)
│   └── wilson-eg/                     ← Egyptian Gold e-commerce (wilson-eg.com)
├── research/                          ← Competitor & market intelligence
│   ├── competitors/                   ← Competitor analysis studies
│   ├── benchmarks/                    ← Performance benchmarks
│   └── market-analysis/              ← Market research & reports
├── design/                           ← Design system & pattern analysis
│   ├── design-language/              ← Cross-project design language comparisons
│   ├── patterns/                     ← Reusable UI/UX patterns
│   └── studies/                      ← Design case studies
└── draft/                            ← Raw material intake (factory)
```

---

## Project Documentation

| Project | Type | DESIGN.md | Pages | Total Lines |
|---------|------|-----------|-------|-------------|
| [Hvar-POS](./projects/hvar-pos/) | Laravel REST API + POS terminal | [DESIGN.md](./projects/hvar-pos/DESIGN.md) | 15 docs | ~1,500 |
| [Hvar-Catalog](./projects/hvar-catalog/) | React product catalog (RTL) | [DESIGN.md](./projects/hvar-catalog/DESIGN.md) | 6 docs | ~2,100 |
| [Hvar-OLD](./projects/hvar-old/) | React ERP admin dashboard | [DESIGN.md](./projects/hvar-old/DESIGN.md) | 6 docs | ~2,300 |
| [MCRM](./projects/mcrm/) | Service CRM (live: mcrm.hvarstore.com) | [DESIGN.md](./projects/mcrm/DESIGN.md) | 5 + original | ~2,500 |
| [Wilson-eg](./projects/wilson-eg/) | Egyptian Gold e-commerce | [DESIGN.md](./projects/wilson-eg/DESIGN.md) | 5 docs | ~3,300 |

### Quick Links

**Hvar-POS** — `projects/hvar-pos/`
| Doc | Description |
|-----|-------------|
| [DESIGN.md](./projects/hvar-pos/DESIGN.md) | Green POS design language — 76 colors, 21 typography, 25 components |
| [01-OVERVIEW.md](./projects/hvar-pos/docs/01-OVERVIEW.md) | System overview, tech stack, conventions |
| [03-ARCHITECTURE.md](./projects/hvar-pos/docs/03-ARCHITECTURE.md) | MVC, service layer, cron jobs |
| [05-ORDER-LIFECYCLE.md](./projects/hvar-pos/docs/05-ORDER-LIFECYCLE.md) | Full order state machine |
| [07-KASHIER-DEEP.md](./projects/hvar-pos/docs/07-KASHIER-DEEP.md) | Kashier payment integration deep-dive |

**Hvar-Catalog** — `projects/hvar-catalog/`
| Doc | Description |
|-----|-------------|
| [DESIGN.md](./projects/hvar-catalog/DESIGN.md) | Red/premium catalog design — 68 colors, grid system, components |
| [01-ARCHITECTURE.md](./projects/hvar-catalog/docs/01-ARCHITECTURE.md) | Component tree, data flow, design system provider |
| [02-COMPONENTS.md](./projects/hvar-catalog/docs/02-COMPONENTS.md) | Full props reference for all 16 components |
| [03-DATA-FLOW.md](./projects/hvar-catalog/docs/03-DATA-FLOW.md) | useProducts hook, dedup logic, categories |

**Hvar-OLD** — `projects/hvar-old/`
| Doc | Description |
|-----|-------------|
| [DESIGN.md](./projects/hvar-old/DESIGN.md) | Rose admin dashboard — 70+ tokens, 20 components |
| [01-ARCHITECTURE.md](./projects/hvar-old/docs/01-ARCHITECTURE.md) | Routes, providers, auth, 400+ API endpoints |
| [02-PAGES.md](./projects/hvar-old/docs/02-PAGES.md) | All 11 page modules with route maps |
| [04-API.md](./projects/hvar-old/docs/04-API.md) | Full API reference (11 domains, 400+ endpoints) |

**Wilson-eg** — `projects/wilson-eg/`
| Doc | Description |
|-----|-------------|
| [DESIGN.md](./projects/wilson-eg/DESIGN.md) | Egyptian Gold — hand-drawn doodles, 13 pattern innovations, gold-tinted shadows |
| [01-ARCHITECTURE.md](./projects/wilson-eg/docs/01-ARCHITECTURE.md) | Flask + React, themes, RTL, CSS variable system |
| [02-COMPONENTS.md](./projects/wilson-eg/docs/02-COMPONENTS.md) | 44 components — doodle bg, product card, hero carousel |
| [03-API.md](./projects/wilson-eg/docs/03-API.md) | Full API — products, orders, auth, admin analytics |
| [04-DATA-MODEL.md](./projects/wilson-eg/docs/04-DATA-MODEL.md) | 26 products, 5 categories, price analysis |
| [05-DESIGN-SYSTEM.md](./projects/wilson-eg/docs/05-DESIGN-SYSTEM.md) | 13 pattern innovations, gold scale, doodles, 3D menu |
| [Original docs](./projects/wilson-eg/docs/original/INDEX.md) | Brand deep study, rebranding plan, UI-UX patterns |

**MCRM** — `projects/mcrm/`
| Doc | Description |
|-----|-------------|
| [DESIGN.md](./projects/mcrm/DESIGN.md) | Rose service CRM — 70+ tokens, 22 components, 9 operative statuses |
| [01-ARCHITECTURE.md](./projects/mcrm/docs/01-ARCHITECTURE.md) | Flask + React, providers, API modules |
| [02-COMPONENTS.md](./projects/mcrm/docs/02-COMPONENTS.md) | 22 UI + feature components |
| [03-API.md](./projects/mcrm/docs/03-API.md) | 8 API modules (auth, bosta, call_center, customer, erp, hub, service, stock) |
| [04-DATA-MODEL.md](./projects/mcrm/docs/04-DATA-MODEL.md) | Service tickets, call types, state machines |
| [05-DESIGN-SYSTEM.md](./projects/mcrm/docs/05-DESIGN-SYSTEM.md) | Tokens, animations, Arabic utilities |
| [Original docs](./projects/mcrm/docs/original/INDEX.md) | Extensive call-center workflows, hub processes, system ref |

---

## Research Log

| Study | Status | Date |
|-------|--------|------|
| [Hvar Brand — Market Report](./research/market-analysis/hvar-brand-market-report.md) | ✅ Complete | 2026-05-31 |
| [Hvar Competitive Landscape](./research/competitors/hvar-competitors.md) | ✅ Complete | 2026-05-31 |
| [Hvar Digital Footprint — Design Study](./design/studies/hvar-brand-digital-footprint.md) | ✅ Complete | 2026-05-31 |

---

## Design Analysis

Cross-Hvar design language comparison — **4 projects** serving different purposes:

| | Hvar-POS | Hvar-Catalog | Hvar-OLD | MCRM | Wilson-eg |
|---|---|---|---|---|---|
| **Primary** | Green (#22c55e) | Red (#ef4444) | Rose (#f43f5e) | Rose (#f43f5e) | **Egyptian Gold (#FEB636)** |
| **Tone** | Utilitarian | Premium | Data‑dense | Operative |
| **Dark mode** | No | No | Yes | Yes |
| **Fluid typography** | No | Yes (clamp) | Yes (clamp) | Yes (clamp, evolved) |
| **Status colors** | 4 | 0 | 5 | 9 operative |
| **Animations** | Minimal | Rich | Functional | scanPulse, glow, shimmer |
| **Arabic utilities** | No | No | No | Yes (arabic-card, etc.) |
| **Scan focus** | No | No | No | Yes (QR/barcode) |
| **Call session** | No | No | No | Yes (global FAB) | No |
| **Doodle BGs** | No | No | No | No | **Yes (22 appliances)** |
| **Gold identity** | No | No | No | No | **Egyptian Gold** |
| **3D animations** | No | No | No | No | **Door-swing menu** |
| **Pattern innovations** | Minimal | Standard | Standard | Status-focused | **13 patterns** |

### How Each System Connects

```
hvarstore.com (pos-clone)          wilson-eg.com (separate brand)
        │                                   │
        │ Orders via Dukan webhook           │ Flask + React backend
        ▼                                   ▼
  Ultimate POS (live/)               Wilson Egypt e-commerce
        │                              (Egyptian Gold identity)
        ├── Hvar-POS (POS terminal)     
        ├── Hvar-Catalog (Product display)
        ├── Hvar-OLD (ERP dashboard)
        └── MCRM (Service CRM)
                │
                └── mcrm.hvarstore.com (live)

Note: Wilson Egypt is a SEPARATE brand from Hvar — different product line,
different identity, different target audience. Wilson is Egyptian Gold (#FEB636)
for mid-range home appliances. Hvar is deep red (#d43533) for premium appliances.
```

---

## How To Use

**Adding a new project:**
```bash
mkdir -p docs/projects/new-project/docs
# ... write DESIGN.md and docs/ files ...
# Then update this README's table
```

**Adding competitor research:**
```bash
touch docs/research/competitors/competitor-name.md
```

**Adding a design study:**
```bash
touch docs/design/studies/study-name.md
```

**Adding raw material (factory intake):**
```bash
# Drop any file into docs/draft/
# I digest it into the correct location
```
