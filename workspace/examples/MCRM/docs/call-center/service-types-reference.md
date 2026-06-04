# Service Types Reference

> Call center context: how each type behaves from the agent's perspective.
> Hub workflow details (state machines, stock ops): `docs/hub/service_tickets.md`

---

## Overview

| Type | Arabic | Purpose | Ticket Prefix | Customer sends? | Hub sends? |
|------|--------|---------|---------------|-----------------|------------|
| **R** | استبدال | Replacement — defective item in, new item out | HVR | ✓ defective | ✓ new product |
| **M** | صيانة | Maintenance — item repaired and returned | HVM | ✓ for repair | ✓ repaired |
| **T** | استرجاع | Return — refund, item back to stock | HVT | ✓ for refund | ✗ |
| **S** | بيع | Sell — parts/products to customer | HVS | ✗ | ✓ ordered items |

---

## Agent Decision Tree

```
"What does the customer need?"

├─ Product is broken/damaged
│    ├─ Under warranty (≤6 months) or wants new product → R
│    └─ Willing to repair → M
│
├─ Wants to fix product → M
├─ Wants to return for refund → T
└─ Wants to buy something → S
```

Quick map:
| Customer says | Type | Key question |
|---------------|------|--------------|
| منتجي تالف | R or M | Warranty? Replacement or repair? |
| عايز أستبدل | R | Confirm replacement |
| عايز أصيانة | M | Repair confirmed |
| عايز أرجع المنتج | T | Refund confirmed |
| عايز أشتري | S | Product or parts? |
| جاني المنتج غلط | R or T | Replacement or return based on timing |

---

## Stock Impact by Type

| Type | Stock Reserved? | When? | Stock Deducted? | When? |
|------|-----------------|-------|-----------------|-------|
| R | ✓ Auto | CONFIRMED | ✓ Auto | SENT |
| M | ✗ | — | ✓ Manual | complete_maintenance |
| T | ✗ | — | ✗ (adds to stock) | validate_items |
| S (parts) | ✓ Auto | CONFIRMED | ✓ Auto | SENT |
| S (products) | ✗ reference only | — | ✗ | — |

---

## Type Comparison

| Aspect | R | M | T | S |
|--------|---|---|---|---|
| Lifecycle | Full (7 states) | Full (7 states) | Short (4 states) | Full w/ optional RETURNED |
| Tracking numbers | 3 (original, send, receive) | 2 (send, receive) | 1 (receive) | 1 (send) |
| Payment direction | None (warranty) or paid repair | Paid (out-of-warranty) | Refund to customer | Customer pays |
| Auto stock ops | RESERVE + COMMIT | None | RECEIVE on complete | RESERVE + COMMIT (parts) |
| Has sub-states | ✓ | ✓ | ✗ | ✗ |

---

## Business Rules

### R — Replacement
- R-001: Stock auto-reserved at CONFIRMED
- R-002: Cannot proceed if replacement stock unavailable
- R-003: Defective item must be returned within 7 days
- R-004: Warranty (≤6 months) = free; >6 months = paid
- R-005: original_tracking = the Bosta order that brought the defective item

### M — Maintenance
- M-001: NO auto stock reservation
- M-002: Parts deducted manually during `complete_maintenance`
- M-003: Customer approval required for repairs >500 EGP
- M-004: Warranty repairs (≤6 months) free; out-of-warranty = paid before dispatch

### T — Return
- T-001: No READY_FOR_DISPATCH or SENT states
- T-002: Direct IN_PROCESS → COMPLETED
- T-003: Full refund if returned ≤14 days (buyer's remorse)
- T-004: Resellable items → back to stock; damaged → write off

### S — Sell
- S-001: Parts auto-reserved at CONFIRMED; products never reserved
- S-002: Payment required before READY_FOR_DISPATCH
- S-003: Customer type (customer/merchant) determines pricing tier
- S-004: Returned items may trigger a T (Return) workflow

---

## Sell: Product vs Part

| Aspect | Product (منتج) | Part (قطعة) |
|--------|----------------|-------------|
| Stock impact | None (reference only) | Yes (reserved → committed) |
| Validation | No stock check | Availability required |
| Pricing | `price_customer` or `price_merchant` | Same |
| Examples | خلاط فيليبس كامل | قطعة غيار، محرك |

Customer types: `customer` (B2C, retail price) · `merchant` (B2B, wholesale price)

---

## Call Center → Hub Handoff

```
Call Center (orders table):
  status: draft → pending → confirmed → converted
                                              ↓
Hub (service_tickets table):
  status: PENDING → CONFIRMED → IN_PROCESS → ... → COMPLETED
```

Once leader approves → order.status = `converted` → ticket created in hub → read-only in call center.
