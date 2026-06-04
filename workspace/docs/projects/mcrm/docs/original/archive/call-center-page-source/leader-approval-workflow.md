# Leader Approval Workflow - Call Center

## Table of Contents
1. [Overview](#leader-approval-overview)
2. [Review Queue](#leader-review-queue)
3. [Review Process](#review-process)
4. [Approval Action](#approval-action)
5. [Rejection Action](#rejection-action)
6. [Request More Info](#request-more-info)
7. [Post-Approval Workflow](#post-approval-workflow)
8. [Quality Checks](#quality-checks)
9. [Error Handling](#error-handling)
10. [API Reference](#api-reference)

---

## Leader Approval Overview

### Purpose
Quality control gateway before service ticket creation. Team Leaders review and approve orders that have been verified by call center agents.

### Who
- **Team Leaders** (`role = 'team_leader'`)
- Have authority to approve, reject, or request more information
- Responsible for final quality check before ticket creation

### When
After agent verification:
- **Pending Orders**: Customer not yet contacted
- **Confirmed Orders**: Customer contacted and verified

### Scope
All service types:
- **R** - Replacement (استبدال)
- **M** - Maintenance (صيانة)
- **T** - Return (إرجاع)
- **S** - Sell (بيع)

### Order Sources
- **ERP System**: Direct orders from enterprise system
- **Bosta Integration**: Delivery orders requiring service
- **Direct Entry**: Manual orders from call center

---

## Leader Review Queue

### Accessing the Queue

```
GET /api/call-center/pending
```

### Response Structure

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "order_number": "DR2025/00123",
      "customer": {
        "id": 456,
        "name": "محمد أحمد محمد",
        "phone": "01012345678"
      },
      "source": "bosta",
      "source_type": 10,
      "status": "confirmed",
      "service_type": "R",
      "items": [
        {
          "id": 1,
          "part_number": "MTR-001",
          "name": "محرك رئيسي",
          "quantity": 1
        }
      ],
      "notes": "تم التواصل مع العميل وتأكيد الطلب",
      "call_history": [
        {
          "id": 789,
          "created_at": "2025-10-20T14:30:00",
          "duration": 180,
          "status": "confirmed",
          "agent_notes": "العميل متاح للتسليم غداً"
        }
      ],
      "created_by": {
        "id": 5,
        "name": "أحمد علي"
      },
      "created_at": "2025-10-20T14:15:00",
      "approved_by": null,
      "approved_at": null
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20
  }
}
```

### Queue Filtering

Orders returned match these criteria:
- `status IN ('pending', 'confirmed')` - Awaiting approval
- `approved_by IS NULL` - Not yet reviewed
- Sorted by `created_at DESC` - Newest first

### Queue Display Options

**Filter by Source:**
- All Sources
- ERP Only
- Bosta Only
- Direct Entry Only

**Filter by Service Type:**
- All Types
- Replacement (R)
- Maintenance (M)
- Return (T)
- Sell (S)

**Filter by Status:**
- Pending (غير مؤكد)
- Confirmed (مؤكد)

**Sort Options:**
- Newest First (الأحدث أولاً)
- Oldest First (الأقدم أولاً)
- High Priority First (الأولوية العالية)

---

## Review Process

### Leader Review Screen

```
┌───────────────────────────────────────────────────────────────┐
│                    قائد الفريق - مراجعة الطلبات              │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Order: DR2025/00123                                   │ │
│  │  Status: ⏳ Pending Confirmation                       │ │
│  │  Source: 🚚 Bosta (Type 10)                            │ │
│  │  Created: 2025-10-20 14:15                             │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │                                                          │ │
│  │  👤 معلومات العميل                                       │ │
│  │  ────────────────────────────────────────────────────  │ │
│  │  الاسم:    محمد أحمد محمد                               │ │
│  │  الهاتف:   01012345678                                   │ │
│  │  العنوان:  شارع الجيش، القاهرة                          │ │
│  │                                                          │ │
│  │  🔧 نوع الخدمة                                          │ │
│  │  ────────────────────────────────────────────────────  │ │
│  │  R - استبدال (Replacement)                             │ │
│  │                                                          │ │
│  │  📦 القطع                                               │ │
│  │  ────────────────────────────────────────────────────  │ │
│  │  • محرك رئيسي (MTR-001)              x1                │ │
│  │  • لوحة تحكم (CTL-002)                 x1                │ │
│  │                                                          │ │
│  │  📝 ملاحظات الوكيل                                     │ │
│  │  ────────────────────────────────────────────────────  │ │
│  │  تم التواصل مع العميل عبر الهاتف:                        │ │
│  │  • أكد استلام المنتج التالف                             │ │
│  │  • يريد استبدال بنفس الموديل                           │ │
│  │  • متاح للاستلام غداً من 9 صباحاً                       │ │
│  │                                                          │ │
│  │  📞 سجل المكالمات                                       │ │
│  │  ────────────────────────────────────────────────────  │ │
│  │  2025-10-20 14:30 - مكالمة تأكيد (3 دقائق)            │ │
│  │  → الوكيل: أحمد علي                                     │ │
│  │  → النتيجة: مؤكد                                       │ │
│  │  → ملاحظات: العميل متاح غداً للاستلام                  │ │
│  │                                                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  [📋 عرض التفاصيل الكاملة] [🔍 البحث في السجلات]            │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  إجراءات المراجعة                                       │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │  [✅ اعتماد وإنشاء تذكرة الخدمة]                        │ │
│  │  [❌ رفض - إعادة للوكيل]                                │ │
│  │  [❓ طلب معلومات إضافية]                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Review Checklist

Before approval, leader should verify:

**Customer Information:**
- [ ] Name is correct and complete
- [ ] Phone number is valid Egyptian format
- [ ] Address is accurate (if applicable)
- [ ] Customer exists in database

**Service Details:**
- [ ] Service type is appropriate for the case
- [ ] Items are accurate and valid
- [ ] Quantities are correct
- [ ] Part numbers match stock records

**Agent Work:**
- [ ] Customer was contacted (if confirmed)
- [ ] Notes are clear and complete
- [ ] Call history is documented
- [ ] All required fields are filled

**Quality Checks:**
- [ ] No duplicate orders exist
- [ ] Stock availability (if replacement)
- [ ] Delivery details set (if needed)
- [ ] Special requirements noted

---

## Approval Action

### User Action

```
Leader clicks [✅ اعتماد وإنشاء تذكرة الخدمة]
```

### API Call

```
POST /api/call-center/orders/{id}/leader-approve
```

### Request Body

```json
{
  "leader_notes": "تم المراجعة والاعتماد - جميع البيانات صحيحة",
  "override_stock": false
}
```

### Backend Validation

```python
# Backend checks in order_api.py

def leader_approve_order(order_id, leader_user_id, notes=None):
    """
    Approve a pending/confirmed order and create service ticket

    Args:
        order_id: Order to approve
        leader_user_id: Team leader user ID
        notes: Optional approval notes

    Returns:
        dict: Created ticket information

    Raises:
        ValidationError: If order cannot be approved
    """
    order = get_order_by_id(order_id)

    # Validation checks
    if order.status not in ['pending', 'confirmed']:
        raise ValidationError("Order must be pending or confirmed")

    if not order.service_type:
        raise ValidationError("Service type must be set before approval")

    if not order.customer_id:
        raise ValidationError("Customer must be set before approval")

    # Verify user is team leader
    user = get_user_by_id(leader_user_id)
    if user.role != 'team_leader':
        raise PermissionError("Only team leaders can approve orders")

    # Generate ticket number
    ticket_number = generate_ticket_number(order.service_type)

    # Create service ticket
    ticket_data = {
        'ticket_number': ticket_number,
        'customer_id': order.customer_id,
        'service_type': order.service_type,
        'status': 'PENDING',
        'created_by': leader_user_id,
        'source_order_id': order.id
    }

    # Copy items if applicable
    if order.service_type in ['R', 'S']:  # Replacement and Sell
        ticket_data['items'] = copy_items_from_order(order)

    ticket = create_service_ticket(ticket_data)

    # Update order
    update_order(order_id, {
        'status': 'converted',
        'approved_by': leader_user_id,
        'approved_at': datetime.now(),
        'converted_to_ticket_id': ticket.id,
        'leader_notes': notes
    })

    return {
        'order_id': order_id,
        'ticket_id': ticket.id,
        'ticket_number': ticket_number,
        'status': 'approved'
    }
```

### Ticket Number Generation

```python
def generate_ticket_number(service_type):
    """
    Generate service ticket number

    Format: HV{TYPE}{YYMMDD}{SEQ}
    Example: HVR251020001

    Args:
        service_type: R, M, T, or S

    Returns:
        str: Generated ticket number
    """
    date_str = datetime.now().strftime('%y%m%d')
    prefix = f"HV{service_type}"

    # Get next sequence for today
    seq = get_next_sequence(prefix, date_str)

    return f"{prefix}{date_str}{seq:03d}"
```

### Response

```json
{
  "success": true,
  "message": "تم إنشاء تذكرة الخدمة بنجاح",
  "data": {
    "order_id": 123,
    "ticket_id": 456,
    "ticket_number": "HVR251020001",
    "status": "approved",
    "created_at": "2025-10-20T15:00:00"
  }
}
```

### Frontend Handling

```javascript
// After successful approval
const handleApprove = async (orderId, notes) => {
  const response = await leaderApproveOrder(orderId, { leader_notes: notes });

  if (response.success) {
    // Show success message
    showToast({
      type: 'success',
      message: `تم إنشاء تذكرة: ${response.data.ticket_number}`
    });

    // Navigate to ticket details
    navigate(`/tickets/${response.data.ticket_id}`);

    // Refresh queue
    fetchPendingOrders();
  }
};
```

---

## Rejection Action

### User Action

```
Leader clicks [❌ رفض - إعادة للوكيل]
```

### Rejection Reason Modal

```
┌─────────────────────────────────────────┐
│  🚫 رفض الطلب - طلب السبب             │
├─────────────────────────────────────────┤
│                                         │
│  يرجى تحديد سبب الرفض:                 │
│                                         │
│  ○ بيانات ناقصة                        │
│  ○ معلومات العميل غير صحيحة            │
│  ○ القطع غير محددة                     │
│  ○ نوع الخدمة غير مناسب                │
│  ○ طلب مكرر                            │
│  ○ يحتاج اتصال إضافي بالعميل           │
│  ○ سبب آخر                             │
│                                         │
│  ملاحظات إضافية:                       │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [إلغاء] [تأكيد الرفض]                 │
│                                         │
└─────────────────────────────────────────┘
```

### API Call

```
POST /api/call-center/orders/{id}/reject
```

### Request Body

```json
{
  "rejection_reason": "بيانات ناقصة",
  "rejection_notes": "رقم الهاتف غير صحيح - يرجى التواصل مع العميل",
  "return_to_agent_id": 5
}
```

### Backend Processing

```python
def reject_order(order_id, rejection_data):
    """
    Reject order and return to agent for correction

    Args:
        order_id: Order to reject
        rejection_data: Reason and notes
    """
    order = get_order_by_id(order_id)

    # Update order status
    update_order(order_id, {
        'status': 'draft',
        'rejection_reason': rejection_data['rejection_reason'],
        'rejection_notes': rejection_data['rejection_notes'],
        'rejected_by': current_user.id,
        'rejected_at': datetime.now(),
        'return_to_agent_id': rejection_data.get('return_to_agent_id')
    })

    # Notify agent
    if rejection_data.get('return_to_agent_id'):
        create_notification({
            'user_id': rejection_data['return_to_agent_id'],
            'type': 'order_rejected',
            'title': 'تم رفض الطلب',
            'message': f'الطلب {order.order_number} يحتاج تعديلات',
            'link': f'/call-center/orders/{order_id}'
        })

    return {'success': True, 'status': 'rejected'}
```

### Response

```json
{
  "success": true,
  "message": "تم رفض الطلب وإعادته للوكيل",
  "data": {
    "order_id": 123,
    "status": "draft",
    "rejection_reason": "بيانات ناقصة"
  }
}
```

### Agent Workflow After Rejection

```
Order returns to Draft (مسودة)
  ↓
Agent sees rejection notification
  ↓
Agent can:
  ├── Fix identified issues
  ├── Update customer information
  ├── Add missing items
  ├── Change service type
  ├── Contact customer again
  └── Resubmit for approval
  ↓
Order returns to Pending Queue
  ↓
Leader reviews again
```

---

## Request More Info

### User Action

```
Leader clicks [❓ طلب معلومات إضافية]
```

### Request Info Modal

```
┌─────────────────────────────────────────┐
│  ❓ طلب معلومات إضافية                 │
├─────────────────────────────────────────┤
│                                         │
│  تعيين إلى الوكيل:                     │
│  ┌─────────────────────────────────┐   │
│  │ أحمد علي (أونلاين)      ▼      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  الرسالة / الملاحظات:                  │
│  ┌─────────────────────────────────┐   │
│  │ يرجى التأكد من عنوان التسليم   │   │
│  │ وموعد الاستلام المتاح           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  أولوية:                               │
│  ○ عادية                               │
│  ○ عالية                               │
│  ● عاجلة                               │
│                                         │
│  [إلغاء] [إرسال الطلب]                 │
│                                         │
└─────────────────────────────────────────┘
```

### API Call

```
POST /api/call-center/orders/{id}/request-info
```

### Request Body

```json
{
  "assigned_agent_id": 5,
  "message": "يرجى التأكد من عنوان التسليم وموعد الاستلام المتاح",
  "priority": "urgent",
  "requested_by": "team_leader"
}
```

### Backend Processing

```python
def request_order_info(order_id, request_data):
    """
    Request additional information from agent

    Args:
        order_id: Order needing info
        request_data: Assignment and message details
    """
    order = get_order_by_id(order_id)

    # Create info request record
    info_request = {
        'order_id': order_id,
        'requested_by': request_data['requested_by'],
        'assigned_to': request_data['assigned_agent_id'],
        'message': request_data['message'],
        'priority': request_data.get('priority', 'normal'),
        'status': 'pending',
        'created_at': datetime.now()
    }

    db.insert('info_requests', info_request)

    # Update order status
    update_order(order_id, {
        'status': 'info_requested',
        'info_request_id': info_request['id']
    })

    # Notify agent
    create_notification({
        'user_id': request_data['assigned_agent_id'],
        'type': 'info_request',
        'title': 'طلب معلومات إضافية',
        'message': request_data['message'],
        'priority': request_data.get('priority'),
        'link': f'/call-center/orders/{order_id}'
    })

    return {'success': True, 'request_id': info_request['id']}
```

### Agent Workflow After Info Request

```
Agent receives notification
  ↓
Agent opens order
  ↓
Sees leader's request
  ↓
Agent can:
  ├── Add requested information
  ├── Update order details
  ├── Contact customer for missing info
  ├── Add notes to clarify
  └── Submit for re-review
  ↓
Order returns to Pending Queue
```

---

## Post-Approval Workflow

### Ticket Creation Flow

```
Leader Approval
  ↓
Service Ticket Created (status='PENDING')
  ↓
Ticket enters Service System
  ↓
Normal Service Workflow:
  PENDING (في الانتظار)
    ↓
  CONFIRMED (مؤكدة)
    ↓
  IN_PROCESS (قيد المعالجة)
    ↓
  COMPLETED (مكتمل)
```

### Order Status After Approval

```
Order status = 'converted'
  ↓
Order changes:
  ├── No longer in active queues
  ├── Becomes read-only reference
  ├── Linked via converted_to_ticket_id
  └── Archived for history
```

### Ticket-Order Relationship

```javascript
// Ticket data structure
{
  "id": 456,
  "ticket_number": "HVR251020001",
  "source_order_id": 123,        // Links back to original order
  "source_order_number": "DR2025/00123",
  "customer_id": 789,
  "service_type": "R",
  "status": "PENDING",
  "created_by": 10,              // Leader who approved
  "created_at": "2025-10-20T15:00:00"
}

// Order data structure
{
  "id": 123,
  "order_number": "DR2025/00123",
  "status": "converted",
  "converted_to_ticket_id": 456,  // Links to created ticket
  "converted_to_ticket_number": "HVR251020001",
  "approved_by": 10,
  "approved_at": "2025-10-20T15:00:00"
}
```

### Viewing Converted Orders

```
Leaders can still view converted orders:
  ↓
GET /api/call-center/orders/{id}?include=converted_ticket
  ↓
Returns both order and ticket data
  ↓
Displays:
  ├── Original order details (read-only)
  ├── Created ticket information
  ├── Link to ticket in service system
  └── Approval history
```

---

## Quality Checks

### Pre-Approval Checklist

**Customer Information ✓**
- [ ] Name is complete and accurate
- [ ] Phone number is valid Egyptian format (01xxxxxxxxx)
- [ ] Address is complete (if delivery needed)
- [ ] Customer record exists in database
- [ ] No duplicate customer records

**Service Details ✓**
- [ ] Service type is appropriate
  - Replacement (R): Defective part needs replacement
  - Maintenance (M): Repair needed
  - Return (T): Product return
  - Sell (S): New sale
- [ ] Items are accurate
- [ ] Part numbers are valid
- [ ] Quantities are correct
- [ ] Items match customer request

**Agent Verification ✓**
- [ ] Customer was contacted (for confirmed orders)
- [ ] Call was documented
- [ ] Notes are clear
- [ ] All required fields filled
- [ ] Timeline is realistic

**Delivery Details ✓**
- [ ] Delivery address set (if applicable)
- [ ] Available date/time confirmed
- [ ] Special requirements noted
- [ ] Contact phone verified

**Quality Assurance ✓**
- [ ] No duplicate orders exist
- [ ] Stock available (if replacement)
- [ ] No conflicting orders
- [ ] Pricing is correct (if sell)
- [ ] Special cases noted

### Common Issues to Check

**Duplicate Detection:**
```javascript
// Check for similar recent orders
function checkForDuplicates(order) {
  const duplicates = await api.get('/api/call-center/check-duplicates', {
    customer_phone: order.customer.phone,
    service_type: order.service_type,
    days: 30  // Check last 30 days
  });

  if (duplicates.length > 0) {
    showWarning(`يوجد ${duplicates.length} طلبات مشابهة للعميل`);
    displayDuplicates(duplicates);
  }
}
```

**Stock Verification:**
```javascript
// Check stock before approving replacement
function verifyStockAvailability(items) {
  const unavailable = items.filter(item => {
    return item.stock_quantity < item.quantity;
  });

  if (unavailable.length > 0) {
    showError(`القطع التالية غير متوفرة: ${unavailable.map(i => i.name).join(', ')}`);
    return false;
  }
  return true;
}
```

---

## Error Handling

### Common Error Scenarios

**1. Missing Service Type**
```
Error: Service type must be set before approval
Cause: Agent didn't select R/M/T/S
Action: Return to agent with message
```

**2. Invalid Customer**
```
Error: Customer information incomplete
Cause: Phone number invalid or customer not found
Action: Request correction from agent
```

**3. Duplicate Ticket**
```
Error: Similar ticket already exists
Cause: Duplicate order detection
Action: Show duplicates to leader for decision
```

**4. Stock Not Available**
```
Error: Requested items out of stock
Cause: Replacement item not in inventory
Action: Show stock status, allow override or reject
```

**5. Invalid Items**
```
Error: Part number not found in catalog
Cause: Wrong or obsolete part number
Action: Request correction from agent
```

### Error Response Format

```json
{
  "success": false,
  "error": "SERVICE_TYPE_REQUIRED",
  "message": "نوع الخدمة مطلوب",
  "details": {
    "field": "service_type",
    "allowed_values": ["R", "M", "T", "S"]
  },
  "suggestions": [
    "تواصل مع الوكيل لتحديد نوع الخدمة",
    "راجع تفاصيل الطلب مع العميل"
  ]
}
```

### Error Handling UI

```
┌─────────────────────────────────────────┐
│  ⚠️ لا يمكن اعتماد هذا الطلب           │
├─────────────────────────────────────────┤
│                                         │
│  المشكلة:                               │
│  نوع الخدمة غير محدد                     │
│                                         │
│  الإجراءات المطلوبة:                    │
│  1. تواصل مع الوكيل: أحمد علي           │
│  2. حدد نوع الخدمة المناسب               │
│  3. تأكد من تفاصيل القطع                │
│                                         │
│  [إغلاق] [اتصال بالوكيل]               │
│                                         │
└─────────────────────────────────────────┘
```

---

## API Reference

### Get Pending Orders

```
GET /api/call-center/pending
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `source` (optional): erp, bosta, direct
- `service_type` (optional): R, M, T, S
- `status` (optional): pending, confirmed
- `sort` (default): created_at_desc

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

### Approve Order

```
POST /api/call-center/orders/{id}/leader-approve
```

**Request Body:**
```json
{
  "leader_notes": "string (optional)",
  "override_stock": "boolean (default: false)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_id": 123,
    "ticket_id": 456,
    "ticket_number": "HVR251020001"
  }
}
```

### Reject Order

```
POST /api/call-center/orders/{id}/reject
```

**Request Body:**
```json
{
  "rejection_reason": "string",
  "rejection_notes": "string (optional)",
  "return_to_agent_id": "number (optional)"
}
```

### Request Info

```
POST /api/call-center/orders/{id}/request-info
```

**Request Body:**
```json
{
  "assigned_agent_id": "number",
  "message": "string",
  "priority": "normal|high|urgent"
}
```

### Check Duplicates

```
GET /api/call-center/check-duplicates
```

**Query Parameters:**
- `customer_phone` (required)
- `service_type` (optional)
- `days` (default: 30)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "order_id": 100,
      "order_number": "DR2025/00100",
      "ticket_number": "HVR251015001",
      "created_at": "2025-10-15T10:00:00",
      "status": "converted"
    }
  ]
}
```

### Get Order Details

```
GET /api/call-center/orders/{id}
```

**Query Parameters:**
- `include` (optional): converted_ticket, call_history

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {...},
    "converted_ticket": {...},
    "call_history": [...]
  }
}
```

---

## Best Practices

### For Team Leaders

1. **Review Thoroughly**
   - Check all required fields
   - Verify customer information
   - Validate service type selection
   - Review agent notes

2. **Communicate Clearly**
   - Provide specific rejection reasons
   - Give actionable feedback to agents
   - Document approval decisions

3. **Prioritize Orders**
   - Handle urgent requests first
   - Consider customer impact
   - Balance quality with speed

4. **Monitor Patterns**
   - Track common errors
   - Identify training needs
   - Suggest process improvements

### For Call Center Agents

1. **Complete Verification**
   - Contact customer before confirming
   - Document all interactions
   - Gather complete information

2. **Clear Notes**
   - Write specific, actionable notes
   - Include customer preferences
   - Note any special requirements

3. **Accurate Data**
   - Verify phone numbers
   - Confirm part numbers
   - Double-check quantities

4. **Proper Categorization**
   - Select correct service type
   - Choose appropriate source
   - Set realistic timelines

---

## Troubleshooting

### Common Issues

**Order not showing in pending queue**
- Check order status is 'pending' or 'confirmed'
- Verify approved_by is NULL
- Ensure proper filtering

**Cannot approve order**
- Verify service_type is set
- Check customer_id exists
- Confirm user is team_leader

**Ticket number generation fails**
- Check sequence table
- Verify date format
- Check for concurrent approvals

**Agent not receiving rejection notification**
- Verify agent_id is valid
- Check notification system
- Ensure agent is active

---

## Summary

The Leader Approval Workflow ensures quality control before service ticket creation:

1. **Agents** verify orders and set service type
2. **Leaders** review pending orders in queue
3. **Leaders** can approve, reject, or request info
4. **Approved** orders become service tickets
5. **Rejected** orders return to agents for correction
6. **Info requests** allow clarification before decision

This workflow maintains service quality while providing clear escalation paths and feedback mechanisms.
