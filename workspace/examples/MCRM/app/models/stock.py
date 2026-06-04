# app/models/stock.py
"""Stock model definition."""
# Define Stock model here
from app.utils.db import execute_insert, execute_query, execute_update, transaction

def create_stock_item(data):
    """Creates a new stock item. Optional: price_customer, price_merchant."""
    cols = ['sku', 'name', 'type', 'quantity_on_hand', 'created_by']
    placeholders = ['%(sku)s', '%(name)s', '%(type)s', '%(quantity_on_hand)s', '%(created_by)s']
    if data.get('price_customer') is not None:
        cols.append('price_customer')
        placeholders.append('%(price_customer)s')
    if data.get('price_merchant') is not None:
        cols.append('price_merchant')
        placeholders.append('%(price_merchant)s')
    sql = f"""
        INSERT INTO stock_items ({', '.join(cols)})
        VALUES ({', '.join(placeholders)})
    """
    return execute_insert(sql, data)

def update_stock_item(item_id, data):
    """Updates a stock item."""
    fields = []
    params = {}
    
    allowed_fields = ['sku', 'name', 'active', 'updated_by', 'price_customer', 'price_merchant']
    
    for field in allowed_fields:
        if field in data:
            fields.append(f"{field} = %({field})s")
            params[field] = data[field]
    
    if not fields:
        return False
    
    params['id'] = item_id
    sql = f"UPDATE stock_items SET {', '.join(fields)}, updated_at = CURRENT_TIMESTAMP WHERE id = %(id)s"
    
    return execute_update(sql, params)

def get_stock_item_by_id(item_id, active_only=False):
    """
    Gets a stock item by its ID.
    
    Args:
        item_id: The ID of the stock item
        active_only: If True, only return item if it's active. Default False.
    
    Returns:
        Stock item dict or None if not found
    """
    if active_only:
        sql = "SELECT * FROM stock_items WHERE id = %s AND active = TRUE"
    else:
        sql = "SELECT * FROM stock_items WHERE id = %s"
    result = execute_query(sql, (item_id,))
    return result[0] if result else None

def get_item_price(item_id, customer_type='customer'):
    """
    Get item price based on customer type.
    
    Args:
        item_id: The ID of the stock item
        customer_type: 'customer' or 'merchant' (التاجر)
    
    Returns:
        Price (decimal) or None if not found
    """
    item = get_stock_item_by_id(item_id)
    if not item:
        return None
    
    if customer_type == 'merchant':
        return item.get('price_merchant')
    return item.get('price_customer')

def get_stock_item_by_sku(sku):
    """Gets a stock item by its SKU."""
    sql = "SELECT * FROM stock_items WHERE sku = %s"
    result = execute_query(sql, (sku,))
    return result[0] if result else None

def get_stock_items_by_type(item_type=None, limit=None, offset=0, active_only=True):
    """
    Gets all stock items, optionally filtered by type and active status, with pagination.
    
    Args:
        item_type: Optional filter by type ('part' or 'product')
        limit: Optional limit for pagination
        offset: Optional offset for pagination
        active_only: If True (default), only return active items. If False, return all items including inactive/deleted.
    
    Returns:
        List of stock item dicts
    """
    conditions = []
    params = []
    
    # Add active filter if requested
    if active_only:
        conditions.append("active = TRUE")
    
    # Add type filter if provided
    if item_type:
        conditions.append("type = %s")
        params.append(item_type)
    
    # Build WHERE clause
    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)
    
    # Build query with pagination
    if limit is not None:
        sql = f"SELECT * FROM stock_items {where_clause} LIMIT %s OFFSET %s"
        params.extend([limit, offset])
    elif offset > 0:
        # MySQL requires LIMIT when using OFFSET, so use a very large number
        sql = f"SELECT * FROM stock_items {where_clause} LIMIT 18446744073709551615 OFFSET %s"
        params.append(offset)
    else:
        sql = f"SELECT * FROM stock_items {where_clause}"
    
    return execute_query(sql, tuple(params) if params else ())

def get_product_components(product_id):
    """Gets all components for a given product."""
    sql = """
        SELECT si.*, pc.quantity_needed
        FROM product_components pc
        JOIN stock_items si ON pc.part_id = si.id
        WHERE pc.product_id = %s
    """
    return execute_query(sql, (product_id,))

def log_stock_movement(item_id, movement_type, quantity, reference_type, reference_id, user_id, condition='valid', notes=None):
    """Logs a single stock movement."""
    sql = """
        INSERT INTO stock_movements (item_id, movement_type, quantity, reference_type, reference_id, created_by, `condition`, notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    params = (item_id, movement_type, quantity, reference_type, reference_id, user_id, condition, notes)
    return execute_insert(sql, params)

def get_stock_movements(item_id=None, movement_type=None, reference_type=None, reference_id=None, 
                       created_by=None, limit=100, offset=0, order_by='created_at', order_direction='DESC',
                       start_date=None, end_date=None, condition=None, item_type=None, service_type=None):
    """
    Gets stock movements with optional filtering and pagination.
    Returns movements with stock item details joined.
    
    Parameters:
    - item_id: Filter by specific stock item ID
    - movement_type: Single type or list of types (SEND, RECEIVE, MANUAL)
    - reference_type: Type of reference (service_ticket, manual_adjustment)
    - reference_id: ID of the related object
    - created_by: User who created the movement
    - condition: Item condition (valid, damaged)
    - item_type: Type of stock item (product, part)
    - service_type: Service type of ticket (replacement, maintenance, return) - only applies when reference_type is 'service_ticket'
    - start_date: ISO format date string (YYYY-MM-DD) for start of date range
    - end_date: ISO format date string (YYYY-MM-DD) for end of date range
    - limit: Items per page (max 100)
    - offset: Pagination offset
    - order_by: Sort field (id, created_at, movement_type, quantity)
    - order_direction: ASC or DESC
    """
    # Build WHERE clause
    conditions = []
    params = []
    
    if item_id:
        conditions.append("sm.item_id = %s")
        params.append(item_id)
    
    if movement_type:
        if isinstance(movement_type, list):
            placeholders = ','.join(['%s'] * len(movement_type))
            conditions.append(f"sm.movement_type IN ({placeholders})")
            params.extend(movement_type)
        else:
            conditions.append("sm.movement_type = %s")
            params.append(movement_type)
    
    if reference_type:
        conditions.append("sm.reference_type = %s")
        params.append(reference_type)
    
    if reference_id:
        conditions.append("sm.reference_id = %s")
        params.append(reference_id)
    
    if created_by:
        conditions.append("sm.created_by = %s")
        params.append(created_by)
    
    if condition:
        conditions.append("sm.`condition` = %s")
        params.append(condition)
    
    if item_type:
        conditions.append("si.type = %s")
        params.append(item_type)
    
    if service_type:
        # Only apply service_type filter when reference_type is service_ticket
        if reference_type == 'service_ticket' or reference_type is None:
            if isinstance(service_type, list):
                placeholders = ','.join(['%s'] * len(service_type))
                conditions.append(f"st.service_type IN ({placeholders})")
                params.extend(service_type)
            else:
                conditions.append("st.service_type = %s")
                params.append(service_type)
        # If reference_type is set to something else and service_type is provided, it's invalid
        # But we'll allow it and just not filter (service_type will be ignored)
    
    if start_date:
        conditions.append("DATE(sm.created_at) >= %s")
        params.append(start_date)
    
    if end_date:
        conditions.append("DATE(sm.created_at) <= %s")
        params.append(end_date)
    
    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)
    
    # Build JOIN clause - left join service_tickets when service_type filter is used or reference_type is service_ticket
    join_clause = "JOIN stock_items si ON sm.item_id = si.id"
    if service_type or reference_type == 'service_ticket' or reference_type is None:
        join_clause += " LEFT JOIN service_tickets st ON sm.reference_type = 'service_ticket' AND sm.reference_id = st.id"
    
    # Build the main query with stock item details and condition
    sql = f"""
        SELECT 
            sm.id,
            sm.item_id,
            sm.quantity,
            sm.movement_type,
            sm.reference_type,
            sm.reference_id,
            sm.created_by,
            sm.created_at,
            sm.notes,
            sm.`condition`,
            si.sku,
            si.name as item_name,
            si.type as item_type
        FROM stock_movements sm
        {join_clause}
        {where_clause}
        ORDER BY sm.{order_by} {order_direction}
        LIMIT %s OFFSET %s
    """
    params.extend([limit, offset])
    
    return execute_query(sql, params)

def get_stock_movements_count(item_id=None, movement_type=None, reference_type=None, reference_id=None, 
                             created_by=None, condition=None, item_type=None, start_date=None, end_date=None, service_type=None):
    """Get total count of stock movements matching the filters."""
    conditions = []
    params = []
    
    if item_id:
        conditions.append("sm.item_id = %s")
        params.append(item_id)
    
    if movement_type:
        if isinstance(movement_type, list):
            placeholders = ','.join(['%s'] * len(movement_type))
            conditions.append(f"sm.movement_type IN ({placeholders})")
            params.extend(movement_type)
        else:
            conditions.append("sm.movement_type = %s")
            params.append(movement_type)
    
    if reference_type:
        conditions.append("sm.reference_type = %s")
        params.append(reference_type)
    
    if reference_id:
        conditions.append("sm.reference_id = %s")
        params.append(reference_id)
    
    if created_by:
        conditions.append("sm.created_by = %s")
        params.append(created_by)
    
    if condition:
        conditions.append("sm.`condition` = %s")
        params.append(condition)
    
    if item_type:
        conditions.append("si.type = %s")
        params.append(item_type)
    
    if service_type:
        # Only apply service_type filter when reference_type is service_ticket
        if reference_type == 'service_ticket' or reference_type is None:
            if isinstance(service_type, list):
                placeholders = ','.join(['%s'] * len(service_type))
                conditions.append(f"st.service_type IN ({placeholders})")
                params.extend(service_type)
            else:
                conditions.append("st.service_type = %s")
                params.append(service_type)
        # If reference_type is set to something else and service_type is provided, it's invalid
        # But we'll allow it and just not filter (service_type will be ignored)
    
    if start_date:
        conditions.append("DATE(sm.created_at) >= %s")
        params.append(start_date)
    
    if end_date:
        conditions.append("DATE(sm.created_at) <= %s")
        params.append(end_date)
    
    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)
    
    # Build JOIN clause - left join service_tickets when service_type filter is used or reference_type is service_ticket
    join_clause = "JOIN stock_items si ON sm.item_id = si.id"
    if service_type or reference_type == 'service_ticket' or reference_type is None:
        join_clause += " LEFT JOIN service_tickets st ON sm.reference_type = 'service_ticket' AND sm.reference_id = st.id"
    
    sql = f"""
        SELECT COUNT(*) as count FROM stock_movements sm
        {join_clause}
        {where_clause}
    """
    result = execute_query(sql, params)
    return result[0]['count'] if result else 0

def check_item_dependencies(item_id):
    """
    Checks if a stock item has dependencies in service_items or stock_movements.
    Only blocks deletion for service_items linked to active tickets (not COMPLETED or CANCELLED).
    Returns a dict with counts, details of dependencies, and active ticket information.
    """
    dependencies = {
        'service_items_count': 0,
        'active_service_items_count': 0,
        'stock_movements_count': 0,
        'has_dependencies': False,
        'service_tickets': []
    }
    
    # Check service_items references - only count active tickets (not COMPLETED or CANCELLED)
    service_items_sql = """
        SELECT COUNT(*) as count 
        FROM service_items si
        JOIN service_tickets st ON si.ticket_id = st.id
        WHERE si.item_id = %s AND st.status NOT IN ('COMPLETED', 'CANCELLED')
    """
    service_items_result = execute_query(service_items_sql, (item_id,))
    dependencies['active_service_items_count'] = service_items_result[0]['count'] if service_items_result else 0
    
    # Get details of active tickets blocking deletion
    tickets_sql = """
        SELECT DISTINCT st.id, st.ticket_number, st.status, st.service_type
        FROM service_items si
        JOIN service_tickets st ON si.ticket_id = st.id
        WHERE si.item_id = %s AND st.status NOT IN ('COMPLETED', 'CANCELLED')
        ORDER BY st.ticket_number
    """
    tickets_result = execute_query(tickets_sql, (item_id,))
    dependencies['service_tickets'] = tickets_result if tickets_result else []
    
    # Total service_items count (for reference)
    total_service_items_sql = "SELECT COUNT(*) as count FROM service_items WHERE item_id = %s"
    total_service_items_result = execute_query(total_service_items_sql, (item_id,))
    dependencies['service_items_count'] = total_service_items_result[0]['count'] if total_service_items_result else 0
    
    # Check stock_movements references (for informational purposes only - doesn't block deletion)
    stock_movements_sql = "SELECT COUNT(*) as count FROM stock_movements WHERE item_id = %s"
    stock_movements_result = execute_query(stock_movements_sql, (item_id,))
    dependencies['stock_movements_count'] = stock_movements_result[0]['count'] if stock_movements_result else 0
    
    # Only block if there are active service items (stock movements don't block deletion)
    dependencies['has_dependencies'] = dependencies['active_service_items_count'] > 0
    
    return dependencies

def delete_stock_item(item_id):
    """
    Soft deletes a stock item by setting active = FALSE and appending "-deleted-{id}" to SKU.
    This preserves all historical data (movements, relationships) while freeing the SKU for reuse.
    The item ID is appended to ensure unique SKU even if multiple items with same SKU are deleted.
    Use check_item_dependencies() first to validate.
    Returns True if deletion was successful, False otherwise.
    Raises exception if database error occurs.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Get the current SKU
    current_item = get_stock_item_by_id(item_id)
    if not current_item:
        logger.error(f"Item {item_id} not found for deletion")
        return False
    
    current_sku = current_item.get('sku', '')
    
    # Check if already deleted (contains "-deleted-{id}" pattern)
    deleted_pattern = f"-deleted-{item_id}"
    if deleted_pattern in current_sku:
        # Already deleted with this ID, don't modify SKU
        new_sku = current_sku
    elif current_sku.endswith('-deleted'):
        # Old pattern detected: replace "-deleted" with "-deleted-{id}" for consistency
        base_sku = current_sku[:-8]  # Remove "-deleted" suffix
        new_sku = base_sku + deleted_pattern
    else:
        # Append "-deleted-{id}" suffix to ensure uniqueness
        # This prevents duplicate SKU errors when multiple items with same SKU are deleted
        new_sku = current_sku + deleted_pattern
    
    sql = """
        UPDATE stock_items 
        SET active = FALSE, 
            sku = %s,
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = %s
    """
    try:
        rowcount = execute_update(sql, (new_sku, item_id))
        return rowcount > 0
    except Exception as e:
        logger.error(f"Database error deleting item {item_id}: {str(e)}", exc_info=True)
        raise

