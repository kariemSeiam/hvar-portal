# Gaps — What This Research Is Missing

> Updated after POS codebase analysis (2026-05-31).
> ✅ = Filled | ⬜ = Still open

## Critical Gaps

| # | Gap | Status | How | Action Needed |
|---|-----|--------|-----|---------------|
| 1 | **hvarstore.com actual design tokens** | ✅ Partial | Default: `#d43533` deep red, IBM Plex Sans Arabic + Montserrat Arabic fonts (from `app.blade.php`) | Verify live values — `base_color` might differ from default |
| 2 | **Dukan API/export capabilities** | ✅ Filled | Webhooks: POST `/WebHooksyncOrdersGet/Update/Delete`. Manual: `syncOrdersGet`, `syncCategoriesGet`, `syncProductsGet`, `syncAttributesGet` | Confirmed working — no action needed |
| 3 | **Real order data structure** | ✅ Filled | `Transaction` model: `website_order_id`, `type='sell'`, `status='draft'`, shipping: `state→cities.id`, `city→districts.district_id`, auto-Bosta tracking | No action |
| 4 | **Brand logo** | ⬜ Open | Not found in codebase as "hvar" | Need you to provide or screenshot |

## Medium Gaps

| # | Gap | Status | Notes |
|---|------|--------|-------|
| 5 | **Product/SKU list + pricing** | ⬜ Open | Schema exists (`products`, `variations`, `variation_location_details`) but no dump of this data | 
| 6 | **WhatsApp wholesale flow** | ⬜ Open | Not found in scanned files — may be in frontend partials |
| 7 | **ValU/Souhoola/Aman API** | ⬜ Open | Payment gateways — not in the current scope |
| 8 | **Customer reviews data** | ⬜ Open | No review system visible in the platform |
| 9 | **Social media engagement metrics** | ⬜ Open | External — needs API access |

## Low Gaps

| # | Gap | Status | Notes |
|---|------|--------|-------|
| 10 | **Competitor pricing comparison** | ⬜ Open | Manual research |
| 11 | **Ad library data** | ⬜ Open | Meta Ad Library |
| 12 | **After-sales return flow** | ⬜ Open | Operational |
| 13 | **Real stock levels** | ⬜ Open | In DB but not dumped |
| 14 | **Employee/operator roles** | ⬜ Open | `User` model has roles but workforce structure unknown |

## What We Learned From the Codebase

1. hvarstore.com = pos-clone (Dukan/6valley platform) + live (Ultimate POS backend)
2. Brand template: red `#d43533`, IBM Plex Sans Arabic, RTL Bootstrap, TikTok+Clarity tracking
3. Order sync: Dukan → webhook → OrderSyncService → Transaction table
4. Shipping: Bosta API integration, governorate/district matching with Arabic spelling normalization
5. Accounting: Full Arabic chart of accounts (assets, liabilities, equity, income, expenses)
6. Two phone numbers, two storefronts — confirmed by the codebase structure

## How to Close the Rest

```
Provide → hvarstore.com screenshots + DB settings query
       → brand logo (any format)
       → product list from admin panel
       → I digest everything into the research docs
```
