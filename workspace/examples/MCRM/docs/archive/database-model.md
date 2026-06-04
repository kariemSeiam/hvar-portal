# Database Model - Call Center System (NEW VISION 2025)

> **Version**: 2.0 | **Date**: 2025-02-10 | **Status**: DRAFT - READY FOR IMPLEMENTATION
>
> **Complete rewrite based on NEW VISION**: Draft-first, unified customer service platform

---

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [New Tables](#new-tables)
4. [Existing Tables](#existing-tables)
5. [Relationships](#relationships)
6. [Indexes & Performance](#indexes--performance)
7. [Migration Strategy](#migration-strategy)

---

## Design Philosophy

### Core Principles

1. **Draft-First Philosophy**
   - Drafts are created WITHOUT service type
   - Service type selected during confirmation
   - Flexible workflow adapts to customer's actual situation

2. **Type Selection at Confirmation**
   - Type based on customer's stated need
   - Reduces re-classification
   - Clear intent documentation

3. **Customer 360 View**
   - Single phone search shows everything
   - Customer info, Bosta orders, service tickets, draft orders
   - Complete context in one query

4. **SELL Type Enhancement**
   - PRODUCTS: Reference only, no stock impact
   - PARTS: Inventory tracked (future)
   - Customer vs Merchant pricing tiers

### Database Design Rules

- **Normalization**: Customer data in customers table (not denormalized in orders)
- **Minimal Redundancy**: Reuse existing tables where possible
- **Clean Relationships**: Proper foreign keys with constraints
- **Performance**: Proper indexes on query patterns
- **Multi-Source**: Support ERP, Bosta, and Direct sources
- **Dual Linking**: Calls table links to orders OR service_tickets

---

## Entity Relationship Diagram

```
customers (1:N) orders
customers (1:N) service_tickets
orders (1:1, optional) service_tickets (via converted_to_ticket_id)
orders (1:N) service_items (via order_id)
service_tickets (1:N) service_items (via ticket_id)
service_items (N:1) stock_items
orders (1:N) calls (via order_id)
service_tickets (1:N) calls (via ticket_id)
users (1:N) calls (via agent_id)
users (1:N) orders (via approved_by)
```

---

## New Tables

### Table: `orders`

**Purpose**: Draft order management for all service types (R/M/T/S) with draft-first philosophy

**Key Features**:
- Draft status WITHOUT service type (NULL until confirmation)
- Source tracking (ERP, Bosta, Direct)
- Approval workflow (team leader approval required)
- Conversion to service_tickets
- Dual linking to calls table

```sql
CREATE TABLE orders (
    -- Primary Key
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Order Number
    order_number VARCHAR(100) UNIQUE NOT NULL COMMENT 'Format: DR2025/XXXXX or HV{TYPE}{YYMMDD}{NNN} after conversion',
    order_date DATETIME NOT NULL COMMENT 'Date/time order was created',

    -- Source & Type
    source ENUM('erp', 'bosta', 'direct') DEFAULT 'direct' COMMENT 'Order source',
    source_data JSON COMMENT 'Raw source data (ERP/Bosta) - for reference only',
    service_type ENUM('R', 'M', 'T', 'S') NULL COMMENT 'Service type: NULL until confirmation',

    -- Customer (Normalized)
    customer_id INT NOT NULL COMMENT 'Foreign key to customers table',

    -- Shipping Address (Denormalized for performance)
    address_country VARCHAR(100) COMMENT 'Country from Bosta or direct entry',
    address_governorate VARCHAR(255) COMMENT 'Governorate (المحافظة)',
    address_city VARCHAR(255) COMMENT 'City (المدينة)',
    address_district VARCHAR(255) COMMENT 'District (المنطقة)',
    address_full TEXT COMMENT 'Full address string',

    -- Contact
    contact_phone VARCHAR(20) COMMENT 'Alternative contact phone (if different from customer)',

    -- Order Details
    description TEXT COMMENT 'Initial issue description',
    notes TEXT COMMENT 'Additional notes and history',

    -- Financial
    cod_amount DECIMAL(10, 2) COMMENT 'Cash on delivery amount',
    estimated_cost DECIMAL(10, 2) COMMENT 'Estimated service cost',

    -- Bosta Integration
    bosta_tracking_number VARCHAR(100) COMMENT 'Bosta tracking number (if source=bosta)',
    bosta_order_type INT COMMENT 'Bosta order type (10/20/25/30)',
    bosta_order_data JSON COMMENT 'Complete Bosta order data (cached)',

    -- Status & Workflow
    status ENUM('draft', 'pending', 'scheduled', 'confirmed', 'converted', 'canceled') DEFAULT 'draft' COMMENT 'Draft state machine status',

    -- Scheduling
    scheduled_callback_at DATETIME COMMENT 'When customer requested callback',
    next_action_at DATETIME COMMENT 'When order becomes actionable (for gap time)',

    -- Approval
    approved_by INT COMMENT 'Team leader who approved this draft',
    approved_at DATETIME COMMENT 'Timestamp of leader approval',
    converted_to_ticket_id INT COMMENT 'Link to service_ticket after conversion',
    rejection_reason TEXT COMMENT 'Reason if draft was rejected',

    -- Locking
    locked_by INT COMMENT 'Agent user_id if locked',
    locked_at DATETIME COMMENT 'Timestamp of lock',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50) COMMENT 'Agent who created the draft',

    -- Foreign Keys
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (converted_to_ticket_id) REFERENCES service_tickets(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (locked_by) REFERENCES users(id) ON DELETE SET NULL,

    -- Indexes
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_customer_id (customer_id),
    INDEX idx_source (source),
    INDEX idx_service_type (service_type),
    INDEX idx_bosta_tracking (bosta_tracking_number),
    INDEX idx_next_action_at (next_action_at),
    INDEX idx_scheduled_callback_at (scheduled_callback_at),
    INDEX idx_approved_by (approved_by),
    INDEX idx_locked_by (locked_by),
    INDEX idx_status_next_action (status, next_action_at),
    INDEX idx_status_service_type (status, service_type)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Draft orders before service ticket creation - NEW VISION 2025';
```

**Status Values**:
| Status | Description | service_type | Next Actions |
|--------|-------------|--------------|--------------|
| `draft` | Initial state, data collection | NULL | Collect details → Select type |
| `pending` | Type selected, awaiting leader approval | SET | Leader reviews |
| `scheduled` | Callback scheduled, awaiting customer | NULL or SET | Resume at scheduled time |
| `confirmed` | Customer confirmed all details | SET | Leader approval |
| `converted` | Service ticket created | SET | Archived (view-only) |
| `canceled` | Canceled by agent/customer | NULL or SET | Archived |

---

### Table: `calls`

**Purpose**: Call session tracking for BOTH orders AND service tickets

**Key Features**:
- Dual linking (order_id OR ticket_id, one must be set)
- Complete audit trail for all calls
- 3-strike tracking for draft orders
- Gap time support for retry logic
- Agent tracking with denormalized agent_name

```sql
CREATE TABLE calls (
    -- Primary Key
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Dual Linking (One must be NULL, one must be SET)
    order_id INT NULL COMMENT 'Linked to orders table (NULL if for service ticket)',
    ticket_id INT NULL COMMENT 'Linked to service_tickets table (NULL if for order)',

    -- Agent
    agent_id INT COMMENT 'Agent who made the call',
    agent_name VARCHAR(100) COMMENT 'Agent name (denormalized for performance)',

    -- Call Timing
    call_date DATE COMMENT 'Date of call (for daily attempt tracking)',
    call_time TIME COMMENT 'Time of call',
    call_datetime DATETIME COMMENT 'Full timestamp (call_date + call_time)',
    duration_seconds INT COMMENT 'Call duration in seconds',

    -- Customer Info (denormalized for performance)
    customer_phone VARCHAR(20) NOT NULL COMMENT 'Customer phone number',

    -- Attempt Tracking (3-strike logic for draft orders)
    attempt_number INT COMMENT 'Attempt number for draft orders (1, 2, 3...)',
    is_daily_attempt BOOLEAN DEFAULT TRUE COMMENT 'True if part of daily 3 attempts',

    -- Call Outcome
    status ENUM('confirmed', 'accepted', 'scheduled', 'no_answer', 'canceled', 'left_message') NOT NULL,
    scheduled_date DATETIME COMMENT 'Scheduled callback date (if status=scheduled)',
    cancellation_reason TEXT COMMENT 'Cancellation reason (if status=canceled)',

    -- Call Details
    history TEXT COMMENT 'Agent notes/observations',

    -- Retry Logic
    next_action_at DATETIME COMMENT 'When order becomes actionable (for gap time)',
    gap_time_hours INT COMMENT 'Gap time in hours until next attempt',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES service_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE RESTRICT,

    -- Check Constraint: Exactly one of order_id or ticket_id must be set
    CONSTRAINT chk_call_target CHECK (
        (order_id IS NOT NULL AND ticket_id IS NULL) OR
        (order_id IS NULL AND ticket_id IS NOT NULL)
    ),

    -- Indexes
    INDEX idx_order_id (order_id),
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_agent_id (agent_id),
    INDEX idx_agent_name (agent_name),
    INDEX idx_customer_phone (customer_phone),
    INDEX idx_call_date (call_date),
    INDEX idx_call_datetime (call_datetime),
    INDEX idx_status (status),
    INDEX idx_attempt_number (attempt_number),
    INDEX idx_next_action_at (next_action_at),
    INDEX idx_order_date_attempt (order_id, call_date, attempt_number),
    INDEX idx_ticket_date (ticket_id, call_date)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Call session tracking for orders and tickets - NEW VISION 2025';
```

**Call Status Values**:
| Status | Description | Context |
|--------|-------------|---------|
| `confirmed` | Customer accepted draft order | Draft orders |
| `accepted` | Customer accepted service ticket action | Service tickets |
| `scheduled` | Customer requested callback | Both |
| `no_answer` | Customer didn't answer, will retry | Both |
| `canceled` | Customer refused | Both |
| `left_message` | Left voicemail/message | Both |

---

## Existing Tables

### Table: `service_tickets`

**Purpose**: Internal service ticket processing after draft conversion

**Changes**: New workflow support for all service types (R/M/T/S)

```sql
CREATE TABLE service_tickets (
    -- Primary Key
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Ticket Number
    ticket_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Format: HV{TYPE}{YYMMDD}{NNN}',
    ticket_type ENUM('R', 'M', 'T', 'S') NOT NULL COMMENT 'R=Replacement, M=Maintenance, T=Return, S=Sell',

    -- Customer
    customer_id INT NOT NULL COMMENT 'Foreign key to customers',
    governorate VARCHAR(100) COMMENT 'Governorate (المحافظة)',
    city VARCHAR(100) COMMENT 'City (المدينة)',
    address TEXT COMMENT 'Full address',

    -- Status & Workflow
    status ENUM('PENDING', 'CONFIRMED', 'IN_PROCESS', 'COMPLETED', 'CANCELED') DEFAULT 'PENDING',
    description TEXT COMMENT 'Issue description',
    notes TEXT COMMENT 'Additional notes',

    -- Items (JSON)
    items JSON COMMENT 'Service items and their details',

    -- Source Tracking
    source ENUM('call_center', 'hub', 'web') DEFAULT 'call_center' COMMENT 'Where ticket was created',
    created_from_order_id INT COMMENT 'Link to orders table if converted from draft',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_from_order_id) REFERENCES orders(id) ON DELETE SET NULL,

    -- Indexes
    INDEX idx_ticket_number (ticket_number),
    INDEX idx_ticket_type (ticket_type),
    INDEX idx_status (status),
    INDEX idx_customer_id (customer_id),
    INDEX idx_source (source)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Service tickets for R/M/T/S workflows - Updated for NEW VISION';
```

---

### Table: `service_items`

**Purpose**: Link service_tickets AND orders to stock_items

**Changes**: Added `order_id` column for draft-to-ticket flow

```sql
CREATE TABLE service_items (
    -- Primary Key
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Dual Linking (ticket_id OR order_id)
    ticket_id INT NULL COMMENT 'Linked to service_tickets (NULL if for order)',
    order_id INT NULL COMMENT 'Linked to orders (NULL if for ticket)',

    -- Item Details
    item_id INT NOT NULL COMMENT 'Foreign key to stock_items',
    quantity INT NOT NULL DEFAULT 1,

    -- Item-specific details
    item_details JSON COMMENT 'Type-specific item data (condition, direction, etc.)',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (ticket_id) REFERENCES service_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES stock_items(id) ON DELETE RESTRICT,

    -- Check Constraint: Exactly one of ticket_id or order_id must be set
    CONSTRAINT chk_service_items_link CHECK (
        (ticket_id IS NOT NULL AND order_id IS NULL) OR
        (ticket_id IS NULL AND order_id IS NOT NULL)
    ),

    -- Indexes
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_order_id (order_id),
    INDEX idx_item_id (item_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Service items - Updated to support orders and tickets';
```

---

### Table: `customers`

**Purpose**: Customer data and history (no changes required, shown for reference)

```sql
CREATE TABLE customers (
    -- Primary Key
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Customer Info
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL COMMENT 'Normalized to 01XXXXXXXXX format',
    phone_secondary VARCHAR(20),
    governorate VARCHAR(100),
    city VARCHAR(100),
    address_details TEXT,

    -- Bosta Integration (JSON cache)
    bosta_orders JSON COMMENT 'Cached Bosta order data',
    customer_services JSON COMMENT 'Cached service history',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_phone (phone),
    INDEX idx_name (name)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### Table: `stock_items`

**Purpose**: Products and parts inventory (no changes required, shown for reference)

```sql
CREATE TABLE stock_items (
    -- Primary Key
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Item Info
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('product', 'part') NOT NULL,
    category VARCHAR(100),

    -- Inventory
    quantity_on_hand INT DEFAULT 0,
    quantity_reserved INT DEFAULT 0,

    -- Pricing
    price_customer DECIMAL(10, 2) NOT NULL COMMENT 'Retail price',
    price_merchant DECIMAL(10, 2) COMMENT 'Wholesale price',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_sku (sku),
    INDEX idx_type (type),
    INDEX idx_category (category)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### Table: `users`

**Purpose**: System users (agents, team leaders) (no changes required, shown for reference)

```sql
CREATE TABLE users (
    -- Primary Key
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- User Info
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('agent', 'team_leader', 'admin') NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_username (username),
    INDEX idx_role (role)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Relationships

### Core Relationships

```
customers (1:N) orders
customers (1:N) service_tickets
orders (1:1, optional) service_tickets (via converted_to_ticket_id)
orders (1:N) service_items (via order_id)
service_tickets (1:N) service_items (via ticket_id)
service_items (N:1) stock_items
orders (1:N) calls (via order_id)
service_tickets (1:N) calls (via ticket_id)
users (1:N) calls (via agent_id)
users (1:N) orders (via approved_by)
```

### Relationship Details

#### 1. Draft to Ticket Conversion
```sql
-- Draft order becomes service ticket
orders.converted_to_ticket_id → service_tickets.id
orders.status = 'converted'

-- Items transfer from order to ticket
-- Before: service_items.order_id = orders.id
-- After: service_items.ticket_id = service_tickets.id
```

#### 2. Call Linking
```sql
-- For draft order calls
calls.order_id = orders.id
calls.ticket_id = NULL

-- For service ticket calls
calls.order_id = NULL
calls.ticket_id = service_tickets.id

-- Constraint ensures exactly one is set
CONSTRAINT chk_call_target CHECK (
    (order_id IS NOT NULL AND ticket_id IS NULL) OR
    (order_id IS NULL AND ticket_id IS NOT NULL)
)
```

#### 3. Item Linking
```sql
-- For draft orders
service_items.order_id = orders.id
service_items.ticket_id = NULL

-- For service tickets
service_items.order_id = NULL
service_items.ticket_id = service_tickets.id

-- Constraint ensures exactly one is set
CONSTRAINT chk_service_items_link CHECK (
    (ticket_id IS NOT NULL AND order_id IS NULL) OR
    (ticket_id IS NULL AND order_id IS NOT NULL)
)
```

---

## Indexes & Performance

### Query Patterns and Indexes

#### 1. Queue Queries (Drafts ready for call)
```sql
-- Pattern: Get draft orders needing call
-- Index: idx_status_next_action (status, next_action_at)
SELECT o.*, c.name, c.phone
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.status IN ('draft', 'scheduled')
  AND (o.next_action_at IS NULL OR o.next_action_at <= NOW())
  AND o.locked_by IS NULL
ORDER BY o.next_action_at ASC, o.created_at ASC;
```

#### 2. Customer Search
```sql
-- Pattern: Find customer by phone (01XXXXXXXXX)
-- Index: idx_phone on customers
SELECT * FROM customers WHERE phone = '01012345678';
```

#### 3. Call History
```sql
-- Pattern: Get call history for order
-- Index: idx_order_date_attempt (order_id, call_date, attempt_number)
SELECT * FROM calls
WHERE order_id = ?
ORDER BY call_datetime DESC;
```

#### 4. Bosta Orders
```sql
-- Pattern: Find by Bosta tracking number
-- Index: idx_bosta_tracking on orders
SELECT * FROM orders
WHERE bosta_tracking_number = 'BOS12345678';
```

#### 5. Approval Queue
```sql
-- Pattern: Get drafts pending approval
-- Index: idx_status (status)
SELECT o.*, c.name, c.phone, u.name as agent_name
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN users u ON o.created_by = u.username
WHERE o.status = 'pending'
ORDER BY o.updated_at ASC;
```

---

## Migration Strategy

### Phase 1: Create New Tables

```sql
-- Step 1: Create orders table
CREATE TABLE orders (
    -- [See full schema above]
);

-- Step 2: Create calls table
CREATE TABLE calls (
    -- [See full schema above]
);
```

### Phase 2: Modify Existing Tables

```sql
-- Step 1: Add order_id to service_items
ALTER TABLE service_items
ADD COLUMN order_id INT NULL COMMENT 'Linked to orders (if order, not ticket)',
ADD FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
ADD INDEX idx_order_id (order_id),
ADD CONSTRAINT chk_service_items_link
  CHECK (ticket_id IS NOT NULL OR order_id IS NOT NULL);

-- Step 2: Add source and draft tracking to service_tickets
ALTER TABLE service_tickets
ADD COLUMN created_from_order_id INT COMMENT 'Link to orders table if converted from draft',
ADD FOREIGN KEY (created_from_order_id) REFERENCES orders(id) ON DELETE SET NULL,
ADD INDEX idx_created_from_order_id (created_from_order_id);
```

### Phase 3: Data Migration

```sql
-- Migrate existing draft data if any
-- (This depends on current state - assess before running)
```

### Phase 4: Validation

```sql
-- Verify all constraints are working
-- Test draft creation
-- Test call recording
-- Test draft-to-ticket conversion
```

---

## Appendix A: Type-Specific Fields (JSON Storage)

### [R] REPLACEMENT
```json
{
  "original_item": {
    "sku": "string",
    "name": "string",
    "condition": "defective|damaged|warranty_issue"
  },
  "replacement_item": {
    "sku": "string",
    "name": "string",
    "quantity": 1
  },
  "warranty": {
    "is_warranty": true,
    "purchase_date": "2025-01-01"
  },
  "tracking": {
    "original": "BOS123",
    "new_send": "BOS456",
    "new_receive": "BOS789"
  }
}
```

### [M] MAINTENANCE
```json
{
  "item": {
    "description": "string",
    "serial_number": "string",
    "category": "string"
  },
  "problem": {
    "description": "string",
    "symptoms": ["noise", "leaking"]
  },
  "estimates": {
    "parts": [{"sku": "string", "quantity": 1}],
    "labor_hours": 2.5,
    "cost": 500.00
  }
}
```

### [T] RETURN
```json
{
  "original_order": {
    "invoice": "string",
    "purchase_date": "2025-01-01",
    "amount": 1500.00
  },
  "return_reason": {
    "code": "defective|wrong_item|buyer_remorse",
    "details": "string"
  },
  "refund": {
    "method": "original_payment|bank_transfer|store_credit",
    "amount": 1500.00
  }
}
```

### [S] SELL
```json
{
  "items": [{
    "sku": "string",
    "name": "string",
    "type": "product|part",
    "quantity": 1,
    "price_customer": 1500.00,
    "price_merchant": 1200.00,
    "selected_price": 1500.00
  }],
  "customer_type": "customer|merchant",
  "shipping": {
    "same_as_customer": true,
    "governorate": "string",
    "city": "string",
    "full_address": "string"
  },
  "payment": {
    "method": "cod|bank_transfer|wallet",
    "status": "pending|paid|partial"
  },
  "bosta": {
    "create_product": true,
    "ready": false
  }
}
```

---

## Appendix B: State Transition Tables

### Draft Order Status Flow

```
draft ──────────────────────┐
  │                          │
  ├─→ pending (type selected)│
  ├─→ scheduled (callback)  │
  └─→ canceled              │
                            │
pending ────────────────────┤
  │                          │
  ├─→ confirmed (full data) │
  ├─→ scheduled (callback)  │
  └─→ draft (rejected)      │
                            │
confirmed ───────────────────┤
  │                          │
  └─→ converted (approved)  │
                            │
scheduled ───────────────────┤
  │                          │
  ├─→ draft (resume)        │
  ├─→ pending (confirm)     │
  └─→ canceled              │
                            │
canceled/converted ──────────┘ (Terminal states)
```

---

**Last Updated**: 2025-02-10
**Version**: 2.0 - NEW VISION 2025
**Status**: DRAFT - Ready for Implementation
**Maintained by**: HVAR Systems Development Team
