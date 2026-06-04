# app/api/hub_api.py
"""Hub API endpoints."""
from flask import Blueprint, request, jsonify, g
from app.utils.auth import require_auth
from app.services import tracking_manager, service_manager
from app.models import service_ticket as ticket_model
from app.utils.messages import get_message, get_error_message
from app.utils.phone_normalizer import normalize_ticket_phone

hub_api_blueprint = Blueprint('hub_api', __name__, url_prefix='/api/hub')

@hub_api_blueprint.route('/scan/<tracking_number>', methods=['GET'])
@require_auth
def scan_tracking_endpoint(tracking_number):
    """
    Universal scan endpoint - fastest possible with comprehensive context.
    Combines speed of optimized lookup with rich contextual information.
    """
    from app.models import service_ticket as ticket_model, customer as customer_model
    from flask import request

    # Check if it's a ticket number (starts with HVR/HVM/HVT/HVS)
    is_ticket_number = tracking_number.startswith(('HVR', 'HVM', 'HVT', 'HVS'))

    if is_ticket_number:
        # Look up by ticket_number field (direct query - fast)
        ticket = ticket_model.get_ticket_by_ticket_number(tracking_number)
    else:
        # Find ticket by tracking number (fast lookup with composite index)
        ticket = tracking_manager.find_ticket_by_tracking(tracking_number)

    if not ticket:
        return jsonify({
            "error": get_message("not_found_tracking"),
            "tracking_number": tracking_number,
            "found": False,
            "message": get_message("not_found_tracking")
        }), 404

    # Get ticket with customer info (fast JOIN query)
    # Note: get_ticket_by_ticket_number already includes customer info
    if not is_ticket_number:
        ticket = ticket_model.get_ticket_with_customer(ticket['id'])
        if not ticket:
            return jsonify({
                "error": get_message("not_found_ticket"),
                "tracking_number": tracking_number,
                "found": False
            }), 404

    # Add items (fast JOIN query)
    ticket['items'] = ticket_model.get_ticket_items(ticket['id'])

    # Add tracking field indicator (which field matched)
    tracking_field = None
    if ticket.get('original_tracking') == tracking_number:
        tracking_field = 'original_tracking'
    elif ticket.get('new_tracking_send') == tracking_number:
        tracking_field = 'new_tracking_send'
    elif ticket.get('new_tracking_receive') == tracking_number:
        tracking_field = 'new_tracking_receive'

    ticket['scanned_tracking_field'] = tracking_field
    ticket['scanned_tracking_number'] = tracking_number

    # Build comprehensive context (all fast database operations)
    context = {
        "search_type": "ticket_number" if is_ticket_number else "tracking_number",
        "scan_history": tracking_manager.get_tracking_history(tracking_number),
        "ticket": ticket,
        "available_actions": service_manager.get_available_actions(ticket['id']),
        "warnings": []
    }

    # Add contextual warnings
    if not context['scan_history']:
        context['warnings'].append(get_message("warning_no_history"))

    if ticket['status'] == 'CANCELLED':
        context['warnings'].append(get_message("warning_cancelled"))

    # Optional: Add more warnings based on ticket state
    # if ticket['priority'] == 'urgent' and ticket['status'] in ['PENDING', 'CONFIRMED']:
    #     context['warnings'].append("Urgent ticket requires immediate attention.")

    # Include Bosta data by default if original_tracking exists (common scanning scenario)
    # But make it optional for performance when not needed
    include_bosta = request.args.get('include_bosta', 'auto').lower()
    if include_bosta == 'true' or (include_bosta == 'auto' and ticket.get('original_tracking')):
        # Add Bosta orders (this makes external API calls - slower but needed for original tracking)
        enriched_ticket = ticket_model.enrich_ticket_with_bosta_orders(ticket.copy())
        context['ticket']['bosta_orders'] = enriched_ticket.get('bosta_orders', [])
    else:
        # Skip Bosta API calls for speed when not needed
        context['ticket']['bosta_orders'] = []

    # Add current location from last scan
    last_scan = context['scan_history'][-1] if context['scan_history'] else None
    context['current_location'] = last_scan['scan_location'] if last_scan else None

    # Normalize phone numbers in ticket data
    normalize_ticket_phone(ticket)

    # Add search summary for quick overview
    context['search_summary'] = {
        "ticket_id": ticket['id'],
        "ticket_number": ticket['ticket_number'],
        "service_type": ticket['service_type'],
        "status": ticket['status'],
        "customer_name": ticket['customer_name'],
        "scans_count": len(context['scan_history']),
        "has_warnings": len(context['warnings']) > 0
    }

    return jsonify({
        "tracking_number": tracking_number,
        "found": True,
        "context": context
    })


@hub_api_blueprint.route('/scan/receive', methods=['POST'])
@require_auth
def receive_package():
    """Log receipt of a package and update ticket status."""
    data = request.get_json()
    tracking_number = data.get('tracking_number')
    user_id = g.current_user['id']
    condition = data.get('condition', 'good')  # Default to 'good' if not provided
    location = data.get('location', 'HUB')
    notes = data.get('notes')
    
    if not tracking_number:
        return jsonify({"error": get_message("missing_fields")}), 400
    
    try:
        # Find the ticket first to determine its type
        ticket = tracking_manager.find_ticket_by_tracking(tracking_number)
        if not ticket:
            return jsonify({"error": get_message("not_found_tracking")}), 404
        
        # Determine which function to call based on ticket type and status
        ticket_type = ticket['service_type']
        ticket_status = ticket['status']
        
        # For return tickets that are being completed, use receive_return
        if ticket_type == 'return' and ticket_status == 'IN_PROCESS':
            service_manager.receive_return(ticket['id'], tracking_number, condition, user_id)
        # For all other cases (replacement, maintenance receiving for repair), use scan_inbound
        else:
            service_manager.scan_inbound(ticket['id'], tracking_number, user_id, notes)
        
        updated_context = tracking_manager.get_full_scan_context(tracking_number)
        return jsonify({
            "success": True,
            "message": get_message("scan_recorded"),
            "context": updated_context
        })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@hub_api_blueprint.route('/scan/dispatch', methods=['POST'])
@require_auth
def dispatch_package():
    """Log dispatch of a package and update ticket status."""
    data = request.get_json()
    tracking_number = data.get('tracking_number')
    user_id = g.current_user['id']
    destination = data.get('destination')
    
    if not tracking_number:
        return jsonify({"error": get_message("missing_fields")}), 400
    
    try:
        # Update ticket status via ServiceManager (mark_sent will handle scan logging)
        ticket = tracking_manager.find_ticket_by_tracking(tracking_number)
        if ticket:
            # Build notes with destination if provided
            notes = f"{get_message('note_dispatched_to')} {destination}" if destination else None
            service_manager.mark_sent(ticket['id'], tracking_number, user_id, notes)
            updated_context = tracking_manager.get_full_scan_context(tracking_number)
            return jsonify({
                "success": True,
                "message": get_message("scan_dispatched"),
                "context": updated_context
            })
        else:
            return jsonify({"error": get_message("not_found_tracking")}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@hub_api_blueprint.route('/queues/workshop', methods=['GET'])
@require_auth
def get_workshop_queue():
    """Get all tickets in workshop status."""
    try:
        tickets = ticket_model.get_tickets_by_status('IN_PROCESS')
        workshop_tickets = [t for t in tickets if t['service_type'] == 'maintenance']
        return jsonify(workshop_tickets)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@hub_api_blueprint.route('/queues/pending-dispatch', methods=['GET'])
@require_auth
def get_pending_dispatch_queue():
    """Get all tickets ready to be sent."""
    try:
        tickets = ticket_model.get_tickets_by_status('READY_FOR_DISPATCH')
        return jsonify(tickets)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@hub_api_blueprint.route('/workshop/complete', methods=['POST'])
@require_auth
def complete_maintenance():
    """Complete maintenance work on a ticket."""
    data = request.get_json()
    ticket_id = data.get('ticket_id')
    user_id = g.current_user['id']
    notes = data.get('notes', '')
    cost_adjustment = data.get('cost_adjustment', 0)
    items = data.get('items')
    
    if not ticket_id:
        return jsonify({"error": get_message("missing_fields")}), 400
    
    # Items are now optional - complete_maintenance handles None/empty items
    try:
        success = service_manager.complete_maintenance(
            ticket_id, user_id, notes, cost_adjustment, items
        )
        if success:
            updated_ticket = ticket_model.get_ticket_by_id(ticket_id)
            return jsonify({
                "success": True,
                "message": get_message("maintenance_completed"),
                "ticket": updated_ticket
            })
        else:
            return jsonify({"error": get_message("failed_execute")}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@hub_api_blueprint.route('/workshop/mark-ready', methods=['POST'])
@require_auth
def mark_ready():
    """Mark maintenance ticket as ready for dispatch with tracking number."""
    data = request.get_json()
    ticket_id = data.get('ticket_id')
    user_id = g.current_user['id']
    new_tracking_send = data.get('new_tracking_send')
    notes = data.get('notes', '')
    cost_adjustment = data.get('cost_adjustment', 0)
    
    if not all([ticket_id, new_tracking_send]):
        return jsonify({"error": get_message("missing_fields")}), 400
    
    try:
        success = service_manager.mark_ready(
            ticket_id, new_tracking_send, user_id, notes, cost_adjustment
        )
        if success:
            updated_ticket = ticket_model.get_ticket_by_id(ticket_id)
            return jsonify({
                "success": True,
                "message": "Ticket marked as ready for dispatch",
                "ticket": updated_ticket
            })
        else:
            return jsonify({"error": get_message("failed_execute")}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
