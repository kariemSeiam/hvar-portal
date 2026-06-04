# app/services/service_manager.py
"""Service ticket management logic."""
# Service manager logic here
import logging
import random
from datetime import datetime, timedelta

from app.utils.db import execute_insert, execute_query, execute_update, transaction
import pymysql.err

logger = logging.getLogger(__name__)

from app.models import service_ticket as ticket_model, stock as stock_model, customer as customer_model
from app.services import stock_manager, tracking_manager
from app.utils.messages import get_message
from app.utils.phone_normalizer import normalize_to_local_phone, normalize_phone_safe

class ServiceManagerException(Exception):
    """Custom exception for ServiceManager errors."""
    pass

def _check_original_tracking_not_used(original_tracking, cursor, service_type=None):
    """
    Checks if the given original_tracking is already used in any existing ticket.
    CANCELLED tickets are excluded - their tracking numbers can be reused.
    Raises ServiceManagerException if already used.
    """
    if not original_tracking:
        return  # No tracking means no conflict

    cursor.execute(
        "SELECT id, ticket_number, service_type FROM service_tickets WHERE original_tracking = %s AND status != 'CANCELLED'",
        (original_tracking,)
    )
    existing_ticket = cursor.fetchone()

    if existing_ticket:
        raise ServiceManagerException(
            f"{get_message('err_tracking_already_used')} ({existing_ticket['ticket_number']} - {existing_ticket['service_type']}). "
            f"{get_message('err_tracking_used_once')}"
        )

def _check_new_tracking_not_used(tracking_number, cursor, exclude_ticket_id=None):
    """
    Checks if the given tracking number is already used in new_tracking_send or new_tracking_receive
    of any existing ticket. CANCELLED tickets are excluded - their tracking numbers can be reused.
    Raises ServiceManagerException if already used.
    
    Args:
        tracking_number: The tracking number to check
        cursor: Database cursor for executing queries
        exclude_ticket_id: Optional ticket ID to exclude from the check (for updates)
    """
    if not tracking_number:
        return  # No tracking means no conflict

    if exclude_ticket_id:
        cursor.execute(
            """SELECT id, ticket_number, service_type FROM service_tickets 
               WHERE (new_tracking_send = %s OR new_tracking_receive = %s) 
               AND id != %s AND status != 'CANCELLED'""",
            (tracking_number, tracking_number, exclude_ticket_id)
        )
    else:
        cursor.execute(
            """SELECT id, ticket_number, service_type FROM service_tickets 
               WHERE (new_tracking_send = %s OR new_tracking_receive = %s) 
               AND status != 'CANCELLED'""",
            (tracking_number, tracking_number)
        )
    
    existing_ticket = cursor.fetchone()

    if existing_ticket:
        raise ServiceManagerException(
            f"{get_message('err_new_tracking_already_used')} ({existing_ticket['ticket_number']} - {existing_ticket['service_type']}). "
            f"{get_message('err_new_tracking_used_once')}"
        )

def _validate_stock_availability_for_confirmation(cursor, item_id, quantity_needed):
    """
    Validates that there is sufficient available stock for replacement confirmation.
    For replacement tickets, items with direction='send' must have available quantity >= quantity_needed.
    Products can go negative, but available quantity must still meet the requirement.
    
    Args:
        cursor: Database cursor for executing queries
        item_id: The item ID to check
        quantity_needed: The quantity needed for the replacement
        
    Raises:
        ServiceManagerException: If stock is insufficient or unavailable
    """
    cursor.execute(
        "SELECT quantity_on_hand, quantity_reserved, sku, name FROM stock_items WHERE id = %s FOR UPDATE",
        (item_id,)
    )
    item = cursor.fetchone()
    
    if not item:
        raise ServiceManagerException(f"{get_message('not_found_item')} {item_id}")
    
    available = item['quantity_on_hand'] - item['quantity_reserved']
    
    # For replacement confirmation, must have available quantity >= quantity needed
    # Products can go negative in quantity_on_hand, but available must still meet requirement
    if available < quantity_needed:
        raise ServiceManagerException(
            f"{get_message('insufficient_stock')} للقطعة {item['sku']} ({item['name']}). "
            f"المتاح: {available}, المطلوب: {quantity_needed}"
        )

def _upsert_customer_and_get_id(cursor, customer_id=None, name=None, phone=None, phone_secondary=None,
                              governorate=None, city=None, address_details=None, user_id=None):
    """
    Creates or updates a customer within a transaction and returns their ID.
    - If customer_id is provided, updates that customer with any provided data.
    - If not, tries to find customer by phone.
    - If found, updates the customer.
    - If not found, creates a new customer.
    
    Phone numbers are normalized to 01XXXXXXXXX format before storage.
    """
    # Normalize phone numbers to 01XXXXXXXXX format
    normalized_phone = None
    normalized_phone_secondary = None
    
    if phone:
        try:
            normalized_phone = normalize_to_local_phone(phone)
        except Exception as e:
            raise ServiceManagerException(f"Invalid phone number format: {str(e)}")
    
    if phone_secondary:
        try:
            normalized_phone_secondary = normalize_to_local_phone(phone_secondary)
        except Exception:
            # Secondary phone is optional, so if invalid, just skip it
            normalized_phone_secondary = None
    
    customer_data = {
        'name': name, 'phone': normalized_phone, 'phone_secondary': normalized_phone_secondary,
        'governorate': governorate, 'city': city, 'address_details': address_details
    }
    customer_data = {k: v for k, v in customer_data.items() if v is not None}

    if not customer_data and not customer_id:
        raise ServiceManagerException(get_message("err_customer_data_required"))

    final_customer_id = customer_id

    if final_customer_id:
        if customer_data:
            update_fields = [f"{key} = %s" for key in customer_data]
            update_params = list(customer_data.values())
            update_fields.append("updated_by = %s")
            update_params.append(user_id)
            update_params.append(final_customer_id)
            update_sql = f"UPDATE customers SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(update_sql, update_params)
        return final_customer_id

    if not normalized_phone:
        raise ServiceManagerException(get_message("err_phone_required"))

    # Search using normalized phone
    cursor.execute("SELECT id FROM customers WHERE phone = %s", (normalized_phone,))
    existing = cursor.fetchone()

    if existing:
        final_customer_id = existing['id']
        if customer_data:
            update_fields = [f"{key} = %s" for key in customer_data]
            update_params = list(customer_data.values())
            update_fields.append("updated_by = %s")
            update_params.append(user_id)
            update_params.append(final_customer_id)
            update_sql = f"UPDATE customers SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(update_sql, update_params)
        return final_customer_id
    else:
        if 'name' not in customer_data:
            raise ServiceManagerException(get_message("err_name_required"))
        
        customer_data['created_by'] = user_id
        
        columns = '`, `'.join(customer_data.keys())
        placeholders = ', '.join(['%s'] * len(customer_data))
        sql = f"INSERT INTO customers (`{columns}`) VALUES ({placeholders})"
        cursor.execute(sql, list(customer_data.values()))
        new_id = cursor.lastrowid
        if not new_id:
            raise ServiceManagerException(get_message("err_customer_create_failed"))
        return new_id

def _get_last_daily_ticket_number(service_type, cursor):
    """
    Atomically retrieves and increments the daily sequential number for a given service type.
    Uses a dedicated table and provided cursor to prevent race conditions.
    """
    today = datetime.now().date()
    # No longer need type_codes here, as it's for ticket number formatting, not sequence table

    # Use INSERT ... ON DUPLICATE KEY UPDATE to atomically increment the counter
    sql = """
        INSERT INTO ticket_sequences (service_type, sequence_date, sequence_number)
        VALUES (%s, %s, 1)
        ON DUPLICATE KEY UPDATE sequence_number = sequence_number + 1
    """
    params = (service_type, today)

    # Execute the atomic update/insert using the provided cursor
    cursor.execute(sql, params)

    # Now fetch the *current* sequence number after the increment using the provided cursor
    fetch_sql = """
        SELECT sequence_number
        FROM ticket_sequences
        WHERE service_type = %s AND sequence_date = %s
    """
    cursor.execute(fetch_sql, (service_type, today))
    result = cursor.fetchone()

    if result:
        return result['sequence_number']
    return 0 # Should not happen if INSERT ON DUPLICATE always ensures an entry

def _generate_ticket_number(service_type, cursor):
    """
    Generates a unique ticket number with type indicator, date, and atomic sequential number.
    Format: HV{TYPE}{YYMMDD}{NNN} (e.g., HVR251020001)
    """
    type_codes = {
        'replacement': 'R',
        'maintenance': 'M',
        'return': 'T',
        'sell': 'S'
    }
    type_code = type_codes.get(service_type, 'R')

    # Get the atomically incremented sequential number using the provided cursor
    next_daily_num = _get_last_daily_ticket_number(service_type, cursor)

    # Format date and combine
    now = datetime.now()
    date_str = now.strftime('%y%m%d')

    return f"HV{type_code}{date_str}{next_daily_num:03d}"

def _validate_state_transition(ticket, target_state):
    """Validates if a ticket can transition to a new state."""
    if not ticket:
        raise ServiceManagerException(get_message("err_ticket_not_found"))
    
    current_state = ticket['status']
    workflow = ticket['service_type']
    
    # State machine definition
    valid_transitions = {
        'replacement': {
            'PENDING': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['IN_PROCESS', 'CANCELLED'],
            'IN_PROCESS': ['READY_FOR_DISPATCH', 'CANCELLED'],
            'READY_FOR_DISPATCH': ['SENT', 'CANCELLED'],
            'SENT': ['RETURNED', 'CANCELLED'],
            'RETURNED': ['COMPLETED', 'CANCELLED'],
            'COMPLETED': [],
            'CANCELLED': []
        },
        'maintenance': {
            'PENDING': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['IN_PROCESS', 'CANCELLED'],
            'IN_PROCESS': ['READY_FOR_DISPATCH', 'CANCELLED'],
            'READY_FOR_DISPATCH': ['SENT', 'CANCELLED'],
            'SENT': ['COMPLETED', 'CANCELLED'],
            'COMPLETED': [],
            'CANCELLED': []
        },
        'return': {
            'PENDING': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['IN_PROCESS', 'CANCELLED'],
            'IN_PROCESS': ['COMPLETED', 'CANCELLED'],
            'COMPLETED': [],
            'CANCELLED': []
        },
        'sell': {
            'PENDING': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['IN_PROCESS', 'CANCELLED'],
            'IN_PROCESS': ['READY_FOR_DISPATCH', 'CANCELLED'],
            'READY_FOR_DISPATCH': ['SENT', 'CANCELLED'],
            'SENT': ['COMPLETED', 'CANCELLED'],
            'COMPLETED': [],
            'CANCELLED': []
        }
    }
    
    allowed_states = valid_transitions.get(workflow, {}).get(current_state, [])
    if target_state not in allowed_states:
        raise ServiceManagerException(f"{get_message('err_invalid_transition')}: من '{current_state}' إلى '{target_state}' لتذكرة '{workflow}'")

def _calculate_actions_for_ticket(ticket, history=None):
    """Helper function to calculate available actions for a single ticket.
    
    Args:
        ticket: Ticket dict with 'status' and 'service_type'
        history: Optional list of history entries for this ticket
    """
    status = ticket['status']
    workflow = ticket['service_type']
    actions = []

    if workflow == 'replacement':
        if status == 'PENDING':
            actions.extend(['confirm', 'cancel'])
        elif status == 'CONFIRMED':
            actions.extend(['start_preparation', 'cancel'])
        elif status == 'IN_PROCESS':
            actions.extend(['ready_for_dispatch', 'cancel'])
        elif status == 'READY_FOR_DISPATCH':
            actions.extend(['scan_outbound', 'cancel'])
        elif status == 'SENT':
            actions.extend(['scan_inbound', 'cancel'])
        elif status == 'RETURNED':
            actions.extend(['validate_items', 'cancel'])

    elif workflow == 'maintenance':
        if status == 'PENDING':
            actions.extend(['confirm', 'cancel'])
        elif status == 'CONFIRMED':
            actions.extend(['scan_inbound', 'cancel'])
        elif status == 'IN_PROCESS':
            # Check maintenance state by counting IN_PROCESS -> IN_PROCESS history entries only
            # No dependency on note content or service_items - purely based on action sequence
            internal_action_count = 0
            
            if history:
                for entry in history:
                    old_stat = str(entry.get('old_status', '')).strip().upper()
                    new_stat = str(entry.get('new_status', '')).strip().upper()
                    
                    # Count IN_PROCESS -> IN_PROCESS entries (internal maintenance actions)
                    if old_stat == 'IN_PROCESS' and new_stat == 'IN_PROCESS':
                        internal_action_count += 1
            
            # Determine state based on entry count:
            # - 0 entries = maintenance not started → show start_maintenance
            # - 1 entry = start_maintenance was called → show complete_maintenance
            # - 2+ entries = both start_maintenance and complete_maintenance were called → show mark_ready
            
            if internal_action_count == 0:
                # No internal actions, maintenance not started
                actions.extend(['start_maintenance', 'cancel'])
            elif internal_action_count == 1:
                # One internal action means start_maintenance was called
                # Maintenance has started but not completed
                actions.extend(['complete_maintenance', 'cancel'])
            else:
                # Two or more entries means both start_maintenance and complete_maintenance were called
                # Maintenance is completed
                actions.extend(['mark_ready', 'cancel'])
        elif status == 'READY_FOR_DISPATCH':
            actions.extend(['scan_outbound', 'cancel'])
        elif status == 'SENT':
            actions.extend(['mark_delivered', 'cancel'])

    elif workflow == 'return':
        if status == 'PENDING':
            actions.extend(['confirm', 'cancel'])
        elif status == 'CONFIRMED':
            actions.extend(['scan_inbound', 'cancel'])
        elif status == 'IN_PROCESS':
            actions.extend(['validate_items', 'cancel'])

    elif workflow == 'sell':
        if status == 'PENDING':
            actions.extend(['confirm', 'cancel'])
        elif status == 'CONFIRMED':
            actions.extend(['start_preparation', 'cancel'])
        elif status == 'IN_PROCESS':
            actions.extend(['ready_for_dispatch', 'cancel'])
        elif status == 'READY_FOR_DISPATCH':
            actions.extend(['scan_outbound', 'cancel'])
        elif status == 'SENT':
            actions.extend(['confirm_sent', 'cancel'])

    # All active tickets can be cancelled, except for terminal states.
    if status not in ['COMPLETED', 'CANCELLED'] and 'cancel' not in actions:
        actions.append('cancel')

    return actions

def get_available_actions(ticket_id):
    """Gets available actions for a ticket based on its current state and workflow."""
    ticket = ticket_model.get_ticket_by_id(ticket_id)
    if not ticket:
        return []

    # For maintenance tickets, we need history
    history = None
    if ticket['service_type'] == 'maintenance' and ticket['status'] == 'IN_PROCESS':
        history = ticket_model.get_ticket_history(ticket_id)
    
    return _calculate_actions_for_ticket(ticket, history)

def get_available_actions_batch(tickets, history_by_ticket=None):
    """Batch version of get_available_actions for multiple tickets.
    
    Args:
        tickets: List of ticket dicts
        history_by_ticket: Optional dict mapping ticket_id -> list of history entries
    
    Returns:
        Dict mapping ticket_id -> list of available actions
    """
    if history_by_ticket is None:
        history_by_ticket = {}
    
    actions_by_ticket = {}
    for ticket in tickets:
        ticket_id = ticket['id']
        history = history_by_ticket.get(ticket_id, [])
        actions_by_ticket[ticket_id] = _calculate_actions_for_ticket(ticket, history)
    
    return actions_by_ticket

def _update_customer_services(ticket_id):
    """Helper function to update customer_services field."""
    from app.models import customer as customer_model
    ticket = ticket_model.get_ticket_by_id(ticket_id)
    if ticket:
        customer_model.update_customer_services(ticket['customer_id'])

# --- Ticket Creation ---

def _create_ticket_and_items(data, items, cursor, reservation_ids=None):
    """Helper to create ticket and associated items inside a transaction."""
    ticket_id = ticket_model.create_ticket(data)
    logger.info(f"_create_ticket_and_items: ticket_id={ticket_id}, items_count={len(items)}, service_type={data.get('service_type')}")

    for item in items:
        # Validate condition is provided
        condition = item.get('condition')
        if not condition:
            raise ServiceManagerException(f"{get_message('err_condition_required')} {item.get('item_id')}")
        
        # Validate condition value
        from app.utils.validators import validate_condition
        validation_error = validate_condition(condition)
        if validation_error:
            raise ServiceManagerException(f"{get_message('err_invalid_condition')} '{condition}' للقطعة {item.get('item_id')}: {validation_error}")
        
        # Handle price_customer override (optional, for sell tickets)
        # If price_customer is provided, it's an override; if NULL, use stock_items price based on customer_type
        price_customer = item.get('price_customer')
        
        item_sql = "INSERT INTO service_items (ticket_id, item_id, quantity, direction, `condition`, price_customer) VALUES (%s, %s, %s, %s, %s, %s)"
        cursor.execute(item_sql, (ticket_id, item['item_id'], item['quantity'], item['direction'], condition, price_customer))

    if reservation_ids:
        for res_id in reservation_ids:
            res_sql = "UPDATE stock_movements SET reference_id = %s WHERE id = %s AND reference_type = 'service_ticket' AND reference_id IS NULL"
            cursor.execute(res_sql, (ticket_id, res_id))

    return ticket_id

def create_replacement_ticket(customer_id, items, user_id, notes, priority='normal',
                              city=None, governorate=None, address_details=None, original_tracking=None,
                              reason=None, cost_adjustment=None,
                              name=None, phone=None, phone_secondary=None, **kwargs):
    """Create a replacement ticket, creating or updating customer details as needed."""
    from app.models import customer as customer_model

    with transaction() as cursor:
        # Generate ticket number first
        generated_ticket_number = _generate_ticket_number('replacement', cursor)

        # If original_tracking is not provided, use the generated ticket number
        if not original_tracking:
            original_tracking = generated_ticket_number

        # Check if original_tracking is already used before proceeding
        _check_original_tracking_not_used(original_tracking, cursor)

        final_customer_id = _upsert_customer_and_get_id(
            cursor, customer_id=customer_id, name=name, phone=phone, phone_secondary=phone_secondary,
            governorate=governorate, city=city, address_details=address_details, user_id=user_id
        )

        data = {
            'ticket_number': generated_ticket_number,
            'customer_id': final_customer_id,
            'service_type': 'replacement',
            'status': kwargs.get('initial_status', 'PENDING'),
            'priority': priority,
            'reason': reason,
            'created_by': user_id,
            'notes': notes,
            'original_tracking': original_tracking,
            'cost_adjustment': cost_adjustment
        }
        for k in ['source', 'approved_by', 'approved_at', 'new_tracking_send', 'new_tracking_receive']:
            if k in kwargs: data[k] = kwargs[k]
        
        ticket_id = _create_ticket_and_items(data, items, cursor, reservation_ids=kwargs.get('reservation_ids'))

        customer_model.update_customer_services(final_customer_id)

    return ticket_id

def create_maintenance_ticket(customer_id, user_id, notes, priority='normal',
                                reason=None, cost_adjustment=None,
                                original_tracking=None,
                                name=None, phone=None, phone_secondary=None,
                                city=None, governorate=None, address_details=None, items=None, **kwargs):
    """Create a maintenance ticket, creating or updating customer details as needed."""
    from app.models import customer as customer_model
    with transaction() as cursor:
        # Generate ticket number first
        generated_ticket_number = _generate_ticket_number('maintenance', cursor)

        # If original_tracking is not provided, use the generated ticket number
        if not original_tracking:
            original_tracking = generated_ticket_number

        # Check if original_tracking is already used before proceeding
        _check_original_tracking_not_used(original_tracking, cursor)

        final_customer_id = _upsert_customer_and_get_id(
            cursor, customer_id=customer_id, name=name, phone=phone, phone_secondary=phone_secondary,
            governorate=governorate, city=city, address_details=address_details, user_id=user_id
        )

        data = {
            'ticket_number': generated_ticket_number,
            'customer_id': final_customer_id,
            'service_type': 'maintenance',
            'status': kwargs.get('initial_status', 'PENDING'),
            'priority': priority,
            'reason': reason,
            'created_by': user_id,
            'notes': notes,
            'original_tracking': original_tracking,
            'cost_adjustment': cost_adjustment
        }
        for k in ['source', 'approved_by', 'approved_at', 'new_tracking_send', 'new_tracking_receive']:
            if k in kwargs: data[k] = kwargs[k]
        
        ticket_id = _create_ticket_and_items(data, items or [], cursor, reservation_ids=kwargs.get('reservation_ids'))
        customer_model.update_customer_services(final_customer_id)
    return ticket_id

def create_return_ticket(customer_id, user_id, notes, priority='normal',
                         reason=None, cost_adjustment=None,
                         original_tracking=None,
                         name=None, phone=None, phone_secondary=None,
                         city=None, governorate=None, address_details=None, items=None, **kwargs):
    """Create a return ticket, creating or updating customer details as needed."""
    from app.models import customer as customer_model
    with transaction() as cursor:
        # Generate ticket number first
        generated_ticket_number = _generate_ticket_number('return', cursor)

        # If original_tracking is not provided, use the generated ticket number
        if not original_tracking:
            original_tracking = generated_ticket_number

        # Check if original_tracking is already used before proceeding
        _check_original_tracking_not_used(original_tracking, cursor)

        final_customer_id = _upsert_customer_and_get_id(
            cursor, customer_id=customer_id, name=name, phone=phone, phone_secondary=phone_secondary,
            governorate=governorate, city=city, address_details=address_details, user_id=user_id
        )

        data = {
            'ticket_number': generated_ticket_number,
            'customer_id': final_customer_id,
            'service_type': 'return',
            'status': kwargs.get('initial_status', 'PENDING'),
            'priority': priority,
            'reason': reason,
            'created_by': user_id,
            'notes': notes,
            'original_tracking': original_tracking,
            'cost_adjustment': cost_adjustment
        }
        for k in ['source', 'approved_by', 'approved_at', 'new_tracking_send', 'new_tracking_receive']:
            if k in kwargs: data[k] = kwargs[k]
        
        ticket_id = _create_ticket_and_items(data, items or [], cursor, reservation_ids=kwargs.get('reservation_ids'))
        customer_model.update_customer_services(final_customer_id)
    return ticket_id

def create_sell_ticket(customer_id, items, user_id, notes, priority='normal',
                       city=None, governorate=None, address_details=None, original_tracking=None,
                       reason=None, cost_adjustment=None,
                       name=None, phone=None, phone_secondary=None, customer_type='customer', **kwargs):
    """Create a sell ticket, creating or updating customer details as needed."""
    from app.models import customer as customer_model
    from app.models import stock as stock_model

    if not items:
        raise ServiceManagerException(get_message("items_required"))

    # Validate items exist in stock (products and parts both allowed; parts get reserved at CONFIRMED)
    with transaction() as cursor:
        for item in items:
            item_info = stock_model.get_stock_item_by_id(item['item_id'])
            if not item_info:
                raise ServiceManagerException(f"العنصر {item['item_id']} غير موجود في المخزون")

    with transaction() as cursor:
        # Generate ticket number first
        generated_ticket_number = _generate_ticket_number('sell', cursor)

        # If original_tracking is not provided, use the generated ticket number
        if not original_tracking:
            original_tracking = generated_ticket_number

        # Check if original_tracking is already used before proceeding
        _check_original_tracking_not_used(original_tracking, cursor)

        final_customer_id = _upsert_customer_and_get_id(
            cursor, customer_id=customer_id, name=name, phone=phone, phone_secondary=phone_secondary,
            governorate=governorate, city=city, address_details=address_details, user_id=user_id
        )

        data = {
            'ticket_number': generated_ticket_number,
            'customer_id': final_customer_id,
            'service_type': 'sell',
            'status': kwargs.get('initial_status', 'PENDING'),
            'priority': priority,
            'reason': reason,
            'created_by': user_id,
            'notes': notes,
            'original_tracking': original_tracking,
            'cost_adjustment': cost_adjustment,
            'customer_type': customer_type
        }
        for k in ['source', 'approved_by', 'approved_at', 'new_tracking_send', 'new_tracking_receive']:
            if k in kwargs: data[k] = kwargs[k]
        
        ticket_id = _create_ticket_and_items(data, items, cursor, reservation_ids=kwargs.get('reservation_ids'))

        customer_model.update_customer_services(final_customer_id)

    return ticket_id

# --- State Machine Workflows ---

def confirm_replacement(ticket_id, user_id, city=None, governorate=None, address_details=None, original_tracking=None, new_tracking_send=None, new_tracking_receive=None, cost_adjustment=0, notes='', items=None, phone=None, phone_secondary=None, name=None, customer_id=None, priority=None, reason=None):
    """Confirm a replacement ticket and reserve stock for items to be sent."""
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        _validate_state_transition(ticket, 'CONFIRMED')
        
        # Handle customer switching or customer updates
        final_customer_id = ticket['customer_id']
        
        if customer_id and customer_id != ticket['customer_id']:
            # Switch to different customer
            final_customer_id = customer_id
            cursor.execute("UPDATE service_tickets SET customer_id = %s WHERE id = %s", (customer_id, ticket_id))
        elif name or phone or phone_secondary or city or governorate or address_details:
            # Update current customer or create new customer
            if name or phone:
                # Create new customer or find existing by phone
                final_customer_id = _upsert_customer_and_get_id(
                    cursor, customer_id=final_customer_id, name=name, phone=phone, phone_secondary=phone_secondary,
                    governorate=governorate, city=city, address_details=address_details, user_id=user_id
                )
                if final_customer_id != ticket['customer_id']:
                    cursor.execute("UPDATE service_tickets SET customer_id = %s WHERE id = %s", (final_customer_id, ticket_id))
            else:
                # Update existing customer fields
                update_fields = []
                update_params = []
                
                if city:
                    update_fields.append("city = %s")
                    update_params.append(city)
                if governorate:
                    update_fields.append("governorate = %s")
                    update_params.append(governorate)
                if address_details:
                    update_fields.append("address_details = %s")
                    update_params.append(address_details)
                if phone:
                    update_fields.append("phone = %s")
                    update_params.append(phone)
                if phone_secondary:
                    update_fields.append("phone_secondary = %s")
                    update_params.append(phone_secondary)
                
                if update_fields:
                    update_params.append(final_customer_id)
                    update_sql = f"UPDATE customers SET {', '.join(update_fields)} WHERE id = %s"
                    cursor.execute(update_sql, update_params)
        
        # Update items if provided
        if items:
            # Clear existing items
            cursor.execute("DELETE FROM service_items WHERE ticket_id = %s", (ticket_id,))
            
            # Add new items
            for item in items:
                # Validate condition is provided
                condition = item.get('condition')
                if not condition:
                    raise ServiceManagerException(f"{get_message('err_condition_required')} {item.get('item_id')}")
                
                # Validate condition value
                from app.utils.validators import validate_condition
                validation_error = validate_condition(condition)
                if validation_error:
                    raise ServiceManagerException(f"{get_message('err_invalid_condition')} '{condition}' للقطعة {item.get('item_id')}: {validation_error}")
                
                item_sql = "INSERT INTO service_items (ticket_id, item_id, quantity, direction, `condition`) VALUES (%s, %s, %s, %s, %s)"
                cursor.execute(item_sql, (ticket_id, item['item_id'], item['quantity'], item['direction'], condition))
        
        # Update ticket with confirmation data
        update_fields = []
        update_params = []
            
        # Note: original_tracking cannot be updated during confirmation
        # if original_tracking:
        #     update_fields.append("original_tracking = %s")
        #     update_params.append(original_tracking)
        
        # Validate new tracking numbers before updating
        if new_tracking_send:
            _check_new_tracking_not_used(new_tracking_send, cursor, exclude_ticket_id=ticket_id)
            update_fields.append("new_tracking_send = %s")
            update_params.append(new_tracking_send)

        if new_tracking_receive:
            _check_new_tracking_not_used(new_tracking_receive, cursor, exclude_ticket_id=ticket_id)
            update_fields.append("new_tracking_receive = %s")
            update_params.append(new_tracking_receive)

        if cost_adjustment != 0:
            update_fields.append("cost_adjustment = %s")
            update_params.append(cost_adjustment)
            
        # Update ticket fields if provided
        if priority:
            update_fields.append("priority = %s")
            update_params.append(priority)
            
        if reason:
            update_fields.append("reason = %s")
            update_params.append(reason)
            
        if notes:
            update_fields.append("notes = %s")
            update_params.append(notes)
            
        # Update ticket fields (but NOT status - update_ticket_status will do that)
        if update_fields:
            update_params.append(ticket_id)
            update_sql = f"UPDATE service_tickets SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(update_sql, update_params)
        
        # Reserve stock for items to be sent (replacement tickets only)
        if ticket['service_type'] == 'replacement':
            cursor.execute("SELECT item_id, quantity FROM service_items WHERE ticket_id = %s AND direction = 'send'", (ticket_id,))
            items_to_send = cursor.fetchall()

            if not items_to_send:
                raise ServiceManagerException(get_message("err_no_items_to_send"))

            # Validate stock availability before reserving (for replacement tickets only)
            for item in items_to_send:
                _validate_stock_availability_for_confirmation(cursor, item['item_id'], item['quantity'])
                stock_manager.reserve_stock(item['item_id'], item['quantity'], ticket_id, user_id)
        
        elif ticket['service_type'] == 'return':
            # For return tickets, reserve stock without validation (return doesn't affect stock negatively)
            cursor.execute("SELECT item_id, quantity FROM service_items WHERE ticket_id = %s AND direction = 'send'", (ticket_id,))
            items_to_send = cursor.fetchall()

            if not items_to_send:
                raise ServiceManagerException(get_message("err_no_items_to_send"))

            for item in items_to_send:
                stock_manager.reserve_stock(item['item_id'], item['quantity'], ticket_id, user_id)
        

        # Log the status change with notes (this will update status from PENDING to CONFIRMED)
        confirmation_notes = notes if notes else get_message("note_confirmed_reserved")
        ticket_model.update_ticket_status(ticket_id, 'CONFIRMED', user_id, confirmation_notes)

        # Update customer_services field
        _update_customer_services(ticket_id)
    return True

def confirm_maintenance(ticket_id, user_id, new_tracking_send=None, new_tracking_receive=None, cost_adjustment=0, notes='', items=None, phone=None, phone_secondary=None, name=None, customer_id=None, priority=None, reason=None):
    """Confirm a maintenance ticket."""
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        _validate_state_transition(ticket, 'CONFIRMED')

        # Handle customer switching or customer updates
        final_customer_id = ticket['customer_id']
        
        if customer_id and customer_id != ticket['customer_id']:
            # Switch to different customer
            final_customer_id = customer_id
            cursor.execute("UPDATE service_tickets SET customer_id = %s WHERE id = %s", (customer_id, ticket_id))
        elif name or phone or phone_secondary:
            # Update current customer or create new customer
            if name or phone:
                # Create new customer or find existing by phone
                final_customer_id = _upsert_customer_and_get_id(
                    cursor, customer_id=final_customer_id, name=name, phone=phone, phone_secondary=phone_secondary,
                    governorate=None, city=None, address_details=None, user_id=user_id
                )
                if final_customer_id != ticket['customer_id']:
                    cursor.execute("UPDATE service_tickets SET customer_id = %s WHERE id = %s", (final_customer_id, ticket_id))
            else:
                # Update existing customer fields
                update_fields = []
                update_params = []
                
                if phone:
                    update_fields.append("phone = %s")
                    update_params.append(phone)
                if phone_secondary:
                    update_fields.append("phone_secondary = %s")
                    update_params.append(phone_secondary)
                
                if update_fields:
                    update_params.append(final_customer_id)
                    update_sql = f"UPDATE customers SET {', '.join(update_fields)} WHERE id = %s"
                    cursor.execute(update_sql, update_params)

        # Update items if provided
        if items:
            # Clear existing items
            cursor.execute("DELETE FROM service_items WHERE ticket_id = %s", (ticket_id,))
            
            # Add new items
            for item in items:
                # Validate condition is provided
                condition = item.get('condition')
                if not condition:
                    raise ServiceManagerException(f"{get_message('err_condition_required')} {item.get('item_id')}")
                
                # Validate condition value
                from app.utils.validators import validate_condition
                validation_error = validate_condition(condition)
                if validation_error:
                    raise ServiceManagerException(f"{get_message('err_invalid_condition')} '{condition}' للقطعة {item.get('item_id')}: {validation_error}")
                
                item_sql = "INSERT INTO service_items (ticket_id, item_id, quantity, direction, `condition`) VALUES (%s, %s, %s, %s, %s)"
                cursor.execute(item_sql, (ticket_id, item['item_id'], item['quantity'], item['direction'], condition))

        # Update ticket with confirmation data
        update_fields = []
        update_params = []

        # Validate new tracking numbers before updating
        if new_tracking_send:
            _check_new_tracking_not_used(new_tracking_send, cursor, exclude_ticket_id=ticket_id)
            update_fields.append("new_tracking_send = %s")
            update_params.append(new_tracking_send)

        if new_tracking_receive:
            _check_new_tracking_not_used(new_tracking_receive, cursor, exclude_ticket_id=ticket_id)
            update_fields.append("new_tracking_receive = %s")
            update_params.append(new_tracking_receive)

        if cost_adjustment != 0:
            update_fields.append("cost_adjustment = %s")
            update_params.append(cost_adjustment)
            
        if priority:
            update_fields.append("priority = %s")
            update_params.append(priority)
            
        if reason:
            update_fields.append("reason = %s")
            update_params.append(reason)
            
        if notes:
            update_fields.append("notes = %s")
            update_params.append(notes)
            
        # Update ticket fields (but NOT status - update_ticket_status will do that)
        if update_fields:
            update_params.append(ticket_id)
            update_sql = f"UPDATE service_tickets SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(update_sql, update_params)
            
        # Log the status change with notes (this will update status from PENDING to CONFIRMED)
        confirmation_notes = notes if notes else get_message("note_maintenance_confirmed")
        ticket_model.update_ticket_status(ticket_id, 'CONFIRMED', user_id, confirmation_notes)
        
        # Update customer_services field
        _update_customer_services(ticket_id)
    return True

def confirm_return(ticket_id, user_id, new_tracking_send=None, new_tracking_receive=None, cost_adjustment=0, notes='', items=None, phone=None, phone_secondary=None, name=None, customer_id=None, priority=None, reason=None, city=None, governorate=None, address_details=None):
    """Confirm a return ticket."""
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        _validate_state_transition(ticket, 'CONFIRMED')

        # Handle customer switching or customer updates
        final_customer_id = ticket['customer_id']
        
        if customer_id and customer_id != ticket['customer_id']:
            # Switch to different customer
            final_customer_id = customer_id
            cursor.execute("UPDATE service_tickets SET customer_id = %s WHERE id = %s", (customer_id, ticket_id))
        elif name or phone or phone_secondary or city or governorate or address_details:
            # Update current customer or create new customer
            if name or phone:
                # Create new customer or find existing by phone
                final_customer_id = _upsert_customer_and_get_id(
                    cursor, customer_id=final_customer_id, name=name, phone=phone, phone_secondary=phone_secondary,
                    governorate=governorate, city=city, address_details=address_details, user_id=user_id
                )
                if final_customer_id != ticket['customer_id']:
                    cursor.execute("UPDATE service_tickets SET customer_id = %s WHERE id = %s", (final_customer_id, ticket_id))
            else:
                # Update existing customer fields
                update_fields = []
                update_params = []
                
                if city:
                    update_fields.append("city = %s")
                    update_params.append(city)
                if governorate:
                    update_fields.append("governorate = %s")
                    update_params.append(governorate)
                if address_details:
                    update_fields.append("address_details = %s")
                    update_params.append(address_details)
                if phone:
                    update_fields.append("phone = %s")
                    update_params.append(phone)
                if phone_secondary:
                    update_fields.append("phone_secondary = %s")
                    update_params.append(phone_secondary)
                
                if update_fields:
                    update_params.append(final_customer_id)
                    update_sql = f"UPDATE customers SET {', '.join(update_fields)} WHERE id = %s"
                    cursor.execute(update_sql, update_params)

        # Update items if provided
        if items:
            # Clear existing items
            cursor.execute("DELETE FROM service_items WHERE ticket_id = %s", (ticket_id,))
            
            # Add new items
            for item in items:
                # Validate condition is provided
                condition = item.get('condition')
                if not condition:
                    raise ServiceManagerException(f"{get_message('err_condition_required')} {item.get('item_id')}")
                
                # Validate condition value
                from app.utils.validators import validate_condition
                validation_error = validate_condition(condition)
                if validation_error:
                    raise ServiceManagerException(f"{get_message('err_invalid_condition')} '{condition}' للقطعة {item.get('item_id')}: {validation_error}")
                
                item_sql = "INSERT INTO service_items (ticket_id, item_id, quantity, direction, `condition`) VALUES (%s, %s, %s, %s, %s)"
                cursor.execute(item_sql, (ticket_id, item['item_id'], item['quantity'], item['direction'], condition))

        # Update ticket with confirmation data
        update_fields = []
        update_params = []

        # Validate new tracking numbers before updating
        if new_tracking_send:
            _check_new_tracking_not_used(new_tracking_send, cursor, exclude_ticket_id=ticket_id)
            update_fields.append("new_tracking_send = %s")
            update_params.append(new_tracking_send)

        if new_tracking_receive:
            _check_new_tracking_not_used(new_tracking_receive, cursor, exclude_ticket_id=ticket_id)
            update_fields.append("new_tracking_receive = %s")
            update_params.append(new_tracking_receive)

        if cost_adjustment != 0:
            update_fields.append("cost_adjustment = %s")
            update_params.append(cost_adjustment)

        if priority:
            update_fields.append("priority = %s")
            update_params.append(priority)
            
        if reason:
            update_fields.append("reason = %s")
            update_params.append(reason)
            
        if notes:
            update_fields.append("notes = %s")
            update_params.append(notes)
            
        # Update ticket fields (but NOT status - update_ticket_status will do that)
        if update_fields:
            update_params.append(ticket_id)
            update_sql = f"UPDATE service_tickets SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(update_sql, update_params)
            
        # Log the status change with notes (this will update status from PENDING to CONFIRMED)
        confirmation_notes = notes if notes else get_message("note_return_confirmed")
        ticket_model.update_ticket_status(ticket_id, 'CONFIRMED', user_id, confirmation_notes)
        
        # Update customer_services field
        _update_customer_services(ticket_id)
    return True

def confirm_sell(ticket_id, user_id, city=None, governorate=None, address_details=None, original_tracking=None, new_tracking_send=None, new_tracking_receive=None, cost_adjustment=0, notes='', items=None, phone=None, phone_secondary=None, name=None, customer_id=None, priority=None, reason=None):
    """Confirm a sell ticket and reserve stock for parts to be sent (products are skipped)."""
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        _validate_state_transition(ticket, 'CONFIRMED')
        
        # Handle customer switching or customer updates
        final_customer_id = ticket['customer_id']
        
        if customer_id and customer_id != ticket['customer_id']:
            # Switch to different customer
            final_customer_id = customer_id
            cursor.execute("UPDATE service_tickets SET customer_id = %s WHERE id = %s", (customer_id, ticket_id))
        elif name or phone or phone_secondary or city or governorate or address_details:
            # Update current customer or create new customer
            if name or phone:
                # Create new customer or find existing by phone
                final_customer_id = _upsert_customer_and_get_id(
                    cursor, customer_id=final_customer_id, name=name, phone=phone, phone_secondary=phone_secondary,
                    governorate=governorate, city=city, address_details=address_details, user_id=user_id
                )
                if final_customer_id != ticket['customer_id']:
                    cursor.execute("UPDATE service_tickets SET customer_id = %s WHERE id = %s", (final_customer_id, ticket_id))
            else:
                # Update existing customer fields
                update_fields = []
                update_params = []
                
                if city:
                    update_fields.append("city = %s")
                    update_params.append(city)
                if governorate:
                    update_fields.append("governorate = %s")
                    update_params.append(governorate)
                if address_details:
                    update_fields.append("address_details = %s")
                    update_params.append(address_details)
                if phone:
                    update_fields.append("phone = %s")
                    update_params.append(phone)
                if phone_secondary:
                    update_fields.append("phone_secondary = %s")
                    update_params.append(phone_secondary)
                
                if update_fields:
                    update_params.append(final_customer_id)
                    update_sql = f"UPDATE customers SET {', '.join(update_fields)} WHERE id = %s"
                    cursor.execute(update_sql, update_params)
        
        # Update items if provided
        if items:
            # Clear existing items
            cursor.execute("DELETE FROM service_items WHERE ticket_id = %s", (ticket_id,))
            
            # Add new items
            for item in items:
                # Validate condition is provided
                condition = item.get('condition')
                if not condition:
                    raise ServiceManagerException(f"{get_message('err_condition_required')} {item.get('item_id')}")
                
                # Validate condition value
                from app.utils.validators import validate_condition
                validation_error = validate_condition(condition)
                if validation_error:
                    raise ServiceManagerException(f"{get_message('err_invalid_condition')} '{condition}' للقطعة {item.get('item_id')}: {validation_error}")
                
                # Handle price_customer override for sell tickets
                # If price_customer is provided, it's an override; if NULL, use stock_items price based on customer_type
                price_customer = item.get('price_customer')
                
                item_sql = "INSERT INTO service_items (ticket_id, item_id, quantity, direction, `condition`, price_customer) VALUES (%s, %s, %s, %s, %s, %s)"
                cursor.execute(item_sql, (ticket_id, item['item_id'], item['quantity'], item['direction'], condition, price_customer))
        
        # Update ticket with confirmation data
        update_fields = []
        update_params = []
            
        # Validate new tracking numbers before updating
        if new_tracking_send:
            _check_new_tracking_not_used(new_tracking_send, cursor, exclude_ticket_id=ticket_id)
            update_fields.append("new_tracking_send = %s")
            update_params.append(new_tracking_send)
        
        if new_tracking_receive:
            _check_new_tracking_not_used(new_tracking_receive, cursor, exclude_ticket_id=ticket_id)
            update_fields.append("new_tracking_receive = %s")
            update_params.append(new_tracking_receive)
        
        if cost_adjustment != 0:
            update_fields.append("cost_adjustment = %s")
            update_params.append(cost_adjustment)
            
        # Update ticket fields if provided
        if priority:
            update_fields.append("priority = %s")
            update_params.append(priority)
            
        if reason:
            update_fields.append("reason = %s")
            update_params.append(reason)
            
        if notes:
            update_fields.append("notes = %s")
            update_params.append(notes)
        
        # Update ticket fields (but NOT status - update_ticket_status will do that)
        if update_fields:
            update_params.append(ticket_id)
            update_sql = f"UPDATE service_tickets SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(update_sql, update_params)
        
        # Reserve stock for parts only (products = reference only, no reservation)
        cursor.execute("""
            SELECT si.item_id, si.quantity 
            FROM service_items si
            JOIN stock_items st ON si.item_id = st.id
            WHERE si.ticket_id = %s AND si.direction = 'send' AND st.type = 'part'
        """, (ticket_id,))
        items_to_send = cursor.fetchall()

        # Validate stock availability and reserve for parts only (products-only sells skip reservation)
        for item in items_to_send:
            _validate_stock_availability_for_confirmation(cursor, item['item_id'], item['quantity'])
            stock_manager.reserve_stock(item['item_id'], item['quantity'], ticket_id, user_id)

        # Log the status change with notes (this will update status from PENDING to CONFIRMED)
        confirmation_notes = notes if notes else "تم تأكيد تذكرة البيع وحجز المخزون."
        ticket_model.update_ticket_status(ticket_id, 'CONFIRMED', user_id, confirmation_notes)

        # Update customer_services field
        _update_customer_services(ticket_id)
    return True

def start_preparation(ticket_id, user_id, notes='', cost_adjustment=0):
    """Start preparation phase for replacement ticket."""
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        _validate_state_transition(ticket, 'IN_PROCESS')
        
        # Update cost adjustment if provided
        if cost_adjustment != 0:
            cursor.execute("UPDATE service_tickets SET cost_adjustment = cost_adjustment + %s WHERE id = %s", (cost_adjustment, ticket_id))
        
        # Log the status change with notes
        preparation_notes = notes if notes else "بدأ المركز في التجهيز."
        ticket_model.update_ticket_status(ticket_id, 'IN_PROCESS', user_id, preparation_notes)
        
        # Update customer_services field
        _update_customer_services(ticket_id)
    return True

def mark_delivered(ticket_id, user_id, notes='', cost_adjustment=0, item_validations=None):
    """Mark maintenance ticket as delivered to customer and complete it."""
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        _validate_state_transition(ticket, 'COMPLETED')
        
        # Update cost adjustment if provided
        if cost_adjustment != 0:
            cursor.execute("UPDATE service_tickets SET cost_adjustment = cost_adjustment + %s WHERE id = %s", (cost_adjustment, ticket_id))
        
        # Process item validations if provided
        validation_summary = []
        if item_validations:
            cursor.execute("SELECT item_id, quantity FROM service_items WHERE ticket_id = %s AND direction = 'receive'", (ticket_id,))
            items_to_receive = cursor.fetchall()
            
            for item in items_to_receive:
                # Find validation for this item
                validation = next((v for v in item_validations if v['item_id'] == item['item_id']), None)
                if validation:
                    condition = validation.get('condition')
                    if not condition:
                        raise ServiceManagerException(f"{get_message('err_condition_required')} {item['item_id']}")
                    
                    # Validate condition value
                    from app.utils.validators import validate_condition
                    validation_error = validate_condition(condition)
                    if validation_error:
                        raise ServiceManagerException(f"{get_message('err_invalid_condition')} '{condition}' للقطعة {item['item_id']}: {validation_error}")
                    quantity = validation.get('quantity', item['quantity'])
                    
                    # Get item details for logging
                    cursor.execute("SELECT sku, name FROM stock_items WHERE id = %s", (item['item_id'],))
                    item_details = cursor.fetchone()
                    item_name = item_details['name'] if item_details else f"{get_message('not_found_item')} {item['item_id']}"
                    item_sku = item_details['sku'] if item_details else f"{get_message('note_sku_fallback')}-{item['item_id']}"
                    
                    # Update item condition
                    cursor.execute("UPDATE service_items SET `condition` = %s, quantity = %s WHERE ticket_id = %s AND item_id = %s AND direction = 'receive'", 
                                  (condition, quantity, ticket_id, item['item_id']))
                    
                    # Process stock based on condition with detailed logging
                    if condition == 'valid':
                        stock_manager.process_return(item['item_id'], quantity, 'valid', ticket_id, user_id)
                        validation_summary.append(f"✓ {item_sku} ({item_name}): {quantity} {get_message('note_validated_good')}")
                    elif condition == 'damaged':
                        stock_manager.process_return(item['item_id'], quantity, 'damaged', ticket_id, user_id)
                        validation_summary.append(f"✗ {item_sku} ({item_name}): {quantity} {get_message('note_marked_damaged')}")
                    else:
                        validation_summary.append(f"? {item_sku} ({item_name}): {quantity} {get_message('note_condition_unspecified')}")
        
        # Log scan event if tracking exists
        if ticket.get('new_tracking_send'):
            tracking_manager.log_scan(ticket['new_tracking_send'], 'delivered', user_id, ticket_id)
        
        # Log the status change with notes
        if notes:
            delivered_notes = notes
        else:
            delivered_notes = get_message("note_delivered")
        
        # Add validation summary to notes if available
        if validation_summary:
            validation_summary_str = '. '.join(validation_summary)
            delivered_notes = f"{delivered_notes}. {validation_summary_str}."
        
        ticket_model.update_ticket_status(ticket_id, 'COMPLETED', user_id, delivered_notes)
        
        # Update customer_services field
        _update_customer_services(ticket_id)
    return True

def start_maintenance(ticket_id, user_id, notes=''):
    """Start maintenance work on a ticket."""
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        if not ticket:
            raise ServiceManagerException(get_message("err_ticket_not_found"))
        
        if ticket['service_type'] != 'maintenance':
            raise ServiceManagerException(get_message("err_maintenance_only"))
            
        if ticket['status'] != 'IN_PROCESS':
            raise ServiceManagerException(f"{get_message('err_cannot_start_maintenance')} '{ticket['status']}'")
            
        # Log the action in ticket history, but don't change the main status
        maintenance_notes = notes if notes else get_message("note_maintenance_started")
        ticket_model.log_status_change(ticket_id, ticket['status'], ticket['status'], user_id, maintenance_notes)
        
    return True

def ready_for_dispatch(ticket_id, user_id, notes='', cost_adjustment=0):
    """Mark ticket as ready for dispatch."""
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        _validate_state_transition(ticket, 'READY_FOR_DISPATCH')
        
        # Update cost adjustment if provided
        if cost_adjustment != 0:
            cursor.execute("UPDATE service_tickets SET cost_adjustment = cost_adjustment + %s WHERE id = %s", (cost_adjustment, ticket_id))
        
        # Log the status change with notes
        dispatch_notes = notes if notes else "العبوة جاهزة للشحن."
        ticket_model.update_ticket_status(ticket_id, 'READY_FOR_DISPATCH', user_id, dispatch_notes)
    return True

def scan_outbound(ticket_id, tracking_number, user_id, notes='', cost_adjustment=0):
    """Scan outbound package and mark as sent."""
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        _validate_state_transition(ticket, 'SENT')
        
        # Validate new tracking number before updating
        _check_new_tracking_not_used(tracking_number, cursor, exclude_ticket_id=ticket_id)
        
        # Update tracking and cost adjustment (but NOT status - update_ticket_status will do that)
        update_fields = ["new_tracking_send = %s"]
        update_params = [tracking_number]
        
        if cost_adjustment != 0:
            update_fields.append("cost_adjustment = cost_adjustment + %s")
            update_params.append(cost_adjustment)
        
        if update_fields:  # Only update if there are fields to update
            update_params.append(ticket_id)
            update_sql = f"UPDATE service_tickets SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(update_sql, update_params)
        
        # Handle stock operations based on service type
        stock_summary = []

        if ticket['service_type'] in ['replacement', 'return']:
            # For replacement and return: Commit existing reservations
            cursor.execute("""
                SELECT sm.id, sm.item_id, sm.quantity, si.sku, si.name
                FROM stock_movements sm
                JOIN stock_items si ON sm.item_id = si.id
                WHERE sm.reference_id = %s AND sm.movement_type = 'RESERVE'
            """, (ticket_id,))
            reservations = cursor.fetchall()

            if not reservations:
                raise ServiceManagerException(get_message("err_no_reservations"))

            for res in reservations:
                stock_manager.commit_reservation(res['id'], user_id, cursor)
                stock_summary.append(f"📦 {res['sku']} ({res['name']}): {res['quantity']} {get_message('note_units_dispatched')}")

        elif ticket['service_type'] == 'sell':
            # For sell: Commit reservations only for parts (skip products)
            cursor.execute("""
                SELECT sm.id, sm.item_id, sm.quantity, si.sku, si.name
                FROM stock_movements sm
                JOIN stock_items si ON sm.item_id = si.id
                WHERE sm.reference_id = %s AND sm.movement_type = 'RESERVE' AND si.type = 'part'
            """, (ticket_id,))
            reservations = cursor.fetchall()

            if not reservations:
                raise ServiceManagerException(get_message("err_no_reservations"))

            for res in reservations:
                stock_manager.commit_reservation(res['id'], user_id, cursor)
                stock_summary.append(f"📦 {res['sku']} ({res['name']}): {res['quantity']} {get_message('note_units_dispatched')}")

        elif ticket['service_type'] == 'maintenance':
            # For maintenance: NO stock operations - maintenance tickets are documentation only
            pass

        tracking_manager.log_scan(tracking_number, 'OUTBOUND_TO_CUSTOMER', user_id, ticket_id)
        
        # Log the status change with detailed stock summary (this will update status from READY_FOR_DISPATCH to SENT)
        if notes:
            sent_notes = notes
        else:
            stock_info = f"{'; '.join(stock_summary)}" if stock_summary else ""
            sent_notes = f"تم إرسال العبوة برقم التتبع: {tracking_number}." + (f" {stock_info}" if stock_info else "")
        ticket_model.update_ticket_status(ticket_id, 'SENT', user_id, sent_notes)
    return True

def scan_inbound(ticket_id, tracking_number, user_id, notes='', cost_adjustment=0):
    """Scan inbound package from customer."""
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        
        # For maintenance and return tickets, scan_inbound moves from CONFIRMED to IN_PROCESS
        if ticket['status'] == 'CONFIRMED' and ticket['service_type'] in ['maintenance', 'return']:
            _validate_state_transition(ticket, 'IN_PROCESS')
            
            # Validate new tracking number before updating
            _check_new_tracking_not_used(tracking_number, cursor, exclude_ticket_id=ticket_id)
            
            # Update tracking and cost adjustment (but NOT status - update_ticket_status will do that)
            update_fields = ["new_tracking_receive = %s"]
            update_params = [tracking_number]
            
            if cost_adjustment != 0:
                update_fields.append("cost_adjustment = cost_adjustment + %s")
                update_params.append(cost_adjustment)
            
            if update_fields:  # Only update if there are fields to update
                update_params.append(ticket_id)
                update_sql = f"UPDATE service_tickets SET {', '.join(update_fields)} WHERE id = %s"
                cursor.execute(update_sql, update_params)
            
            tracking_manager.log_scan(tracking_number, 'INBOUND_FROM_CUSTOMER', user_id, ticket_id)
            
            # Log the status change with notes (this will update status from CONFIRMED to IN_PROCESS)
            received_notes = notes if notes else f"تم استلام العبوة برقم التتبع: {tracking_number}."
            ticket_model.update_ticket_status(ticket_id, 'IN_PROCESS', user_id, received_notes)
            
        # For replacement tickets, scan_inbound moves from SENT to RETURNED (received in hub)
        # For sell tickets, use confirm_sent action instead (no RETURNED state)
        elif ticket['status'] == 'SENT' and ticket['service_type'] == 'replacement':
            _validate_state_transition(ticket, 'RETURNED')

            # Validate new tracking number before updating
            _check_new_tracking_not_used(tracking_number, cursor, exclude_ticket_id=ticket_id)

            # Update tracking and cost adjustment (but NOT status - update_ticket_status will do that)
            update_fields = ["new_tracking_receive = %s"]
            update_params = [tracking_number]

            if cost_adjustment != 0:
                update_fields.append("cost_adjustment = cost_adjustment + %s")
                update_params.append(cost_adjustment)
            
            if update_fields:  # Only update if there are fields to update
                update_params.append(ticket_id)
                update_sql = f"UPDATE service_tickets SET {', '.join(update_fields)} WHERE id = %s"
                cursor.execute(update_sql, update_params)

            tracking_manager.log_scan(tracking_number, 'INBOUND_FROM_CUSTOMER', user_id, ticket_id)
            
            # Log the status change with notes (this will update status from SENT to RETURNED)
            received_notes = notes if notes else f"تم استلام عبوة الإرجاع في المركز برقم التتبع: {tracking_number}."
            ticket_model.update_ticket_status(ticket_id, 'RETURNED', user_id, received_notes)
    return True

def validate_items(ticket_id, item_validations, user_id, notes='', cost_adjustment=0):
    """Validate received items and update stock with detailed movement tracking."""
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        _validate_state_transition(ticket, 'COMPLETED')
        
        # Update cost adjustment if provided
        if cost_adjustment != 0:
            cursor.execute("UPDATE service_tickets SET cost_adjustment = cost_adjustment + %s WHERE id = %s", (cost_adjustment, ticket_id))
        
        # For sell tickets, validate returned items (parts only) from send direction
        # For other tickets, validate items from receive direction
        if ticket['service_type'] == 'sell':
            cursor.execute("""
                SELECT si.item_id, si.quantity 
                FROM service_items si
                JOIN stock_items st ON si.item_id = st.id
                WHERE si.ticket_id = %s AND si.direction = 'send' AND st.type = 'part'
            """, (ticket_id,))
            items_to_receive = cursor.fetchall()
        else:
            cursor.execute("SELECT item_id, quantity FROM service_items WHERE ticket_id = %s AND direction = 'receive'", (ticket_id,))
            items_to_receive = cursor.fetchall()
        
        validation_summary = []
        
        for item in items_to_receive:
            # Find validation for this item
            validation = next((v for v in item_validations if v['item_id'] == item['item_id']), None)
            if validation:
                condition = validation.get('condition')
                if not condition:
                    raise ServiceManagerException(f"{get_message('err_condition_required')} {item['item_id']}")
                
                # Validate condition value
                from app.utils.validators import validate_condition
                validation_error = validate_condition(condition)
                if validation_error:
                    raise ServiceManagerException(f"{get_message('err_invalid_condition')} '{condition}' للقطعة {item['item_id']}: {validation_error}")
                quantity = validation.get('quantity', item['quantity'])
                
                # Get item details for logging
                cursor.execute("SELECT sku, name FROM stock_items WHERE id = %s", (item['item_id'],))
                item_details = cursor.fetchone()
                item_name = item_details['name'] if item_details else f"{get_message('not_found_item')} {item['item_id']}"
                item_sku = item_details['sku'] if item_details else f"{get_message('note_sku_fallback')}-{item['item_id']}"
                
                # Update item condition (for sell, update send items; for others, update receive items)
                if ticket['service_type'] == 'sell':
                    cursor.execute("UPDATE service_items SET `condition` = %s, quantity = %s WHERE ticket_id = %s AND item_id = %s AND direction = 'send'", 
                                  (condition, quantity, ticket_id, item['item_id']))
                else:
                    cursor.execute("UPDATE service_items SET `condition` = %s, quantity = %s WHERE ticket_id = %s AND item_id = %s AND direction = 'receive'", 
                                  (condition, quantity, ticket_id, item['item_id']))
                
                # Process stock based on condition with detailed logging (only for parts in sell tickets)
                if ticket['service_type'] == 'sell':
                    # For sell tickets, only process parts (already filtered in query above)
                    if condition == 'valid':
                        stock_manager.process_return(item['item_id'], quantity, 'valid', ticket_id, user_id)
                        validation_summary.append(f"✓ {item_sku} ({item_name}): {quantity} {get_message('note_validated_good')}")
                    elif condition == 'damaged':
                        stock_manager.process_return(item['item_id'], quantity, 'damaged', ticket_id, user_id)
                        validation_summary.append(f"✗ {item_sku} ({item_name}): {quantity} {get_message('note_marked_damaged')}")
                    else:
                        validation_summary.append(f"? {item_sku} ({item_name}): {quantity} {get_message('note_condition_unspecified')}")
                else:
                    # For other ticket types, process all items
                    if condition == 'valid':
                        stock_manager.process_return(item['item_id'], quantity, 'valid', ticket_id, user_id)
                        validation_summary.append(f"✓ {item_sku} ({item_name}): {quantity} {get_message('note_validated_good')}")
                    elif condition == 'damaged':
                        stock_manager.process_return(item['item_id'], quantity, 'damaged', ticket_id, user_id)
                        validation_summary.append(f"✗ {item_sku} ({item_name}): {quantity} {get_message('note_marked_damaged')}")
                    else:
                        validation_summary.append(f"? {item_sku} ({item_name}): {quantity} {get_message('note_condition_unspecified')}")

        # Log the status change with detailed validation summary
        if notes:
            validation_notes = notes
        else:
            validation_summary_str = '. '.join(validation_summary)
            validation_notes = f"{get_message('note_validation_processed')}. {validation_summary_str}."
        ticket_model.update_ticket_status(ticket_id, 'COMPLETED', user_id, validation_notes)
        
        # Update customer_services field
        _update_customer_services(ticket_id)
    return True

def mark_sent(ticket_id, tracking_number, user_id, notes=None):
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        _validate_state_transition(ticket, 'SENT')
        
        # Validate new tracking number before updating
        _check_new_tracking_not_used(tracking_number, cursor, exclude_ticket_id=ticket_id)
        
        cursor.execute("UPDATE service_tickets SET new_tracking_send = %s WHERE id = %s", (tracking_number, ticket_id))

        # Handle stock operations based on service type (same logic as scan_outbound)
        stock_summary = []

        if ticket['service_type'] in ['replacement', 'return']:
            # For replacement and return: Commit existing reservations
            cursor.execute("""
                SELECT sm.id, sm.item_id, sm.quantity, si.sku, si.name
                FROM stock_movements sm
                JOIN stock_items si ON sm.item_id = si.id
                WHERE sm.reference_id = %s AND sm.movement_type = 'RESERVE'
            """, (ticket_id,))
            reservations = cursor.fetchall()

            for res in reservations:
                stock_manager.commit_reservation(res['id'], user_id, cursor)
                stock_summary.append(f"📦 {res['sku']} ({res['name']}): {res['quantity']} {get_message('note_units_dispatched')}")

        elif ticket['service_type'] == 'sell':
            # For sell: Commit reservations only for parts (skip products)
            cursor.execute("""
                SELECT sm.id, sm.item_id, sm.quantity, si.sku, si.name
                FROM stock_movements sm
                JOIN stock_items si ON sm.item_id = si.id
                WHERE sm.reference_id = %s AND sm.movement_type = 'RESERVE' AND si.type = 'part'
            """, (ticket_id,))
            reservations = cursor.fetchall()

            if not reservations:
                raise ServiceManagerException(get_message("err_no_reservations"))

            for res in reservations:
                stock_manager.commit_reservation(res['id'], user_id, cursor)
                stock_summary.append(f"📦 {res['sku']} ({res['name']}): {res['quantity']} {get_message('note_units_dispatched')}")

        elif ticket['service_type'] == 'maintenance':
            # For maintenance: NO stock operations - maintenance tickets are documentation only
            pass

        # Log the scan with optional notes (e.g., destination from hub dispatch)
        scan_notes = notes if notes else None
        tracking_manager.log_scan(tracking_number, 'OUTBOUND_TO_CUSTOMER', user_id, ticket_id, notes=scan_notes)

        # Log the status change with detailed stock summary
        stock_info = f"{'; '.join(stock_summary)}" if stock_summary else ""
        if notes:
            # If notes provided (e.g., from hub dispatch), include them in status notes
            sent_notes = f"{notes}. {stock_info}" if stock_info else notes
        else:
            sent_notes = f"تم إرسال المنتج برقم التتبع: {tracking_number}." + (f" {stock_info}" if stock_info else "")
        ticket_model.update_ticket_status(ticket_id, 'SENT', user_id, sent_notes)
    return True

def confirm_sent(ticket_id, user_id, notes='', cost_adjustment=0, item_validations=None):
    """Mark sell ticket as delivered to customer and complete it. Similar to mark_delivered for maintenance."""
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        if ticket['service_type'] != 'sell':
            raise ServiceManagerException(get_message("err_sell_only"))
        _validate_state_transition(ticket, 'COMPLETED')
        
        # Update cost adjustment if provided
        if cost_adjustment != 0:
            cursor.execute("UPDATE service_tickets SET cost_adjustment = cost_adjustment + %s WHERE id = %s", (cost_adjustment, ticket_id))
        
        # Process item validations if provided (for failed send - returned items)
        validation_summary = []
        if item_validations:
            # For sell tickets, returned items are from 'send' direction (parts that were sent but returned)
            cursor.execute("""
                SELECT si.item_id, si.quantity 
                FROM service_items si
                JOIN stock_items st ON si.item_id = st.id
                WHERE si.ticket_id = %s AND si.direction = 'send' AND st.type = 'part'
            """, (ticket_id,))
            items_to_receive = cursor.fetchall()
            
            for item in items_to_receive:
                # Find validation for this item
                validation = next((v for v in item_validations if v['item_id'] == item['item_id']), None)
                if validation:
                    condition = validation.get('condition')
                    if not condition:
                        raise ServiceManagerException(f"{get_message('err_condition_required')} {item['item_id']}")
                    
                    # Validate condition value
                    from app.utils.validators import validate_condition
                    validation_error = validate_condition(condition)
                    if validation_error:
                        raise ServiceManagerException(f"{get_message('err_invalid_condition')} '{condition}' للقطعة {item['item_id']}: {validation_error}")
                    quantity = validation.get('quantity', item['quantity'])
                    
                    # Get item details for logging
                    cursor.execute("SELECT sku, name FROM stock_items WHERE id = %s", (item['item_id'],))
                    item_details = cursor.fetchone()
                    item_name = item_details['name'] if item_details else f"{get_message('not_found_item')} {item['item_id']}"
                    item_sku = item_details['sku'] if item_details else f"{get_message('note_sku_fallback')}-{item['item_id']}"
                    
                    # Update item condition (for sell, update send items)
                    cursor.execute("UPDATE service_items SET `condition` = %s, quantity = %s WHERE ticket_id = %s AND item_id = %s AND direction = 'send'", 
                                  (condition, quantity, ticket_id, item['item_id']))
                    
                    # Process stock based on condition with detailed logging (only for parts in sell tickets)
                    if condition == 'valid':
                        stock_manager.process_return(item['item_id'], quantity, 'valid', ticket_id, user_id)
                        validation_summary.append(f"✓ {item_sku} ({item_name}): {quantity} {get_message('note_validated_good')}")
                    elif condition == 'damaged':
                        stock_manager.process_return(item['item_id'], quantity, 'damaged', ticket_id, user_id)
                        validation_summary.append(f"✗ {item_sku} ({item_name}): {quantity} {get_message('note_marked_damaged')}")
                    else:
                        validation_summary.append(f"? {item_sku} ({item_name}): {quantity} {get_message('note_condition_unspecified')}")
        
        # Log scan event if tracking exists
        if ticket.get('new_tracking_send'):
            tracking_manager.log_scan(ticket['new_tracking_send'], 'delivered', user_id, ticket_id)
        
        # Log the status change with notes
        if notes:
            delivered_notes = notes
        else:
            delivered_notes = get_message("note_delivered")
        
        # Add validation summary to notes if available
        if validation_summary:
            validation_summary_str = '. '.join(validation_summary)
            delivered_notes = f"{delivered_notes}. {validation_summary_str}."
        
        ticket_model.update_ticket_status(ticket_id, 'COMPLETED', user_id, delivered_notes)
        
        # Update customer_services field
        _update_customer_services(ticket_id)
    return True

def complete_ticket(ticket_id, user_id, notes=''):
    """Mark a ticket as completed."""
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        _validate_state_transition(ticket, 'COMPLETED')
        
        # Log the status change with notes
        complete_notes = notes if notes else get_message("ticket_completed")
        ticket_model.update_ticket_status(ticket_id, 'COMPLETED', user_id, complete_notes)
    return True

def receive_return(ticket_id, tracking_number, condition, user_id):
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        _validate_state_transition(ticket, 'COMPLETED')
        
        # Validate new tracking number before updating
        _check_new_tracking_not_used(tracking_number, cursor, exclude_ticket_id=ticket_id)
        
        cursor.execute("UPDATE service_tickets SET new_tracking_receive = %s WHERE id = %s", (tracking_number, ticket_id))
        
        cursor.execute("SELECT item_id, quantity FROM service_items WHERE ticket_id = %s AND direction = 'receive'", (ticket_id,))
        items_to_receive = cursor.fetchall() # This assumes items to receive are predefined
        
        for item in items_to_receive:
            stock_manager.process_return(item['item_id'], item['quantity'], condition, ticket_id, user_id)

        tracking_manager.log_scan(tracking_number, 'INBOUND_FROM_CUSTOMER', user_id, ticket_id)
        ticket_model.update_ticket_status(ticket_id, 'COMPLETED', user_id, f"{get_message('note_return_received_tracking')}: {tracking_number}")
    return True

# ... (Maintenance and Return workflow functions would be implemented similarly) ...

def cancel_ticket(ticket_id, reason, user_id):
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        _validate_state_transition(ticket, 'CANCELLED')

        # Cancel any outstanding reservations for all ticket types that reserve stock
        # (replacement, maintenance, and return tickets all reserve stock)
        cursor.execute("""
            SELECT sm.id FROM stock_movements sm
            WHERE sm.reference_id = %s
            AND sm.reference_type = 'service_ticket'
            AND sm.movement_type = 'RESERVE'
        """, (ticket_id,))
        reservations = cursor.fetchall()
        for res in reservations:
            try:
                stock_manager.cancel_reservation(res['id'], user_id)
            except stock_manager.StockManagerException as e:
                # Ignore errors if reservation was already actioned (committed or cancelled)
                # This is expected behavior - we only want to cancel active reservations
                pass

        ticket_model.update_ticket_status(ticket_id, 'CANCELLED', user_id, reason)
    return True

def delete_ticket(ticket_id, user_id):
    """
    Delete a cancelled ticket permanently.
    Only tickets with CANCELLED status can be deleted.
    This operation is irreversible and removes the ticket and all related data.
    """
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)

        if not ticket:
            raise ServiceManagerException(get_message("err_ticket_not_found"))

        # Only CANCELLED tickets can be deleted
        if ticket['status'] != 'CANCELLED':
            raise ServiceManagerException(get_message("err_only_cancelled_tickets_deletable"))

        # Delete related records in order (respecting foreign key constraints)
        # 1. Delete service items
        cursor.execute("DELETE FROM service_items WHERE ticket_id = %s", (ticket_id,))

        # 2. Delete ticket history
        cursor.execute("DELETE FROM service_ticket_history WHERE ticket_id = %s", (ticket_id,))

        # 3. Delete only RESERVE movements (uncommitted reservations)
        # Keep all other movement types (SEND, RECEIVE, COMMIT, etc.) for audit trail
        # These movements represent actual stock changes and should be preserved
        cursor.execute("""
            DELETE FROM stock_movements
            WHERE reference_type = 'service_ticket'
            AND reference_id = %s
            AND movement_type = 'RESERVE'
        """, (ticket_id,))

        # 4. Delete tracking scans (if any)
        cursor.execute("""
            DELETE FROM tracking_scans
            WHERE reference_type = 'service_ticket'
            AND reference_id = %s
        """, (ticket_id,))

        # 5. Finally, delete the ticket itself
        cursor.execute("DELETE FROM service_tickets WHERE id = %s", (ticket_id,))

        # Update customer_services field for the customer
        if ticket.get('customer_id'):
            from app.models import customer as customer_model
            customer_model.update_customer_services(ticket['customer_id'])

    return True

def complete_maintenance(ticket_id, user_id, notes='', cost_adjustment=0, items=None):
    """Complete maintenance work by processing items with stock impact only. Status remains IN_PROCESS.

    For SEND items: Validates stock availability, decreases quantity_on_hand, and creates SEND stock movement.
    For RECEIVE items: Increases quantity_on_hand (if valid) or quantity_damaged (if damaged), and creates RECEIVE stock movement.
    All stock movements are linked to the maintenance ticket.

    Note: Items are OPTIONAL. If provided, they are used ONLY for stock operations and are NOT saved to service_items table.
    Items set during ticket creation or confirmation remain unchanged in service_items.
    """
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        if not ticket:
            raise ServiceManagerException(get_message("err_ticket_not_found"))

        if ticket['service_type'] != 'maintenance':
            raise ServiceManagerException(get_message("err_maintenance_only"))

        if ticket['status'] != 'IN_PROCESS':
            raise ServiceManagerException(f"{get_message('err_cannot_start_maintenance')} '{ticket['status']}'")

        # Process items WITH stock impact only (does not modify service_items table)
        # Items are now OPTIONAL - if not provided, just log the completion without stock changes
        stock_summary = []

        if items:
            for item in items:
                item_id = item.get('item_id')
                quantity = item.get('quantity', 1)
                direction = item.get('direction', 'SEND')
                condition = item.get('condition', 'valid')

                # Validate direction
                if direction not in ['SEND', 'RECEIVE']:
                    raise ServiceManagerException(f"{get_message('err_invalid_direction')} '{direction}' للقطعة {item_id}")

                # Validate condition
                from app.utils.validators import validate_condition
                validation_error = validate_condition(condition)
                if validation_error:
                    raise ServiceManagerException(f"{get_message('err_invalid_condition')} '{condition}' للقطعة {item_id}: {validation_error}")

                # Validate item exists and get details
                cursor.execute("SELECT id, sku, name FROM stock_items WHERE id = %s FOR UPDATE", (item_id,))
                item_details = cursor.fetchone()
                if not item_details:
                    raise ServiceManagerException(f"{get_message('not_found_item')} {item_id}")

                # Process stock based on direction
                if direction == 'SEND':
                    # Validate stock availability for SEND items
                    _validate_stock_availability_for_confirmation(cursor, item_id, quantity)

                    # Decrease quantity_on_hand
                    cursor.execute(
                        "UPDATE stock_items SET quantity_on_hand = quantity_on_hand - %s WHERE id = %s",
                        (quantity, item_id)
                    )

                    # Log SEND movement
                    stock_model.log_stock_movement(
                        item_id, 'SEND', quantity, 'service_ticket', ticket_id, user_id,
                        condition=condition, notes=f"صيانة: قطع مستخدمة"
                    )

                    stock_summary.append(f"📤 {item_details['sku']} ({item_details['name']}): {quantity} {get_message('note_units_dispatched')}")

                elif direction == 'RECEIVE':
                    # Process based on condition
                    if condition == 'valid':
                        # Add to valid stock
                        cursor.execute(
                            "UPDATE stock_items SET quantity_on_hand = quantity_on_hand + %s WHERE id = %s",
                            (quantity, item_id)
                        )
                    else:  # damaged
                        # Add to damaged stock
                        cursor.execute(
                            "UPDATE stock_items SET quantity_damaged = quantity_damaged + %s WHERE id = %s",
                            (quantity, item_id)
                        )

                    # Log RECEIVE movement
                    stock_model.log_stock_movement(
                        item_id, 'RECEIVE', quantity, 'service_ticket', ticket_id, user_id,
                        condition=condition, notes=f"صيانة: قطع مستلمة"
                    )

                    condition_text = get_message('note_validated_good') if condition == 'valid' else get_message('note_marked_damaged')
                    stock_summary.append(f"📥 {item_details['sku']} ({item_details['name']}): {quantity} {condition_text}")

        # Update cost adjustment if provided
        if cost_adjustment != 0:
            cursor.execute("UPDATE service_tickets SET cost_adjustment = cost_adjustment + %s WHERE id = %s", (cost_adjustment, ticket_id))
        
        # Update ticket status - stays in IN_PROCESS
        if notes:
            maintenance_notes = notes
        else:
            maintenance_notes = "اكتملت الصيانة."
        
        # Add stock summary to notes if available
        if stock_summary:
            stock_info = f"{'; '.join(stock_summary)}"
            maintenance_notes = f"{maintenance_notes} {stock_info}"
        
        ticket_model.update_ticket_status(ticket_id, 'IN_PROCESS', user_id, maintenance_notes)
    
    return True

def mark_ready(ticket_id, new_tracking_send, user_id, notes='', cost_adjustment=0):
    """Mark maintenance ticket as ready for dispatch with tracking number. Moves from IN_PROCESS to READY_FOR_DISPATCH."""
    with transaction() as cursor:
        ticket = ticket_model.get_ticket_by_id(ticket_id)
        if not ticket:
            raise ServiceManagerException(get_message("err_ticket_not_found"))
        
        if ticket['service_type'] != 'maintenance':
            raise ServiceManagerException(get_message("err_maintenance_only"))
        
        _validate_state_transition(ticket, 'READY_FOR_DISPATCH')
        
        if not new_tracking_send:
            raise ServiceManagerException(get_message("err_tracking_required_ready"))
        
        # Validate new tracking number before updating
        _check_new_tracking_not_used(new_tracking_send, cursor, exclude_ticket_id=ticket_id)
        
        # Update tracking and cost adjustment
        update_fields = ["new_tracking_send = %s"]
        update_params = [new_tracking_send]
        
        if cost_adjustment != 0:
            update_fields.append("cost_adjustment = cost_adjustment + %s")
            update_params.append(cost_adjustment)
        
        update_params.append(ticket_id)
        update_sql = f"UPDATE service_tickets SET {', '.join(update_fields)} WHERE id = %s"
        cursor.execute(update_sql, update_params)
        
        # Update ticket status
        if notes:
            ready_notes = notes
        else:
            ready_notes = f"تم تعيين رقم التتبع للشحن: {new_tracking_send}. العبوة جاهزة للإرسال."
        ticket_model.update_ticket_status(ticket_id, 'READY_FOR_DISPATCH', user_id, ready_notes)
    
    return True
