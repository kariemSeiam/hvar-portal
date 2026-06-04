# Stock Management System Documentation

## Overview

The stock management system handles inventory tracking for products and parts, including quantity management, reservations, movements, and bill-of-materials (components). The system maintains three separate quantity counts per item to enable accurate stock accounting and audit trails.

## Database Schema

### Core Tables

#### `stock_items`

```sql
CREATE TABLE stock_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL COMMENT 'Enum: product, part',
    quantity_on_hand INT DEFAULT 0 COMMENT 'Physical count of good, valid items',
    quantity_reserved INT DEFAULT 0 COMMENT 'Count of on_hand items promised to active tickets',
    quantity_damaged INT DEFAULT 0 COMMENT 'Physical count of broken or unusable items',
    active BOOLEAN DEFAULT TRUE COMMENT 'Item is active and available for use',
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Key Fields:**

- `sku`: Unique identifier for the item
- `name`: Item display name
- `type`: Either 'product' or 'part' - determines if item can have components
- `quantity_on_hand`: Actual good items in inventory
- `quantity_reserved`: Good items allocated to active service tickets (subset of on_hand)
- `quantity_damaged`: Broken/unusable items
- `active`: Item availability status (affects item selection in UI)

**Quantity Semantics:**

- `quantity_available = quantity_on_hand - quantity_reserved`
- Total physical stock: `quantity_on_hand + quantity_damaged`

#### `stock_movements`

Audit trail for all inventory changes.

```sql
CREATE TABLE stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    movement_type VARCHAR(30) NOT NULL,
    `condition` VARCHAR(10) DEFAULT 'valid',
    reference_type VARCHAR(20),
    reference_id INT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (item_id) REFERENCES stock_items(id) ON DELETE RESTRICT
);
```

**Movement Types:**

- `SEND`: Stock reservation or commitment (used for service tickets)
- `RECEIVE`: Stock return or receipt (returns, cancellations)
- `MANUAL`: Manual stock adjustments and corrections

**Condition Values:**

- `valid`: Good, usable items
- `damaged`: Broken or unusable items

**Reference Types:**

- `service_ticket`: Movement linked to a service ticket operation
- `manual_adjustment`: Manual stock correction without ticket reference

#### `product_components`

Bill-of-materials defining which parts make up a product.

```sql
CREATE TABLE product_components (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    part_id INT NOT NULL,
    quantity_needed INT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES stock_items(id) ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES stock_items(id) ON DELETE CASCADE
);
```

**Rules:**

- `product_id` must reference a stock_item with type='product'
- `part_id` must reference a stock_item with type='part'
- `quantity_needed` defines how many parts required per product unit

---

## API Endpoints

### 1. Create Stock Item

**POST** `/api/stock/items`

Creates a new stock item (product or part) with optional components for products.

**Request:**

```json
{
  "sku": "PROD-001",
  "name": "هاتف محمول",
  "type": "product",
  "quantity_on_hand": 10,
  "user_id": "مسؤول",
  "components": [
    { "part_id": 1, "quantity_needed": 1 },
    { "part_id": 2, "quantity_needed": 2 }
  ]
}
```

**Parameters:**

- `sku` (required): Unique SKU identifier - must be unique across all items
- `name` (required): Item display name
- `type` (required): 'product' or 'part'
- `quantity_on_hand` (optional, default: 0): Initial stock quantity
- `user_id` (required): User creating the item (audit trail)
- `components` (optional): Array of component objects for products only
  - Each component requires: `part_id` (must exist and be type='part') and `quantity_needed` (positive integer)

**Response (201):**

```json
{
  "id": 1,
  "sku": "PROD-001",
  "name": "هاتف محمول",
  "type": "product",
  "quantity_on_hand": 10,
  "quantity_reserved": 0,
  "quantity_damaged": 0,
  "active": true,
  "created_by": "مسؤول",
  "created_at": "2025-10-27T10:00:00",
  "components": [
    {
      "id": 1,
      "sku": "PART-001",
      "name": "بطارية",
      "type": "part",
      "quantity_needed": 1
    }
  ]
}
```

**Error Responses:**

- **400**: Missing required fields (sku, name, type, user_id) OR invalid type OR component missing required fields OR component part not found
- **409**: SKU already exists
- **404**: Component part not found
- **500**: Creation failed

---

### 2. Update Stock Item Details

**PUT** `/api/stock/items/{item_id}`

Updates item metadata (SKU, name, active status).

**Request:**

```json
{
  "sku": "PROD-001-V2",
  "name": "Mobile Phone - Updated",
  "active": false,
  "user_id": "admin"
}
```

**Parameters:**

- `item_id` (URL): Stock item ID
- `sku` (optional): New SKU - must be unique if changed
- `name` (optional): New item name
- `active` (optional): true/false to activate/deactivate item
- `user_id` (required): User making the update (audit trail)

**Response (200):**
Returns updated item object with all fields.

**Logic:**

- At least one field (sku, name, or active) must be provided
- If SKU is changed, validates new SKU is not already in use
- Updates `updated_by` and `updated_at` automatically
- Components are included in response if product type

**Error Responses:**

- **400**: No fields to update OR validation failed
- **404**: Stock item not found
- **409**: New SKU already exists
- **500**: Update failed

---

### 3. Delete Stock Item

**DELETE** `/api/stock/items/{item_id}`

Deletes a stock item (part or product) from the system. Works for both parts and products.

**Request:**

No request body required. Only the `item_id` in the URL path.

**Parameters:**

- `item_id` (URL, required): Stock item ID to delete

**Response (200):**

```json
{
  "message": "تم الحذف بنجاح",
  "item_id": 123
}
```

**Logic:**

- Validates item exists before deletion
- Checks for dependencies in `service_items` and `stock_movements` tables
- **Only active tickets block deletion**: Items linked to COMPLETED or CANCELLED tickets do NOT block deletion
- If active dependencies exist, deletion is blocked (returns 409 Conflict with ticket details)
- If no active dependencies, item is deleted
- Product components are automatically deleted via CASCADE constraint

**Error Responses:**

- **404**: Stock item not found
- **409**: Cannot delete item - referenced in active service tickets or has stock movements
  ```json
  {
    "error": "لا يمكن حذف القطعة: القطعة مرتبطة بـ 2 عنصر خدمة في تذاكر: HVR251020001 (CONFIRMED)، HVM251020002 (IN_PROCESS) ولها 5 حركة مخزون",
    "details": {
      "service_items_count": 2,
      "stock_movements_count": 5,
      "service_tickets": [
        {
          "id": 1,
          "ticket_number": "HVR251020001",
          "status": "CONFIRMED",
          "service_type": "replacement"
        },
        {
          "id": 2,
          "ticket_number": "HVM251020002",
          "status": "IN_PROCESS",
          "service_type": "maintenance"
        }
      ]
    }
  }
  ```
- **500**: Deletion failed

**Important Notes:**

- Items **CAN** be deleted if they are only linked to COMPLETED or CANCELLED tickets
- Items **CANNOT** be deleted if they are referenced in:
  - `service_items` linked to active tickets (PENDING, CONFIRMED, IN_PROCESS, READY_FOR_DISPATCH, SENT, RETURNED)
  - `stock_movements` (has stock movement history)
- **Action Required**: If deletion is blocked by active tickets, you must complete or cancel those tickets first, then retry deletion
- The error response includes which ticket numbers and their statuses are blocking deletion
- Product components (`product_components`) are automatically deleted when the product is deleted
- Parts used as components in products will also have their component relationships deleted automatically

**Example Request:**

```javascript
// Delete a stock item
fetch('/api/stock/items/123', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  if (response.status === 200) {
    return response.json();
  } else if (response.status === 409) {
    // Handle dependency error
    return response.json().then(data => {
      // Show error message
      alert(data.error);
      // Optionally show ticket details
      if (data.details && data.details.service_tickets.length > 0) {
        console.log('Blocking tickets:', data.details.service_tickets);
        // You can display these tickets to the user
        // User needs to complete or cancel these tickets before deletion
      }
    });
  }
})
.then(data => {
  if (data) {
    console.log('Item deleted:', data);
  }
});
```

---

### 4. Get Single Stock Item

**GET** `/api/stock/items/{item_id}`

Retrieves complete details for a single stock item.

**Response (200):**
For products, includes `components` array with part details and `quantity_needed`.

**Error Responses:**

- **404**: Stock item not found

---

### 5. List Stock Items

**GET** `/api/stock/items`

Lists all stock items with optional filtering.

**Query Parameters:**

- `type` (optional): Filter by 'part' or 'product'
- `limit` (optional, ignored): If provided, limit parameter is ignored and all items are returned
- `offset` (optional, default: 0): Pagination offset

**Note:** The `limit` parameter is ignored when provided. All matching items are returned regardless of the limit value. This ensures complete data retrieval for frontend applications.

**Response:**

```json
[
  {
    "id": 1,
    "sku": "PROD-001",
    "name": "Mobile Phone",
    "type": "product",
    "quantity_on_hand": 10,
    "quantity_reserved": 2,
    "quantity_damaged": 1,
    "active": true
  }
]
```

**Example Requests:**

- `/api/stock/items?type=product&limit=100` - Returns all products (limit is ignored)
- `/api/stock/items?type=part` - Returns all parts
- `/api/stock/items?type=product&offset=0` - Returns all products starting from offset 0

---

### 6. Adjust Stock Quantity (by Item ID)

**POST** `/api/stock/items/{item_id}/adjust`

Manually adjusts the `quantity_on_hand` for an item.

**Request:**

```json
{
  "quantity_delta": 50,
  "reason": "Stock receipt from supplier",
  "user_id": "admin"
}
```

**Parameters:**

- `item_id` (URL): Stock item ID
- `quantity_delta` (required): Integer (positive increases, negative decreases)
- `reason` (required): String describing the adjustment reason
- `user_id` (required): User making the adjustment

**Response (200):**
Returns updated item details.

**Logic:**

- Creates a MANUAL stock movement with provided reason
- Directly updates `quantity_on_hand`
- No reservation logic involved

**Error Responses:**

- **400**: Missing required fields
- **500**: Adjustment failed

---

### 7. Manual Stock Adjustment (by SKU)

**POST** `/api/stock/manual`

Adjusts stock by SKU - supports both valid and damaged conditions.

**Request:**

```json
{
  "sku": "PROD-001",
  "quantity": 5,
  "condition": "valid",
  "user_id": "admin",
  "ticket_id": 123,
  "notes": "Extra parts for replacement"
}
```

**Parameters:**

- `sku` (required): Item SKU
- `quantity` (required): Integer (positive increases, negative decreases)
- `condition` (required): 'valid' or 'damaged'
- `user_id` (required): User making the adjustment
- `ticket_id` (optional): Ticket ID to link this adjustment to a service operation
- `notes` (optional): Additional notes about the adjustment

**Response (200):**

```json
{
  "message": "Manual adjustment completed: increased 5 valid items",
  "item": {
    "id": 1,
    "sku": "PROD-001",
    "quantity_on_hand": 15,
    "quantity_damaged": 0
  }
}
```

**Logic:**

- `condition='valid'`: Adjusts `quantity_on_hand`
- `condition='damaged'`: Adjusts `quantity_damaged`
- Creates MANUAL movement with auto-generated notes
- If `ticket_id` provided: `reference_type='service_ticket'`; otherwise `reference_type='manual_adjustment'`
- Notes are auto-formatted: `"Manual adjustment: [action] [qty] [condition] items. [user_notes]"`

**Error Responses:**

- **400**: Missing required fields OR invalid condition
- **404**: SKU not found
- **500**: Adjustment failed

---

### 8. Add Component to Product

**POST** `/api/stock/items/{product_id}/components`

Adds a component (part) to a product's bill-of-materials.

**Request:**

```json
{
  "part_id": 3,
  "quantity_needed": 2
}
```

**Parameters:**

- `product_id` (URL): Product stock item ID
- `part_id` (required): Part stock item ID (must exist and be type='part')
- `quantity_needed` (required): Positive integer

**Response (201):**

```json
{
  "components": [
    {
      "id": 1,
      "sku": "PART-001",
      "name": "Battery",
      "type": "part",
      "quantity_needed": 1
    },
    {
      "id": 2,
      "sku": "PART-002",
      "name": "Screen",
      "type": "part",
      "quantity_needed": 2
    }
  ]
}
```

**Error Responses:**

- **400**: Missing fields OR product is not type='product'
- **404**: Product not found OR part not found OR part is not type='part'
- **500**: Failed to add component

---

### 9. Remove Component from Product

**DELETE** `/api/stock/items/{product_id}/components/{component_id}`

Removes a component from a product's bill-of-materials.

**Response (200):**
Returns updated components array.

**Error Responses:**

- **404**: Product not found
- **500**: Removal failed

---

### 10. List Stock Movements

**GET** `/api/stock/movements`

Retrieves stock movement history with comprehensive filtering and pagination.

**Query Parameters:**

- `item_id` (optional, type: int): Filter by specific stock item
- `movement_type` (optional): Single type or comma-separated list (e.g., 'SEND' or 'SEND,RECEIVE,MANUAL')
- `reference_type` (optional): 'service_ticket' or 'manual_adjustment'
- `reference_id` (optional, type: int): Filter by specific reference (e.g., ticket ID)
- `created_by` (optional): Filter by user who created the movement
- `condition` (optional): Item condition - 'valid' or 'damaged'
- `item_type` (optional): Stock item type - 'product' or 'part'
- `start_date` (optional): Start of date range (YYYY-MM-DD format) to filter movements
- `end_date` (optional): End of date range (YYYY-MM-DD format) to filter movements
- `limit` (optional, default: 50, max: 100): Items per page
- `offset` (optional, default: 0): Pagination offset
- `order_by` (optional, default: 'created_at'): Sort field - must be one of: 'id', 'created_at', 'movement_type', 'quantity'
- `order_direction` (optional, default: 'DESC'): 'ASC' or 'DESC'

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "item_id": 1,
      "quantity": 10,
      "movement_type": "SEND",
      "condition": "valid",
      "reference_type": "service_ticket",
      "reference_id": 123,
      "created_by": "admin",
      "created_at": "2025-10-27T10:00:00",
      "notes": "Reserved for replacement",
      "sku": "PROD-001",
      "item_name": "Mobile Phone",
      "item_type": "product"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

**Movement Object Fields:**

- `id`: Movement record ID
- `item_id`: Stock item ID
- `quantity`: Signed quantity (positive for increase, negative for decrease)
- `movement_type`: SEND, RECEIVE, or MANUAL
- `condition`: 'valid' or 'damaged'
- `reference_type`: 'service_ticket' or 'manual_adjustment'
- `reference_id`: ID of the related object (ticket ID or null)
- `created_by`: User who performed the movement
- `created_at`: Timestamp of the movement
- `notes`: Additional context about the movement
- `sku`: Item SKU
- `item_name`: Item display name
- `item_type`: 'product' or 'part'

**Example Requests:**

- `/api/stock/movements?movement_type=SEND,RECEIVE&reference_type=service_ticket&limit=50`
- `/api/stock/movements?item_id=1&limit=100`
- `/api/stock/movements?created_by=admin&order_by=created_at&order_direction=ASC`
- `/api/stock/movements?start_date=2025-10-01&end_date=2025-10-31&condition=valid`
- `/api/stock/movements?item_type=product&movement_type=SEND&start_date=2025-10-20`
- `/api/stock/movements?condition=damaged&reference_type=service_ticket`

**Error Responses:**

- **400**: Invalid condition, item_type, or date format
- **500**: Failed to retrieve movements

---

## Service Layer (Business Logic)

Located in `app/services/stock_manager.py`

### Reserve Stock

```python
reserve_stock(item_id, quantity, ticket_id, user_id) -> reservation_id
```

Reserves stock for a service ticket without physically removing it.

**Parameters:**

- `item_id`: Stock item ID
- `quantity`: Number of units to reserve
- `ticket_id`: Service ticket ID for audit trail
- `user_id`: User making the reservation

**Returns:** Movement ID of the reservation (used as `reservation_id` for later commit/cancel)

**Behavior:**

- Increases `quantity_reserved` by the specified amount
- Uses row-level locking (SELECT FOR UPDATE) to prevent race conditions
- Validates available stock: `(quantity_on_hand - quantity_reserved) >= quantity`
- Logs a SEND movement with reference to the service ticket
- Reservation is marked in movement notes for tracking

**Raises:** `StockManagerException` if insufficient available stock

**Implementation Detail:** Row locking ensures atomicity - no two reservations can race.

---

### Commit Reservation

```python
commit_reservation(reservation_id, user_id) -> bool
```

Commits a previous reservation, physically removing items from stock.

**Parameters:**

- `reservation_id`: Movement ID returned from `reserve_stock()`
- `user_id`: User committing the reservation

**Behavior:**

- Decreases both `quantity_on_hand` AND `quantity_reserved` by the reserved amount
- Validates the reservation exists and is a SEND movement (not already committed/cancelled)
- Logs a second SEND movement with note referencing the original reservation
- Prevents double-committing via notes check

**Raises:** `StockManagerException` if:

- Reservation not found
- Reservation already actioned (committed or cancelled)

**Note:** After commit, `quantity_reserved` decreases by the reserved amount (reservation is fulfilled).

---

### Cancel Reservation

```python
cancel_reservation(reservation_id, user_id) -> bool
```

Cancels a previous reservation, freeing up the reserved stock.

**Parameters:**

- `reservation_id`: Movement ID returned from `reserve_stock()`
- `user_id`: User cancelling the reservation

**Behavior:**

- Decreases `quantity_reserved` only (does NOT affect `quantity_on_hand`)
- Validates the reservation exists and hasn't been actioned
- Logs a RECEIVE movement with note referencing the original reservation
- Prevents double-cancelling via notes check

**Raises:** `StockManagerException` if:

- Reservation not found
- Reservation already actioned (committed or cancelled)

---

### Adjust Stock

```python
adjust_stock(item_id, quantity_delta, reason, user_id) -> bool
```

Manually adjusts `quantity_on_hand` (for administrative corrections).

**Parameters:**

- `item_id`: Stock item ID
- `quantity_delta`: Positive (increase) or negative (decrease)
- `reason`: String describing why the adjustment was made
- `user_id`: User making the adjustment

**Behavior:**

- Updates `quantity_on_hand` by delta amount
- Creates a MANUAL movement with provided reason as notes
- Condition is always 'valid'
- Reference type is 'manual_adjustment'
- No validation - allows negative quantities

**Used By:** General stock corrections, receipts, discrepancies.

---

### Receive Stock

```python
receive_stock(item_id, quantity, user_id) -> bool
```

Wrapper around `adjust_stock()` for receiving new stock.

**Parameters:**

- `item_id`: Stock item ID
- `quantity`: Positive number of units received
- `user_id`: User receiving the stock

**Behavior:**

- Calls `adjust_stock(item_id, quantity, "Initial stock receipt", user_id)`
- Provides standardized message for stock receipts

---

### Adjust Damaged Stock

```python
adjust_damaged_stock(item_id, quantity_delta, reason, user_id) -> bool
```

Manually adjusts `quantity_damaged` (broken/unusable items).

**Parameters:**

- `item_id`: Stock item ID
- `quantity_delta`: Positive (mark as damaged) or negative (repair/remove)
- `reason`: String describing the damage or repair
- `user_id`: User making the adjustment

**Behavior:**

- Updates `quantity_damaged` by delta amount
- Creates a RECEIVE movement (not SEND) with provided reason
- Condition is always 'damaged'
- Reference type is 'manual_adjustment'

**Used By:** Damage reports, discrepancies, repairs.

---

### Process Return

```python
process_return(item_id, quantity, condition, ticket_id, user_id) -> bool
```

Processes returned items from a service ticket.

**Parameters:**

- `item_id`: Stock item ID
- `quantity`: Number of units returned
- `condition`: 'valid' (good) or 'damaged'
- `ticket_id`: Service ticket ID (audit trail)
- `user_id`: User processing the return

**Behavior:**

- If `condition='valid'`: Increases `quantity_on_hand`
- If `condition='damaged'`: Increases `quantity_damaged`
- Always logs a RECEIVE movement (items coming back)
- Reference type is 'service_ticket'

**Raises:** `StockManagerException` if condition is not 'valid' or 'damaged'

**Used By:** Return workflows, when items are sent back from customers.

---

### Manual Stock Adjustment (General Purpose)

```python
manual_stock_adjustment(item_id, quantity, condition, user_id, ticket_id=None, notes='') -> bool
```

General-purpose manual adjustment supporting both valid and damaged stock.

**Parameters:**

- `item_id`: Stock item ID
- `quantity`: Positive (increase) or negative (decrease)
- `condition`: 'valid' or 'damaged'
- `user_id`: User making the adjustment
- `ticket_id` (optional): Service ticket ID to link adjustment
- `notes` (optional): Additional context

**Behavior:**

- If `condition='valid'`: Adjusts `quantity_on_hand`
- If `condition='damaged'`: Adjusts `quantity_damaged`
- Always logs a MANUAL movement
- Auto-generates notes: `"Manual adjustment: [increased/decreased] [qty] [condition] items. [user_notes]"`
- If `ticket_id` provided: `reference_type='service_ticket'`; else `reference_type='manual_adjustment'`

**Raises:** `StockManagerException` if condition is not 'valid' or 'damaged'

**Workflow:** Used for ad-hoc adjustments with optional ticket linkage.

---

## Model Layer (Database Functions)

Located in `app/models/stock.py`

### create_stock_item(data)

Creates a new stock item with provided data (sku, name, type, quantity_on_hand, created_by).

### update_stock_item(item_id, data)

Updates allowed fields: sku, name, active, updated_by.

### get_stock_item_by_id(item_id)

Retrieves a single item by ID.

### get_stock_item_by_sku(sku)

Retrieves a single item by SKU (unique lookup).

### get_stock_items_by_type(item_type=None, limit=100, offset=0)

Lists items with optional type filter and pagination.

### get_product_components(product_id)

Retrieves all components for a product with part details and quantity_needed.

### log_stock_movement(item_id, movement_type, quantity, reference_type, reference_id, user_id, condition='valid', notes=None)

Creates a stock movement record for audit trail.

### get_stock_movements(item_id=None, movement_type=None, reference_type=None, reference_id=None, created_by=None, limit=100, offset=0, order_by='created_at', order_direction='DESC')

Retrieves movements with filtering, pagination, and custom ordering.

### get_stock_movements_count(item_id=None, movement_type=None, reference_type=None, reference_id=None, created_by=None)

Returns total count of movements matching filters.

---

## Key Implementation Details

1. **Quantity Management:**

   - `quantity_on_hand`: Physical good items
   - `quantity_reserved`: Subset of on_hand reserved for tickets
   - `quantity_available = quantity_on_hand - quantity_reserved`
   - `quantity_damaged`: Separate physical count
   - All are non-negative integers

2. **Row-Level Locking:**

   - `reserve_stock()` uses `SELECT FOR UPDATE` to prevent race conditions
   - Ensures atomic read-modify-write of quantities
   - Critical for multi-threaded environments

3. **Audit Trail:**

   - Every stock change creates a movement record
   - Movements store signed quantities: positive for increase, negative for decrease
   - Reference types link movements to tickets or manual adjustments
   - All operations include `created_by` for full accountability

4. **Reservation Semantics:**

   - Reservation is a two-phase process:
     1. `reserve_stock()` - marks items as reserved but keeps in on_hand
     2. `commit_reservation()` - removes from on_hand + reserved
   - Can be cancelled with `cancel_reservation()` - removes from reserved only
   - Prevents double-actioning via notes tracking

5. **Component Management:**

   - Only products can have components
   - Components are one-way (product → part), not bidirectional
   - Deleting a product cascades to delete its components
   - Deleting a part restricts if it's used in any product

6. **Transaction Safety:**

   - All multi-step operations use `with transaction()` context manager
   - Ensures atomicity of related database changes
   - Automatically rolls back on exception

7. **Validation:**

   - SKU uniqueness enforced at database level (UNIQUE constraint)
   - Type validation (product vs part)
   - Component validation (must reference existing parts)
   - Available stock validation on reservation

8. **Active Status:**
   - Items can be deactivated without deletion
   - Allows historical tracking while hiding from UI
   - Useful for phased stock management

---

## Error Codes

| Code    | Context       | Meaning                                                                |
| ------- | ------------- | ---------------------------------------------------------------------- |
| **400** | Any endpoint  | Bad Request - validation failed, missing fields, or insufficient stock |
| **404** | Any endpoint  | Not Found - item, component, or SKU doesn't exist                      |
| **409** | Create/Update | Conflict - SKU already exists                                          |
| **500** | Any endpoint  | Internal Server Error - operation failed                               |

---

## Workflow Examples

### Example 1: Simple Stock Receipt

```
1. POST /api/stock/items with quantity_on_hand=0
   → Creates item with zero stock

2. POST /api/stock/items/{item_id}/adjust
   → quantity_delta=100, reason="Supplier shipment"
   → quantity_on_hand becomes 100
```

### Example 2: Service Ticket with Reservation & Commit

```
1. reserve_stock(item_id=1, quantity=5, ticket_id=123, user_id="tech")
   → quantity_reserved increases to 5
   → Returns movement_id (e.g., 999)

2. [Perform service...]

3. commit_reservation(reservation_id=999, user_id="tech")
   → quantity_on_hand decreases by 5
   → quantity_reserved decreases by 5
   → Second movement created linking to original
```

### Example 3: Return with Damage

```
1. Customer returns item in damaged condition

2. process_return(item_id=1, quantity=3, condition="damaged", ticket_id=123, user_id="tech")
   → quantity_damaged increases by 3
   → RECEIVE movement logged with service_ticket reference
```

### Example 4: Manual Correction

```
1. Physical inventory count shows discrepancy

2. manual_stock_adjustment(item_id=1, quantity=-5, condition="valid", user_id="admin", notes="Inventory recount")
   → quantity_on_hand decreases by 5
   → MANUAL movement logged with notes
```

---

## Indexes

Optimized for common query patterns:

- `idx_stock_sku`: SKU lookups
- `idx_stock_type`: Filtering by product/part
- `idx_stock_items_active`: Filtering active items
- `idx_stock_movements_item_created`: Item history queries
- `idx_stock_movements_created_at`: Movement timeline queries
- Composite indexes for common filter combinations

---

## Best Practices

1. **Always provide user_id** for audit accountability
2. **Use reservations** for service tickets (don't directly adjust stock)
3. **Use condition field** to separate valid from damaged stock
4. **Link to tickets** where applicable for better traceability
5. **Review movements** regularly for audit compliance
6. **Test with multiple concurrent requests** if running in production with multiple workers
