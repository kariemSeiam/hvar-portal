# Service Type Workflows Documentation

**Version**: 2.0.0 - Draft-First Architecture
**Last Updated**: 2025-02-10
**Context**: Call Center Page - Unified Draft-to-Ticket Management

> **IMPORTANT**: This document describes the NEW draft-first workflow where service type is selected AFTER draft creation, not before.

## Table of Contents
1. [Overview](#overview)
2. [Draft-First Philosophy](#draft-first-philosophy)
3. [Service Type R - Replacement (استبدال)](#service-type-r---replacement-استبدال)
4. [Service Type M - Maintenance (صيانة)](#service-type-m---maintenance-صيانة)
5. [Service Type T - Return (استرجاع)](#service-type-t---return-استرجاع)
6. [Service Type S - Sell (المبيعات)](#service-type-s---sell-بيع-قطع)
7. [Type Selection Matrix](#type-selection-matrix)
8. [Ticket Number Format](#ticket-number-format)
9. [Stock Impact Matrix](#stock-impact-matrix)
10. [API Endpoints Reference](#api-endpoints-reference)

---

## Overview

The Call Center system manages four distinct service types through a **unified draft-first workflow**:

| Type | Name (Arabic) | Name (English) | Purpose | Ticket Prefix |
|------|---------------|----------------|---------|---------------|
| **R** | استبدال | Replacement | Customer receives new product, returns defective item | HVR |
| **M** | صيانة | Maintenance | Customer sends product for repair | HVM |
| **T** | استرجاع | Return | Customer returns item for refund | HVT |
| **S** | المبيعات | Sell Parts/Products | Customer buys parts or products | HVS |

### Draft-First Universal Workflow

```
CUSTOMER CONTACT
       ↓
DRAFT ORDER CREATED (service_type = NULL)
       ↓
AGENT COLLECTS CUSTOMER INFO & ISSUE DETAILS
       ↓
AGENT SELECTS SERVICE TYPE
       ↓
TYPE-SPECIFIC DATA COLLECTION
       ↓
SUBMIT FOR LEADER APPROVAL
       ↓
LEADER APPROVES → TICKET CREATED
       ↓
TYPE-SPECIFIC TICKET WORKFLOW
       ↓
COMPLETED & ARCHIVED
```

### Key Principles

1. **Draft Creation First**: Always create draft without service type
2. **Type Selection Second**: Agent selects type after understanding customer need
3. **Flexible Workflow**: Draft can be converted to any type until submitted
4. **Customer-Centric**: Type determined by WHAT customer needs, not predetermined

---

## Draft-First Philosophy

### Why Draft-First?

The draft-first approach separates **intent capture** from **type classification**:

```
TRADITIONAL APPROACH (OLD):
Customer calls → Agent selects type → Creates order → May need to change type

DRAFT-FIRST APPROACH (NEW):
Customer calls → Create draft → Understand need → Select type → Proceed correctly
```

### Benefits

| Benefit | Description |
|---------|-------------|
| **Reduced Re-classification** | Type selected after understanding, reducing changes |
| **Better Customer Experience** | Agent focuses on customer's problem first |
| **Flexible Data Collection** | Collect common fields once, add type-specific later |
| **Clearer Intent Documentation** | Draft records initial customer statement |
| **Easier Training** | New agents learn one flow, then type specifics |

### Draft States

| State | service_type | Description | Next Action |
|-------|--------------|-------------|-------------|
| `draft` | NULL | Initial state, collecting info | Select type or continue collecting |
| `pending` | SET | Type selected, awaiting approval | Leader review |
| `confirmed` | SET | Customer confirmed all details | Leader approval |
| `converted` | SET | Service ticket created | Archived |
| `canceled` | NULL or SET | Canceled by agent/customer | Archived |

### Common Draft Fields (All Types)

```javascript
{
  // Customer Information (REQUIRED)
  customer_id: INT,
  customer_name: STRING,
  customer_phone: STRING,        // 01XXXXXXXXX format
  customer_address: {
    governorate: STRING,
    city: STRING,
    full_address: STRING
  },

  // Contact
  contact_phone: STRING,         // Optional: Different phone

  // Issue Description
  description: TEXT,             // Initial problem description
  notes: TEXT,                   // Additional notes

  // Source
  source: ENUM('erp', 'bosta', 'direct'),
  source_data: JSON,             // Bosta order details, etc.

  // Meta
  created_by: STRING,            // Agent name/id
  created_at: TIMESTAMP,

  // Type Selection
  service_type: ENUM('R', 'M', 'T', 'S') NULL  // NULL until selected
}
```

---

## Service Type R - Replacement (استبدال)

### Purpose
Customer receives a new product in exchange for a defective item that must be returned.

### Draft Creation Phase

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: CREATE DRAFT (No Type Yet)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Customer: Ahmed Mohamed                                        │
│  Phone: 01012345678                                             │
│  Address: القاهرة، المعادي                                       │
│                                                                  │
│  Initial Description:                                           │
│  "الوصل وبه مشكلة في التشغيل..."                              │
│  (The mixer has an operation problem...)                        │
│                                                                  │
│  Source: Bosta Order BOS123                                     │
│                                                                  │
│  Draft Status: draft                                            │
│  Service Type: NULL (not yet selected)                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: AGENT SELECTS TYPE = 'R'                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Agent selects: [🔧 REPLACEMENT]                                │
│                                                                  │
│  System shows REPLACEMENT-SPECIFIC FORM                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Type-Specific Fields (R)

```javascript
{
  // Original Item
  original_tracking: STRING,     // Bosta tracking number
  original_sku: STRING,          // Product SKU if known
  original_name: STRING,         // Product name
  original_condition: ENUM('defective', 'damaged', 'warranty_issue'),

  // Replacement Item
  replacement_item_id: INT,      // From stock_items
  replacement_sku: STRING,
  replacement_name: STRING,
  replacement_quantity: INT,

  // Warranty
  is_warranty: BOOLEAN,          // ≤6 months = free replacement
  purchase_date: DATE,           // For warranty calculation

  // Tracking Numbers (Three-way)
  new_tracking_send: STRING,     // Outbound (new product to customer)
  new_tracking_receive: STRING,  // Inbound (defective from customer)

  // Reason
  reason_code: ENUM('defective', 'wrong_item', 'damaged', 'other'),
  reason_details: TEXT
}
```

### Complete Ticket Workflow (After Draft Conversion)

```
DRAFT ORDER (Type R selected)
    ↓
[AGENT] Completes R-specific fields
[AGENT] Submits for leader approval
    ↓
PENDING (تذكرة مؤقتة)
    - Ticket created: HVR251020001
    - Status: PENDING (10% progress)
    - Waiting for leader approval
    - Stock NOT reserved yet
    ↓
[LEADER] Reviews and approves
    ↓
CONFIRMED (مؤكدة)
    - Status: CONFIRMED (25% progress)
    - Stock AUTOMATICALLY RESERVED
    - Customer notified of approval
    - Team assigned to ticket
    ↓
IN_PROCESS (قيد المعالجة) - THREE SUB-STATES:
    a) received (تم الاستلام)
       - Defective item received from customer
       - Team logs receipt condition
       - Photos may be attached
       ↓
    b) under-maintenance (تحت الصيانة)
       - Defective item being tested/processed
       - Team may diagnose issue
       - Determines if warranty applies
       ↓
    c) completion-ready (جاهز للاستكمال)
       - Testing complete
       - New product ready for dispatch
       - Final quality check done
    ↓
READY_FOR_DISPATCH (جاهز للشحن)
    - Status: READY_FOR_DISPATCH (75% progress)
    - New product packaged
    - Shipping label prepared
    - Waiting for courier pickup
    ↓
SENT (تم الإرسال)
    - Status: SENT (90% progress)
    - New product shipped to customer
    - Tracking active
    - Waiting for defective item return
    ↓
RETURNED (تم الاسترجاع)
    - Status: RETURNED (95% progress)
    - Defective item received back
    - Stock updated (if applicable)
    - Warranty determination made
    ↓
COMPLETED (مكتمل)
    - Status: COMPLETED (100% progress)
    - Ticket archived
    - Case closed
```

### Business Rules (R)

| Rule | Description |
|------|-------------|
| **R-001** | Stock reservation occurs automatically at CONFIRMED |
| **R-002** | Ticket cannot progress if replacement stock unavailable |
| **R-003** | Defective item MUST be returned within 7 days of customer receipt |
| **R-004** | Warranty coverage: ≤6 months = free, >6 months = paid |
| **R-005** | Three tracking numbers: original (Bosta), send (new product), receive (defective return) |
| **R-006** | Cannot reach COMPLETED until RETURNED status achieved |

### Stock Impact (R)

| Status | Stock Action | Item Status |
|--------|--------------|-------------|
| PENDING | None | - |
| CONFIRMED | Reserve replacement item | reserved |
| IN_PROCESS | Hold reserved | reserved |
| READY | Prepare for shipment | reserved |
| SENT | Deduct from stock | sold |
| RETURNED | Log defective receipt | separate entry |
| COMPLETED | Finalize | sold (new), logged (defective) |

---

## Service Type M - Maintenance (صيانة)

### Purpose
Customer sends product for repair, may receive replacement parts, but core product is returned after service.

### Draft Creation Phase

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: CREATE DRAFT (No Type Yet)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Customer: Fatima Ali                                          │
│  Phone: 0223456789                                             │
│  Address: الإسكندرية، سموحة                                     │
│                                                                  │
│  Initial Description:                                           │
│  "غسالة ملابس تعمل بصوت عالي..."                             │
│  (Washing machine makes loud noise...)                          │
│                                                                  │
│  Source: Direct call                                           │
│                                                                  │
│  Draft Status: draft                                            │
│  Service Type: NULL                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: AGENT SELECTS TYPE = 'M'                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Agent selects: [⚙️ MAINTENANCE]                                │
│                                                                  │
│  System shows MAINTENANCE-SPECIFIC FORM                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Type-Specific Fields (M)

```javascript
{
  // Item to Repair
  item_description: TEXT,
  item_serial_number: STRING,
  item_category: STRING,         // e.g., "خلاط", "مكنسة", "غسالة"

  // Problem
  problem_description: TEXT,
  symptom_codes: ARRAY,          // e.g., ['noise', 'leaking', 'power_issue']

  // Estimates
  estimated_parts: ARRAY,        // [{sku, name, quantity}]
  estimated_labor_hours: DECIMAL,
  estimated_cost: DECIMAL,

  // Customer Approval
  requires_approval: BOOLEAN,    // Cost > 500 EGP
  approval_status: ENUM('pending', 'approved', 'declined'),

  // Photos
  photos: ARRAY,                 // URLs to uploaded photos
  photo_required: BOOLEAN        // Based on item type
}
```

### Complete Ticket Workflow (After Draft Conversion)

```
DRAFT ORDER (Type M selected)
    ↓
[AGENT] Completes M-specific fields
[AGENT] Submits for leader approval
    ↓
PENDING (تذكرة مؤقتة)
    - Ticket created: HVM251020002
    - Waiting for leader approval
    - NO automatic stock operations
    ↓
[LEADER] Reviews and approves
    ↓
CONFIRMED (مؤكدة)
    - Service approved
    - Team assigned
    - Customer notified to send item
    - NO stock reservation (manual later)
    ↓
IN_PROCESS (قيد المعالجة) - THREE SUB-STATES:
    a) received (تم الاستلام)
       - Item received from customer
       - Initial inspection logged
       - Photos attached showing condition
       - Problem description confirmed
       ↓
    b) under-maintenance (تحت الصيانة)
       - Diagnosis in progress
       - Parts needed identified
       - Manual stock operations:
         * Parts deducted from stock
         * Labor hours logged
       - Customer may be contacted for approval
       ↓
    c) completion-ready (جاهز للاستكمال)
       - Repair complete
       - Testing performed
       - Quality check passed
       - Photos of repaired item attached
       - Final cost calculated
    ↓
READY_FOR_DISPATCH (جاهز للشحن)
    - Repaired item packaged
    - Shipping label prepared
    - Any replaced parts listed
    ↓
SENT (تم الإرسال)
    - Repaired item shipped to customer
    - Tracking active
    - Invoice sent (if applicable)
    ↓
COMPLETED (مكتمل)
    - Customer confirms receipt (optional)
    - Payment processed (if applicable)
    - Ticket archived
```

### Business Rules (M)

| Rule | Description |
|------|-------------|
| **M-001** | NO automatic stock reservation at CONFIRMED |
| **M-002** | Parts must be manually deducted during under-maintenance |
| **M-003** | Photos required at: received, under-maintenance, completion-ready |
| **M-004** | Customer approval required for repairs >500 EGP |
| **M-005** | Warranty repairs (≤6 months old) are free |
| **M-006** | Out-of-warranty repairs require payment before dispatch |
| **M-007** | Repaired items must pass quality check before READY_FOR_DISPATCH |

### Stock Impact (M)

| Status | Stock Action | Item Status |
|--------|--------------|-------------|
| PENDING | None | - |
| CONFIRMED | None | - |
| IN_PROCESS | Manual deduction by technician | sold (parts used) |
| READY | None | - |
| SENT | None | - |
| COMPLETED | Finalize | sold (parts used) |

**Note**: Type M has NO automatic stock operations. All stock changes are manual during under-maintenance.

---

## Service Type T - Return (استرجاع)

### Purpose
Customer returns item for refund, typically within warranty period or due to buyer's remorse.

### Draft Creation Phase

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: CREATE DRAFT (No Type Yet)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Customer: Omar Hassan                                         │
│  Phone: 0123456789                                             │
│  Address: الجيزة، الدقي                                         │
│                                                                  │
│  Initial Description:                                           │
│  "عايز أرجع مكيف الهواء..."                                   │
│  (I want to return the air conditioner...)                     │
│                                                                  │
│  Source: WhatsApp message                                      │
│                                                                  │
│  Draft Status: draft                                            │
│  Service Type: NULL                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: AGENT SELECTS TYPE = 'T'                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Agent selects: [↩️ RETURN]                                     │
│                                                                  │
│  System shows RETURN-SPECIFIC FORM                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Type-Specific Fields (T)

```javascript
{
  // Original Order
  original_invoice: STRING,
  original_purchase_date: DATE,
  original_amount: DECIMAL,
  original_payment_method: STRING,

  // Return Reason
  return_reason_code: ENUM('defective', 'wrong_item', 'buyer_remorse', 'other'),
  return_reason_details: TEXT,

  // Item Condition
  expected_condition: ENUM('new_in_box', 'like_new', 'used', 'damaged'),

  // Refund
  refund_method: ENUM('original_payment', 'bank_transfer', 'store_credit'),
  refund_amount: DECIMAL,
  refund_notes: TEXT,

  // Timeframe
  is_within_return_window: BOOLEAN, // 14 days for buyer's remorse
  days_since_purchase: INT
}
```

### Complete Ticket Workflow (After Draft Conversion)

```
DRAFT ORDER (Type T selected)
    ↓
[AGENT] Completes T-specific fields
[AGENT] Submits for leader approval
    ↓
PENDING (تذكرة مؤقتة)
    - Ticket created: HVT251020003
    - Waiting for leader approval
    - NO stock operations (yet)
    ↓
[LEADER] Reviews and approves
    [LEADER] May request additional documentation
    ↓
CONFIRMED (مؤكدة)
    - Return authorized
    - Customer notified to send item
    - Return shipping label generated
    - Refund amount calculated
    ↓
IN_PROCESS (قيد المعالجة)
    - Item received from customer
    - Condition inspected
    - Refund eligibility verified
    - NO sub-states (single phase)
    ↓
    [TEAM] Inspects returned item
    [TEAM] Verifies:
      - Serial number matches
      - Condition matches description
      - All parts included
      - Warranty valid (if applicable)
    ↓
COMPLETED (مكتمل)
    - Refund processed
    - Item returned to stock (if resellable) or written off
    - Customer notified of refund
    - Ticket archived
```

### State Progression (T)

```
PENDING (10%)
   ↓
CONFIRMED (25%)
   ↓
IN_PROCESS (50%)
   ↓
COMPLETED (100%)

Note: Type T has shortest lifecycle - no READY_FOR_DISPATCH or SENT states
      Direct progression from IN_PROCESS to COMPLETED
```

### Business Rules (T)

| Rule | Description |
|------|-------------|
| **T-001** | No READY_FOR_DISPATCH or SENT states |
| **T-002** | Direct transition from IN_PROCESS to COMPLETED |
| **T-003** | Return shipping label generated at CONFIRMED |
| **T-004** | Full refund if returned within 14 days (buyer's remorse) |
| **T-005** | Warranty returns require proof of purchase |
| **T-006** | Damaged items incur damage fee (deducted from refund) |
| **T-007** | Refund processed within 3-7 business days |
| **T-008** | Resellable items returned to stock status 'available' |
| **T-009** | Non-resellable items written off |

### Stock Impact (T)

| Condition | Action | New Stock Status |
|-----------|--------|------------------|
| Resellable | Return to stock | available |
| Damaged (minor) | Repair then return | in_repair → available |
| Damaged (major) | Write off | written_off |
| Defective | Return to manufacturer | returned_to_vendor |

**Note**: Type T does NOT deduct stock. It ADDS stock for resellable returns.

---

## Service Type S - Sell (المبيعات)

### Purpose
Customer purchases parts or products. **CRITICAL DISTINCTION** between PRODUCTS (reference only, no stock impact) and PARTS (inventory tracked).

### Key Distinction: PRODUCTS vs PARTS

| Aspect | PRODUCTS (منتجات) | PARTS (قطع) |
|--------|-------------------|-------------|
| **Stock Impact** | NONE (reference only) | YES (future implementation) |
| **Validation** | No stock checks needed | Stock availability required |
| **Use Case** | Selling complete products | Selling replacement parts |
| **Examples** | خلاط فيليبس, مكواة كهرباء | قطع غيار, إكسسوارات |
| **Reservation** | Never reserved | Reserved at CONFIRMED |
| **Tracking** | Product reference only | Individual part tracking |
| **Bosta Creation** | Can create Bosta product | Can create Bosta product |

### Customer Type Pricing

| Customer Type | Price Source | Margin | Use Case |
|---------------|--------------|--------|----------|
| **Customer (B2C)** | price_customer | Retail margin | Individual consumers |
| **Merchant (B2B)** | price_merchant | Wholesale margin | Business customers |

### Draft Creation Phase

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: CREATE DRAFT (No Type Yet)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Customer: Mohamed Kamal                                       │
│  Phone: 0112345678                                             │
│  Address: القاهرة، مدينة نصر                                    │
│                                                                  │
│  Initial Description:                                           │
│  "عايز أشتري خلاط فيليبس..."                                  │
│  (I want to buy a Philips mixer...)                            │
│                                                                  │
│  Source: Direct call                                           │
│                                                                  │
│  Draft Status: draft                                            │
│  Service Type: NULL                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: AGENT SELECTS TYPE = 'S'                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Agent selects: [💰 SELL]                                       │
│                                                                  │
│  System shows SELL-SPECIFIC FORM                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Type-Specific Fields (S)

```javascript
{
  // Items/Products
  items: ARRAY,                  // [{...}]
  {
    item_id: INT,                // From stock_items or NULL for reference
    sku: STRING,
    name: STRING,
    type: ENUM('product', 'part'), // NEW: Product vs Part
    quantity: INT,

    // Pricing
    price_customer: DECIMAL,     // Retail price
    price_merchant: DECIMAL,     // Wholesale price
    selected_price: DECIMAL,     // Based on customer_type

    // Stock Impact (for parts only, future)
    affect_stock: BOOLEAN        // true=parts, false=products (no impact)
  },

  // Customer Type (Pricing Tier)
  customer_type: ENUM('customer', 'merchant'),

  // Shipping
  shipping_address: {
    same_as_customer: BOOLEAN,
    governorate: STRING,
    city: STRING,
    full_address: STRING
  },

  // Payment
  payment_method: ENUM('cod', 'bank_transfer', 'wallet'),
  payment_status: ENUM('pending', 'paid', 'partial'),

  // Bosta Product Creation (NEW)
  create_bosta_product: BOOLEAN,  // Should Bosta pickup be created?
  bosta_product_ready: BOOLEAN,   // Ready for Bosta pickup

  // Special Instructions
  special_instructions: TEXT,
  gift_wrap: BOOLEAN,
  urgent: BOOLEAN
}
```

### Complete Ticket Workflow (After Draft Conversion)

```
DRAFT ORDER (Type S selected)
    ↓
[AGENT] Completes S-specific fields:
  - Adds items/products
  - Selects item type (PRODUCT or PART) for each
  - Selects customer type (customer or merchant)
  - System calculates pricing based on customer_type
[AGENT] Submits for leader approval
    ↓
PENDING (تذكرة مؤقتة)
    - Ticket created: HVS251020004
    - Waiting for leader approval
    - Stock NOT reserved yet
    ↓
[LEADER] Reviews and approves
    [LEADER] Verifies PARTS stock availability (if applicable)
    [LEADER] May adjust pricing (discounts)
    ↓
CONFIRMED (مؤكدة)
    - Order confirmed
    - Stock AUTOMATICALLY RESERVED for PARTS only
    - PRODUCTS: NO stock reservation
    - Payment requested
    - Customer notified
    ↓
IN_PROCESS (قيد المعالجة)
    - Payment confirmed
    - Items picked from warehouse:
      * PARTS: From reserved stock
      * PRODUCTS: From vendor or separate inventory
    - Order prepared for shipping
    - NO sub-states
    ↓
READY_FOR_DISPATCH (جاهز للشحن)
    - Order packaged
    - Shipping label prepared
    - Weight and dimensions calculated
    - Bosta product creation (if enabled)
    ↓
SENT (تم الإرسال)
    - Order shipped to customer
    - Tracking active
    - Payment collected (if COD)
    ↓
RETURNED (تم الاسترجاع) [OPTIONAL]
    - If customer returns items
    - May initiate Type T (Return) workflow
    - Or process as return within Type S ticket
    ↓
COMPLETED (مكتمل)
    - Customer confirms receipt (optional)
    - Final payment settled
    - Ticket archived
```

### Business Rules (S)

| Rule | Description |
|------|-------------|
| **S-001** | PARTS automatically reserved at CONFIRMED |
| **S-002** | PRODUCTS do NOT reserve stock (reference only) |
| **S-003** | Payment required before READY_FOR_DISPATCH |
| **S-004** | Customer pricing vs Merchant pricing based on customer_type |
| **S-005** | Shipping cost calculated based on weight/dimensions |
| **S-006** | RETURNS state is optional (for customer returns) |
| **S-007** | Returned items may trigger Type T workflow |
| **S-008** | Cannot sell more PARTS than available stock |
| **S-009** | PRODUCTS can be sold even if out of stock (reference/future) |
| **S-010** | Bosta product creation flag enables shipping integration |

### Stock Impact (S)

| Item Type | When Reserved | When Deducted | Final Status |
|-----------|---------------|---------------|--------------|
| **Part** | CONFIRMED | SENT | sold |
| **Product** | Never | Never | N/A (reference) |

### Example: Mixed Order (Products + Parts)

```
Customer Order:
1. Philips Mixer (PRODUCT) - Reference only
2. Mixer Blade (PART) - Stock tracked
3. Motor Unit (PART) - Stock tracked

Pricing (Customer Type: Customer):
- Mixer: 1500 EGP (retail)
- Blade: 150 EGP (retail)
- Motor: 450 EGP (retail)
Total: 2100 EGP

Stock Impact:
- Mixer: NO reservation (reference only)
- Blade: RESERVED at CONFIRMED, DEDUCTED at SENT
- Motor: RESERVED at CONFIRMED, DEDUCTED at SENT

If Customer Type: Merchant:
- Mixer: 1200 EGP (wholesale)
- Blade: 120 EGP (wholesale)
- Motor: 360 EGP (wholesale)
Total: 1680 EGP
```

---

## Type Selection Matrix

### Decision Tree for Agents

```
CUSTOMER CONTACT
       ↓
UNDERSTAND CUSTOMER NEED
       ↓
┌─────────────────────────────────────────────────────────────┐
│ "What does the customer need?"                              │
└─────────────────────────────────────────────────────────────┘
       ↓
       ├─ "My product is broken/damaged"
       │     ↓
       │   Is it under warranty (≤6 months)?
       │     ↓
       │     ├─ YES → Needs REPLACEMENT → Type R
       │     └─ NO  → Customer preference?
       │              ├─ Wants new product → Type R
       │              └─ Willing to repair → Type M
       │
       ├─ "I want to fix my product"
       │     ↓
       │   Needs REPAIR → Type M
       │
       ├─ "I want to return my purchase"
       │     ↓
       │   Needs REFUND → Type T
       │
       └─ "I want to buy something"
             ↓
           Needs to PURCHASE → Type S
```

### Quick Reference Guide

| Customer Statement | Type | Key Question |
|--------------------|------|--------------|
| "منتجي تالف" (My product is defective) | R or M | Is it under warranty? Want replacement or repair? |
| "عايز أستبدل المنتج" (I want to replace) | R | Confirm replacement needed |
| "عايز أصيانة" (I want maintenance) | M | Repair service needed |
| "عايز أرجع المنتج" (I want to return) | T | Refund requested |
| "عايز أشتري" (I want to buy) | S | Purchase requested |
| "المنتج مش شغال" (Product not working) | R or M | Diagnose issue first |
| "جاني المنتج غلط" (Wrong product sent) | R or T | Replacement or return based on timing |

### Type Comparison Table

| Aspect | R (Replacement) | M (Maintenance) | T (Return) | S (Sell) |
|--------|----------------|-----------------|------------|----------|
| **Customer sends item?** | Yes (defective) | Yes (for repair) | Yes (for refund) | No |
| **Business sends item?** | Yes (new product) | Yes (repaired item) | No | Yes (ordered items) |
| **Stock reserved?** | Yes (auto) | No | No | Parts: Yes, Products: No |
| **Stock deducted?** | Yes (at SENT) | Manual | No | Parts: Yes, Products: No |
| **Payment from customer?** | No (warranty) or Yes | Yes (if out of warranty) | No (refund to customer) | Yes |
| **Warranty applicable?** | Yes | Yes | Yes (return window) | No |
| **Tracking numbers?** | 3-way (original, send, receive) | 2-way (send, receive) | 1-way (return) | 1-way (send) |
| **Has sub-states?** | Yes (3) | Yes (3) | No | No |
| **Has READY state?** | Yes | Yes | No | Yes |
| **Has SENT state?** | Yes | Yes | No | Yes |
| **Has RETURNED state?** | Yes | No | N/A | Optional |

---

## Ticket Number Format

All tickets follow a standardized format for easy identification and sorting.

### Format Structure

```
HV + TYPE + YYMMDD + NNN
└─┬─┘└─┬─┘└───┬──┘└─┬─┘
  │    │     │     │
  │    │     │     └── Sequential Number (001-999)
  │    │     │         Resets daily
  │    │     │
  │    │     └──────── Date Created (Year, Month, Day)
  │    │                 YY = Year (25 = 2025)
  │    │                 MM = Month (02 = February)
  │    │                 DD = Day (10 = 10th)
  │    │
  │    └──────────────── Service Type
  │                        R = Replacement (استبدال)
  │                        M = Maintenance (صيانة)
  │                        T = Return (استرجاع)
  │                        S = Sell (المبيعات)
  │
  └────────────────────── Fixed Prefix (Hub)
```

### Examples

| Ticket Number | Type | Date Created | Sequence |
|---------------|------|--------------|----------|
| HVR25020001 | Replacement | 2025-02-10 | 1st ticket of day |
| HVM25020042 | Maintenance | 2025-02-10 | 42nd ticket of day |
| HVT25020005 | Return | 2025-02-10 | 5th ticket of day |
| HVS25020018 | Sell | 2025-02-10 | 18th ticket of day |
| HVR25021001 | Replacement | 2025-02-21 | 1st ticket of next day |

### Generation Rules

| Rule | Description |
|------|-------------|
| **N-001** | Sequential number resets to 001 each day |
| **N-002** | Each service type has independent sequence |
| **N-003** | Maximum 999 tickets per type per day |
| **N-004** | Date uses Egyptian timezone (GMT+2) |
| **N-005** | Fixed prefix "HV" never changes |
| **N-006** | Service type character is uppercase |
| **N-007** | No gaps in sequence (deleted tickets not re-used) |

---

## Stock Impact Matrix

Different service types affect stock differently depending on business logic.

### Summary Table

| Service Type | Stock Reserved? | When? | Stock Deducted? | When? | Reason |
|--------------|-----------------|-------|-----------------|-------|---------|
| **R** (Replacement) | ✓ Yes | CONFIRMED | ✓ Yes | SENT | Reserve for customer, deduct when shipped |
| **M** (Maintenance) | ✗ No | - | ✓ Manual | During repair | Parts manually selected by technician |
| **T** (Return) | ✗ No | - | ✗ No | - | Item returned to stock, not deducted |
| **S** (Sell - Parts) | ✓ Yes | CONFIRMED | ✓ Yes | SENT | Reserve for customer, deduct when shipped |
| **S** (Sell - Products) | ✗ No | - | ✗ No | - | Reference only, no stock impact |

### Detailed Timeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                  STOCK IMPACT TIMELINE BY TYPE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TYPE R - REPLACEMENT:                                              │
│                                                                     │
│  PENDING      → No stock action                                     │
│  CONFIRMED    → Stock RESERVED (status: 'reserved')                 │
│  IN_PROCESS   → Reserved stock held                                 │
│  READY        → Reserved stock prepared                             │
│  SENT         → Stock DEDUCTED (status: 'sold')                     │
│  RETURNED     → Defective item received (separate stock entry)      │
│  COMPLETED    → Stock updates finalized                             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TYPE M - MAINTENANCE:                                              │
│                                                                     │
│  PENDING      → No stock action                                     │
│  CONFIRMED    → No stock action                                     │
│  IN_PROCESS   → Manual stock deduction:                             │
│                  (under-maintenance sub-state)                     │
│                  - Technician selects parts                         │
│                  - Parts deducted (status: 'sold')                  │
│  READY        → No further stock action                             │
│  SENT         → No further stock action                             │
│  COMPLETED    → Stock updates finalized                             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TYPE T - RETURN:                                                   │
│                                                                     │
│  PENDING      → No stock action                                     │
│  CONFIRMED    → No stock action                                     │
│  IN_PROCESS   → Item received:                                      │
│                  - IF resellable → Return to stock ('available')     │
│                  - IF damaged → Write off ('written_off')           │
│                  - IF defective → Return to vendor                  │
│  COMPLETED    → Stock updates finalized                             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TYPE S - SELL (PARTS):                                             │
│                                                                     │
│  PENDING      → No stock action                                     │
│  CONFIRMED    → Stock RESERVED (status: 'reserved')                 │
│  IN_PROCESS   → Reserved stock held                                 │
│  READY        → Reserved stock prepared                             │
│  SENT         → Stock DEDUCTED (status: 'sold')                     │
│  COMPLETED    → Stock updates finalized                             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TYPE S - SELL (PRODUCTS):                                          │
│                                                                     │
│  All states   → NO STOCK IMPACT (reference only)                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Stock Status Transitions

```
available
   ↓
   [Reserved for ticket]
   ↓
reserved
   ↓
   [Shipped to customer]
   ↓
sold
   ↓
   [End of lifecycle]

OR

available
   ↓
   [Received as return, resellable]
   ↓
available (relisted)

OR

available
   ↓
   [Damaged in transit]
   ↓
in_repair
   ↓
   [Repaired]
   ↓
available (relisted)

OR

available
   ↓
   [Damaged beyond repair]
   ↓
written_off
```

---

## API Endpoints Reference

### Draft Management Endpoints

```javascript
// Create new draft (NO service_type yet)
POST /api/orders/drafts
Body: {
  customer_id: INT,
  customer_name: STRING,
  customer_phone: STRING,
  customer_address: OBJECT,
  description: TEXT,
  source: 'bosta' | 'erp' | 'direct',
  source_data: OBJECT  // Bosta order details, etc.
}
Response: {
  success: true,
  data: {
    draft_id: INT,
    order_number: STRING,
    status: 'draft',
    service_type: NULL,
    message: 'Draft created successfully'
  }
}

// Select service type for draft
POST /api/orders/drafts/{draft_id}/select-type
Body: {
  service_type: 'R' | 'M' | 'T' | 'S',
  type_specific_data: OBJECT  // Varies by type
}
Response: {
  success: true,
  data: {
    draft_id: INT,
    service_type: STRING,
    status: 'draft',
    type_form_fields: OBJECT,  // Required fields for this type
    message: 'Service type selected'
  }
}

// Submit draft for leader approval
POST /api/orders/drafts/{draft_id}/submit
Body: {
  confirmed_by: INT,  // Agent ID
  notes: TEXT
}
Response: {
  success: true,
  data: {
    draft_id: INT,
    status: 'pending',
    service_type: STRING,
    submitted_at: TIMESTAMP,
    message: 'Draft submitted for approval'
  }
}

// Get draft details
GET /api/orders/drafts/{draft_id}
Response: {
  success: true,
  data: {
    draft: { /* Full draft object */ },
    can_select_type: BOOLEAN,
    can_submit: BOOLEAN,
    available_types: ['R', 'M', 'T', 'S']
  }
}

// Update draft (before type selection)
PUT /api/orders/drafts/{draft_id}
Body: {
  // Any draft fields (except service_type)
  customer_name: STRING,
  description: TEXT,
  notes: TEXT
}
Response: {
  success: true,
  data: {
    draft_id: INT,
    updated_fields: ARRAY,
    message: 'Draft updated'
  }
}

// Cancel draft
POST /api/orders/drafts/{draft_id}/cancel
Body: {
  reason: TEXT,
  canceled_by: INT
}
Response: {
  success: true,
  data: {
    draft_id: INT,
    status: 'canceled',
    message: 'Draft canceled'
  }
}
```

### Type-Specific Endpoints

```javascript
// Type R - Replacement specific data
POST /api/orders/drafts/{draft_id}/type-r-data
Body: {
  original_tracking: STRING,
  original_sku: STRING,
  original_name: STRING,
  original_condition: 'defective' | 'damaged' | 'warranty_issue',
  replacement_item_id: INT,
  is_warranty: BOOLEAN,
  purchase_date: DATE,
  reason_code: STRING,
  reason_details: TEXT
}
Response: {
  success: true,
  data: {
    draft_id: INT,
    type_data_valid: BOOLEAN,
    warranty_status: STRING,
    message: 'Replacement data saved'
  }
}

// Type M - Maintenance specific data
POST /api/orders/drafts/{draft_id}/type-m-data
Body: {
  item_description: TEXT,
  item_serial_number: STRING,
  item_category: STRING,
  problem_description: TEXT,
  symptom_codes: ARRAY,
  estimated_parts: ARRAY,
  estimated_labor_hours: DECIMAL,
  estimated_cost: DECIMAL,
  requires_approval: BOOLEAN,
  photos: ARRAY
}
Response: {
  success: true,
  data: {
    draft_id: INT,
    type_data_valid: BOOLEAN,
    cost_estimate: DECIMAL,
    approval_required: BOOLEAN,
    message: 'Maintenance data saved'
  }
}

// Type T - Return specific data
POST /api/orders/drafts/{draft_id}/type-t-data
Body: {
  original_invoice: STRING,
  original_purchase_date: DATE,
  original_amount: DECIMAL,
  original_payment_method: STRING,
  return_reason_code: STRING,
  return_reason_details: TEXT,
  expected_condition: STRING,
  refund_method: STRING,
  refund_amount: DECIMAL
}
Response: {
  success: true,
  data: {
    draft_id: INT,
    type_data_valid: BOOLEAN,
    refund_calculated: BOOLEAN,
    refund_amount: DECIMAL,
    message: 'Return data saved'
  }
}

// Type S - Sell specific data
POST /api/orders/drafts/{draft_id}/type-s-data
Body: {
  items: ARRAY,
  customer_type: 'customer' | 'merchant',
  shipping_address: OBJECT,
  payment_method: STRING,
  create_bosta_product: BOOLEAN,
  special_instructions: TEXT
}
Response: {
  success: true,
  data: {
    draft_id: INT,
    type_data_valid: BOOLEAN,
    total_amount: DECIMAL,
    pricing_tier: STRING,
    stock_check: ARRAY,
    message: 'Sell data saved'
  }
}
```

### Leader Approval Endpoints

```javascript
// Get pending drafts for approval
GET /api/orders/drafts/pending?page=1&limit=20
Response: {
  success: true,
  data: {
    drafts: [
      {
        draft_id: INT,
        order_number: STRING,
        service_type: STRING,
        customer_name: STRING,
        customer_phone: STRING,
        created_at: TIMESTAMP,
        type_summary: OBJECT  // Type-specific summary
      }
    ],
    total: INT,
    page: INT,
    limit: INT
  }
}

// Approve draft and create ticket
POST /api/orders/drafts/{draft_id}/approve
Body: {
  approved_by: INT,
  notes: TEXT
}
Response: {
  success: true,
  data: {
    draft_id: INT,
    ticket_id: INT,
    ticket_number: STRING,  // e.g., HVR251020001
    draft_status: 'converted',
    message: 'Draft approved, ticket created'
  }
}

// Reject draft
POST /api/orders/drafts/{draft_id}/reject
Body: {
  rejected_by: INT,
  rejection_reason: TEXT,
  notes: TEXT
}
Response: {
  success: true,
  data: {
    draft_id: INT,
    draft_status: 'draft',
    rejection_reason: TEXT,
    message: 'Draft rejected, returned to agent'
  }
}
```

### Validation Endpoints

```javascript
// Validate type-specific data before submission
POST /api/orders/drafts/{draft_id}/validate-type-data
Body: {
  service_type: STRING,
  type_data: OBJECT
}
Response: {
  success: true,
  data: {
    valid: BOOLEAN,
    errors: ARRAY,  // Empty if valid
    warnings: ARRAY,
    required_fields: ARRAY,
    message: 'Validation completed'
  }
}

// Check stock availability for Type R or S
POST /api/orders/drafts/{draft_id}/check-stock
Response: {
  success: true,
  data: {
    stock_available: BOOLEAN,
    items: [
      {
        item_id: INT,
        item_name: STRING,
        requested: INT,
        available: INT,
        sufficient: BOOLEAN
      }
    ],
    message: 'Stock check completed'
  }
}

// Calculate pricing for Type S
POST /api/orders/drafts/{draft_id}/calculate-pricing
Body: {
  items: ARRAY,
  customer_type: 'customer' | 'merchant'
}
Response: {
  success: true,
  data: {
    subtotal: DECIMAL,
    shipping_estimate: DECIMAL,
    total: DECIMAL,
    pricing_tier: STRING,
    items_pricing: ARRAY,
    message: 'Pricing calculated'
  }
}
```

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-10-20 | Initial documentation | System |
| 2.0.0 | 2025-02-10 | **COMPLETE REWRITE** - Draft-first architecture, SELL type enhancement | System |

---

## Related Documentation

- [New Vision Overview](./00-NEW-VISION.md) - Complete draft-first architecture
- [Workflow Documentation](./workflow.md) - Detailed workflow diagrams
- [Calls Model](./calls-model.md) - Call session tracking
- [Database Model](./database-model.md) - Database schema
- [API Endpoints](../api_endpoints.md) - Complete API reference
- [Bosta Integration](./bosta-integration.md) - Shipping integration

---

## Support

For questions or issues related to service type workflows:

1. Check this documentation first
2. Review the workflow diagrams
3. Consult the API reference
4. Contact the development team

**Last Updated**: 2025-02-10
**Next Review**: 2025-03-10
