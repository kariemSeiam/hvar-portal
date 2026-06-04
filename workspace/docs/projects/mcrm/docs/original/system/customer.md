# Customer API Documentation

## Model Schema

```sql
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    phone_secondary VARCHAR(20),
    governorate VARCHAR(100),
    city VARCHAR(100),
    address_details TEXT,
    bosta_orders JSON,
    customer_services JSON DEFAULT ('[]'),
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Endpoints

### 1. List Customers

**GET** `/api/customers/`

- **Params:** `limit` (default: 20), `offset` (default: 0)
- **Response:** `{"data": [...], "pagination": {"total": 150, "limit": 10, "offset": 0, "has_more": true}}`

### 2. Create Customer

**POST** `/api/customers/`

- **Required:** `name`, `phone`
- **Optional:** `phone_secondary`, `governorate`, `city`, `address_details`, `created_by`
- **Success (201):** `{"message": "Customer created successfully", "data": {...}}`
- **Errors:** 400 (missing fields), 409 (phone exists), 500 (creation failed)

### 3. Search Customers

**GET** `/api/customers/search`

- **Required:** `q` (name/phone/tracking)
- **Optional:** `type` (phone/tracking), `limit`, `offset`
- **Logic:** Local search first, then Bosta sync if not found
- **Response:** Array of customers or empty array
- **Errors:** 400 (missing query), 404 (tracking not found), 500 (Bosta errors)

### 4. Get Customer by ID

**GET** `/api/customers/{customer_id}`

- **Logic:** Auto-syncs with Bosta on retrieval
- **Success:** Customer object or `{"warning": "...", "data": {...}}` if sync fails
- **Error:** 404 (not found)

### 5. Update Customer

**PUT** `/api/customers/{customer_id}`

- **Allowed fields:** `name`, `governorate`, `city`, `address_details`, `phone_secondary`, `updated_by`
- **Note:** Primary phone cannot be updated
- **Success (200):** `{"message": "Customer address updated successfully", "data": {...}}`
- **Errors:** 400 (no valid fields), 404 (not found), 500 (update failed)

## Bosta Integration

- Auto-sync on GET operations
- Search by phone/tracking number
- `created_by`/`updated_by` set to `'bosta_sync'` for Bosta operations
- Graceful failure handling with warnings

## Error Codes

- **400:** Bad Request (validation errors)
- **404:** Not Found (customer/tracking not found)
- **409:** Conflict (duplicate phone)
- **500:** Internal Server Error (system failures)

## Key Features

- Phone uniqueness validation
- Automatic Bosta synchronization
- Pagination support
- Universal search (local + Bosta)
- Audit trail (created_by/updated_by)
- JSON fields for orders/services
