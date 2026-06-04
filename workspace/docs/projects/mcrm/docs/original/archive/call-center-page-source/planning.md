# Call Center Page - Unified Implementation Plan

> Complete implementation plan for the unified call center order system integrating ERP drafts, Bosta orders, and direct orders into a single workflow.

## Project Status

### Current State
- **Frontend**: ~90% complete (UI and state management done)
- **Backend**: ~0% complete (no unified order system implemented)
- **Documentation**: Complete specification in this directory

### Vision
Transform the call center from a fragmented COD verification system into a unified order intake platform that handles:
- **ERP Draft Orders** → Traditional COD verification workflow
- **Bosta Orders** → E-commerce order processing
- **Direct Orders** → Manual order creation via phone
- **All Sources** → Unified leader approval and ticket creation

---

## Implementation Phases

### Phase 1: Backend Foundation (Week 1)

**Goal**: Create draft order system and database schema

#### 1.1 Database Migration

**File**: `app/migrations/add_call_center_unified_fields.py`

```python
# Add to orders table
ALTER TABLE orders ADD COLUMN service_type VARCHAR(20);
ALTER TABLE orders ADD COLUMN source VARCHAR(20);  -- 'erp', 'bosta', 'direct'
ALTER TABLE orders ADD COLUMN bosta_tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN bosta_order_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN approval_status VARCHAR(20);  -- 'draft', 'pending', 'approved', 'rejected'
ALTER TABLE orders ADD COLUMN leader_notes TEXT;
ALTER TABLE orders ADD COLUMN agent_notes TEXT;
ALTER TABLE orders ADD COLUMN quick_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN customer_confirmed_at DATETIME;

# Add indexes
CREATE INDEX idx_orders_source ON orders(source);
CREATE INDEX idx_orders_service_type ON orders(service_type);
CREATE INDEX idx_orders_approval_status ON orders(approval_status);
CREATE INDEX idx_orders_bosta_tracking ON orders(bosta_tracking_number);
```

**Tasks**:
- [ ] Create migration script
- [ ] Test on development database
- [ ] Document rollback procedure
- [ ] Plan data migration for existing orders

#### 1.2 Backend API - Draft Orders

**File**: `app/api/call_center_api.py`

**Endpoints**:
```python
# Draft Order Queue
GET  /api/call-center/drafts
    - Query params: source, date_from, date_to
    - Returns: List of draft orders with customer info

# Quick Accept Flow
POST /api/call-center/orders/<id>/quick-accept
    - Body: { notes, customer_confirmed }
    - Creates: Service ticket directly
    - Returns: Created ticket details

# Standard Confirm Flow
POST /api/call-center/orders/<id>/confirm-by-customer
    - Body: { items, notes, delivery_date }
    - Sets: customer_confirmed_at, approval_status = 'pending'
    - Returns: Updated order

# Call Outcomes
POST /api/call-center/orders/<id>/no-answer
    - Body: { scheduled_call_time }
    - Sets: next_action_at, increments attempt_count
    - Returns: Updated order

POST /api/call-center/orders/<id>/schedule
    - Body: { scheduled_date }
    - Sets: scheduled_for, approval_status = 'scheduled'
    - Returns: Updated order

POST /api/call-center/orders/<id>/cancel
    - Body: { reason_code, notes }
    - Sets: approval_status = 'canceled'
    - Returns: Updated order
```

**Tasks**:
- [ ] Implement GET /drafts endpoint
- [ ] Implement POST /quick-accept endpoint
- [ ] Implement POST /confirm-by-customer endpoint
- [ ] Implement POST /no-answer endpoint
- [ ] Implement POST /schedule endpoint
- [ ] Implement POST /cancel endpoint
- [ ] Add error handling and validation
- [ ] Add unit tests

#### 1.3 Backend API - Leader Approval

**Endpoints**:
```python
# Leader Review Queue
GET /api/call-center/pending
    - Query params: service_type, source, date_from, date_to
    - Returns: Orders awaiting approval

# Leader Actions
POST /api/call-center/orders/<id>/leader-approve
    - Body: { items, notes, service_type }
    - Creates: Service ticket
    - Sets: approval_status = 'approved'
    - Returns: Created ticket

POST /api/call-center/orders/<id>/reject
    - Body: { reason, notes }
    - Sets: approval_status = 'rejected'
    - Returns: Updated order

POST /api/call-center/orders/<id>/request-info
    - Body: { questions, notes }
    - Sets: leader_notes (questions for agent)
    - Returns: Updated order
```

**Tasks**:
- [ ] Implement GET /pending endpoint
- [ ] Implement POST /leader-approve endpoint
- [ ] Implement POST /reject endpoint
- [ ] Implement POST /request-info endpoint
- [ ] Add notification system for leader actions
- [ ] Add unit tests

#### 1.4 Service Manager Updates

**File**: `app/services/service_manager.py`

**New Functions**:
```python
def draft_order_to_ticket(order_id, service_type, items, notes):
    """Convert draft order to service ticket directly"""
    # Validates order is in correct state
    # Creates ticket based on service_type
    # Links order to ticket
    # Updates order status
    pass

def leader_approve_order(order_id, items, notes, service_type):
    """Leader approves and converts to ticket"""
    # Validates approval_status is 'pending'
    # Creates ticket with leader's modifications
    # Links order to ticket
    # Updates order to 'approved'
    pass

def create_ticket_from_order(order, service_type, items, agent_id):
    """Unified ticket creation from any order source"""
    # Handles all 4 service types
    # Preserves source metadata
    # Creates audit trail
    pass
```

**Updates**:
- [ ] Add draft_order_to_ticket function
- [ ] Add leader_approve_order function
- [ ] Update create_ticket to handle all 4 types
- [ ] Add source tracking to all tickets
- [ ] Add unit tests

**Deliverables**:
- Database migration script
- 10 new API endpoints
- Updated service_manager.py
- Unit tests for all new functions

---

### Phase 2: Frontend Updates (Week 2)

**Goal**: Update UI for unified order system

#### 2.1 CustomerServicePage Updates

**File**: `front/src/pages/CustomerServicePage.jsx`

**New Tabs**:
```javascript
const tabs = [
  { id: 'drafts', label: 'مسودة', count: draftsCount },      // Draft orders
  { id: 'pending', label: 'قيد المراجعة', count: pendingCount }, // Leader review
  { id: 'converted', label: 'محولة', count: convertedCount },  // Converted to tickets
  { id: 'scheduled', label: 'مجدولة', count: scheduledCount }, // Scheduled callbacks
];
```

**Updates**:
- [ ] Add "Drafts" tab (draft orders only)
- [ ] Add "Pending" tab (awaiting leader approval)
- [ ] Add "Converted" tab (archived converted orders)
- [ ] Update filter components for new states
- [ ] Add source filter (All/ERP/Bosta/Direct)
- [ ] Add service_type filter (All/Sell/Maintenance/Replacement/Return)

#### 2.2 DraftsQueue Component

**File**: `front/src/components/call-center/DraftsQueue.jsx`

**Features**:
```javascript
// Display draft orders only
<DraftsQueue>
  <QueueFilters>
    <SourceFilter />      {/* All/ERP/Bosta/Direct */}
    <ServiceTypeFilter /> {/* All/Sell/Maintenance/Replacement/Return */}
  </QueueFilters>

  <OrdersTable>
    <OrderRow>
      <SourceBadge />        {/* ERP/Bosta/Direct indicator */}
      <ServiceTypeBadge />    {/* Sell/Maintenance/etc */}
      <CustomerInfo />
      <OrderDetails />
      <Actions>
        <CallButton />
        <QuickAcceptButton /> {/* For ERP orders */}
        <ViewButton />
      </Actions>
    </OrderRow>
  </OrdersTable>
</DraftsQueue>
```

**Tasks**:
- [ ] Create DraftsQueue component
- [ ] Implement source badge display
- [ ] Implement service_type badge display
- [ ] Add Quick Accept button (ERP only)
- [ ] Add 7-day date filtering
- [ ] Add loading states
- [ ] Add error handling

#### 2.3 LeaderReviewQueue Component

**File**: `front/src/components/call-center/LeaderReviewQueue.jsx`

**Features**:
```javascript
// Display pending + confirmed orders
<LeaderReviewQueue>
  <OrderRow>
    <AgentInfo />          {/* Who created/confirmed */}
    <ServiceTypeBadge />    {/* Requested type */}
    <CustomerContext />
    <AgentNotes />         {/* Notes from agent */}
    <ItemsPreview />
    <Actions>
      <ApproveButton />
      <RejectButton />
      <RequestInfoButton />
    </Actions>
  </OrderRow>
</LeaderReviewQueue>
```

**Tasks**:
- [ ] Create LeaderReviewQueue component
- [ ] Display agent information
- [ ] Show agent notes
- [ ] Implement Approve action
- [ ] Implement Reject action
- [ ] Implement Request Info action
- [ ] Add service_type selector in Approve modal
- [ ] Add item modification in Approve modal

#### 2.4 CallSessionFAB Updates

**File**: `front/src/components/call-center/CallSessionFAB.jsx`

**New Features**:
```javascript
<CallSessionFAB>
  {/* Existing: Customer context, items, actions */}

  {/* NEW: Service Type Selection */}
  <ServiceTypeSelector>
    <SellIcon />
    <MaintenanceIcon />
    <ReplacementIcon />
    <ReturnIcon />
  </ServiceTypeSelector>

  {/* NEW: Bosta Order Selection */}
  <BostaOrderSelector>
    {customer.bosta_orders.map(order => (
      <BostaOrderCard onSelect={...} />
    ))}
  </BostaOrderSelector>

  {/* NEW: Quick Accept Button */}
  {order.source === 'erp' && (
    <QuickAcceptButton onClick={handleQuickAccept}>
      قبول سريع
    </QuickAcceptButton>
  )}

  {/* NEW: Inline Customer Creation */}
  {!customer && (
    <CreateCustomerForm
      onSubmit={handleCreateCustomer}
    />
  )}
</CallSessionFAB>
```

**Tasks**:
- [ ] Add service_type dropdown selector
- [ ] Add Bosta order selection UI
- [ ] Add Quick Accept button (ERP orders)
- [ ] Add inline customer creation form
- [ ] Update confirm button to handle all sources
- [ ] Add source indicator in order header
- [ ] Update items section for Bosta products

**Deliverables**:
- 4 updated/created components
- Updated routing and tabs
- Updated API integration
- RTL/Arabic support for all new UI

---

### Phase 3: Bosta Integration (Week 3)

**Goal**: Complete Bosta order integration

#### 3.1 Phone Search Enhancement

**File**: `front/src/components/call-center/PhoneSearch.jsx`

**Enhanced Flow**:
```javascript
const handlePhoneSearch = async (phone) => {
  // 1. Check local customer database
  const localCustomer = await getCustomerByPhone(phone);

  // 2. Check Bosta API for orders
  const bostaOrders = await searchBostaOrders(phone);

  // 3. Merge results
  return {
    customer: localCustomer,
    bostaOrders: bostaOrders,
    hasBostaOrders: bostaOrders.length > 0
  };
};

// Display results
<PhoneSearchResults>
  {customer && <CustomerCard customer={customer} />}
  {hasBostaOrders && (
    <BostaOrdersSection>
      {bostaOrders.map(order => (
        <BostaOrderCard
          order={order}
          onSelect={handleSelectBostaOrder}
          onCreateService={handleCreateServiceFromBosta}
        />
      ))}
    </BostaOrdersSection>
  )}
  {!customer && (
    <CreateCustomerPrompt
      phone={phone}
      bostaData={bostaOrders[0]}
    />
  )}
</PhoneSearchResults>
```

**Tasks**:
- [ ] Update phone search to call Bosta API
- [ ] Display Bosta orders in search results
- [ ] Add "Create Service" button on Bosta orders
- [ ] Add inline customer creation from Bosta data
- [ ] Cache Bosta orders in customer.bosta_orders

#### 3.2 Bosta Order Selection

**File**: `front/src/components/call-center/BostaOrderSelector.jsx`

**Features**:
```javascript
<BostaOrderSelector>
  <BostaOrderList>
    {bostaOrders.map(order => (
      <BostaOrderCard key={order.id}>
        <OrderInfo>
          <TrackingNumber>{order.tracking_number}</TrackingNumber>
          <OrderDate>{formatDate(order.created_at)}</OrderDate>
          <StatusBadge>{order.status}</StatusBadge>
        </OrderInfo>

        <ItemsPreview>
          {order.items.map(item => (
            <ItemBadge>{item.name} x{item.quantity}</ItemBadge>
          ))}
        </ItemsPreview>

        <Actions>
          <ViewDetailsButton />
          <CreateServiceButton />
        </Actions>
      </BostaOrderCard>
    ))}
  </BostaOrderList>
</BostaOrderSelector>
```

**Tasks**:
- [ ] Create BostaOrderSelector component
- [ ] Display Bosta order details
- [ ] Implement order selection
- [ ] Create draft order from Bosta selection
- [ ] Link draft to Bosta tracking number
- [ ] Display Bosta context in call session

#### 3.3 Customer Sync

**File**: `app/services/customer_service.py`

**Sync Logic**:
```python
def sync_customer_from_bosta(bosta_order):
    """Create or update customer from Bosta order data"""
    customer = get_customer_by_phone(bosta_order.customer_phone)

    if not customer:
        # Create new customer
        customer = create_customer({
            'name': bosta_order.customer_name,
            'phone': bosta_order.customer_phone,
            'address': bosta_order.customer_address,
            'bosta_orders': [bosta_order.to_dict()]
        })
    else:
        # Update existing customer
        bosta_orders = customer.get('bosta_orders', [])
        bosta_orders.append(bosta_order.to_dict())
        update_customer(customer['id'], {
            'bosta_orders': bosta_orders
        })

    return customer
```

**Tasks**:
- [ ] Implement sync_customer_from_bosta function
- [ ] Add Bosta order caching in customer.bosta_orders
- [ ] Update phone search to sync automatically
- [ ] Add Bosta order refresh functionality
- [ ] Handle Bosta API errors gracefully

**Deliverables**:
- Enhanced phone search with Bosta integration
- Bosta order selection UI
- Customer sync functionality
- Complete Bosta workflow documentation

---

### Phase 4: Documentation & Testing (Week 4)

**Goal**: Complete documentation and comprehensive testing

#### 4.1 Documentation

**Files to Create/Update**:

1. **README.md** - System overview
   - Architecture diagram
   - Component overview
   - Quick start guide
   - Deployment instructions

2. **workflow.md** - Complete workflows
   - Draft order lifecycle
   - Leader approval process
   - Bosta integration flow
   - Direct order creation

3. **database-model.md** - Schema reference
   - Orders table schema
   - New field descriptions
   - Index documentation
   - Migration history

4. **API_ENDPOINTS.md** - API specification
   - All endpoint documentation
   - Request/response examples
   - Error codes
   - Authentication details

5. **call-session-cycle.md** - Call workflows
   - Incoming call flow
   - Outgoing call flow
   - Quick accept flow
   - Standard confirm flow

6. **bosta-integration.md** - Bosta guide
   - Bosta API integration
   - Order search flow
   - Customer sync process
   - Error handling

7. **service-type-workflows.md** - All 4 types
   - Sell workflow
   - Maintenance workflow
   - Replacement workflow
   - Return workflow

8. **leader-approval-workflow.md** - Leader process
   - Pending queue overview
   - Approval process
   - Rejection process
   - Info request process

**Tasks**:
- [ ] Create/update all 8 documentation files
- [ ] Add diagrams and flowcharts
- [ ] Include code examples
- [ ] Add troubleshooting sections
- [ ] Create video tutorials (optional)

#### 4.2 Testing

**Unit Tests**:
```python
# test_service_manager.py
def test_draft_order_to_ticket():
    """Test converting draft order to ticket"""
    pass

def test_leader_approve_order():
    """Test leader approval process"""
    pass

def test_create_ticket_from_order():
    """Test unified ticket creation"""
    pass

# test_call_center_api.py
def test_get_drafts():
    """Test fetching draft orders"""
    pass

def test_quick_accept():
    """Test quick accept flow"""
    pass

def test_leader_approve():
    """Test leader approval endpoint"""
    pass
```

**Integration Tests**:
```python
# test_call_center_workflow.py
def test_erp_draft_to_ticket():
    """Test complete ERP draft workflow"""
    pass

def test_bosta_order_to_ticket():
    """Test complete Bosta order workflow"""
    pass

def test_direct_order_to_ticket():
    """Test complete direct order workflow"""
    pass

def test_leader_approval_flow():
    """Test leader approval workflow"""
    pass
```

**E2E Tests**:
```javascript
// e2e/call-center.spec.js
test('complete ERP draft workflow', async () => {
  // 1. Agent sees draft order
  // 2. Agent calls customer
  // 3. Agent confirms order
  // 4. Leader approves
  // 5. Ticket is created
});

test('complete Bosta order workflow', async () => {
  // 1. Phone search finds Bosta order
  // 2. Agent selects Bosta order
  // 3. Agent confirms with customer
  // 4. Leader approves
  // 5. Ticket is created
});
```

**Tasks**:
- [ ] Write unit tests for all new functions
- [ ] Write integration tests for API endpoints
- [ ] Write E2E tests for complete workflows
- [ ] Test all three order sources
- [ ] Test all four service types
- [ ] Test error scenarios
- [ ] Performance testing
- [ ] Security testing

**Deliverables**:
- 8 comprehensive documentation files
- Complete test coverage (>80%)
- Test reports and metrics
- Bug fixes from testing

---

## Success Metrics

### Performance Metrics
- **Draft Processing Time**: <2 minutes (from draft to pending)
- **Quick Accept Time**: <30 seconds (for simple ERP orders)
- **Leader Approval Time**: <5 minutes (from pending to approved)
- **Order Creation Time**: <3 minutes (for direct orders)
- **Error Rate**: <1% (failed conversions/approvals)

### Business Metrics
- **Orders Processed/Day**: +20% increase
- **Customer Confirmation Rate**: >85%
- **Leader Approval Rate**: >95%
- **Average Call Duration**: <5 minutes
- **First Contact Resolution**: >70%

### Quality Metrics
- **Test Coverage**: >80%
- **Documentation Completeness**: 100%
- **Code Review Approval**: 100%
- **Bug Count (Post-Launch)**: <5 critical bugs

---

## Risk Mitigation

### Technical Risks

**Risk**: Database migration breaks existing data
- **Mitigation**:
  - Test migration on staging first
  - Create backup before migration
  - Document rollback procedure
  - Run migration during low-traffic hours

**Risk**: Performance degradation with new queries
- **Mitigation**:
  - Add indexes before rollout
  - Use EXPLAIN to optimize queries
  - Implement caching for frequent queries
  - Load test before production deployment

**Risk**: Bosta API integration failures
- **Mitigation**:
  - Implement retry logic with exponential backoff
  - Cache Bosta orders locally
  - Graceful degradation if Bosta is down
  - Monitor API call success rates

### Process Risks

**Risk**: Agents resist new workflow
- **Mitigation**:
  - Provide comprehensive training
  - Create video tutorials
  - Run pilot with small team first
  - Gather feedback and iterate

**Risk**: Leader approval becomes bottleneck
- **Mitigation**:
  - Implement notification system
  - Add approval delegation
  - Provide mobile approval interface
  - Monitor approval queue size

**Risk**: Data quality issues
- **Mitigation**:
  - Add validation at all entry points
  - Require agent notes on confirm
  - Implement data quality checks
  - Regular data audits

### Operational Risks

**Risk**: System downtime during rollout
- **Mitigation**:
  - Use blue-green deployment
  - Plan rollback procedure
  - Schedule during low-traffic hours
  - Have support team on standby

**Risk**: Increased support burden
- **Mitigation**:
  - Create comprehensive documentation
  - Build knowledge base
  - Train support team
  - Implement error monitoring

---

## Implementation Timeline

### Week 1: Backend Foundation
- Day 1-2: Database migration and testing
- Day 3-4: Draft order API endpoints
- Day 5: Leader approval API endpoints
- Day 6-7: Service manager updates and testing

### Week 2: Frontend Updates
- Day 1-2: CustomerServicePage updates
- Day 3-4: DraftsQueue component
- Day 5: LeaderReviewQueue component
- Day 6-7: CallSessionFAB updates

### Week 3: Bosta Integration
- Day 1-2: Phone search enhancement
- Day 3-4: Bosta order selection
- Day 5-6: Customer sync implementation
- Day 7: Integration testing

### Week 4: Documentation & Testing
- Day 1-2: Documentation creation
- Day 3-4: Unit and integration tests
- Day 5: E2E tests
- Day 6: Bug fixes and polish
- Day 7: Final review and launch preparation

---

## Launch Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Code review complete
- [ ] Documentation complete
- [ ] Training materials ready
- [ ] Support team trained
- [ ] Monitoring in place
- [ ] Rollback plan tested

### Launch Day
- [ ] Backup database
- [ ] Deploy to production
- [ ] Smoke test critical paths
- [ ] Monitor error rates
- [ ] Support team on standby
- [ ] Communicate launch to users

### Post-Launch
- [ ] Monitor key metrics daily
- [ ] Gather user feedback
- [ ] Fix critical bugs immediately
- [ ] Iterate on user requests
- [ ] Plan next phase features

---

## Next Phase Features (Future)

### Phase 5: Advanced Features (Future)
- Mobile app for agents
- IVR integration
- Auto-dialer functionality
- Advanced analytics dashboard
- AI-powered order classification
- Voice transcription for notes
- Multi-location support

---

**Last Updated**: 2026-02-08
**Status**: Ready for Implementation
**Owner**: Call Center Team
