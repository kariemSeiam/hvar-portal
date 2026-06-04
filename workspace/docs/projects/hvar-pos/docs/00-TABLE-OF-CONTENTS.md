# Hvar-POS — Documentation

> Root: `/hub/projects/dev/hvar/pos/workspace/examples/Hvar-POS/`
> Repo: `kariemSeiam/Hvar-POS`
> Origin: Active eCommerce CMS by ActiveITzone
> Customized by: Dokkan Agency 2024 — `v1.0.0 beta`

---

## Index

| # | File | What it covers |
|---|------|----------------|
| 01 | [01-OVERVIEW.md](01-OVERVIEW.md) | System landscape — what POS is, what ERP is, how they connect |
| 02 | [02-ORIGINS.md](02-ORIGINS.md) | Upstream origins, license, version history, Hvar delta |
| 03 | [03-ARCHITECTURE.md](03-ARCHITECTURE.md) | Laravel structure, key directories, route groups, models |
| 04 | [04-STOCK-FLOW.md](04-STOCK-FLOW.md) | **⭐ Full stock lifecycle** — POS stock, ERP stock, sync, drafts, mapping |
| 05 | [05-ORDER-LIFECYCLE.md](05-ORDER-LIFECYCLE.md) | Cart → Checkout → Payment → Order → Fulfillment → Sync to ERP |
| 06 | [06-PAYMENT-GATEWAYS.md](06-PAYMENT-GATEWAYS.md) | All 20+ gateways, architecture, flow pattern |
| 07 | [07-KASHIER-DEEP.md](07-KASHIER-DEEP.md) | **⭐ Kashier deep dive** — config, hash generation, callback, mapping |
| 08 | [08-POS-TERMINAL.md](08-POS-TERMINAL.md) | Admin/seller POS screen — search, cart, order placement |
| 09 | [09-ERP-INTEGRATION.md](09-ERP-INTEGRATION.md) | Integration API, webhooks, cron jobs, mapping tables |
| 10 | [10-API-V2.md](10-API-V2.md) | Flutter mobile API — auth, products, cart, orders, delivery boy |
| 11 | [11-MULTI-SELLER.md](11-MULTI-SELLER.md) | Seller marketplace — products, commissions, withdraws |
| 12 | [12-CUSTOMIZATIONS.md](12-CUSTOMIZATIONS.md) | Hvar customizations — 🐺 commits, Bosta, security audit |
| 13 | [13-DATABASE-REFERENCE.md](13-DATABASE-REFERENCE.md) | Key tables, columns, relationships |
| 14 | [14-CRON-SCHEDULER.md](14-CRON-SCHEDULER.md) | All cron jobs — stock sync, order cancel, shipping status |
| 15 | [15-SHIPPING.md](15-SHIPPING.md) | Shipping — Turbo, Bosta, carriers, tracking |
