# Bosta Integration Documentation

> **Last Updated**: 2025-02-08
> **Purpose**: Complete reference for Bosta shipping integration in the call center system

## Table of Contents

1. [Overview](#overview)
2. [Bosta Order Types](#bosta-order-types)
3. [Integration Workflow](#integration-workflow)
4. [Phone Search Process](#phone-search-process)
5. [Order Selection for Services](#order-selection-for-services)
6. [Data Mapping](#data-mapping)
7. [API Endpoints](#api-endpoints)
8. [Error Handling](#error-handling)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Bosta?

Bosta is a third-party shipping/delivery service used by Hvar for delivering products to customers. The integration allows call center agents to:

- Search for customer orders in Bosta's system
- View delivery status and tracking information
- Create service tickets based on Bosta orders
- Sync customer data between Bosta and local database

### Key Concepts

**IMPORTANT**: Bosta orders are **EXTERNAL shipping orders**, separate from internal service tickets (HVR tickets). The integration helps agents:

1. **Find existing orders** when a customer calls about a delivery issue
2. **Verify customer identity** using phone number and order history
3. **Create service tickets** (Replacement/Maintenance/Return/Sell) based on Bosta order data
4. **Sync customer data** from Bosta to local database for faster future lookups

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Call Center Frontend                     │
│  (Agent searches by phone, views Bosta orders, selects)     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ↓ axios
┌─────────────────────────▼───────────────────────────────────┐
│                  Bosta Backend Service                      │
│  (BostaAPIService - normalize phones, call Bosta API)       │
│  (BostaConverter - transform to unified format)            │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ↓                ↓                ↓
    ┌─────────┐    ┌──────────┐    ┌─────────────┐
    │ Local DB│    │Bosta API │    │Bosta Cache │
    │customers│    │Search    │    │bosta_orders│
    └─────────┘    └──────────┘    └─────────────┘
```

---

## Bosta Order Types

### Type 10: SEND (إرسال)

**Description**: Customer sending item from business to customer

**Flow**: Business → Bosta → Customer

**Use Cases**:
- Regular product delivery
- Replacement item sent to customer
- New product shipment

**Address Source**: `dropOffAddress` (customer's address)

**Example**:
```json
{
  "type": {
    "code": 10,
    "value": "SEND"
  },
  "trackingNumber": "BOS123456789",
  "customer": {
    "phone": "01012345678",
    "name": "محمد أحمد"
  },
  "customerAddress": {
    "city": { "nameAr": "القاهرة" },
    "zone": { "nameAr": "المعادي" },
    "fullAddress": "شارع النصر، عمارة 15"
  },
  "status": {
    "confirmed": true,
    "timeline": [...]
  }
}
```

---

### Type 20: RETURN TO ORIGIN (إرجاع للمصدر)

**Description**: Item being returned from customer back to business

**Flow**: Customer → Bosta → Business

**Use Cases**:
- Customer returning product
- Wrong item being returned
- Defective item return

**Address Source**: `dropOffAddress` (business address for return)

**Example**:
```json
{
  "type": {
    "code": 20,
    "value": "RETURN TO ORIGIN"
  },
  "trackingNumber": "BOS987654321",
  "customer": {
    "phone": "01098765432",
    "name": "فاطمة علي"
  },
  "status": {
    "confirmed": false,
    "timeline": [...]
  }
}
```

---

### Type 25: CUSTOMER RETURN PICKUP (استرجاع العميل)

**Description**: Bosta picking up item from customer's location

**Flow**: Customer (pickup) → Bosta → Business

**Use Cases**:
- Scheduled pickup from customer
- Return request pickup
- Maintenance item pickup

**Address Source**: `pickupAddress` (customer's address for pickup)

**Special Handling**:
- Description comes from `returnSpecs.packageDetails.description`
- Package details from `returnSpecs` (not `specs`)

**Example**:
```json
{
  "type": {
    "code": 25,
    "value": "CUSTOMER RETURN PICKUP"
  },
  "trackingNumber": "BOS555555555",
  "customer": {
    "phone": "01055555555",
    "name": "أمحمود سعيد"
  },
  "customerAddress": {
    "city": { "nameAr": "الجيزة" },
    "zone": { "nameAr": "الدقي" },
    "fullAddress": "شارع الجامعة، عمارة 20"
  },
  "package": {
    "type": "خلاط",
    "description": "استرجاع خلاط معطل",
    "itemsCount": 1
  }
}
```

---

### Type 30: EXCHANGE (استبدال)

**Description**: Exchange item - old item picked up, new item delivered

**Flow**: Business → Bosta → Customer (NEW item)
         Customer → Bosta → Business (OLD item)

**Use Cases**:
- Product exchange (defective for working)
- Size/variant exchange
- Upgrade exchange

**Address Source**: `dropOffAddress` (customer's address)

**Example**:
```json
{
  "type": {
    "code": 30,
    "value": "EXCHANGE"
  },
  "trackingNumber": "BOS333333333",
  "customer": {
    "phone": "01077777777",
    "name": "خالد عبدالله"
  },
  "status": {
    "confirmed": true,
    "timeline": [...]
  }
}
```

---

### Order Type Reference Table

| Code | Type Name | Arabic Name | Direction | Address Source | Description Source |
|------|-----------|------------|-----------|---------------|-------------------|
| 10 | SEND | إرسال | B→C | dropOffAddress | notes/specs |
| 20 | RETURN TO ORIGIN | إرجاع للمصدر | C→B | dropOffAddress | notes/specs |
| 25 | CUSTOMER RETURN PICKUP | استرجاع العميل | C→B | pickupAddress | returnSpecs.packageDetails |
| 30 | EXCHANGE | استبدال | B↔C | dropOffAddress | notes/specs |

**Legend**: B = Business, C = Customer

---

## Integration Workflow

### High-Level Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Agent receives call                                    │
│    - Customer calls about delivery/service issue           │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Agent inputs phone number                              │
│    - Raw phone in any format (+20, 201, 01, etc.)        │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Phone Normalization                                    │
│    - Convert to 01XXXXXXXXX format                       │
│    - Validate Egyptian phone pattern                      │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4a. Local Database Search                                 │
│    SELECT * FROM customers WHERE phone = ?                │
│    - Check if customer exists locally                    │
│    - Return customer with bosta_orders JSON if found     │
└─────────────────────────┬───────────────────────────────────┘
                          ↓ (if not found locally)
┌─────────────────────────────────────────────────────────────┐
│ 4b. Bosta API Search                                     │
│    POST /deliveries/search { mobilePhones: [...] }       │
│    - Search Bosta by normalized phone                     │
│    - Return all orders for this phone number             │
└─────────────────────────┬───────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Process Search Results                                 │
│    ├─ Bosta orders found?                                │
│    │   ├─ YES: Display orders to agent                  │
│    │   │   ├─ Agent selects order → Create draft order  │
│    │   │   └─ Agent skips → Proceed with manual entry  │
│    │   └─ Sync customer data to local DB                  │
│    │                                                       │
│    └─ No orders found?                                   │
│        └─ Prompt for new customer creation               │
└─────────────────────────────────────────────────────────────┘
```

### Detailed Workflow Diagram

```
AGENT INPUTS PHONE
       ↓
[NORMALIZE PHONE]
Raw Phone → 01XXXXXXXXX
       ↓
[SEARCH LOCAL DB]
SELECT * FROM customers WHERE phone = '01XXXXXXXXX'
       ↓
    ┌──┴──┐
    │     │
FOUND NOT FOUND
    │     │
    │     ↓
    │  [SEARCH BOSTA API]
    │  POST /deliveries/search
    │  { mobilePhones: ['01XXXXXXXXX'] }
    │     ↓
    │  ┌──┴──┐
    │  │     │
    │FOUND NOT FOUND
    │  │     │
    │  │     ↓
    │  │  [NOT FOUND]
    │  │  Show "Customer not found"
    │  │  Prompt for new customer creation
    │  │     ↓
    │  │  [CREATE CUSTOMER]
    │  │  Collect customer info manually
    │  │  INSERT INTO customers
    │  │     ↓
    │  │  Ready for service creation
    │  │
    │  ↓
    │  [CONVERT & SYNC]
    │  Convert Bosta orders to unified format
    │  Upsert customer with bosta_orders JSON
    │     ↓
    │  [DISPLAY RESULTS]
    │  Show customer info
    │  Show Bosta orders list (type 10/20/25/30)
    │     ↓
    │  ┌─────────────────┐
    │  │                 │
    │  AGENT SELECTS    AGENT SKIPS
    │  BOSTA ORDER      (proceeds manually)
    │  │                 │
    │  ↓                 │
    │  [CREATE DRAFT]     │
    │  source='bosta'     │
    │  bosta_tracking=... │
    │  bosta_type=...     │
    │  bosta_data=...     │
    │  status='draft'     │
    │  service_type=NULL  │
    │  │                 │
    │  ↓                 │
    │  [SET SERVICE TYPE]│
    │  Agent selects     │
    │  R/M/T/S           │
    │  │                 │
    │  ↓                 ↓
    │  [CONFIRM DETAILS] [COLLECT INFO]
    │  Verify with       Collect all info
    │  customer          manually
    │  │                 │
    │  ↓                 ↓
    │  └────→ [SUBMIT FOR APPROVAL] ←────┘
    │         Create service ticket
    │         Send to team leader approval
    │              ↓
    │         [COMPLETE]
```

---

## Phone Search Process

### Phone Normalization Rules

The system uses Egyptian phone normalization (01XXXXXXXXX format):

**Input Formats Accepted**:
- `+201234567890` (12 digits with +)
- `201234567890` (11 digits, starts with 20)
- `01234567890` (11 digits, starts with 01) ✓ **TARGET FORMAT**
- `1234567890` (10 digits, missing leading 0)
- `+20 1 234 567 890` (formatted with spaces)

**Normalization Logic**:
```
┌─────────────────────────────────────────────────────────────┐
│ INPUT: +201234567890                                        │
│    ↓                                                       │
│ Strip non-digits: 201234567890                             │
│    ↓                                                       │
│ Check length 12, starts with 201:                          │
│    → Remove '20', add '0' → 01234567890                   │
│    ↓                                                       │
│ Validate: /^01[0-9]{9}$/                                  │
│    ↓                                                       │
│ OUTPUT: 01234567890 ✓                                     │
└─────────────────────────────────────────────────────────────┘
```

**Code Reference**: `app/utils/phone_normalizer.py`

```python
def normalize_to_local_phone(phone: str) -> str:
    """
    Normalize Egyptian phone number to local format: 01XXXXXXXXX
    Accepts any format and returns 01XXXXXXXXX
    """
    # Strip all non-digit characters
    clean_phone = ''.join(filter(str.isdigit, phone))

    # Apply normalization rules
    if clean_phone.startswith('201') and len(clean_phone) == 12:
        normalized = '0' + clean_phone[2:]  # Remove '20', add '0'
    elif clean_phone.startswith('01') and len(clean_phone) == 11:
        normalized = clean_phone  # Already correct
    # ... more rules

    # Validate final format
    if not re.match(r'^01[0-9]{9}$', normalized):
        raise PhoneNormalizationError(...)

    return normalized
```

### Search Flowchart

```
                    ┌──────────────────┐
                    │  Raw Phone Input │
                    │ +201234567890   │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │  Normalize Phone │
                    │  01XXXXXXXXX     │
                    └────────┬─────────┘
                             ↓
        ┌────────────────────────────────┐
        │   Search Local Database       │
        │   WHERE phone = '01234567890' │
        └───────────────┬────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
        FOUND                   NOT FOUND
            │                       │
            │                       ↓
            │              ┌─────────────────┐
            │              │ Search Bosta API │
            │              │ POST /search     │
            │              │ {phone: ...}     │
            │              └────────┬─────────┘
            │                       │
            │              ┌────────┴────────┐
            │              │                 │
            │          FOUND           NOT FOUND
            │              │                 │
            │              │                 ↓
            │              │          ┌──────────────┐
            │              │          │ NOT FOUND    │
            │              │          │ Show message:│
            │              │          │ "Customer not │
            │              │          │  found in     │
            │              │          │  system"      │
            │              │          └──────────────┘
            │              │
            ↓              ↓
    ┌──────────────┐  ┌──────────────┐
    │ Return       │  │ Sync & Return│
    │ Customer     │  │ Customer     │
    │ with         │  │ with         │
    │ bosta_orders │  │ bosta_orders │
    └──────────────┘  └──────────────┘
```

### Unified Order Format

All Bosta orders are converted to a unified format for consistent display:

```javascript
{
  // Type information
  type: "SEND",              // Human-readable type name

  // Tracking
  trackingNumber: "BOS123456789",

  // Status
  status: {
    confirmed: true,         // Is delivery confirmed?
    timeline: [...]           // Status timeline
  },

  // Customer information
  customer: {
    phone: "01012345678",
    secondPhone: "01123456789",  // Optional
    name: "محمد أحمد"
  },

  // Address (always uses correct source based on type)
  customerAddress: {
    city: "القاهرة",        // Governorate (Bosta 'city')
    zone: "المعادي",         // City (Bosta 'zone')
    district: "الدقي",      // District
    fullAddress: "..."      // Street address
  },

  // Package details
  package: {
    type: "خلاط",
    description: "...",
    itemsCount: 1
  },

  // Financial
  financial: {
    cod: 1500.00,           // Cash on delivery amount
    bostaFees: 50.00        // Bosta shipping fees
  },

  // Communication attempts
  communication: {
    calls: 3,               // Number of calls
    sms: 5,                // Number of SMS
    attempts: 2,           // Delivery attempts
    lastCall: "2025-01-01T10:00:00Z"
  },

  // Timestamps
  timestamps: {
    created: "2025-01-01T08:00:00Z",
    updated: "2025-01-02T15:30:00Z",
    collected: "...",
    scheduled: "..."
  }
}
```

**Code Reference**: `app/utils/bosta_converter.py`

---

## Order Selection for Services

### Agent Selection Flow

```
AGENT VIEWS BOSTA ORDERS
       ↓
┌──────────────────────────────────────────┐
│ Order 1: BOS123456789 (SEND)             │
│ Customer: محمد أحمد (01012345678)       │
│ Status: Delivered ✓                      │
│ COD: EGP 1,500                           │
└──────────────────────────────────────────┘
       ↓
[AGENT CLICKS ORDER]
       ↓
┌──────────────────────────────────────────┐
│ CREATE DRAFT ORDER FROM BOSTA DATA       │
│                                          │
│ {                                       │
│   source: 'bosta',                       │
│   bosta_tracking_number: 'BOS123456789', │
│   bosta_order_type: 10,                  │
│   bosta_order_type_name: 'SEND',         │
│   bosta_order_data: {FULL ORDER JSON},  │
│   status: 'draft',                       │
│   service_type: NULL,  ← TO BE SET       │
│   customer_id: 123,                      │
│   customer_name: 'محمد أحمد',           │
│   customer_phone: '01012345678',        │
│   customer_governorate: 'القاهرة',      │
│   customer_city: 'المعادي',             │
│   customer_address: '...'               │
│ }                                       │
└──────────────────────────────────────────┘
       ↓
[AGENT CONTINUES TO SERVICE CREATION]
       ↓
┌──────────────────────────────────────────┐
│ SELECT SERVICE TYPE                       │
│ ○ Replacement (استبدال)                 │
│ ○ Maintenance (صيانة)                   │
│ ○ Return (استرجاع)                      │
│ ○ Sell (بيع)                           │
└──────────────────────────────────────────┘
       ↓
[AGENT SELECTS REPLACEMENT]
       ↓
┌──────────────────────────────────────────┐
│ CONFIRM DETAILS                          │
│ Service: Replacement                    │
│ From Order: BOS123456789 (SEND)         │
│ Customer: محمد أحمد                    │
│ Address: القاهرة، المعادي،...           │
│                                          │
│ [CONFIRM] [CANCEL]                      │
└──────────────────────────────────────────┘
       ↓
[AGENT CONFIRMS]
       ↓
┌──────────────────────────────────────────┐
│ SUBMIT FOR LEADER APPROVAL              │
│                                          │
│ {                                       │
│   ...previous draft data,              │
│   service_type: 'R',  ← NOW SET        │
│   status: 'pending_confirmation',       │
│   created_for_call_center: true        │
│ }                                       │
└──────────────────────────────────────────┘
```

### Draft Order Data Structure

When an agent selects a Bosta order, the following data is populated:

```javascript
{
  // === Bosta Integration Fields ===
  source: 'bosta',
  bosta_tracking_number: 'BOS123456789',
  bosta_order_type: 10,                    // Type code
  bosta_order_type_name: 'SEND',          // Type name
  bosta_order_data: {                      // Full Bosta order JSON
    trackingNumber: 'BOS123456789',
    type: { code: 10, value: 'SEND' },
    customer: {...},
    customerAddress: {...},
    package: {...},
    financial: {...},
    // ... all Bosta fields
  },

  // === Customer Data (from Bosta) ===
  customer_id: 123,                        // Synced/created customer ID
  customer_name: 'محمد أحمد',
  customer_phone: '01012345678',
  customer_governorate: 'القاهرة',
  customer_city: 'المعادي',
  customer_address: 'شارع النصر، عمارة 15',

  // === Service Ticket Fields ===
  service_type: null,                      // TO BE SET BY AGENT (R/M/T/S)
  status: 'draft',                        // Initial status
  ticket_number: null,                    // Generated on submit

  // === Items (empty until agent adds) ===
  items: [],                              // Agent can modify/add items

  // === Additional Info ===
  problem_description: null,              // Agent fills in
  notes: null,                            // Agent fills in
  created_by: 'call_center_agent',
  created_for_call_center: true
}
```

### Service Type Mapping

Bosta order types don't directly map to service ticket types. The agent must select:

| Bosta Order Type | Possible Service Types | Use Case |
|------------------|----------------------|----------|
| **SEND (10)** | Replacement, Return, Sell | Customer received item, wants to return/exchange |
| **RETURN TO ORIGIN (20)** | Maintenance, Replacement | Item being returned, needs repair/replacement |
| **CUSTOMER RETURN PICKUP (25)** | Maintenance, Return | Pickup scheduled, creating service ticket |
| **EXCHANGE (30)** | Replacement | Exchange in progress, tracking both items |

**Example Scenarios**:

1. **Customer calls about defective product** (Type 10 SEND)
   - Agent searches phone → Finds Bosta order (delivered)
   - Agent selects order → Creates draft
   - Agent selects **Replacement** service type
   - Agent confirms details → Submits for approval

2. **Customer wants to return product** (Type 10 SEND)
   - Agent searches phone → Finds Bosta order (delivered)
   - Agent selects order → Creates draft
   - Agent selects **Return** service type
   - Agent confirms details → Submits for approval

3. **Bosta picking up defective item** (Type 25 PICKUP)
   - Agent searches phone → Finds Bosta order (scheduled pickup)
   - Agent selects order → Creates draft
   - Agent selects **Maintenance** service type (for repair)
   - Agent confirms details → Submits for approval

---

## Data Mapping

### Bosta Fields → Local Database Fields

```javascript
// MAPPING TABLE
┌─────────────────────────┬─────────────────────────┬─────────────────────┐
│ Bosta Field             │ Local DB Field          │ Notes               │
├─────────────────────────┼─────────────────────────┼─────────────────────┤
│ trackingNumber          │ bosta_tracking_number   │ Direct copy         │
│ type.code               │ bosta_order_type        │ Numeric code (10)   │
│ type.value              │ bosta_order_type_name   │ Human-readable      │
│ full order JSON         │ bosta_order_data        │ Stored as JSON      │
│ receiver.phone          │ customer_phone          │ Normalized to 01X   │
│ receiver.fullName       │ customer_name           │ Direct copy         │
│ receiver.secondPhone    │ customer_phone_secondary│ Optional            │
│ dropOffAddress.city     │ customer_governorate    │ Bosta 'city' = gov  │
│ dropOffAddress.zone     │ customer_city           │ Bosta 'zone' = city │
│ dropOffAddress.firstLine│ customer_address         │ Full address        │
│ specs.packageDetails    │ items (parsed)           │ Parse description   │
│ wallet.cashCycle.cod     │ cod_amount              │ Convert to float    │
└─────────────────────────┴─────────────────────────┴─────────────────────┘
```

### Customer Data Sync

When Bosta orders are found, customer data is synced to local database:

```sql
-- Customer upsert (create or update)
INSERT INTO customers (
  name,
  phone,
  phone_secondary,
  governorate,
  city,
  address_details,
  bosta_orders,          -- JSON array of orders
  created_by,
  updated_at
) VALUES (
  'محمد أحمد',
  '01012345678',
  '01123456789',        -- Optional
  'القاهرة',           -- From dropOffAddress.city.nameAr
  'المعادي',           -- From dropOffAddress.zone.nameAr
  'شارع النصر، عمارة 15',  -- From dropOffAddress.firstLine
  '[...]',              -- JSON array of Bosta orders
  'bosta_sync',
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  phone_secondary = VALUES(phone_secondary),
  governorate = VALUES(governorate),
  city = VALUES(city),
  address_details = VALUES(address_details),
  bosta_orders = VALUES(bosta_orders),  -- Update with latest orders
  updated_at = NOW();
```

**Code Reference**: `app/models/customer.py`

```python
def upsert_customer_bosta_data(data):
    """
    Upsert customer data from Bosta API.
    Creates new customer or updates existing one.
    Returns customer ID.
    """
    # ... implementation
```

### Address Field Mapping

**IMPORTANT**: Bosta address structure differs from local database:

```
BOSTA STRUCTURE:                LOCAL DATABASE:
┌─────────────────────┐         ┌─────────────────────┐
│ city                 │         │ governorate         │
│  └─ nameAr: 'القاهرة'│    →    │ 'القاهرة'          │
├─────────────────────┤         ├─────────────────────┤
│ zone                 │         │ city                │
│  └─ nameAr: 'المعادي'│    →    │ 'المعادي'          │
├─────────────────────┤         ├─────────────────────┤
│ district             │         │ (not stored)        │
│  └─ nameAr: 'الدقي' │         │                     │
├─────────────────────┤         ├─────────────────────┤
│ firstLine            │         │ address_details     │
│  'شارع النصر، ...'   │    →    │ 'شارع النصر، ...'  │
└─────────────────────┘         └─────────────────────┘
```

---

## API Endpoints

### Backend Bosta API Endpoints

#### 1. Health Check

**Endpoint**: `GET /api/bosta/health`

**Purpose**: Check if Bosta API integration is working

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "token_configured": true,
    "api_accessible": true
  },
  "message": "Bosta API is healthy"
}
```

**Error Cases**:
- `503` - Token not configured
- `503` - API not accessible (network error, invalid token)

---

#### 2. Search Deliveries

**Endpoint**: `POST /api/bosta/search`

**Purpose**: Search Bosta orders by phone, name, or tracking number

**Request Body**:
```json
{
  "phone": "01012345678",      // Optional - normalized to 01XXXXXXXXX
  "name": "محمد أحمد",        // Optional - customer name
  "tracking": "BOS123456789",  // Optional - tracking number
  "page": 1,                   // Optional - pagination (default: 1)
  "limit": 50,                 // Optional - results limit (max: 100)
  "group": false               // Optional - group by customer (default: false)
}
```

**Response (ungrouped)**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "type": "SEND",
        "trackingNumber": "BOS123456789",
        "customer": {...},
        "customerAddress": {...},
        "package": {...},
        "financial": {...},
        "communication": {...},
        "timestamps": {...}
      }
    ],
    "totalOrders": 5,
    "types": ["SEND", "RETURN TO ORIGIN"],
    "processedAt": "2025-01-01T00:00:00.000Z"
  },
  "message": "Search completed successfully"
}
```

**Response (grouped)**:
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "phone": "01012345678",
        "name": "محمد أحمد",
        "secondPhone": null,
        "address": {...},
        "orders": [...]
      }
    ],
    "totalCustomers": 3,
    "totalOrders": 8,
    "types": ["SEND", "RETURN TO ORIGIN"],
    "processedAt": "2025-01-01T00:00:00.000Z"
  },
  "message": "Search completed successfully"
}
```

**Error Cases**:
- `400` - At least one search parameter required
- `400` - Invalid phone number format
- `400` - Bad request (Bosta API error)
- `401` - Authentication error (check API settings)
- `500` - Internal server error

---

#### 3. Get Order Details

**Endpoint**: `GET /api/bosta/order/{tracking_number}`

**Purpose**: Get details for a single Bosta order by tracking number

**Query Parameters**:
- `force_sync` (optional, boolean) - Bypass cache and fetch from Bosta API

**Response**:
```json
{
  "success": true,
  "data": {
    "type": "SEND",
    "trackingNumber": "BOS123456789",
    "customer": {...},
    "customerAddress": {...},
    "package": {...},
    "financial": {...},
    "communication": {...},
    "timestamps": {...}
  },
  "message": "Order details retrieved successfully"
}
```

**Error Cases**:
- `400` - Tracking number is required
- `404` - Order not found
- `500` - Internal server error

**Caching**: Results are cached in `bosta_orders` table. Use `force_sync=true` to bypass cache.

---

#### 4. Get Customer Orders

**Endpoint**: `GET /api/bosta/customer/{phone_number}/orders`

**Purpose**: Get all Bosta orders for a customer in unified format

**Response**:
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "totalOrders": 5,
    "types": ["SEND", "RETURN TO ORIGIN"],
    "processedAt": "2025-01-01T00:00:00.000Z"
  },
  "message": "Customer orders retrieved successfully"
}
```

**Error Cases**:
- `400` - Phone number is required
- `400` - Invalid phone number format
- `500` - Internal server error

---

#### 5. Sync Customer Data

**Endpoint**: `POST /api/bosta/customer/{phone_number}/sync`

**Purpose**: Sync customer data from Bosta to local database

**Response**:
```json
{
  "success": true,
  "data": {
    "customer_id": 123,
    "phone": "01012345678"
  },
  "message": "Customer data synced successfully"
}
```

**Error Cases**:
- `400` - Phone number is required
- `400` - Invalid phone number format
- `404` - No orders found for this customer
- `500` - Internal server error

**What it does**:
1. Searches Bosta API for orders with this phone number
2. Converts orders to unified format
3. Uses latest order as source of truth for customer details
4. Upserts customer record with Bosta data
5. Stores all Bosta orders in `bosta_orders` JSON field

---

### Frontend API Usage

**File**: `front/src/api/customerAPI.js` (includes Bosta search)

```javascript
// Search customer with Bosta integration
export const searchCustomers = async (phone, options = {}) => {
  const { include_bosta = true, force_sync = false } = options;

  // Search local database first
  const localResults = await api.get(`/api/customers/search`, {
    params: { phone, limit: 1 }
  });

  if (localResults.data.data.length > 0) {
    return localResults.data.data;
  }

  // If not found locally and Bosta enabled, search Bosta
  if (include_bosta) {
    const bostaResults = await api.post('/api/bosta/search', {
      phone: phone,
      group: false,
      limit: 10
    });

    if (bostaResults.data.data.orders.length > 0) {
      // Sync customer data to local DB
      await api.post(`/api/bosta/customer/${phone}/sync`, {});

      // Return synced customer
      const syncedResults = await api.get(`/api/customers/search`, {
        params: { phone, limit: 1 }
      });

      return syncedResults.data.data;
    }
  }

  return [];
};
```

---

## Error Handling

### Error Scenarios & Solutions

#### Scenario 1: Invalid Phone Format

**Error**: `"Invalid phone number format"`

**Cause**: Phone number doesn't match Egyptian pattern

**Examples**:
- `1234567` - Too short
- `0123456789012` - Too long
- `0212345678` - Invalid prefix (02 is landline)

**Solution**:
1. Validate phone input before search
2. Show user-friendly error message in Arabic
3. Suggest correct format (01XXXXXXXXX)

**Arabic Message**: `"رقم الهاتف غير صحيح. يجب أن يكون 11 رقم يبدأ بـ 01"`

---

#### Scenario 2: Customer Not Found

**Error**: `"No orders found for this customer"`

**Causes**:
1. Customer has no orders in Bosta system
2. Phone number doesn't match any Bosta orders
3. Customer is new (first-time caller)

**Solutions**:
1. **Verify phone number** - Check with customer if phone is correct
2. **Search by name** - Try name search instead
3. **Create new customer** - Collect info manually

**UI Flow**:
```
[SEARCH: 01012345678]
       ↓
[NOT FOUND]
       ↓
┌──────────────────────────────────────────┐
│ customer not found                       │
│                                          │
│ ○ Search by name                        │
│ ○ Create new customer                   │
│ ○ Try different phone number           │
└──────────────────────────────────────────┘
```

**Arabic Message**: `"العميل غير موجود في النظام. يرجى التحقق من رقم الهاتف أو إنشاء عميل جديد"`

---

#### Scenario 3: Bosta API Timeout

**Error**: `"Network error: Request timeout"`

**Causes**:
1. Bosta API is slow or unresponsive
2. Network connectivity issues
3. Large result set

**Solutions**:
1. **Retry** - Try search again
2. **Fallback to manual entry** - Proceed without Bosta data
3. **Use cached data** - If available in local DB

**Timeout Values**:
- Search endpoint: 12 seconds
- Order details: 10 seconds
- Health check: 5 seconds

**UI Response**:
```
[BOSTA SEARCH TIMEOUT]
       ↓
┌──────────────────────────────────────────┐
│ Bosta API timeout                        │
│                                          │
│ ○ Try again                              │
│ ○ Proceed manually (create customer)    │
│ ○ Use cached data (if available)        │
└──────────────────────────────────────────┘
```

**Arabic Message**: `"انتهت مهلة طلب Bosta. يرجى المحاولة مرة أخرى أو المتابعة يدوياً"`

---

#### Scenario 4: Bosta Token Not Configured

**Error**: `"BOSTA_TOKEN not configured"`

**Cause**: Environment variable `BOSTA_TOKEN` not set on server

**Solution**:
1. Set `BOSTA_TOKEN` in `.env` file
2. Or set in environment variables
3. Restart Flask server

**Health Check**:
```bash
curl http://localhost:5050/api/bosta/health
# Returns 503 if token not configured
```

**Arabic Message**: `"خطأ في إعدادات Bosta. يرجى التواصل مع الدعم الفني"`

---

#### Scenario 5: Bosta API Error (401/403)

**Error**: `"Authentication error - check API settings"`

**Causes**:
1. Invalid/expired Bosta token
2. Token format incorrect
3. IP not whitelisted (if applicable)

**Solution**:
1. Verify token is valid
2. Check Bosta dashboard for token status
3. Generate new token if needed

**Health Check**:
```bash
curl http://localhost:5050/api/bosta/health
# Returns authentication error
```

**Arabic Message**: `"خطأ في المصادقة مع Bosta. يرجى التواصل مع الدعم الفني"`

---

#### Scenario 6: Empty Search Results

**Error**: Search succeeds but returns 0 orders

**Cause**: Customer has no Bosta orders (new customer, orders deleted, etc.)

**Solution**:
1. Verify with customer if they have placed orders
2. Search by customer name instead
3. Create new customer manually

**UI Response**:
```
[SEARCH: 01012345678]
       ↓
[0 ORDERS FOUND]
       ↓
┌──────────────────────────────────────────┐
│ No orders found for this customer        │
│                                          │
│ ○ Search by name                        │
│ ○ Create new customer                   │
│ ○ Check phone number with customer      │
└──────────────────────────────────────────┘
```

**Arabic Message**: `"لا توجد طلبات لهذا العميل في Bosta. هل ترغب في إنشاء عميل جديد؟"`

---

## Troubleshooting

### Common Issues & Fixes

#### Issue 1: Phone Normalization Not Working

**Symptoms**:
- Search by phone returns 0 results
- Phone exists in Bosta but not found

**Diagnosis**:
```python
# Check phone normalization
from app.utils.phone_normalizer import normalize_to_local_phone

phone = "+201234567890"
normalized = normalize_to_local_phone(phone)
print(f"Normalized: {normalized}")  # Should be: 01234567890
```

**Fix**:
1. Ensure phone normalization is applied before Bosta search
2. Check Bosta API expects `01XXXXXXXXX` format
3. Verify no extra characters/spaces in phone

---

#### Issue 2: Bosta Orders Not Syncing to Local DB

**Symptoms**:
- Bosta orders found in search
- Customer not created/updated in local DB

**Diagnosis**:
```sql
-- Check if customer exists
SELECT * FROM customers WHERE phone = '01XXXXXXXXX';

-- Check bosta_orders field
SELECT phone, bosta_orders FROM customers WHERE phone = '01XXXXXXXXX';
```

**Fix**:
1. Manually trigger sync: `POST /api/bosta/customer/{phone}/sync`
2. Check `customer_model.upsert_customer_bosta_data()` function
3. Verify JSON serialization of `bosta_orders` field

---

#### Issue 3: Wrong Address Showing for Order Type 25

**Symptoms**:
- Customer Return Pickup order shows business address
- Should show customer pickup address

**Diagnosis**:
```python
# Check address source in converter
# For type 25, should use 'pickupAddress'
# For type 10/20/30, should use 'dropOffAddress'

# File: app/utils/bosta_converter.py
def convert_bosta_order(bosta_response):
    # ...
    type_code = data.get('type', {}).get('code', 0)

    address_sources = {
        10: 'dropOffAddress',
        20: 'dropOffAddress',
        25: 'pickupAddress',    # ← Should be pickupAddress
        30: 'dropOffAddress'
    }
```

**Fix**:
1. Verify address source mapping in converter
2. Check Bosta API response has `pickupAddress` field
3. Ensure correct address is used based on order type

---

#### Issue 4: Description Missing for Type 25 Orders

**Symptoms**:
- Customer Return Pickup orders show empty description
- Package description field is blank

**Diagnosis**:
```python
# Type 25 uses returnSpecs.packageDetails.description
# NOT specs.packageDetails.description

# File: app/utils/bosta_converter.py
def extract_package_info(data, order_type_code=0):
    if order_type_code == 25:
        # Use returnSpecs
        return_specs = data.get('returnSpecs', {})
        pkg_details = return_specs.get('packageDetails', {})
        description = pkg_details.get('description', '')
    else:
        # Use specs
        specs = data.get('specs', {})
        pkg_details = specs.get('packageDetails', {})
        description = pkg_details.get('description', '')
```

**Fix**:
1. Check `returnSpecs` field exists in Bosta API response
2. Verify `packageDetails` nested structure
3. Add fallback to `notes` if `returnSpecs` is empty

---

#### Issue 5: Cache Not Refreshing

**Symptoms**:
- Old Bosta data showing even after force_sync=true
- Updated order details not reflecting

**Diagnosis**:
```sql
-- Check cached orders
SELECT tracking_number, created_at, updated_at
FROM bosta_orders
WHERE tracking_number = 'BOS123456789';
```

**Fix**:
1. Use `force_sync=true` parameter
2. Clear cache: `DELETE FROM bosta_orders WHERE tracking_number = '...'`
3. Verify upsert logic in `bosta_order_model.upsert_order()`

---

### Performance Optimization

#### Bosta API Caching

**Strategy**: Cache Bosta orders locally to reduce API calls

**Implementation**:
```python
# Check cache first (unless force_sync)
if not force_sync:
    cached_order = bosta_order_model.get_order_by_tracking_number(tracking)
    if cached_order:
        return True, cached_order, None

# Fetch from Bosta API
# ...
# Cache the result
bosta_order_model.upsert_order(tracking_number, unified_order)
```

**Cache Expiration**: No expiration - orders don't change much

**Cache Invalidation**: Use `force_sync=true` to refresh

---

#### Search Result Pagination

**Problem**: Customer with 100+ Bosta orders causes slow UI

**Solution**:
```javascript
// Limit search results
const response = await api.post('/api/bosta/search', {
  phone: normalizedPhone,
  limit: 10,        // Only fetch latest 10 orders
  page: 1,
  sortBy: '-updatedAt'  // Sort by newest first
});
```

**Recommendation**: Show latest 10 orders, add "Load More" button

---

### Debugging Tips

#### Enable Bosta Service Logging

```python
# File: app/services/bosta_service.py
import logging

# Set logging level
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# All Bosta API calls will log:
# - Request URL and parameters
# - Response status
# - Conversion errors
# - Cache hits/misses
```

#### Test Bosta API Manually

```bash
# Test health check
curl http://localhost:5050/api/bosta/health

# Test search by phone
curl -X POST http://localhost:5050/api/bosta/search \
  -H "Content-Type: application/json" \
  -d '{"phone": "01012345678", "limit": 5}'

# Test order details
curl http://localhost:5050/api/bosta/order/BOS123456789

# Test customer sync
curl -X POST http://localhost:5050/api/bosta/customer/01012345678/sync
```

#### Check Phone Normalization

```python
# Test phone normalizer
from app.utils.phone_normalizer import normalize_to_local_phone

test_phones = [
    "+201234567890",
    "201234567890",
    "01234567890",
    "1234567890",
]

for phone in test_phones:
    try:
        normalized = normalize_to_local_phone(phone)
        print(f"{phone} → {normalized}")
    except Exception as e:
        print(f"{phone} → ERROR: {e}")
```

---

## Summary

### Key Takeaways

1. **Bosta Orders ≠ Service Tickets**: Bosta orders are external shipping orders, separate from internal HVR tickets

2. **Phone Normalization is Critical**: Always normalize to `01XXXXXXXXX` format before searching

3. **Four Order Types**: SEND (10), RETURN TO ORIGIN (20), CUSTOMER RETURN PICKUP (25), EXCHANGE (30)

4. **Address Source Varies by Type**: Type 25 uses `pickupAddress`, others use `dropOffAddress`

5. **Local Caching**: Bosta orders are cached in `bosta_orders` table for faster lookups

6. **Agent Workflow**: Search → Select Order → Set Service Type → Confirm → Submit for Approval

7. **Error Handling**: Always have fallback to manual entry if Bosta API fails

### Quick Reference

**Search by Phone**:
```
POST /api/bosta/search
{ "phone": "01012345678", "limit": 10 }
```

**Sync Customer**:
```
POST /api/bosta/customer/{phone}/sync
```

**Check Health**:
```
GET /api/bosta/health
```

**Normalize Phone**:
```python
from app.utils.phone_normalizer import normalize_to_local_phone
normalized = normalize_to_local_phone("+201234567890")
# Returns: "01234567890"
```

---

## Appendix

### A. Complete Bosta API Response Example

**Type 10 (SEND) Order**:
```json
{
  "success": true,
  "data": {
    "trackingNumber": "BOS123456789",
    "type": {
      "code": 10,
      "value": "SEND"
    },
    "isConfirmedDelivery": true,
    "receiver": {
      "phone": "01012345678",
      "secondPhone": null,
      "fullName": "محمد أحمد محمد"
    },
    "dropOffAddress": {
      "city": {
        "nameAr": "القاهرة",
        "nameEn": "Cairo"
      },
      "zone": {
        "nameAr": "المعادي",
        "nameEn": "Maadi"
      },
      "district": {
        "nameAr": "الدقي",
        "nameEn": "Dokki"
      },
      "firstLine": "شارع النصر، عمارة 15، شقة 3"
    },
    "specs": {
      "packageType": "خلاط",
      "packageDetails": {
        "description": "خلاط هفار 8000 وات",
        "itemsCount": 1
      }
    },
    "notes": "توصيل سريع - عمارة لا يوجد مصعد",
    "wallet": {
      "cashCycle": {
        "cod": "1500.00",
        "bosta_fees": "50.00"
      }
    },
    "timeline": [
      {
        "status": "created",
        "createdAt": "2025-01-01T08:00:00Z"
      },
      {
        "status": "picked_up",
        "createdAt": "2025-01-01T10:30:00Z"
      },
      {
        "status": "delivered",
        "createdAt": "2025-01-02T14:00:00Z"
      }
    ],
    "callsNumber": 3,
    "smsNumber": 5,
    "attemptsCount": 1,
    "lastCallTime": "2025-01-02T12:00:00Z",
    "createdAt": "2025-01-01T08:00:00Z",
    "updatedAt": "2025-01-02T14:00:00Z",
    "collectedFromBusiness": "2025-01-01T10:30:00Z",
    "scheduledAt": "2025-01-01T12:00:00Z"
  }
}
```

### B. Type 25 (Customer Return Pickup) Example

```json
{
  "success": true,
  "data": {
    "trackingNumber": "BOS987654321",
    "type": {
      "code": 25,
      "value": "CUSTOMER RETURN PICKUP"
    },
    "isConfirmedDelivery": false,
    "receiver": {
      "phone": "01098765432",
      "secondPhone": null,
      "fullName": "فاطمة علي"
    },
    "pickupAddress": {
      "city": {
        "nameAr": "الجيزة",
        "nameEn": "Giza"
      },
      "zone": {
        "nameAr": "الدقي",
        "nameEn": "Dokki"
      },
      "district": {
        "nameAr": "الدقي",
        "nameEn": "Dokki"
      },
      "firstLine": "شارع الجامعة، عمارة 20، شقة 5"
    },
    "returnSpecs": {
      "packageType": "خلاط",
      "packageDetails": {
        "description": "استرجاع خلاط معطل - لا يعمل",
        "itemsCount": 1
      }
    },
    "notes": "العميل يريد استرجاع الخلاط لأنه لا يعمل",
    "wallet": {
      "cashCycle": {
        "cod": "0.00",
        "bosta_fees": "45.00"
      }
    },
    "timeline": [
      {
        "status": "scheduled",
        "createdAt": "2025-01-03T09:00:00Z"
      }
    ],
    "callsNumber": 1,
    "smsNumber": 2,
    "attemptsCount": 0,
    "lastCallTime": null,
    "createdAt": "2025-01-03T08:00:00Z",
    "updatedAt": "2025-01-03T09:00:00Z"
  }
}
```

---

**End of Documentation**

**Related Files**:
- `app/api/bosta_api.py` - Backend endpoints
- `app/services/bosta_service.py` - Bosta API service
- `app/utils/bosta_converter.py` - Unified format converter
- `app/utils/phone_normalizer.py` - Phone normalization
- `front/src/api/customerAPI.js` - Frontend API usage
