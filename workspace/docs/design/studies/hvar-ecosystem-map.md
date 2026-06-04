# Ecosystem Map — Connecting the Four Hvar Systems

> **Source:** POS codebase analysis + all project documentation
> **Status:** 🔴 Partial — gaps remain in live brand tokens

---

## The Full Hvar Tech Stack

```
                             ┌───────────────────────────┐
                             │     hvarstore.com          │
                             │   (Dukan / pos-clone)      │
                             │   E-commerce Storefront    │
                             │   RTL · Bootstrap · TikTok │
                             │   Clarity · COD · ValU     │
                             └────────┬──────────────────┘
                                      │
                            Webhooks: POST /WebHooksyncOrders*
                                      │
                             ┌────────▼──────────────────┐
                             │   Ultimate POS Backend     │
                             │   (live/ — Laravel)        │
                             │                            │
                             │   Database: hvar_erp       │
                             │   Tables: transactions,    │
                             │   contacts, products,      │
                             │   variations, stock        │
                             └────┬───────┬───────┬───────┘
                                  │       │       │
                    ┌─────────────┘       │       └─────────────┐
                    ▼                     ▼                     ▼
          ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
          │   Hvar-POS      │  │   Hvar-OLD      │  │    MCRM         │
          │   (Laravel API) │  │   ERP Dashboard  │  │  Service CRM    │
          │   Terminal UI   │  │   React 18       │  │  Flask + React  │
          │   Kashier       │  │   400+ endpoints │  │  Call Center    │
          │   Multi-seller  │  │   11 modules     │  │  Hub Scanning   │
          │                 │  │                  │  │  Stock Mgmt     │
          └──────────────────┘  └──────────────────┘  └──────────────────┘
                                                                  │
                                                                  ▼
                                                        ┌──────────────────┐
                                                        │  mcrm.hvarstore  │
                                                        │  .com (live)     │
                                                        └──────────────────┘
```

## What Each System Does

| System | Purpose | Users | Live URL |
|--------|---------|-------|----------|
| **pos-clone** / Dukan | Customer e-commerce storefront | Consumers | hvarstore.com |
| **Ultimate POS (live/)** | Backend admin, order sync, accounting | Back-office | internal |
| **Hvar-POS** | Point of Sale terminal UI | Cashiers | terminal |
| **Hvar-Catalog** | Consumer product catalog display | Shoppers | (experimental) |
| **Hvar-OLD** | ERP operations dashboard | Managers, operators | internal |
| **MCRM** | Service CRM (call center + hub + stock) | Agents, technicians | mcrm.hvarstore.com |

## Data Flow Summary

1. Customer orders on **hvarstore.com** (Dukan/pos-clone)
2. Dukan sends webhook `POST /WebHooksyncOrdersGet` to **Ultimate POS**
3. `OrderSyncService` processes the order:
   - Creates/updates `Contact` (customer)
   - Creates `Transaction` (order) with `website_order_id`, shipping data
   - Creates `TransactionSellLines` (line items)
   - Creates `TransactionPayment` (payment record)
   - Optionally creates Bosta shipment (auto-Bosta)
4. **Hvar-OLD** reads from the same `hvar_erp` database for dashboard
5. **MCRM** also reads from `hvar_erp` for call center + hub operations
6. **Hvar-POS** handles in-person sales with Kashier payment integration

## Design Language Evolution

```
Hvar-POS (v1)       → Hvar-Catalog (v2)    → Hvar-OLD (v3)       → MCRM (v4)
Green (#22c55e)       Red (#ef4444)          Rose (#f43f5e)        Rose (#f43f5e)
Utilitarian           Premium                Data-dense            Operative
No RTL                RTL                    RTL + Dark            RTL + Dark
No fluid              Fluid (clamp)          Fluid (clamp)         Fluid (evolved)
Fixed spacing         Flexible               Flexible              Granular spacing
No animations         Rich float/bounce      Fade/slide            scanPulse/glow/shimmer
No scan               No scan                No scan               QR/barcode focus
No call center        No call center         Call center concept   Full call session FAB
```

## Gaps Between Live Brand and Our Software

### What We Know
| Aspect | hvarstore.com (live) | Our software |
|--------|---------------------|--------------|
| Brand color | Default: #d43533 (deep red)* | MCRM/OLD: #f43f5e (rose) |
| Primary font | IBM Plex Sans Arabic + Montserrat Arabic | Cairo + Tajawal |
| Platform | Dukan (hosted SaaS) | Custom React/Flask |
| Tracking | TikTok Pixel + Clarity | None embedded |
| Payments | COD + ValU + Souhoola + Aman + card | Kashier only (POS) |

*_Actual live color may differ — stored in DB `settings` table via `get_setting('base_color')`_

### What We're Missing
| Gap | Impact |
|-----|--------|
| Live `base_color` value | Our design tokens might not match actual brand |
| Actual HVAR logo | Used across all software projects |
| Live product catalog | Catalog might show different products than live store |
| Dukan webhook auth details | Need to know how MCRM/OLD connects to real orders |
| WhatsApp wholesale flow | POS could handle this if we knew the process |

## Key Technical Insights

1. **Two separate frontend stacks**: pos-clone (Bootstrap/PHP/Blade) vs our projects (React/Tailwind) — the customer-facing store doesn't share our design system
2. **Shared database**: All systems read/write `hvar_erp` — the POS, OLD, and MCRM all operate on the same data
3. **Bosta integration is real**: Auto-shipment creation on order sync — the delivery pipeline is operational
4. **Accounting is mature**: Full Arabic chart of accounts with transactions, budgets, mappings
5. **MCRM is the most evolved**: Latest design system, most comprehensive status system, live in production
