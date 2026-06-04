# app/models/service_ticket.py
"""Service Ticket model definition."""
# Define Service Ticket model here
import logging
from app.utils.db import execute_insert, execute_query, execute_update, transaction

logger = logging.getLogger(__name__)

def enrich_ticket_with_bosta_orders(ticket, force_sync=False):
    """
    Enrich ticket data with Bosta order information.
    Adds 'bosta_orders' array to ticket based on tracking numbers.
    
    Args:
        ticket (dict): The service ticket object.
        force_sync (bool): If True, forces a fresh pull from the Bosta API.
    """
    if not ticket:
        return ticket
    
    # Import here to avoid circular dependency
    from app.services.bosta_service import fetch_ticket_bosta_orders
    
    # Fetch Bosta orders for all tracking numbers
    bosta_orders = fetch_ticket_bosta_orders(
        original_tracking=ticket.get('original_tracking'),
        new_tracking_send=ticket.get('new_tracking_send'),
        new_tracking_receive=ticket.get('new_tracking_receive'),
        force_sync=force_sync
    )
    
    # Add bosta_orders to ticket
    ticket['bosta_orders'] = bosta_orders
    return ticket

def enrich_ticket_full(ticket, force_sync=False):
    """
    Fully enrich a ticket with items and Bosta order data.
    
    Args:
        ticket (dict): The service ticket object.
        force_sync (bool): If True, forces a fresh pull from the Bosta API.
    
    Returns:
        dict: Enriched ticket with items and bosta_orders.
    """
    if not ticket:
        return ticket
    
    # Add items
    ticket['items'] = get_ticket_items(ticket['id'])
    
    # Add bosta orders
    ticket = enrich_ticket_with_bosta_orders(ticket, force_sync)
    
    return ticket

def create_ticket(data):
    """Create a new service ticket from a dictionary of data."""
    # Filter out None values to allow database defaults to apply, except for fields that can be null
    filtered_data = {k: v for k, v in data.items() if v is not None or k in ['reason', 'notes', 'original_tracking', 'new_tracking_send', 'new_tracking_receive', 'created_from_order_id']}
    
    # Dynamically build the INSERT statement
    columns = '`, `'.join(filtered_data.keys())
    placeholders = ', '.join([f"%({key})s" for key in filtered_data.keys()])
    
    sql = f"INSERT INTO service_tickets (`{columns}`) VALUES ({placeholders})"
    
    return execute_insert(sql, filtered_data)

def get_ticket_by_id(ticket_id):
    """Get a single service ticket by its ID."""
    sql = "SELECT * FROM service_tickets WHERE id = %s"
    result = execute_query(sql, (ticket_id,))
    return result[0] if result else None

def log_status_change(ticket_id, old_status, new_status, user_id, notes):
    """Log a status change to the service_ticket_history table."""
    sql = """
        INSERT INTO service_ticket_history (ticket_id, old_status, new_status, created_by, notes)
        VALUES (%s, %s, %s, %s, %s)
    """
    params = (ticket_id, old_status, new_status, user_id, notes)
    return execute_insert(sql, params)

def update_ticket_status(ticket_id, new_status, user_id, notes=""):
    """Update the status of a ticket and log the change."""
    with transaction() as cursor:
        # Get old status
        cursor.execute("SELECT status FROM service_tickets WHERE id = %s", (ticket_id,))
        result = cursor.fetchone()
        if not result:
            return False
        old_status = result['status']
        
        # Update ticket status and set completed_at if status is COMPLETED
        if new_status == 'COMPLETED':
            update_sql = "UPDATE service_tickets SET status = %s, updated_at = CURRENT_TIMESTAMP, completed_at = CURRENT_TIMESTAMP WHERE id = %s"
        else:
            update_sql = "UPDATE service_tickets SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s"
        cursor.execute(update_sql, (new_status, ticket_id))
        
        # Log the status change
        log_sql = """
            INSERT INTO service_ticket_history (ticket_id, old_status, new_status, created_by, notes)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(log_sql, (ticket_id, old_status, new_status, user_id, notes))
    
    return True

def get_tickets_by_status(status, limit=20, offset=0):
    """Get tickets filtered by status with pagination, including customer details."""
    sql = """
        SELECT st.*, c.name as customer_name, c.phone, c.governorate, c.city, c.address_details as customer_address
        FROM service_tickets st
        JOIN customers c ON st.customer_id = c.id
        WHERE st.status = %s
        ORDER BY st.created_at DESC
        LIMIT %s OFFSET %s
    """
    return execute_query(sql, (status, limit, offset))

def list_tickets(limit=20, offset=0):
    """List all service tickets with pagination, including customer details."""
    sql = """
        SELECT st.*, c.name as customer_name, c.phone, c.governorate, c.city, c.address_details as customer_address
        FROM service_tickets st
        JOIN customers c ON st.customer_id = c.id
        ORDER BY st.created_at DESC
        LIMIT %s OFFSET %s
    """
    return execute_query(sql, (limit, offset))

def get_tickets_count():
    """Get total count of service tickets."""
    sql = "SELECT COUNT(*) as count FROM service_tickets"
    result = execute_query(sql)
    return result[0]['count'] if result else 0

def get_tickets_by_customer(customer_id):
    """Get all tickets for a specific customer, including customer details."""
    sql = """
        SELECT st.*, c.name as customer_name, c.phone, c.governorate, c.city, c.address_details as customer_address
        FROM service_tickets st
        JOIN customers c ON st.customer_id = c.id
        WHERE st.customer_id = %s
        ORDER BY st.created_at DESC
    """
    return execute_query(sql, (customer_id,))

def get_tickets_by_service_type(service_type, limit=20, offset=0):
    """Get tickets filtered by service type with pagination, including customer details."""
    sql = """
        SELECT st.*, c.name as customer_name, c.phone, c.governorate, c.city, c.address_details as customer_address
        FROM service_tickets st
        JOIN customers c ON st.customer_id = c.id
        WHERE st.service_type = %s
        ORDER BY st.created_at DESC
        LIMIT %s OFFSET %s
    """
    return execute_query(sql, (service_type, limit, offset))

def get_tickets_count_by_service_type(service_type):
    """Get count of tickets for a specific service type."""
    sql = "SELECT COUNT(*) as count FROM service_tickets WHERE service_type = %s"
    result = execute_query(sql, (service_type,))
    return result[0]['count'] if result else 0

def get_tickets_count_filtered(status=None, customer_id=None, service_type=None, start_date=None, end_date=None, search=None):
    """Get count of tickets with optional filters applied.

    Args:
        status: Single status string or comma-separated statuses (e.g., 'CONFIRMED' or 'CONFIRMED,PENDING')
        customer_id: Filter by customer ID
        service_type: Single type or comma-separated (e.g. replacement,sell); filters with IN when multiple
        start_date: Filter from date (YYYY-MM-DD)
        end_date: Filter until date (YYYY-MM-DD)
        search: Search term to filter by ticket_number, customer name, phone, or tracking numbers
    """
    where_conditions = []
    params = []

    # If search is provided, need to JOIN with customers table
    needs_join = search is not None

    if status:
        # Support multiple statuses (comma-separated)
        statuses = [s.strip() for s in status.split(',')] if ',' in status else [status]
        prefix = "st." if needs_join else ""
        if len(statuses) == 1:
            where_conditions.append(f"{prefix}status = %s")
            params.append(statuses[0])
        else:
            placeholders = ','.join(['%s'] * len(statuses))
            where_conditions.append(f"{prefix}status IN ({placeholders})")
            params.extend(statuses)

    if customer_id:
        prefix = "st." if needs_join else ""
        where_conditions.append(f"{prefix}customer_id = %s")
        params.append(customer_id)
    if service_type:
        prefix = "st." if needs_join else ""
        stypes = [s.strip() for s in service_type.split(',') if s.strip()]
        if len(stypes) == 1:
            where_conditions.append(f"{prefix}service_type = %s")
            params.append(stypes[0])
        else:
            placeholders = ','.join(['%s'] * len(stypes))
            where_conditions.append(f"{prefix}service_type IN ({placeholders})")
            params.extend(stypes)
    if start_date:
        prefix = "st." if needs_join else ""
        where_conditions.append(f"DATE({prefix}created_at) >= %s")
        params.append(start_date)
    if end_date:
        prefix = "st." if needs_join else ""
        where_conditions.append(f"DATE({prefix}created_at) <= %s")
        params.append(end_date)

    if search:
        # Search across ticket_number, customer name, phone, and tracking numbers
        search_term = f"%{search}%"
        where_conditions.append(
            "(st.ticket_number LIKE %s OR c.name LIKE %s OR c.phone LIKE %s OR "
            "st.original_tracking LIKE %s OR st.new_tracking_send LIKE %s OR st.new_tracking_receive LIKE %s)"
        )
        params.extend([search_term] * 6)

    where_clause = " WHERE " + " AND ".join(where_conditions) if where_conditions else ""

    if needs_join:
        sql = f"""
            SELECT COUNT(*) as count
            FROM service_tickets st
            JOIN customers c ON st.customer_id = c.id
            {where_clause}
        """
    else:
        sql = f"SELECT COUNT(*) as count FROM service_tickets{where_clause}"

    result = execute_query(sql, tuple(params))
    return result[0]['count'] if result else 0

def list_tickets_with_items_and_bosta(limit=20, offset=0, status=None, customer_id=None, service_type=None, start_date=None, end_date=None, search=None, force_sync=False, include_bosta=True):
    """
    Optimized function to get tickets with items and Bosta orders in minimal queries.
    Uses JOINs and batching to improve performance significantly.

    Args:
        status: Single status string or comma-separated statuses (e.g., 'CONFIRMED' or 'CONFIRMED,PENDING')
        customer_id: Filter by customer ID
        service_type: Single type or comma-separated list (OR semantics via SQL IN)
        start_date: Filter from date (YYYY-MM-DD)
        end_date: Filter until date (YYYY-MM-DD)
        search: Search term to filter by ticket_number, customer name, phone, or tracking numbers
        force_sync: Force fresh Bosta API sync
        include_bosta: Whether to fetch Bosta order data (default: True)
    """
    # Build WHERE conditions
    where_conditions = []
    params = []

    if status:
        # Support multiple statuses (comma-separated)
        statuses = [s.strip() for s in status.split(',')] if ',' in status else [status]
        if len(statuses) == 1:
            where_conditions.append("st.status = %s")
            params.append(statuses[0])
        else:
            placeholders = ','.join(['%s'] * len(statuses))
            where_conditions.append(f"st.status IN ({placeholders})")
            params.extend(statuses)

    if customer_id:
        where_conditions.append("st.customer_id = %s")
        params.append(customer_id)
    if service_type:
        stypes = [s.strip() for s in service_type.split(',') if s.strip()]
        if len(stypes) == 1:
            where_conditions.append("st.service_type = %s")
            params.append(stypes[0])
        else:
            placeholders = ','.join(['%s'] * len(stypes))
            where_conditions.append(f"st.service_type IN ({placeholders})")
            params.extend(stypes)
    if start_date:
        where_conditions.append("DATE(st.created_at) >= %s")
        params.append(start_date)
    if end_date:
        where_conditions.append("DATE(st.created_at) <= %s")
        params.append(end_date)

    if search:
        # Search across ticket_number, customer name, phone, and tracking numbers
        search_term = f"%{search}%"
        where_conditions.append(
            "(st.ticket_number LIKE %s OR c.name LIKE %s OR c.phone LIKE %s OR "
            "st.original_tracking LIKE %s OR st.new_tracking_send LIKE %s OR st.new_tracking_receive LIKE %s)"
        )
        params.extend([search_term] * 6)

    where_clause = " WHERE " + " AND ".join(where_conditions) if where_conditions else ""

    # Base query for tickets
    if where_conditions:
        tickets_sql = f"""
            SELECT st.*, c.name as customer_name, c.phone, c.phone_secondary,
                   c.governorate, c.city, c.address_details as customer_address
            FROM service_tickets st
            JOIN customers c ON st.customer_id = c.id
            {where_clause}
            ORDER BY st.created_at DESC
            LIMIT %s OFFSET %s
        """
        params.extend([limit, offset])
        tickets = execute_query(tickets_sql, tuple(params))
    else:
        tickets_sql = """
            SELECT st.*, c.name as customer_name, c.phone, c.phone_secondary,
                   c.governorate, c.city, c.address_details as customer_address
            FROM service_tickets st
            JOIN customers c ON st.customer_id = c.id
            ORDER BY st.created_at DESC
            LIMIT %s OFFSET %s
        """
        tickets = execute_query(tickets_sql, (limit, offset))

    if not tickets:
        return tickets

    # Get all ticket IDs for batch processing
    ticket_ids = [ticket['id'] for ticket in tickets]

    # Batch fetch all items for all tickets in one query
    items_sql = """
        SELECT si.id, si.ticket_id, si.item_id, si.quantity, si.direction, si.condition,
               s.sku, s.name, s.type
        FROM service_items si
        JOIN stock_items s ON si.item_id = s.id
        WHERE si.ticket_id IN %s
        ORDER BY si.ticket_id, si.id
    """
    items_result = execute_query(items_sql, (ticket_ids,))

    # Group items by ticket_id
    items_by_ticket = {}
    for item in items_result:
        ticket_id = item['ticket_id']
        if ticket_id not in items_by_ticket:
            items_by_ticket[ticket_id] = []
        items_by_ticket[ticket_id].append(item)

    # Collect all unique tracking numbers for batch Bosta API calls (only if include_bosta is True)
    bosta_orders_by_ticket = {}
    if include_bosta:
        all_tracking_numbers = set()
        tracking_info = {}  # Maps tracking number to list of (ticket_id, tracking_type)

        for ticket in tickets:
            ticket_id = ticket['id']
            # Check all tracking fields
            for tracking_field in ['original_tracking', 'new_tracking_send', 'new_tracking_receive']:
                tracking_number = ticket.get(tracking_field)
                if tracking_number and tracking_number not in all_tracking_numbers:
                    all_tracking_numbers.add(tracking_number)
                    if tracking_number not in tracking_info:
                        tracking_info[tracking_number] = []
                    tracking_info[tracking_number].append((ticket_id, tracking_field))

        # Batch fetch Bosta orders for all tracking numbers using parallel processing
        if all_tracking_numbers:
            from app.services.bosta_service import BostaAPIService
            from app.models import bosta_order as bosta_order_model
            import concurrent.futures
            
            bosta_orders = {}
            
            # First, check cache for all tracking numbers to minimize API calls
            cached_tracking_numbers = set()
            for tracking_number in all_tracking_numbers:
                if not force_sync:
                    cached_order = bosta_order_model.get_order_by_tracking_number(tracking_number)
                    if cached_order:
                        cached_order['tracking_type'] = tracking_info[tracking_number][0][1]
                        bosta_orders[tracking_number] = [cached_order]
                        cached_tracking_numbers.add(tracking_number)
            
            # Only fetch from API for non-cached tracking numbers
            api_tracking_numbers = all_tracking_numbers - cached_tracking_numbers
            
            if api_tracking_numbers:
                def fetch_single_tracking(tracking_number):
                    """Fetch Bosta order for a single tracking number"""
                    try:
                        # BostaAPIService handles missing context gracefully
                        success, unified_order, error = BostaAPIService.fetch_order_data(tracking_number, force_sync=force_sync)
                        
                        if success and unified_order:
                            # Add tracking type label
                            unified_order['tracking_type'] = tracking_info[tracking_number][0][1]  # Use first tracking type
                            return tracking_number, unified_order
                        else:
                            logger.warning(f"Failed to fetch Bosta order for {tracking_number}: {error}")
                            return tracking_number, None
                    except Exception as e:
                        logger.warning(f"Failed to fetch Bosta orders for {tracking_number}: {e}")
                        return tracking_number, None
                
                # Use ThreadPoolExecutor for parallel API calls (only for non-cached)
                with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                    # Submit only non-cached tracking number fetches in parallel
                    future_to_tracking = {
                        executor.submit(fetch_single_tracking, tracking_number): tracking_number 
                        for tracking_number in api_tracking_numbers
                    }
                    
                    # Collect results as they complete
                    for future in concurrent.futures.as_completed(future_to_tracking):
                        tracking_number, order_data = future.result()
                        if order_data:
                            bosta_orders[tracking_number] = [order_data]  # Wrap in list for consistency

            # Group Bosta orders by ticket_id
            for tracking_number, orders in bosta_orders.items():
                for ticket_id, tracking_type in tracking_info[tracking_number]:
                    if ticket_id not in bosta_orders_by_ticket:
                        bosta_orders_by_ticket[ticket_id] = []
                    for order in orders:
                        order_copy = order.copy()
                        order_copy['tracking_type'] = tracking_type
                        bosta_orders_by_ticket[ticket_id].append(order_copy)

    # Batch fetch additional data for all tickets
    # Get history for all tickets
    history_sql = """
        SELECT id, ticket_id, old_status, new_status, notes, created_by, created_at
        FROM service_ticket_history
        WHERE ticket_id IN %s
        ORDER BY ticket_id, created_at ASC
    """
    history_result = execute_query(history_sql, (ticket_ids,))
    
    # Group history by ticket_id
    history_by_ticket = {}
    for history_item in history_result:
        ticket_id = history_item['ticket_id']
        if ticket_id not in history_by_ticket:
            history_by_ticket[ticket_id] = []
        history_by_ticket[ticket_id].append(history_item)

    # Get stock movements for all tickets
    stock_movements_sql = """
        SELECT sm.id, sm.item_id, sm.quantity, sm.movement_type, sm.condition, 
               sm.reference_type, sm.reference_id, sm.created_by, sm.created_at, sm.notes,
               si.sku, si.name as item_name, si.type as item_type
        FROM stock_movements sm
        JOIN stock_items si ON sm.item_id = si.id
        WHERE sm.reference_type = 'service_ticket' AND sm.reference_id IN %s
        ORDER BY sm.reference_id, sm.created_at ASC
    """
    stock_movements_result = execute_query(stock_movements_sql, (ticket_ids,))
    
    # Group stock movements by ticket_id
    stock_movements_by_ticket = {}
    for movement in stock_movements_result:
        ticket_id = movement['reference_id']
        if ticket_id not in stock_movements_by_ticket:
            stock_movements_by_ticket[ticket_id] = []
        stock_movements_by_ticket[ticket_id].append(movement)

    # Get tracking scans for all tickets
    tracking_scans_sql = """
        SELECT id, tracking_number, scan_type, scan_location, reference_type, 
               reference_id, created_by, created_at, notes
        FROM tracking_scans
        WHERE reference_type = 'service_ticket' AND reference_id IN %s
        ORDER BY reference_id, created_at ASC
    """
    tracking_scans_result = execute_query(tracking_scans_sql, (ticket_ids,))
    
    # Group tracking scans by ticket_id
    tracking_scans_by_ticket = {}
    for scan in tracking_scans_result:
        ticket_id = scan['reference_id']
        if ticket_id not in tracking_scans_by_ticket:
            tracking_scans_by_ticket[ticket_id] = []
        tracking_scans_by_ticket[ticket_id].append(scan)

    # Enrich tickets with all data
    for ticket in tickets:
        ticket_id = ticket['id']
        # Add items
        ticket['items'] = items_by_ticket.get(ticket_id, [])
        # Add bosta orders
        ticket['bosta_orders'] = bosta_orders_by_ticket.get(ticket_id, [])
        # Add history
        ticket['history'] = history_by_ticket.get(ticket_id, [])
        # Add stock movements
        ticket['stock_movements'] = stock_movements_by_ticket.get(ticket_id, [])
        # Add tracking scans
        ticket['tracking_scans'] = tracking_scans_by_ticket.get(ticket_id, [])

    return tickets

def get_ticket_items(ticket_id):
    """Get all items for a service ticket with base prices from stock_items."""
    sql = """
        SELECT si.id, si.ticket_id, si.item_id, si.quantity, si.direction, si.condition, 
               si.price_customer as price_customer_override,
               s.sku, s.name, s.type,
               s.price_customer as price_customer_base,
               s.price_merchant as price_merchant_base
        FROM service_items si
        JOIN stock_items s ON si.item_id = s.id
        WHERE si.ticket_id = %s
    """
    return execute_query(sql, (ticket_id,))

def get_ticket_with_customer(ticket_id):
    """Get a service ticket with customer details."""
    sql = """
        SELECT st.*, c.name as customer_name, c.phone, c.governorate, c.city, c.address_details as customer_address
        FROM service_tickets st
        JOIN customers c ON st.customer_id = c.id
        WHERE st.id = %s
    """
    result = execute_query(sql, (ticket_id,))
    return result[0] if result else None

def add_item_to_ticket(ticket_id, item_id, quantity, direction):
    """Adds an item to a service ticket."""
    sql = "INSERT INTO service_items (ticket_id, item_id, quantity, direction) VALUES (%s, %s, %s, %s)"
    return execute_insert(sql, (ticket_id, item_id, quantity, direction))

def update_ticket_item(service_item_id, quantity=None, condition=None):
    """Updates an item on a service ticket."""
    fields = []
    params = []
    if quantity is not None:
        fields.append("quantity = %s")
        params.append(quantity)
    if condition is not None:
        fields.append("`condition` = %s")
        params.append(condition)
    
    if not fields:
        return False

    sql = f"UPDATE service_items SET {', '.join(fields)} WHERE id = %s"
    params.append(service_item_id)
    
    return execute_update(sql, tuple(params))

def remove_item_from_ticket(service_item_id):
    """Removes an item from a service ticket."""
    sql = "DELETE FROM service_items WHERE id = %s"
    return execute_update(sql, (service_item_id,))

def get_ticket_item_by_id(service_item_id):
    """Gets a single service item by its ID."""
    sql = "SELECT * FROM service_items WHERE id = %s"
    result = execute_query(sql, (service_item_id,))
    return result[0] if result else None

def get_ticket_history(ticket_id):
    """Get the complete history of status changes for a ticket."""
    sql = """
        SELECT id, ticket_id, old_status, new_status, notes, created_by, created_at
        FROM service_ticket_history
        WHERE ticket_id = %s
        ORDER BY created_at ASC
    """
    return execute_query(sql, (ticket_id,))

def get_ticket_by_ticket_number(ticket_number):
    """Get a ticket by its ticket number."""
    sql = """
        SELECT st.*, c.name as customer_name, c.phone, c.governorate, c.city, c.address_details as customer_address
        FROM service_tickets st
        JOIN customers c ON st.customer_id = c.id
        WHERE st.ticket_number = %s
    """
    result = execute_query(sql, (ticket_number,))
    return result[0] if result else None
