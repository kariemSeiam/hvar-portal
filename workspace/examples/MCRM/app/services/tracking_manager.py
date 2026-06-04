# app/services/tracking_manager.py
"""Tracking management logic."""
# Tracking manager logic here

from app.models import tracking as tracking_model
from app.models import service_ticket as ticket_model
from app.models import customer as customer_model

class TrackingManagerException(Exception):
    """Custom exception for TrackingManager errors."""
    pass

# --- Scan Logging ---

def log_scan(tracking_number, scan_type, user_id, ticket_id=None, location='HUB', notes=None):
    """
    Logs a physical scan event.
    Finds the associated ticket_id if not provided.
    """
    if not ticket_id:
        ticket = find_ticket_by_tracking(tracking_number)
        if ticket:
            ticket_id = ticket['id']

    scan_id = tracking_model.create_scan(
        tracking_number=tracking_number,
        scan_type=scan_type,
        ticket_id=ticket_id,
        user_id=user_id,
        location=location,
        notes=notes
    )
    return scan_id

# --- Lookup Functions ---

def get_tracking_history(tracking_number):
    """Gets the full scan history for a tracking number."""
    return tracking_model.get_scans_by_tracking(tracking_number)

def get_last_scan_status(tracking_number):
    """Gets the most recent scan for a tracking number."""
    return tracking_model.get_last_scan(tracking_number)

def find_ticket_by_tracking(tracking_number):
    """
    Finds a service ticket by searching all relevant tracking number fields.
    Optimized with composite index for fast lookups.
    """
    from app.utils.db import execute_query
    sql = """
        SELECT * FROM service_tickets
        WHERE original_tracking = %s OR new_tracking_send = %s OR new_tracking_receive = %s
        LIMIT 1
    """
    params = (tracking_number, tracking_number, tracking_number)
    result = execute_query(sql, params)
    return result[0] if result else None

def get_tracking_history_for_ticket(ticket_id):
    """
    Gets all tracking scans for a specific ticket.
    """
    from app.utils.db import execute_query
    sql = """
        SELECT id, tracking_number, scan_type, scan_location, reference_type,
               reference_id, created_by, created_at, notes
        FROM tracking_scans
        WHERE reference_type = 'service_ticket' AND reference_id = %s
        ORDER BY created_at ASC
    """
    return execute_query(sql, (ticket_id,))

# --- Universal Scan Context Aggregator ---

def get_full_scan_context(tracking_number):
    """
    Aggregates comprehensive context for a given tracking number.
    This powers the Hub's universal scan feature.
    """
    # Get scan history
    scan_history = get_tracking_history(tracking_number)
    last_scan = scan_history[-1] if scan_history else None
    
    # Find associated ticket
    ticket = find_ticket_by_tracking(tracking_number)
    
    # Initialize context structure
    context = {
        "tracking_number": tracking_number,
        "scan_history": scan_history,
        "current_location": last_scan['scan_location'] if last_scan else None,
        "ticket": None,
        "available_actions": [],
        "warnings": []
    }
    
    # Handle case where no ticket is found
    if not ticket:
        context['warnings'].append("No associated service ticket found.")
        context['available_actions'].append({"action": "create_maintenance_ticket", "label": "إنشاء تذكرة صيانة"})
        return context
    
    # Get customer information
    customer = None
    if ticket['customer_id']:
        customer = customer_model.get_customer_by_id(ticket['customer_id'])
    
    # Get stock items involved
    items = []
    if ticket['id']:
        from app.utils.db import execute_query
        sql = """
            SELECT si.* FROM service_items si
            JOIN stock_items st ON si.item_id = st.id
            WHERE si.ticket_id = %s
        """
        items = execute_query(sql, (ticket['id'],))
    
    # Build ticket context
    context['ticket'] = {
        "id": ticket['id'],
        "type": ticket['service_type'],
        "status": ticket['status'],
        "customer": customer,
        "items": items
    }
    
    # Determine available actions based on current state
    status = ticket['status']
    service_type = ticket['service_type']
    
    if status in ['CONFIRMED', 'PENDING']:
        context['available_actions'].append({"action": "receive", "label": "استلام الشحنة"})
    elif status == 'READY_FOR_DISPATCH':
        context['available_actions'].append({"action": "dispatch", "label": "إرسال الشحنة"})
    elif status == 'IN_PROCESS':
        if service_type == 'maintenance':
            context['available_actions'].append({"action": "move_to_workshop", "label": "نقل إلى الورشة"})
        elif service_type == 'replacement':
            context['available_actions'].append({"action": "prepare_replacement", "label": "تحضير البديل"})
    elif status == 'COMPLETED':
        context['available_actions'].append({"action": "archive", "label": "أرشفة التذكرة"})
    
    # Add warnings for edge cases
    if len(scan_history) == 0:
        context['warnings'].append("No scan history found for this tracking number.")
    
    if ticket and ticket['status'] == 'CANCELLED':
        context['warnings'].append("This ticket has been cancelled.")
    
    return context