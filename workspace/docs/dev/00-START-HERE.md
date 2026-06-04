# Hvar New Site — Developer Entry Point

> Read this first. Five minutes here saves five days of wrong decisions.

---

## The Insight That Changes Everything

The MCRM at `mcrm.hvarstore.com` is the **staff portal**. It lets agents manage orders, tickets, and customers.

The new hvarstore.com is the **customer portal**. It lets customers place orders, track them, and open service requests.

**They are two windows onto the same database.** When an MCRM agent creates a maintenance ticket, the customer sees it appear on the new site. When a customer places an order on the new site, the MCRM agent sees it in their queue.

This is not a coincidence. This is the architecture. Build everything with this in mind.

---

## What We're Building

**hvarstore.com** — replacing the old Active eCommerce/Dukan storefront.

| Customer Need | What We Build |
|--------------|--------------|
| Browse and discover products | Product catalog with category filters, search |
| Buy online | Cart → checkout → COD or Kashier card/installments |
| Know their order is coming | Order confirmation, Bosta tracking link |
| Something went wrong → fix it | Open maintenance / replacement / return ticket |
| Know where their ticket stands | Ticket status page, state machine display |
| Contact Hvar | WhatsApp CTA, phone, email links |

This is the complete scope. No admin panel. No POS terminal. No multi-seller. This is a **customer-facing portal**.

---

## What Already Exists (Do Not Build These Again)

| System | What It Does | Your Relationship |
|--------|-------------|-------------------|
| Hvar-ERP (Laravel 10) | Orders, inventory, accounting, contacts | Read DB directly. Receive webhooks. Don't modify. |
| MCRM (Flask + React) | Staff operations: calls, tickets, hub | Reuse its DB patterns. Don't duplicate its logic. |
| `hvar_erp` MySQL | Single shared database | Your DB. Every system shares it. |

The code for almost everything you need already exists in MCRM. Your job is building the customer-facing layer on top.

---

## The Customer Journey — Full Flow

```
DISCOVERY
  Customer visits hvarstore.com
  Browses products (reads products + variations + variation_location_details)
  Searches by name, category, price range

PURCHASE
  Adds items to cart (React state only — no DB cart during browsing)
  Selects delivery: COD or Kashier online
  Enters phone number → auto-creates or loads contact from hvar_erp.contacts
  Enters address → governorate + district (dropdowns from cities + districts tables)
  Confirms order

PAYMENT
  COD: order created immediately, payment_status='due'
  Kashier: redirect → HPP → validate x-kashier-signature → confirm order

ORDER IN ERP
  New site fires: POST /websiteintegration/webHooksyncOrdersGet → ERP
  ERP creates transaction (status='draft', website_order_id=our_id)
  MCRM call center confirms → status='final' → Bosta shipment auto-created

ORDER TRACKING
  Customer checks order on site → reads transaction.bill_code
  Site shows Bosta tracking link → customer tracks delivery

AFTER SALE — SERVICE REQUEST
  Customer opens: maintenance / replacement / return form
  Site creates service_ticket in hvar_erp (type=HVM/HVR/HVT, status=PENDING)
  MCRM hub agent sees it in their queue → processes it

TICKET TRACKING
  Customer checks ticket page → reads service_tickets.status
  Sees: PENDING → HUB_RECEIVED → IN_WORKSHOP → READY → CLOSED
  Each state has an Arabic description and expected timeline
```

---

## The Five Rules

1. **ERP is the authority.** Stock, orders, contacts, tickets — all in `hvar_erp`. You don't own the data, you display and feed it.

2. **Phone is identity.** No email accounts. Customers are identified by their Egyptian mobile number. Normalize every phone to `01XXXXXXXXX` before using it.

3. **Kashier orderId is a UUID.** Never `last_id + 1`. Never. Generate `HVAR-{uuid4[:12]}` before redirecting, store in `pending_payments`, match on callback.

4. **Stock is `variation_location_details.qty_available`.** Not `product_stocks.qty`. Re-check at order creation inside a DB transaction with `FOR UPDATE`.

5. **Never hard-delete.** Orders get `cancelled_at` timestamps. Cancellation fires an ERP delete webhook. The ERP needs to know the order is gone before we stop keeping it.

---

## Documents in This Dev Guide

| File | What It Covers |
|------|---------------|
| `00-START-HERE.md` | This file |
| `01-ECOSYSTEM.md` | All systems, integration points, shared DB |
| `02-ERP-CONTRACT.md` | Exact payload formats the ERP expects |
| `03-KASHIER.md` | Payment integration — the correct implementation |
| `04-DATA-FLOWS.md` | Stock authority, order lifecycle, Bosta, phone normalization |
| `05-SITE-SPEC.md` | Full site spec: pages, routes, components, API |
| `06-SERVICE-PORTAL.md` | Service ticket portal: forms, state display, customer flow |

---

## Start Coding In This Order

1. Read `02-ERP-CONTRACT.md` — understand what the ERP needs from you
2. Read `03-KASHIER.md` — understand the payment flow before any checkout work
3. Read `04-DATA-FLOWS.md` — understand stock and order lifecycle
4. Read `05-SITE-SPEC.md` — full feature breakdown
5. Copy `workspace/examples/MCRM/app/` as your Flask backend starter
6. Copy `workspace/examples/wilson-eg/project/frontend/` as your React starter
