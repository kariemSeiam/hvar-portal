# Mini-Doc: Maintenance Service Workflow

**Version:** 1.5 (Stock Impact on Complete Maintenance)
**Service Type:** `maintenance`
**Last Updated:** 2025-01-XX

This document outlines the complete lifecycle of a maintenance ticket, detailing every state, action, and valid input, derived directly from the application's source code. The `complete_maintenance` action now automatically affects stock levels for SEND and RECEIVE items.

**Action Detection Logic:**

The system determines available actions for maintenance tickets in `IN_PROCESS` status by checking the ticket history in reverse chronological order (newest first):

- Finds the most recent `IN_PROCESS → IN_PROCESS` history entry
- If notes contain **"بدأت"** (started) → Shows `complete_maintenance`
- If notes contain **"اكتملت"** (completed) → Shows `mark_ready`
- If no such entry exists → Shows `start_maintenance`

This ensures the correct action flow: `start_maintenance` → `complete_maintenance` → `mark_ready`

---

### **1. State: (Start) → PENDING**

A customer's item is registered for repair.

**Action: `create`**

- **Endpoint:** `POST /api/tickets/create`
- **Purpose:** To create a new maintenance ticket and log the customer's request.
- **Resulting State:** `PENDING`

| Input Field         | Data Type | Requirement  | Logic / Notes                                                                                     |
| :------------------ | :-------- | :----------- | :------------------------------------------------------------------------------------------------ |
| `type`              | String    | **Required** | Must be `"maintenance"`.                                                                          |
| `user_id`           | String    | **Required** | ID of the user creating the ticket.                                                               |
| `customer_id`       | Integer   | Optional     | ID of an existing customer.                                                                       |
| `name`              | String    | Conditional  | **Required** if `customer_id` is not provided.                                                    |
| `phone`             | String    | Conditional  | **Required** if `customer_id` is not provided.                                                    |
| `original_tracking` | String    | Optional     | Tracking number for the item sent _by_ the customer.                                              |
| `items`             | Array     | Optional     | Items associated with the ticket (can be added at creation or confirmation).                      |
| ...                 | ...       | Optional     | Other fields like `notes`, `priority`, `reason`, `cost_adjustment`, and customer address details. |

**Note:** Items can be provided at creation or during confirmation. Stock impact occurs automatically when `complete_maintenance` action is called with SEND and RECEIVE items.

---

### **2. State: `PENDING` → `CONFIRMED`**

The maintenance request is approved, awaiting the item's arrival.

**Action: `confirm`**

- **Endpoint:** `POST /api/tickets/{id}/action`
- **Purpose:** To formally approve the maintenance request.
- **Resulting State:** `CONFIRMED`
- **Stock Impact:** None at this stage.

| Input Field            | Data Type | Requirement  | Logic / Notes                                                                      |
| :--------------------- | :-------- | :----------- | :--------------------------------------------------------------------------------- |
| `action`               | String    | **Required** | Must be `"confirm"`.                                                               |
| `user_id`              | String    | **Required** | ID of the confirming user.                                                         |
| `new_tracking_receive` | String    | Optional     | The tracking number for the inbound shipment from the customer.                    |
| ...                    | ...       | Optional     | Other fields like `notes`, `cost_adjustment`, `items`, and customer phone numbers. |

---

### **3. State: `CONFIRMED` → `IN_PROCESS`**

The customer's item has arrived at the hub.

**Action: `scan_inbound`**

- **Endpoint:** `POST /api/tickets/{id}/action`
- **Purpose:** To log the receipt of the customer's item.
- **Resulting State:** `IN_PROCESS`

| Input Field       | Data Type | Requirement  | Logic / Notes                                    |
| :---------------- | :-------- | :----------- | :----------------------------------------------- |
| `action`          | String    | **Required** | Must be `"scan_inbound"`.                        |
| `user_id`         | String    | **Required** | ID of the user scanning the package.             |
| `tracking_number` | String    | **Required** | Must match `new_tracking_receive` on the ticket. |
| `notes`           | Text      | Optional     |                                                  |

---

### **4. State: `IN_PROCESS` (Action: Start Maintenance)**

The technician begins the maintenance work on the item.

**Action: `start_maintenance`**

- **Endpoint:** `POST /api/tickets/{id}/action`
- **Purpose:** To log the start of maintenance work.
- **Resulting State:** Stays `IN_PROCESS`.
- **Core Logic:**
  - Logs the maintenance start in the ticket's history with notes containing "بدأت" (started).
  - Creates an IN_PROCESS → IN_PROCESS history entry (status remains the same).
  - **No stock changes** at this stage.
- **Available Actions After:**
  - After `start_maintenance` is called, `complete_maintenance` becomes available.
  - The system detects maintenance has started by finding the most recent IN_PROCESS → IN_PROCESS entry with "بدأت" in the notes.

| Input Field | Data Type | Requirement  | Logic / Notes                                                                        |
| :---------- | :-------- | :----------- | :----------------------------------------------------------------------------------- |
| `action`    | String    | **Required** | Must be `"start_maintenance"`.                                                       |
| `user_id`   | String    | **Required** | ID of the user starting maintenance.                                                 |
| `notes`     | Text      | Optional     | Additional notes about the maintenance. Defaults to "بدأت الصيانة." if not provided. |

---

### **5. State: `IN_PROCESS` (Action: Complete Maintenance)**

The repair is finished and items are documented with automatic stock impact.

**Action: `complete_maintenance`**

- **Endpoint:** `POST /api/tickets/{id}/action`
- **Purpose:** To conclude the repair, record maintenance work, and update stock levels.
- **Resulting State:** Stays `IN_PROCESS`.
- **Core Logic:**
  - Processes items array and updates stock levels automatically.
  - Creates service_items records for documentation.
  - Updates stock quantities based on item direction and condition.
  - Creates stock movements (SEND/RECEIVE) linked to the ticket.
  - Logs completion in ticket history with notes containing "اكتملت" (completed) and stock summary.
  - Creates an IN_PROCESS → IN_PROCESS history entry (status remains the same).
- **Available Actions After:**
  - After `complete_maintenance` is called, `mark_ready` becomes available.
  - The system detects maintenance is completed by finding the most recent IN_PROCESS → IN_PROCESS entry with "اكتملت" in the notes.
- **Prerequisites:**
  - Must call `start_maintenance` first before `complete_maintenance` is available.

| Input Field       | Data Type | Requirement  | Logic / Notes                                |
| :---------------- | :-------- | :----------- | :------------------------------------------- |
| `action`          | String    | **Required** | Must be `"complete_maintenance"`.            |
| `user_id`         | String    | **Required** | ID of the user completing the work.          |
| `items`           | Array     | **Required** | Array of items processed during maintenance. |
| `notes`           | Text      | Optional     | Additional notes.                            |
| `cost_adjustment` | Decimal   | Optional     | Cost adjustment for the service.             |

**`items` Array Format:**

```json
"items": [
  {
    "item_id": 10,
    "quantity": 1,
    "direction": "SEND",
    "condition": "valid"
  },
  {
    "item_id": 12,
    "quantity": 1,
    "direction": "RECEIVE",
    "condition": "valid"
  }
]
```

**Direction Types:**

- `SEND`: Parts used/consumed during maintenance
- `RECEIVE`: Parts received/repaired during maintenance

**Stock Impact:**

- **SEND Items (Parts Used):**
  - Validates stock availability before processing (prevents negative available stock)
  - Decreases `quantity_on_hand` by the quantity
  - Creates a `SEND` stock movement linked to the ticket
  - Movement type: `SEND`, reference_type: `service_ticket`, reference_id: ticket_id

- **RECEIVE Items (Parts Received/Repaired):**
  - If `condition='valid'`: Increases `quantity_on_hand` by the quantity
  - If `condition='damaged'`: Increases `quantity_damaged` by the quantity
  - Creates a `RECEIVE` stock movement linked to the ticket
  - Movement type: `RECEIVE`, reference_type: `service_ticket`, reference_id: ticket_id

**Stock Movement Details:**

- All stock movements are automatically logged to `stock_movements` table
- Movements are linked to the maintenance ticket via `reference_type='service_ticket'` and `reference_id=ticket_id`
- Movement notes include context: "صيانة: قطع مستخدمة" (maintenance: parts used) or "صيانة: قطع مستلمة" (maintenance: parts received)
- Condition field is preserved in movement records
- Stock summary is automatically added to ticket history notes

**Example Stock Operations:**

```json
{
  "items": [
    {
      "item_id": 10,
      "quantity": 2,
      "direction": "SEND",
      "condition": "valid"
    },
    {
      "item_id": 12,
      "quantity": 1,
      "direction": "RECEIVE",
      "condition": "valid"
    }
  ]
}
```

This will:
- Decrease stock for item_id 10 by 2 units (quantity_on_hand decreases)
- Create SEND movement for item_id 10
- Increase stock for item_id 12 by 1 unit (quantity_on_hand increases)
- Create RECEIVE movement for item_id 12
- All movements linked to the maintenance ticket

**Note:** After completing maintenance, use `mark_ready` action to set tracking and move to READY_FOR_DISPATCH.

---

### **6. State: `IN_PROCESS` → `READY_FOR_DISPATCH`**

The repaired item is ready to be shipped with tracking number.

**Action: `mark_ready`**

- **Endpoint:** `POST /api/tickets/{id}/action`
- **Purpose:** To set tracking number and mark ticket as ready for dispatch.
- **Resulting State:** `READY_FOR_DISPATCH`
- **Core Logic:**
  - Sets `new_tracking_send` field with outbound tracking number.
  - Moves ticket to READY_FOR_DISPATCH status.
  - **NO stock impact** - maintenance tickets do not affect stock levels.

| Input Field         | Data Type | Requirement  | Logic / Notes                            |
| :------------------ | :-------- | :----------- | :--------------------------------------- |
| `action`            | String    | **Required** | Must be `"mark_ready"`.                  |
| `user_id`           | String    | **Required** | ID of the user marking ticket as ready.  |
| `new_tracking_send` | String    | **Required** | New tracking number for return shipment. |
| `notes`             | Text      | Optional     | Additional notes.                        |
| `cost_adjustment`   | Decimal   | Optional     | Cost adjustment for the service.         |

---

### **7. State: `READY_FOR_DISPATCH` → `SENT`**

The repaired item is shipped back to the customer.

**Action: `scan_outbound`**

- **Endpoint:** `POST /api/tickets/{id}/action`
- **Purpose:** To record the outbound shipment.
- **Resulting State:** `SENT`

| Input Field       | Data Type | Requirement  | Logic / Notes                     |
| :---------------- | :-------- | :----------- | :-------------------------------- |
| `action`          | String    | **Required** | Must be `"scan_outbound"`.        |
| `user_id`         | String    | **Required** | ID of the user.                   |
| `tracking_number` | String    | **Required** | The new outbound tracking number. |
| `notes`           | Text      | Optional     |                                   |

---

### **8. State: `SENT` → `COMPLETED`**

The customer has received their repaired item. The ticket is completed.

**Action: `mark_delivered`**

- **Endpoint:** `POST /api/tickets/{id}/action`
- **Purpose:** To confirm the delivery and complete the ticket.
- **Resulting State:** `COMPLETED`

| Input Field       | Data Type | Requirement  | Logic / Notes               |
| :---------------- | :-------- | :----------- | :-------------------------- |
| `action`          | String    | **Required** | Must be `"mark_delivered"`. |
| `user_id`         | String    | **Required** | ID of the user.             |
| `notes`           | Text      | Optional     |                             |
| `cost_adjustment` | Decimal   | Optional     | Adds to the existing value. |

---

### **Special Case: Cancellation**

Can be triggered from any state before `COMPLETED`.

**Action: `cancel`**

- **Endpoint:** `POST /api/tickets/{id}/cancel`
- **Purpose:** To cancel the ticket.
- **Resulting State:** `CANCELLED`
- **Core Logic:** No stock impact since the new workflow doesn't use reservations.

| Input Field | Data Type | Requirement  | Logic / Notes                      |
| :---------- | :-------- | :----------- | :--------------------------------- |
| `user_id`   | String    | **Required** | ID of the cancelling user.         |
| `reason`    | Text      | Optional     | Defaults to `"Cancelled by user."` |

---

### **Manual Stock Adjustments (Optional)**

While `complete_maintenance` automatically handles stock changes for SEND and RECEIVE items, you can still use manual stock adjustments for additional corrections or adjustments not captured during maintenance completion.

**Endpoint:** `POST /api/stock/manual`

| Input Field | Data Type | Requirement  | Logic / Notes                                |
| :---------- | :-------- | :----------- | :------------------------------------------- |
| `sku`       | String    | **Required** | SKU of the item to adjust.                   |
| `quantity`  | Integer   | **Required** | Positive or negative quantity change.        |
| `condition` | String    | **Required** | Must be `"valid"` or `"damaged"`.            |
| `user_id`   | Integer   | **Required** | ID of the user making the adjustment.        |
| `ticket_id` | Integer   | Optional     | **Link to maintenance ticket for tracking.** |
| `notes`     | Text      | Optional     | Additional notes about the adjustment.       |

**Note:** Manual stock adjustments create `MANUAL` movement types, while `complete_maintenance` creates `SEND` and `RECEIVE` movement types. Use manual adjustments for corrections or additional tracking beyond the standard maintenance workflow.
