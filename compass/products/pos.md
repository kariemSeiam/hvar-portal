# POS Direction — هفار

> Direction for the physical POS terminal and its integration with the Hvar ecosystem. Note the naming clarification below — this is important context for the entire document.

---

## Naming Clarification

The `pos/` directory in the repository is the customer portal (hvarstore.com). The actual POS terminal — the physical in-store/warehouse point-of-sale interface — is **Ultimate POS**, a separate third-party application. When this document says "POS," it means the Ultimate POS terminal and its integration layer. When it says "hvarstore.com" or "the portal," it means the customer-facing web application.

This naming conflict exists because the project was initially scoped around POS functionality and the directory name reflects that origin. The customer portal absorbed that scope, but the directory name didn't change. Keep this mental model clear.

---

## POS's Role in the Hvar Ecosystem

The POS terminal handles:
- **Walk-in customers** at physical locations (store, showroom, warehouse)
- **Cash and card payments** (Kashier POS terminal, distinct from the Kashier HPP used online)
- **Stock deduction** at point of sale — this is where stock physically leaves the system
- **Warranty registration** for in-store purchases (contact created in ERP at sale)
- **Return and exchange processing** for in-store customers

The POS integrates directly with `hvar_erp` — it IS the Ultimate POS interface writing to that database. Every sale through the POS terminal directly modifies `variation_location_details.qty_available`. This is why our hvarstore.com must always re-read stock from the ERP rather than caching it: the POS terminal may have sold items between our page load and our order creation.

---

## What the Compass Controls Here

We do not build the POS UI — it is Ultimate POS. The compass controls:

1. **How hvarstore.com orders arrive and appear in the POS context** — when a customer places an order online, the ERP webhook creates a `transactions` record that an agent sees in the POS/mCRM interface
2. **How POS stock deductions affect hvarstore.com** — the system does not notify us; we re-read on next request
3. **Naming conventions that bridge both systems** — the same entity has different names in our system vs. the POS
4. **Data assumptions we make that depend on POS behavior** — things we must not assume because the POS behaves unexpectedly

---

## Critical Integration Points

### Order Webhook Flow (hvarstore.com → POS/ERP)

When a customer places an order on hvarstore.com and it is confirmed (COD placed or Kashier payment verified):

1. hvarstore.com API fires `POST /websiteintegration/webHooksyncOrdersGet` to the ERP
2. Ultimate POS creates a `transactions` record in `hvar_erp`:
   - `status = 'draft'`
   - `website_order_id = [our internal order ID]`
   - `type = 'sell'`
3. The mCRM agent (or POS terminal agent) sees this draft transaction
4. Agent confirms → `status = 'final'` → stock is deducted → Bosta shipment created

**The link is `transactions.website_order_id`:** this is how we associate an ERP transaction with our order. This field must be stored in both systems. When querying an order's ERP status, look up `transactions WHERE website_order_id = ?`.

### Stock Read Flow (POS → hvarstore.com)

The POS terminal does not notify hvarstore.com when stock changes. There is no event or webhook. The flow is:

1. POS agent completes a sale → ERP deducts from `variation_location_details.qty_available` immediately
2. Next time hvarstore.com reads stock for that product → correct quantity is returned
3. Orders in-flight on hvarstore.com that have not yet re-validated stock may be based on stale data

**Design implication:** never trust the stock quantity from a page load to be valid at checkout time. The `SELECT ... FOR UPDATE` at order creation is the only authoritative stock check. The stock display on the product page is advisory.

### Contact Sync (POS ↔ hvarstore.com)

Both systems write to `hvar_erp.contacts`. The POS creates contacts when a walk-in customer makes a purchase. hvarstore.com creates contacts when a customer registers or places an order. Phone is the primary key for deduplication.

**The deduplication rule:** before writing a new contact, check for an existing contact with the same normalized phone number. If it exists, update name if the existing name is blank; otherwise preserve the existing contact record. Do not create two contacts for the same phone.

**POS contact format:** the POS may store phone numbers in different formats depending on how the cashier enters them. When syncing or looking up contacts that originated in the POS, normalize before lookup.

---

## POS-Specific Naming Conventions

The POS (Ultimate POS) uses different terminology for the same concepts. This table is the translation layer.

| Our term | POS/ERP term | Notes |
|----------|-------------|-------|
| Order | Transaction | `hvar_erp.transactions`, `type='sell'` |
| Order ID | `transactions.id` + `website_order_id` | We store our ID as `website_order_id` in the ERP |
| Customer | Contact | `hvar_erp.contacts`, `type='customer'` |
| Product page | — | POS doesn't have a product page; catalog is browse/search within the POS UI |
| Service ticket | — | Service tickets are in `mcrm_hvar_hub`, not the POS |
| Governorate | City | In `hvar_erp.cities`, each row is a governorate |
| District / city | District | In `hvar_erp.districts`, each row is what Egyptians call a city or neighborhood |
| Stock | `qty_available` | In `variation_location_details`, not `product_stocks` |
| In-store order | — | No special term; same `transactions` table, but without a `website_order_id` value |

### Our Order ID Format

hvarstore.com order IDs follow the format `HVAR-{UUID4[:12].toUpperCase()}` — e.g., `HVAR-3F4A9B2C1E7D`. This format:
- Is never sequential (no `last_id+1`) — prevents order count inference
- Is stored in `pending_payments` before the HPP redirect
- Is stored in `hvar_erp.transactions.website_order_id` after webhook
- Is shown to the customer in order confirmation and tracking

The ERP's own `transactions.id` is a sequential integer that we store internally but do not expose to customers in URLs or communications — it would reveal order volume to competitors.

---

## What Never to Assume

### Assumption 1: Deleted POS Transactions Were Soft-Deleted

The POS hard-deletes cancelled transactions in some scenarios. A transaction that existed when we last queried and does not exist in the next query was not soft-deleted — it was hard-deleted. Our code cannot assume that a missing `transaction` row means `status='cancelled'`. It means the record is gone.

**Design implication:** do not build logic that depends on reading the ERP transaction's final state after cancellation. Store the order status in our own `hvar_site.orders` table. The ERP is the authority for active orders; our table is the authority for the history of what happened.

**The soft-delete is our responsibility:** when we want to cancel an order, we fire the cancel webhook first, then soft-delete in our DB. We never rely on reading a "cancelled" status back from the ERP — we control the cancellation and record it ourselves.

### Assumption 2: POS Stock Updates Are Synchronous

Stock deduction by the POS is synchronous within that transaction, but our read of the updated stock quantity might arrive before or after depending on MySQL replication lag (if any), connection pool behavior, or query timing.

**Design implication:** at order creation on hvarstore.com, use `SELECT qty_available FROM variation_location_details WHERE ... FOR UPDATE` within a transaction. This lock ensures we read and check stock with exclusive access during the critical window. Do not assume that a stock quantity read 5 minutes before order creation is still accurate.

### Assumption 3: POS and hvarstore.com Phone Formats Are Consistent

The POS terminal accepts phone numbers typed in by cashiers. Cashier entry is not normalized. A contact entered via the POS may have a phone stored as `+2001012345678`, `01012345678`, `1012345678`, or any other variant the cashier typed.

**Design implication:** every phone lookup normalizes first. The normalization function runs regardless of where the phone number came from.

### Assumption 4: A `website_order_id` Always Corresponds to a Valid hvarstore.com Order

It is possible for a `website_order_id` to exist in the ERP from a failed webhook, a test order, or a deleted-order scenario. When fetching an order's ERP transaction:

1. Look up `transactions WHERE website_order_id = [our_id] AND type = 'sell'`
2. If no row found: the transaction may have been hard-deleted (see assumption 1), or the webhook may have failed. Handle this gracefully — it does not mean the customer's order doesn't exist.
3. Do not fail the entire order display because the ERP transaction is missing. Show what we know from our own `hvar_site.orders` table; note that ERP sync is pending.

### Assumption 5: Bosta Shipment Creation Is Immediate After Final

When the agent confirms an order and the transaction moves to `status='final'`, the Bosta shipment is typically created shortly after — but not always immediately. The timing depends on the mCRM/POS integration. Do not assume `bill_code` is populated immediately after `status='final'`. Poll or refresh the transaction to get the `bill_code` once it is available.

**Design implication:** the "track your order" link in hvarstore.com shows only when `bill_code` is non-null in the corresponding transaction. Before then, show "order confirmed — shipment being prepared" without a tracking link.
