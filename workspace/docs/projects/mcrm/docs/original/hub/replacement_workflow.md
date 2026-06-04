# Mini-Doc: Replacement Service Workflow

**Version:** 1.0 (Based on code analysis)
**Service Type:** `replacement`

This document outlines the complete lifecycle of a replacement ticket, detailing every state, action, and valid input, derived directly from the application's source code.

---

### **1. State: (Start) → PENDING**

The ticket is created and awaits confirmation.

**Action: `create`**

- **Endpoint:** `POST /api/tickets/create`
- **Purpose:** To create a new replacement ticket and (optionally) a new customer record.
- **Resulting State:** `PENDING`

| Input Field         | Data Type | Requirement  | Logic / Notes                                             |
| :------------------ | :-------- | :----------- | :-------------------------------------------------------- |
| `type`              | String    | **Required** | Must be `"replacement"`.                                  |
| `user_id`           | String    | **Required** | ID of the user creating the ticket.                       |
| `items`             | Array     | **Required** | Array of items to be sent and received. See format below. |
| `customer_id`       | Integer   | Optional     | ID of an existing customer.                               |
| `name`              | String    | Conditional  | **Required** if `customer_id` is not provided.            |
| `phone`             | String    | Conditional  | **Required** if `customer_id` is not provided.            |
| `phone_secondary`   | String    | Optional     |                                                           |
| `governorate`       | String    | Optional     | Sets customer address.                                    |
| `city`              | String    | Optional     | Sets customer address.                                    |
| `address_details`   | Text      | Optional     | Sets customer address.                                    |
| `priority`          | String    | Optional     | Defaults to `"normal"`.                                   |
| `notes`             | Text      | Optional     |                                                           |
| `reason`            | Text      | Optional     |                                                           |
| `cost_adjustment`   | Decimal   | Optional     |                                                           |
| `original_tracking` | String    | Optional     | Must be unique across all tickets.                        |

**`items` Array Format:**

```json
"items": [
  { "item_id": 1, "quantity": 1, "direction": "send", "condition": "valid" },
  { "item_id": 2, "quantity": 1, "direction": "receive", "condition": "damaged" }
]
```

---

### **2. State: `PENDING` → `CONFIRMED`**

The ticket is approved, and inventory is reserved.

**Action: `confirm`**

- **Endpoint:** `POST /api/tickets/{id}/action`
- **Purpose:** To confirm the ticket, update any necessary details, and reserve stock.
- **Resulting State:** `CONFIRMED`
- **Core Logic:**
  - Validates state transition from `PENDING`.
  - **Calls `stock_manager.reserve_stock()`**, which increases `quantity_reserved` for all "send" items.
  - Updates customer and ticket fields as provided.

| Input Field            | Data Type | Requirement  | Logic / Notes                                             |
| :--------------------- | :-------- | :----------- | :-------------------------------------------------------- |
| `action`               | String    | **Required** | Must be `"confirm"`.                                      |
| `user_id`              | String    | **Required** | ID of the confirming user.                                |
| `new_tracking_send`    | String    | **Required** | Tracking number for the outbound shipment.                |
| `items`                | Array     | Optional     | **Replaces all existing items.** Use to correct mistakes. |
| `phone`                | String    | Optional     | Updates customer's primary phone.                         |
| `phone_secondary`      | String    | Optional     | Updates customer's secondary phone.                       |
| `governorate`          | String    | Optional     | Updates customer address.                                 |
| `city`                 | String    | Optional     | Updates customer address.                                 |
| `address_details`      | Text      | Optional     | Updates customer address.                                 |
| `new_tracking_receive` | String    | Optional     | Tracking for the inbound return.                          |
| `cost_adjustment`      | Decimal   | Optional     | Adds to the existing value.                               |
| `priority`             | String    | Optional     | Updates ticket priority.                                  |
| `reason`               | Text      | Optional     | Updates ticket reason.                                    |
| `original_tracking`    | String    | Optional     | Can be updated if not used elsewhere.                     |
| `notes`                | Text      | Optional     |                                                           |

---

### **3. State: `CONFIRMED` → `IN_PROCESS`**

The hub begins physical preparation of the package.

**Action: `start_preparation`**

- **Endpoint:** `POST /api/tickets/{id}/action`
- **Purpose:** To signal that the physical work of picking and packing has begun.
- **Resulting State:** `IN_PROCESS`

| Input Field       | Data Type | Requirement  | Logic / Notes                     |
| :---------------- | :-------- | :----------- | :-------------------------------- |
| `action`          | String    | **Required** | Must be `"start_preparation"`.    |
| `user_id`         | String    | **Required** | ID of the user starting the work. |
| `cost_adjustment` | Decimal   | Optional     | Adds to the existing value.       |
| `notes`           | Text      | Optional     |                                   |

---

### **4. State: `IN_PROCESS` → `READY_FOR_DISPATCH`**

The package is prepared and is waiting for courier pickup.

**Action: `ready_for_dispatch`**

- **Endpoint:** `POST /api/tickets/{id}/action`
- **Purpose:** To mark the package as complete and staged for shipment.
- **Resulting State:** `READY_FOR_DISPATCH`

| Input Field       | Data Type | Requirement  | Logic / Notes                   |
| :---------------- | :-------- | :----------- | :------------------------------ |
| `action`          | String    | **Required** | Must be `"ready_for_dispatch"`. |
| `user_id`         | String    | **Required** | ID of the user.                 |
| `cost_adjustment` | Decimal   | Optional     | Adds to the existing value.     |
| `notes`           | Text      | Optional     |                                 |

---

### **5. State: `READY_FOR_DISPATCH` → `SENT`**

The package has been handed to the courier and has left the hub.

**Action: `scan_outbound`**

- **Endpoint:** `POST /api/tickets/{id}/action`
- **Purpose:** To record the outbound scan and commit the stock reservation.
- **Resulting State:** `SENT`
- **Core Logic:**
  - Validates state transition from `READY_FOR_DISPATCH`.
  - **Calls `stock_manager.commit_reservation()`**, which **decreases `quantity_reserved` AND `quantity_on_hand`**.
  - Logs an `OUTBOUND_TO_CUSTOMER` scan event.

| Input Field       | Data Type | Requirement  | Logic / Notes                                           |
| :---------------- | :-------- | :----------- | :------------------------------------------------------ |
| `action`          | String    | **Required** | Must be `"scan_outbound"`.                              |
| `user_id`         | String    | **Required** | ID of the scanning user.                                |
| `tracking_number` | String    | **Required** | Must match the `new_tracking_send` value on the ticket. |
| `cost_adjustment` | Decimal   | Optional     | Adds to the existing value.                             |
| `notes`           | Text      | Optional     |                                                         |

---

### **6. State: `SENT` → `RETURNED`**

The return package has been received back in the hub.

**Action: `scan_inbound`**

- **Endpoint:** `POST /api/tickets/{id}/action`
- **Purpose:** To record the inbound scan of the return package.
- **Resulting State:** `RETURNED`
- **Core Logic:**
  - Validates state transition from `SENT`.
  - Logs an `INBOUND_FROM_CUSTOMER` scan event.

| Input Field       | Data Type | Requirement  | Logic / Notes                                   |
| :---------------- | :-------- | :----------- | :---------------------------------------------- |
| `action`          | String    | **Required** | Must be `"scan_inbound"`.                       |
| `user_id`         | String    | **Required** | ID of the scanning user.                        |
| `tracking_number` | String    | **Required** | Tracking number for the inbound return package. |
| `cost_adjustment` | Decimal   | Optional     | Adds to the existing value.                     |
| `notes`           | Text      | Optional     |                                                 |

---

### **7. State: `RETURNED` → `COMPLETED`**

The faulty item has been returned, inspected, and the ticket is closed.

**Action: `validate_items`**

- **Endpoint:** `POST /api/tickets/{id}/action`
- **Purpose:** To record the condition of returned items and update stock accordingly.
- **Resulting State:** `COMPLETED`
- **Core Logic:**
  - Validates state transition from `RETURNED`.
  - **Calls `stock_manager.process_return()`**, which increases `quantity_on_hand` for `"valid"` items and `quantity_damaged` for `"damaged"` items.
  - Logs a `RECEIVE` movement in `stock_movements`.

| Input Field        | Data Type | Requirement  | Logic / Notes                                     |
| :----------------- | :-------- | :----------- | :------------------------------------------------ |
| `action`           | String    | **Required** | Must be `"validate_items"`.                       |
| `user_id`          | String    | **Required** | ID of the validating user.                        |
| `item_validations` | Array     | **Required** | Array specifying the condition of returned items. |
| `cost_adjustment`  | Decimal   | Optional     | Adds to the existing value.                       |
| `notes`            | Text      | Optional     |                                                   |

**`item_validations` Array Format:**

```json
"item_validations": [
  { "item_id": 2, "quantity": 1, "condition": "damaged" }
]
```

---

### **Special Case: Cancellation**

Can be triggered from any state before `COMPLETED`.

**Action: `cancel`**

- **Endpoint:** `POST /api/tickets/{id}/cancel` (Legacy endpoint)
- **Purpose:** To cancel the ticket and release any reserved stock.
- **Resulting State:** `CANCELLED`
- **Core Logic:**
  - **Calls `stock_manager.cancel_reservation()`**, which **decreases `quantity_reserved` only**, making the stock available again.

| Input Field | Data Type | Requirement  | Logic / Notes                      |
| :---------- | :-------- | :----------- | :--------------------------------- |
| `user_id`   | String    | **Required** | ID of the cancelling user.         |
| `reason`    | Text      | Optional     | Defaults to `"Cancelled by user."` |
