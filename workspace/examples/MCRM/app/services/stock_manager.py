from app.utils.db import transaction, execute_query
from app.models import stock as stock_model
from app.utils.messages import get_message

class StockManagerException(Exception):
    """Custom exception for StockManager errors."""
    pass

# --- Service Lifecycle Functions ---

def reserve_stock(item_id, quantity, ticket_id, user_id):
    """
    Reserves stock for a ticket.
    Products can have negative stock (backorders), parts must have sufficient stock.
    Returns the ID of the reservation movement record.
    """
    with transaction() as cursor:
        cursor.execute("SELECT quantity_on_hand, quantity_reserved, type FROM stock_items WHERE id = %s FOR UPDATE", (item_id,))
        item = cursor.fetchone()

        if not item:
            raise StockManagerException(f"{get_message('not_found_item')} {item_id}")

        # Only validate stock availability for parts, products can go negative
        item_type = item.get('type')
        if item_type == 'part':
            available = item['quantity_on_hand'] - item['quantity_reserved']
            if available < quantity:
                raise StockManagerException(f"{get_message('insufficient_stock')} للقطعة {item_id}")

        cursor.execute(
            "UPDATE stock_items SET quantity_reserved = quantity_reserved + %s WHERE id = %s",
            (quantity, item_id)
        )
        
        # Log the movement and return its ID as the reservation_id
        reservation_id = stock_model.log_stock_movement(
            item_id, 'RESERVE', quantity, 'service_ticket', ticket_id, user_id, condition='valid'
        )
    return reservation_id

def _get_reservation_details(cursor, reservation_id):
    """Helper to fetch reservation details and check its status."""
    cursor.execute(
        "SELECT id, item_id, quantity, reference_id FROM stock_movements WHERE id = %s AND movement_type = 'RESERVE'",
        (reservation_id,)
    )
    reservation = cursor.fetchone()
    if not reservation:
        raise StockManagerException(f"{get_message('err_reservation_not_found')} {reservation_id}")
    
    # Check if this reservation has already been committed or cancelled
    cursor.execute(
        "SELECT id FROM stock_movements WHERE movement_type IN ('SEND', 'RECEIVE') AND notes = %s",
        (f"{get_message('note_refers_to_reservation')} {reservation_id}",)
    )
    if cursor.fetchone():
        raise StockManagerException(f"{get_message('err_reservation_actioned')} {reservation_id}")
        
    return reservation

def commit_reservation(reservation_id, user_id, cursor=None):
    """
    Commits a reservation using its ID.
    If cursor is provided, uses it (for use within existing transaction).
    If cursor is None, creates its own transaction (for standalone use).
    """
    if cursor is None:
        # Standalone mode: create own transaction
        with transaction() as new_cursor:
            _commit_reservation_internal(new_cursor, reservation_id, user_id)
    else:
        # Use provided cursor (within existing transaction)
        _commit_reservation_internal(cursor, reservation_id, user_id)
    return True

def _commit_reservation_internal(cursor, reservation_id, user_id):
    """Internal helper to commit a reservation using the provided cursor."""
    reservation = _get_reservation_details(cursor, reservation_id)
    item_id = reservation['item_id']
    quantity = reservation['quantity']
    ticket_id = reservation['reference_id']
    
    cursor.execute(
        "UPDATE stock_items SET quantity_on_hand = quantity_on_hand - %s, quantity_reserved = quantity_reserved - %s WHERE id = %s",
        (quantity, quantity, item_id)
    )
    # Log the commit with reference to original reservation
    cursor.execute(
        """
        INSERT INTO stock_movements (item_id, movement_type, quantity, reference_type, reference_id, created_by, notes, `condition`)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (item_id, 'SEND', quantity, 'service_ticket', ticket_id, user_id, f"{get_message('note_refers_to_reservation')} {reservation_id}", 'valid')
    )

def cancel_reservation(reservation_id, user_id):
    """Cancels a reservation using its ID."""
    with transaction() as cursor:
        reservation = _get_reservation_details(cursor, reservation_id)
        item_id = reservation['item_id']
        quantity = reservation['quantity']
        ticket_id = reservation['reference_id']

        cursor.execute(
            "UPDATE stock_items SET quantity_reserved = quantity_reserved - %s WHERE id = %s",
            (quantity, item_id)
        )
        # Log the cancellation with reference to original reservation
        cursor.execute(
            """
            INSERT INTO stock_movements (item_id, movement_type, quantity, reference_type, reference_id, created_by, notes, `condition`)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (item_id, 'RECEIVE', quantity, 'service_ticket', ticket_id, user_id, f"{get_message('note_refers_to_reservation')} {reservation_id}", 'valid')
        )
    return True

# --- Administrative Functions ---

def adjust_stock(item_id, quantity_delta, reason, user_id):
    """Manually adjusts the on_hand quantity for an item."""
    with transaction() as cursor:
        # Update the stock quantity
        cursor.execute("UPDATE stock_items SET quantity_on_hand = quantity_on_hand + %s WHERE id = %s", (quantity_delta, item_id))
        
        # Log the movement with signed quantity (positive for increase, negative for decrease)
        log_sql = """
            INSERT INTO stock_movements (item_id, movement_type, quantity, reference_type, reference_id, created_by, notes, `condition`)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(log_sql, (item_id, 'MANUAL', quantity_delta, 'manual_adjustment', None, user_id, reason, 'valid'))
    return True

def receive_stock(item_id, quantity, user_id):
    """Receives new stock for an item."""
    return adjust_stock(item_id, quantity, get_message("stock_received"), user_id)

def adjust_damaged_stock(item_id, quantity_delta, reason, user_id):
    """Manually adjusts the damaged quantity for an item."""
    with transaction() as cursor:
        # Update the damaged stock quantity
        cursor.execute("UPDATE stock_items SET quantity_damaged = quantity_damaged + %s WHERE id = %s", (quantity_delta, item_id))
        
        # Log the movement with signed quantity (positive for increase, negative for decrease)
        log_sql = """
            INSERT INTO stock_movements (item_id, movement_type, quantity, reference_type, reference_id, created_by, notes, `condition`)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(log_sql, (item_id, 'RECEIVE', quantity_delta, 'manual_adjustment', None, user_id, reason, 'damaged'))
    return True

def process_return(item_id, quantity, condition, ticket_id, user_id):
    """Processes a returned item, adjusting stock based on condition."""
    if condition not in ['valid', 'damaged']:
        raise StockManagerException(get_message("err_return_condition_invalid"))

    with transaction() as cursor:
        if condition == 'valid':
            # Add to valid stock
            cursor.execute("UPDATE stock_items SET quantity_on_hand = quantity_on_hand + %s WHERE id = %s", (quantity, item_id))
            stock_model.log_stock_movement(item_id, 'RECEIVE', quantity, 'service_ticket', ticket_id, user_id, condition='valid')
        else:  # damaged
            # Add to damaged stock
            cursor.execute("UPDATE stock_items SET quantity_damaged = quantity_damaged + %s WHERE id = %s", (quantity, item_id))
            stock_model.log_stock_movement(item_id, 'RECEIVE', quantity, 'service_ticket', ticket_id, user_id, condition='damaged')
    return True

def manual_stock_adjustment(item_id, quantity, condition, user_id, ticket_id=None, notes=''):
    """
    Manually adjust stock.
    Quantity: positive (increase) or negative (decrease)
    Condition: 'valid' (on_hand) or 'damaged'
    Movement type: always MANUAL
    Ticket_id: optional, links adjustment to a service ticket
    """
    if condition not in ['valid', 'damaged']:
        raise StockManagerException(get_message("err_condition_must_be_valid_damaged"))
    
    with transaction() as cursor:
        # Update the appropriate stock field based on condition
        if condition == 'valid':
            cursor.execute(
                "UPDATE stock_items SET quantity_on_hand = quantity_on_hand + %s WHERE id = %s",
                (quantity, item_id)
            )
        else:  # damaged
            cursor.execute(
                "UPDATE stock_items SET quantity_damaged = quantity_damaged + %s WHERE id = %s",
                (quantity, item_id)
            )
        
        # Log movement with MANUAL type
        action = "زيادة" if quantity > 0 else "نقصان"
        log_notes = f"تعديل يدوي: {action} {abs(quantity)} {get_message(f'condition_{condition}')}"
        if notes:
            log_notes = f"{log_notes}. {notes}"
        
        # Set reference type and id based on whether ticket_id is provided
        reference_type = 'service_ticket' if ticket_id else 'manual_adjustment'
        
        # Store quantity with sign: positive for increase, negative for decrease
        cursor.execute(
            """
            INSERT INTO stock_movements (item_id, movement_type, quantity, reference_type, reference_id, created_by, notes, `condition`)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (item_id, 'MANUAL', quantity, reference_type, ticket_id, user_id, log_notes, condition)
        )
    
    return True