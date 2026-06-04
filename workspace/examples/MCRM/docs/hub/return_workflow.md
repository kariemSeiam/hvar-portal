# Mini-Doc: Return Service Workflow

**Version:** 1.0 (Based on code analysis)
**Service Type:** `return`

This document outlines the complete lifecycle of a return ticket, detailing every state, action, and valid input, derived directly from the application's source code.

---

### **1. State: (Start) → PENDING**

A customer's request to return an item is registered.

**Action: `create`**

- **Endpoint:** `POST /api/tickets/create`
- **Purpose:** To create a new return ticket and log the customer's request.
- **Resulting State:** `PENDING`

| Input Field         | Data Type | Requirement  | Logic / Notes                                                                                     |
| :------------------ | :-------- | :----------- | :------------------------------------------------------------------------------------------------ |
| `type`              | String    | **Required** | Must be `"return"`.                                                                               |
| `user_id`           | String    | **Required** | ID of the user creating the ticket.                                                               |
| `customer_id`       | Integer   | Optional     | ID of an existing customer.                                                                       |
| `name`              | String    | Conditional  | **Required** if `customer_id` is not provided.                                                    |
| `phone`             | String    | Conditional  | **Required** if `customer_id` is not provided.                                                    |
| `original_tracking` | String    | Optional     | Tracking number of the original order being returned.                                             |
| `items`             | Array     | Optional     | Can specify the items being returned at creation.                                                 |
| ...                 | ...       | Optional     | Other fields like `notes`, `priority`, `reason`, `cost_adjustment`, and customer address details. |

---

### **2. State: `PENDING` → `CONFIRMED`**

The return request is approved, and the customer is instructed to send the item.

**Action: `confirm`**

- **Endpoint:** `POST /api/tickets/{id}/action`
- **Purpose:** To formally approve the return request.
- **Resulting State:** `CONFIRMED`
- **Stock Impact:** None at this stage.

| Input Field            | Data Type | Requirement  | Logic / Notes                                                             |
| :--------------------- | :-------- | :----------- | :------------------------------------------------------------------------ |
| `action`               | String    | **Required** | Must be `"confirm"`.                                                      |
| `user_id`              | String    | **Required** | ID of the confirming user.                                                |
| `new_tracking_receive` | String    | Optional     | The tracking number for the inbound shipment from the customer.           |
| `items`                | Array     | Optional     | Can be used to log or update the specific items being returned.           |
| ...                    | ...       | Optional     | Other fields like `notes`, `cost_adjustment`, and customer phone numbers. |

---

### **3. State: `CONFIRMED` → `IN_PROCESS`**

The customer's returned item has arrived at the hub for inspection.

**Action: `scan_inbound`**

- **Endpoint:** `POST /api/tickets/{id}/action`
- **Purpose:** To log the receipt of the customer's returned item.
- **Resulting State:** `IN_PROCESS`
- **Core Logic:**
  - Specifically checks if `service_type` is `return` and status is `CONFIRMED`.
  - Logs an `INBOUND_FROM_CUSTOMER` scan event.

| Input Field       | Data Type | Requirement  | Logic / Notes                                    |
| :---------------- | :-------- | :----------- | :----------------------------------------------- |
| `action`          | String    | **Required** | Must be `"scan_inbound"`.                        |
| `user_id`         | String    | **Required** | ID of the user scanning the package.             |
| `tracking_number` | String    | **Required** | Must match `new_tracking_receive` on the ticket. |
| `notes`           | Text      | Optional     |                                                  |

---

### **4. State: `IN_PROCESS` → `COMPLETED`**

The returned item has been inspected, its condition recorded, and stock has been updated. This is the final step.

**Action: `validate_items`**

- **Endpoint:** `POST /api/tickets/{id}/action`
- **Purpose:** To record the condition of the returned item and process it back into inventory.
- **Resulting State:** `COMPLETED`
- **Core Logic:**
  - Validates state transition from `IN_PROCESS`.
  - Calls `stock_manager.process_return()` which **increases `quantity_on_hand`** for `"valid"` items and **`quantity_damaged`** for `"damaged"` items.
  - Logs a `RECEIVE` movement in `stock_movements`.

| Input Field        | Data Type | Requirement  | Logic / Notes                                     |
| :----------------- | :-------- | :----------- | :------------------------------------------------ |
| `action`           | String    | **Required** | Must be `"validate_items"`.                       |
| `user_id`          | String    | **Required** | ID of the validating user.                        |
| `item_validations` | Array     | **Required** | Array specifying the condition of returned items. |
| `cost_adjustment`  | Decimal   | Optional     | Adds to the existing value (e.g., for a refund).  |
| `notes`            | Text      | Optional     |                                                   |

**`item_validations` Array Format:**

```json
"item_validations": [
  { "item_id": 3, "quantity": 1, "condition": "valid" }
]
```

---

### **Special Case: Cancellation**

Can be triggered from any state before `COMPLETED`.

**Action: `cancel`**

- **Endpoint:** `POST /api/tickets/{id}/cancel`
- **Purpose:** To cancel the return request.
- **Resulting State:** `CANCELLED`
- **Stock Impact:** None, as no stock was ever reserved.

| Input Field | Data Type | Requirement  | Logic / Notes                      |
| :---------- | :-------- | :----------- | :--------------------------------- |
| `user_id`   | String    | **Required** | ID of the cancelling user.         |
| `reason`    | Text      | Optional     | Defaults to `"Cancelled by user."` |
