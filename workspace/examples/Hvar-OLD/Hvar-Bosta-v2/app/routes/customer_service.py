"""
Customer Service API Routes
Comprehensive customer service management with maintenance and repair cycles
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from flask import Blueprint, jsonify, request
from app.utils.db_utils import get_db
from app.models.customer_service import CustomerServiceManager
from app.utils.api_response import create_api_response
import json

# Setup logging
logger = logging.getLogger(__name__)

# Create blueprint
bp = Blueprint('customer_service', __name__, url_prefix='/api/customer-service')

# Initialize customer service manager
service_manager = CustomerServiceManager()

@bp.route('/init', methods=['GET', 'POST'])
def initialize_customer_service():
    """Initialize customer service database - idempotent operation"""
    from app.utils.init_utils import initialize_customer_service
    result = initialize_customer_service()
    return jsonify(result), 200 if result['success'] else 500

# Core Service Tickets
@bp.route('/tickets', methods=['GET'])
def get_service_tickets():
    """Get service tickets with filtering and pagination"""
    try:
        # Parse query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        status = request.args.get('status')
        ticket_type = request.args.get('ticket_type')
        priority = request.args.get('priority')
        customer_phone = request.args.get('customer_phone')
        assigned_agent = request.args.get('assigned_agent')
        
        # Build filters
        filters = {}
        if status:
            filters['status'] = status
        if ticket_type:
            filters['ticket_type'] = ticket_type
        if priority:
            filters['priority'] = priority
        if customer_phone:
            filters['customer_phone'] = customer_phone
        if assigned_agent:
            filters['assigned_agent'] = assigned_agent
        
        result = service_manager.get_service_tickets(filters=filters, page=page, limit=limit)
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                result['tickets'],
                pagination=result['pagination']
            ))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error getting service tickets: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/tickets', methods=['POST'])
def create_service_ticket():
    """Create a new service ticket"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='No data provided')), 400
        
        # Validate required fields
        required_fields = ['customer_phone', 'ticket_type', 'subject']
        for field in required_fields:
            if not data.get(field):
                return jsonify(create_api_response(False, error=f'Required field "{field}" is missing')), 400
        
        result = service_manager.create_service_ticket(data)
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                {'ticket_id': result['ticket_id'], 'customer_info': result['customer_info']},
                message=result['message']
            )), 201
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error creating service ticket: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/tickets/<int:ticket_id>', methods=['GET'])
def get_service_ticket(ticket_id: int):
    """Get a specific service ticket with all related data"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get ticket details
            cursor.execute("""
                SELECT st.*, c.full_name as customer_name, c.customer_segment
                FROM service_tickets st
                LEFT JOIN customers c ON st.customer_phone = c.phone
                WHERE st.ticket_id = ?
            """, (ticket_id,))
            
            ticket_row = cursor.fetchone()
            if not ticket_row:
                return jsonify(create_api_response(False, error='Ticket not found')), 404
            
            # Convert to dictionary
            columns = [description[0] for description in cursor.description]
            ticket = dict(zip(columns, ticket_row))
            
            # Get related data
            # Team calls removed - functionality integrated into follow-ups system
            
            # Maintenance cycles
            cursor.execute("""
                SELECT * FROM maintenance_cycles WHERE ticket_id = ? ORDER BY created_at DESC
            """, (ticket_id,))
            maintenance_cycles = [dict(zip([col[0] for col in cursor.description], row)) 
                                for row in cursor.fetchall()]
            
            # Replacements
            cursor.execute("""
                SELECT * FROM replacements WHERE ticket_id = ? ORDER BY created_at DESC
            """, (ticket_id,))
            replacements = [dict(zip([col[0] for col in cursor.description], row)) 
                          for row in cursor.fetchall()]
            
            # Hub confirmations
            cursor.execute("""
                SELECT * FROM hub_confirmations WHERE ticket_id = ? ORDER BY created_at DESC
            """, (ticket_id,))
            hub_confirmations = [dict(zip([col[0] for col in cursor.description], row)) 
                               for row in cursor.fetchall()]
            
            # Team leader actions
            cursor.execute("""
                SELECT * FROM team_leader_actions WHERE ticket_id = ? ORDER BY created_at DESC
            """, (ticket_id,))
            team_leader_actions = [dict(zip([col[0] for col in cursor.description], row)) 
                                 for row in cursor.fetchall()]
            
            return jsonify(create_api_response(True, {
                'ticket': ticket,
                'maintenance_cycles': maintenance_cycles,
                'replacements': replacements,
                'hub_confirmations': hub_confirmations,
                'team_leader_actions': team_leader_actions
            }))
            
    except Exception as e:
        logger.error(f"Error getting service ticket: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

# Team calls routes removed - functionality integrated into follow-ups system

# Legacy Maintenance Support (Deprecated - Use /api/maintenance endpoints)
@bp.route('/maintenance', methods=['POST'])
def create_maintenance_cycle_legacy():
    """
    DEPRECATED: Create a maintenance cycle for repair/service
    Use /api/maintenance/cycles endpoint instead for comprehensive maintenance management
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='No data provided')), 400
        
        # Return deprecation warning with redirect information
        return jsonify(create_api_response(
            False,
            error='This endpoint is deprecated. Use /api/maintenance/cycles for comprehensive maintenance management with stock integration and SLA tracking.'
        )), 410  # Gone status code
            
    except Exception as e:
        logger.error(f"Error in deprecated maintenance endpoint: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/maintenance/<int:cycle_id>/update', methods=['PUT'])
def update_maintenance_cycle_legacy(cycle_id: int):
    """
    DEPRECATED: Update maintenance cycle status
    Use /api/maintenance/cycles/{cycle_id} endpoint instead
    """
    try:
        return jsonify(create_api_response(
            False,
            error='This endpoint is deprecated. Use /api/maintenance/cycles/{cycle_id} for comprehensive maintenance management.'
        )), 410  # Gone status code
            
    except Exception as e:
        logger.error(f"Error in deprecated maintenance update endpoint: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

# Replacement Management
@bp.route('/replacements', methods=['POST'])
def create_replacement_request():
    """Create a replacement request (full or partial)"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='No data provided')), 400
        
        # Validate required fields
        required_fields = ['customer_phone', 'replacement_type', 'replacement_reason']
        for field in required_fields:
            if not data.get(field):
                return jsonify(create_api_response(False, error=f'Required field "{field}" is missing')), 400
        
        result = service_manager.create_replacement_request(data)
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                {'replacement_id': result['replacement_id']},
                message=result['message']
            )), 201
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error creating replacement request: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/replacements/<int:replacement_id>/update', methods=['PUT'])
def update_replacement_status(replacement_id: int):
    """Update replacement status"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='No data provided')), 400
        
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Build update query
            update_fields = []
            update_values = []
            
            allowed_fields = ['replacement_status', 'replacement_product_sku', 'replacement_value',
                            'customer_contribution', 'warranty_applies', 'delivery_address',
                            'delivery_contact', 'delivery_phone', 'estimated_delivery_date',
                            'actual_delivery_date', 'customer_approval']
            
            for field in allowed_fields:
                if field in data:
                    update_fields.append(f"{field} = ?")
                    update_values.append(data[field])
            
            if not update_fields:
                return jsonify(create_api_response(False, error='No valid fields to update')), 400
            
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            update_values.append(replacement_id)
            
            # Execute update
            cursor.execute(f"""
                UPDATE replacements 
                SET {', '.join(update_fields)}
                WHERE replacement_id = ?
            """, update_values)
            
            if cursor.rowcount == 0:
                return jsonify(create_api_response(False, error='Replacement not found')), 404
            
            conn.commit()
            
            return jsonify(create_api_response(True, message='Replacement updated successfully'))
            
    except Exception as e:
        logger.error(f"Error updating replacement: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

# Hub Confirmation System
@bp.route('/hub-confirmations', methods=['POST'])
def create_hub_confirmation():
    """Create hub confirmation for returned orders/repairs"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='No data provided')), 400
        
        # Validate required fields
        required_fields = ['hub_name', 'hub_agent', 'confirmation_type', 'confirmation_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify(create_api_response(False, error=f'Required field "{field}" is missing')), 400
        
        result = service_manager.create_hub_confirmation(data)
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                {'confirmation_id': result['confirmation_id']},
                message=result['message']
            )), 201
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error creating hub confirmation: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/hub-confirmations/<int:confirmation_id>/confirm', methods=['PUT'])
def confirm_hub_inspection(confirmation_id: int):
    """Confirm hub inspection and set status"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='No data provided')), 400
        
        with get_db() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE hub_confirmations 
                SET confirmation_status = ?,
                    inspection_notes = ?,
                    quality_score = ?,
                    defects_found = ?,
                    recommended_action = ?,
                    team_leader_review_required = ?,
                    confirmed_at = CURRENT_TIMESTAMP
                WHERE confirmation_id = ?
            """, (
                data.get('confirmation_status', 'confirmed'),
                data.get('inspection_notes', ''),
                data.get('quality_score'),
                json.dumps(data.get('defects_found', [])),
                data.get('recommended_action'),
                data.get('team_leader_review_required', False),
                confirmation_id
            ))
            
            if cursor.rowcount == 0:
                return jsonify(create_api_response(False, error='Hub confirmation not found')), 404
            
            conn.commit()
            
            return jsonify(create_api_response(True, message='Hub confirmation completed successfully'))
            
    except Exception as e:
        logger.error(f"Error confirming hub inspection: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

# Team Leader Actions
@bp.route('/team-leader-actions', methods=['POST'])
def create_team_leader_action():
    """Create team leader action for final verification"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='No data provided')), 400
        
        # Validate required fields
        required_fields = ['team_leader_name', 'action_type', 'action_date']
        for field in required_fields:
            if not data.get(field):
                return jsonify(create_api_response(False, error=f'Required field "{field}" is missing')), 400
        
        result = service_manager.create_team_leader_action(data)
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                {'action_id': result['action_id']},
                message=result['message']
            )), 201
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error creating team leader action: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/team-leader-actions/<int:action_id>/complete', methods=['PUT'])
def complete_team_leader_action(action_id: int):
    """Complete team leader action with final decision"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='No data provided')), 400
        
        with get_db() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE team_leader_actions 
                SET action_status = ?,
                    verification_notes = ?,
                    quality_standards_met = ?,
                    customer_satisfaction_confirmed = ?,
                    final_resolution = ?,
                    completed_at = CURRENT_TIMESTAMP
                WHERE action_id = ?
            """, (
                data.get('action_status', 'approved'),
                data.get('verification_notes', ''),
                data.get('quality_standards_met', False),
                data.get('customer_satisfaction_confirmed', False),
                data.get('final_resolution', ''),
                action_id
            ))
            
            if cursor.rowcount == 0:
                return jsonify(create_api_response(False, error='Team leader action not found')), 404
            
            # If approved, update ticket status to resolved
            if data.get('action_status') == 'approved':
                cursor.execute("""
                    UPDATE service_tickets 
                    SET status = 'resolved',
                        resolved_at = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE ticket_id = (SELECT ticket_id FROM team_leader_actions WHERE action_id = ?)
                """, (action_id,))
            
            conn.commit()
            
            return jsonify(create_api_response(True, message='Team leader action completed successfully'))
            
    except Exception as e:
        logger.error(f"Error completing team leader action: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

# Customer Follow-up Management
@bp.route('/follow-ups', methods=['GET'])
def get_customer_follow_up_list():
    """Get list of customers requiring follow-up"""
    try:
        # Team calls follow-ups removed - functionality integrated into unified follow-ups system
        follow_ups = []
        
        return jsonify(create_api_response(
            True,
            follow_ups,
            total=len(follow_ups)
        ))
        
    except Exception as e:
        logger.error(f"Error getting follow-ups: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

# Analytics and Dashboard
@bp.route('/analytics', methods=['GET'])
def get_service_analytics():
    """Get service analytics and metrics"""
    try:
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        result = service_manager.get_service_analytics(date_from=date_from, date_to=date_to)
        
        if result['success']:
            return jsonify(create_api_response(True, result['analytics']))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error getting service analytics: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/dashboard', methods=['GET'])
def get_service_dashboard():
    """Get dashboard data for customer service"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Get counts by status
            cursor.execute("""
                SELECT status, COUNT(*) as count
                FROM service_tickets
                GROUP BY status
            """)
            status_counts = dict(cursor.fetchall())
            
            # Get counts by priority
            cursor.execute("""
                SELECT priority, COUNT(*) as count
                FROM service_tickets
                WHERE status IN ('open', 'in_progress')
                GROUP BY priority
            """)
            priority_counts = dict(cursor.fetchall())
            
            # Get today's activities
            today = datetime.now().date().isoformat()
            
            cursor.execute("""
                SELECT COUNT(*) FROM service_tickets 
                WHERE DATE(created_at) = ?
            """, (today,))
            tickets_today = cursor.fetchone()[0]
            
            # Team calls removed - functionality integrated into follow-ups system
            calls_today = 0
            
            cursor.execute("""
                SELECT COUNT(*) FROM maintenance_cycles 
                WHERE DATE(completion_date) = ? AND cycle_status = 'completed'
            """, (today,))
            maintenance_completed_today = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT COUNT(*) FROM replacements 
                WHERE DATE(actual_delivery_date) = ? AND replacement_status = 'delivered'
            """, (today,))
            replacements_delivered_today = cursor.fetchone()[0]
            
            return jsonify(create_api_response(True, {
                'status_counts': status_counts,
                'priority_counts': priority_counts,
                'today_activities': {
                    'tickets_created': tickets_today,
                    'calls_completed': calls_today,
                    'maintenance_completed': maintenance_completed_today,
                    'replacements_delivered': replacements_delivered_today
                }
            }))
            
    except Exception as e:
        logger.error(f"Error getting service dashboard: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500 