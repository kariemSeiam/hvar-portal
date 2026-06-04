"""
Unified Customer Service API Routes
Comprehensive service action management with automated business rules
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from flask import Blueprint, jsonify, request
import json
import time
import sqlite3

from app.utils.db_utils import get_db
from app.services.service_action_manager import ServiceActionManager
from app.services.maintenance_service_manager import MaintenanceServiceManager
from app.services.customer_profile_manager import customer_profile_manager

from app.utils.api_response import create_api_response

# Setup logging and blueprint
logger = logging.getLogger(__name__)
bp = Blueprint('unified_customer_service', __name__, url_prefix='/api/unified-service')

# Initialize service action manager
service_action_manager = ServiceActionManager()
maintenance_service_manager = MaintenanceServiceManager()

# =================== INITIALIZATION ===================

@bp.route('/init', methods=['GET', 'POST'])
def initialize_unified_service():
    """Initialize unified customer service database - idempotent operation"""
    from app.utils.init_utils import initialize_unified_service
    result = initialize_unified_service()
    return jsonify(result), 200 if result['success'] else 500

# =================== UNIFIED SERVICE ACTIONS ===================

@bp.route('/service-actions', methods=['GET'])
@bp.route('/service-actions/', methods=['GET'])
def get_service_actions():
    """Get service actions with advanced filtering and customer context"""
    try:
        # Parse query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        
        # Advanced filters
        filters = {}
        if request.args.get('customer_phone'):
            filters['customer_phone'] = request.args.get('customer_phone')
        if request.args.get('action_status'):
            filters['action_status'] = request.args.get('action_status')
        if request.args.get('action_type'):
            filters['action_type'] = request.args.get('action_type')
        if request.args.get('priority'):
            filters['priority'] = request.args.get('priority')
        if request.args.get('tracking_number'):
            filters['tracking_number'] = request.args.get('tracking_number')
        if request.args.get('assigned_technician'):
            filters['assigned_technician'] = request.args.get('assigned_technician')
        
        # Date range filters
        if request.args.get('date_from'):
            filters['date_from'] = request.args.get('date_from')
        if request.args.get('date_to'):
            filters['date_to'] = request.args.get('date_to')
        
        with get_db() as conn:
            result = _get_service_actions_with_context(conn, filters, page, limit)
            
            if result['success']:
                return jsonify(create_api_response(
                    True,
                    result['actions'],
                    pagination=result['pagination'],
                    total_count=result['total_count']
                ))
            else:
                return jsonify(create_api_response(False, error=result['error'])), 400
                
    except Exception as e:
        logger.error(f"Error getting service actions: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/service-actions', methods=['POST'])
def create_service_action():
    """Create service action - MANUAL CREATION ONLY - No automatic generation"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='No data provided')), 400
        
        # Validate required fields for manual creation
        required_fields = ['receiver_phone', 'action_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify(create_api_response(False, error=f'Required field "{field}" is missing for manual service action creation')), 400
        
        # Enforce manual creation
        data['requires_service_action'] = True
        data['manual_creation'] = True
        data['manual_processing'] = True
        
        # Enrich order data for manual creation
        enriched_data = _enrich_service_action_data(data)
        
        with get_db() as conn:
            action_id = service_action_manager.create_service_action_with_parts(conn, enriched_data)
            
            if action_id:
                # Get created action details
                action_details = _get_service_action_details(conn, action_id)
                conn.commit()
                
                return jsonify(create_api_response(
                    True,
                    {
                        'action_id': action_id,
                        'action_details': action_details,
                        'creation_type': 'manual'
                    },
                    message=f'Manual service action {action_id} created successfully'
                )), 201
            else:
                return jsonify(create_api_response(False, error='Manual service action creation failed - check required fields')), 400
                
    except Exception as e:
        logger.error(f"Error creating manual service action: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/service-actions/<int:action_id>', methods=['GET'])
def get_service_action_details(action_id: int):
    """Get comprehensive service action details with full context"""
    try:
        with get_db() as conn:
            action_details = _get_comprehensive_service_action_details(conn, action_id)
            
            if action_details:
                return jsonify(create_api_response(True, action_details))
            else:
                return jsonify(create_api_response(False, error='Service action not found')), 404
                
    except Exception as e:
        logger.error(f"Error getting service action details: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

# =================== UNIFIED COMMAND ENDPOINT ===================

@bp.route('/command', methods=['POST'])
def unified_service_command():
    """Single command endpoint to manage service actions, follow-ups, hub ops, maintenance, and lightweight orders."""
    try:
        payload = request.get_json() or {}
        command = payload.get('command')
        data = payload.get('data', {})

        if not command:
            return jsonify(create_api_response(False, error='command is required')), 400

        # Dispatch
        if command == 'create_action':
            enriched = _enrich_service_action_data(data)
            with get_db() as conn:
                action_id = service_action_manager.create_service_action_with_parts(conn, enriched)
                if not action_id:
                    return jsonify(create_api_response(False, error='Failed to create service action')), 400
                details = _get_comprehensive_service_action_details(conn, action_id)
                conn.commit()
                return jsonify(create_api_response(True, {
                    'action_id': action_id,
                    'action_details': details
                }, message=f'Service action {action_id} created'))

        if command == 'update_status':
            action_id = data.get('action_id')
            new_status = data.get('new_status')
            if not action_id or not new_status:
                return jsonify(create_api_response(False, error='action_id and new_status are required')), 400
            with get_db() as conn:
                result = service_action_manager.update_service_action_status(
                    conn, int(action_id), new_status,
                    technician=data.get('technician'),
                    notes=data.get('notes'),
                    refund_amount=data.get('refund_amount', 0),
                    parts_actions=data.get('parts_actions', [])
                )
                if result.get('success'):
                    conn.commit()
                    return jsonify(create_api_response(True, result, message=result.get('message')))
                return jsonify(create_api_response(False, error=result.get('error'))), 400

        if command == 'schedule_follow_up':
            with get_db() as conn:
                return create_follow_up_internal(data, conn)

        if command == 'complete_follow_up':
            follow_up_id = data.get('follow_up_id')
            completion_notes = data.get('completion_notes')
            if not follow_up_id or not completion_notes:
                return jsonify(create_api_response(False, error='follow_up_id and completion_notes are required')), 400
            with get_db() as conn:
                cursor = conn.execute("""
                    UPDATE service_action_follow_ups SET
                        status = 'completed',
                        completed_at = CURRENT_TIMESTAMP,
                        call_notes = call_notes || char(10) || 'نتائج المتابعة: ' || ?
                    WHERE follow_up_id = ?
                """, (completion_notes, follow_up_id))
                if cursor.rowcount == 0:
                    return jsonify(create_api_response(False, error='Follow-up not found')), 404

                # Optional: schedule next follow-up
                if data.get('schedule_next') and data.get('next_follow_up_date'):
                    conn.execute("""
                        INSERT INTO service_action_follow_ups (
                            action_id, customer_phone, agent_name, call_type, call_date,
                            call_time, call_notes, status, created_at, follow_up_priority,
                            tracking_number, follow_up_type
                        )
                        SELECT 
                            action_id, customer_phone, ?, call_type, ?,
                            ?, 'متابعة إضافية مطلوبة من العميل', 'scheduled', CURRENT_TIMESTAMP, follow_up_priority,
                            tracking_number, follow_up_type
                        FROM service_action_follow_ups
                        WHERE follow_up_id = ?
                    """, (
                        data.get('next_agent_name', 'System'),
                        data['next_follow_up_date'],
                        data.get('next_follow_up_time'),
                        follow_up_id
                    ))
                conn.commit()
                return jsonify(create_api_response(True, {'follow_up_id': follow_up_id}, message='Follow-up completed'))

        if command == 'hub_scan':
            with get_db() as conn:
                result = _perform_hub_scan(conn, data)
                status = 200 if result.get('success') else 400
                return jsonify(create_api_response(result.get('success', False), result if result.get('success') else None, error=None if result.get('success') else result.get('error'))), status

        if command == 'hub_inspection':
            with get_db() as conn:
                result = _perform_hub_inspection(conn, data)
                status = 200 if result.get('success') else 400
                return jsonify(create_api_response(result.get('success', False), result if result.get('success') else None, error=None if result.get('success') else result.get('error'))), status

        if command == 'create_maintenance_cycle':
            result = maintenance_service_manager.create_maintenance_cycle(data)
            status = 200 if result.get('success') else 400
            return jsonify(create_api_response(result.get('success', False), result if result.get('success') else None, error=None if result.get('success') else result.get('error'))), status

        if command == 'start_maintenance_cycle':
            cycle_id = data.get('cycle_id')
            if not cycle_id:
                return jsonify(create_api_response(False, error='cycle_id is required')), 400
            result = maintenance_service_manager.start_maintenance_cycle(int(cycle_id), data)
            status = 200 if result.get('success') else 400
            return jsonify(create_api_response(result.get('success', False), result if result.get('success') else None, error=None if result.get('success') else result.get('error'))), status

        if command == 'complete_maintenance_cycle':
            cycle_id = data.get('cycle_id')
            if not cycle_id:
                return jsonify(create_api_response(False, error='cycle_id is required')), 400
            result = maintenance_service_manager.complete_maintenance_cycle(int(cycle_id), data)
            status = 200 if result.get('success') else 400
            return jsonify(create_api_response(result.get('success', False), result if result.get('success') else None, error=None if result.get('success') else result.get('error'))), status

        if command == 'create_new_order_minimal':
            with get_db() as conn:
                result = _create_new_order_minimal(conn, data)
                status = 200 if result.get('success') else 400
                return jsonify(create_api_response(result.get('success', False), result if result.get('success') else None, error=None if result.get('success') else result.get('error'))), status

        if command == 'update_new_order_state':
            with get_db() as conn:
                result = _update_new_order_state(conn, data)
                status = 200 if result.get('success') else 400
                return jsonify(create_api_response(result.get('success', False), result if result.get('success') else None, error=None if result.get('success') else result.get('error'))), status

        if command == 'register_return_refund':
            # Create service action of type return_refund and optionally create negative COD order
            enriched = _enrich_service_action_data({
                **data,
                'action_type': 'return_refund',
                'requires_service_action': True,
                'manual_creation': True,
                'manual_processing': True
            })
            with get_db() as conn:
                action_id = service_action_manager.create_service_action_with_parts(conn, enriched)
                if not action_id:
                    return jsonify(create_api_response(False, error='Failed to create return/refund action')), 400
                created_order = None
                if 'refund_amount' in data and float(data['refund_amount']) != 0:
                    created_order = _create_new_order_minimal(conn, {
                        'receiver_phone': data.get('receiver_phone'),
                        'product_name': data.get('product_name') or 'Refund',
                        'cod': -abs(float(data['refund_amount'])),
                        'notes': (data.get('service_notes') or '') + ' [refund]',
                        'tracking_number': data.get('tracking_number')
                    })
                conn.commit()
                return jsonify(create_api_response(True, {
                    'action_id': action_id,
                    'refund_order': created_order
                }, message='Return/refund registered'))

        return jsonify(create_api_response(False, error=f'Unknown command: {command}')), 400
    except Exception as e:
        logger.error(f"Error in unified_service_command: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/service-actions/<int:action_id>/status', methods=['PUT'])
def update_service_action_status(action_id: int):
    """Update service action status"""
    try:
        data = request.get_json()
        
        if not data or not data.get('new_status'):
            return jsonify(create_api_response(False, error='New status is required')), 400
        
        new_status = data['new_status']
        
        # Remove new_status from data to avoid duplicate parameter
        additional_data = {k: v for k, v in data.items() if k != 'new_status'}
        
        with get_db() as conn:
            result = service_action_manager.update_service_action_status(
                conn, action_id, new_status, **additional_data
            )
            
            if result['success']:
                conn.commit()
                return jsonify(create_api_response(True, result, message=result.get('message', 'Status updated successfully')))
            else:
                return jsonify(create_api_response(False, error=result['error'])), 400
                
    except Exception as e:
        logger.error(f"Error updating service action status: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

# =================== HUB OPERATIONS ===================

@bp.route('/hub/scan', methods=['POST'])
def hub_scan():
    """Hub scanning with workflow updates"""
    MAX_RETRIES = 3
    RETRY_DELAY = 2  # seconds

    for attempt in range(MAX_RETRIES):
        try:
            data = request.get_json()
            
            if not data or not data.get('return_tracking_number'):
                return jsonify(create_api_response(False, error='Return tracking number is required')), 400
            
            return_tracking = data['return_tracking_number']
            hub_agent = data.get('hub_agent', 'Unknown')
            scan_notes = data.get('scan_notes', '')
            
            with get_db() as conn:
                # Find associated service action by return tracking OR original order tracking
                cursor = conn.execute("""
                    SELECT sa.action_id, sa.customer_phone, sa.tracking_number, sa.action_type
                    FROM service_actions sa
                    WHERE sa.return_tracking_number = ? 
                       OR sa.return_tracking_number LIKE ? 
                       OR sa.return_tracking_number LIKE ?
                       OR sa.tracking_number = ?  -- Original order tracking number
                """, (
                    return_tracking, 
                    f"RET{return_tracking}%",  # Handle simple format: RET + tracking
                    f"RTN-{return_tracking}%",  # Handle complex format: RTN-tracking-timestamp
                    return_tracking  # Original order tracking number
                ))
                
                action_result = cursor.fetchone()
                if not action_result:
                    return jsonify(create_api_response(False, error='No service action found for this return tracking number')), 404
                
                action_id, customer_phone, tracking_number, action_type = action_result
                
                # Update hub confirmation workflow
                cursor = conn.execute("""
                    UPDATE hub_confirmation_workflow 
                    SET confirmation_status = 'scanned', 
                        inspection_notes = ?,
                        confirmed_at = CURRENT_TIMESTAMP
                    WHERE return_tracking_number = ?
                """, (f"Scanned by {hub_agent}. {scan_notes}", return_tracking))
                
                if cursor.rowcount == 0:
                    # Create hub confirmation entry if it doesn't exist
                    conn.execute("""
                        INSERT INTO hub_confirmation_workflow (
                            action_id, return_tracking_number, confirmation_status,
                            inspection_notes, confirmed_at
                        ) VALUES (?, ?, 'scanned', ?, CURRENT_TIMESTAMP)
                    """, (action_id, return_tracking, f"Scanned by {hub_agent}. {scan_notes}"))
                

                
                conn.commit()
                
                return jsonify(create_api_response(
                    True,
                    {
                        'action_id': action_id,
                        'return_tracking_number': return_tracking,
                        'status': 'scanned'
                    },
                    message='Hub scan completed successfully'
                ))
                    
        except sqlite3.OperationalError as e:
            if "database is locked" in str(e) and attempt < MAX_RETRIES - 1:
                logger.warning(f"Database locked on attempt {attempt + 1} for hub scan. Retrying after {RETRY_DELAY}s...")
                time.sleep(RETRY_DELAY)
                continue
            else:
                logger.error(f"Error processing hub scan: {e}")
                return jsonify(create_api_response(False, error=str(e))), 500
        except Exception as e:
            logger.error(f"Error processing hub scan: {e}")
            return jsonify(create_api_response(False, error=str(e))), 500
            
    return jsonify(create_api_response(False, error="Failed to process hub scan after multiple retries due to database lock.")), 500

@bp.route('/hub/inspection', methods=['POST'])
def hub_inspection_with_parts():
    """Complete hub inspection with parts assessment"""
    MAX_RETRIES = 3
    RETRY_DELAY = 2  # seconds
    
    for attempt in range(MAX_RETRIES):
        try:
            data = request.get_json()
            
            if not data or not data.get('return_tracking_number'):
                return jsonify(create_api_response(False, error='Return tracking number is required')), 400
            
            return_tracking = data['return_tracking_number']
            product_condition = data.get('product_condition', 'unknown')
            quality_score = data.get('quality_score', 0)
            inspection_notes = data.get('inspection_notes', '')
            parts_inspection = data.get('parts_inspection', [])
            hub_agent = data.get('hub_agent', 'Unknown')
            
            with get_db() as conn:
                # Find associated service action by return tracking OR original order tracking
                cursor = conn.execute("""
                    SELECT sa.action_id, sa.customer_phone, sa.tracking_number, sa.action_type, sa.priority
                    FROM service_actions sa
                    WHERE sa.return_tracking_number = ? 
                       OR sa.return_tracking_number LIKE ? 
                       OR sa.return_tracking_number LIKE ?
                       OR sa.tracking_number = ?  -- Original order tracking number
                """, (
                    return_tracking, 
                    f"RET{return_tracking}%",  # Handle simple format: RET + tracking
                    f"RTN-{return_tracking}%",  # Handle complex format: RTN-tracking-timestamp
                    return_tracking  # Original order tracking number
                ))
                
                action_result = cursor.fetchone()
                if not action_result:
                    return jsonify(create_api_response(False, error='No service action found for this return tracking number')), 404
                
                action_id, customer_phone, tracking_number, action_type, priority = action_result
                
                # Update hub confirmation workflow
                conn.execute("""
                    UPDATE hub_confirmation_workflow 
                    SET confirmation_status = 'confirmed', 
                        product_condition = ?,
                        quality_score = ?,
                        inspection_notes = ?,
                        confirmed_at = CURRENT_TIMESTAMP
                    WHERE return_tracking_number = ?
                """, (product_condition, quality_score, inspection_notes, return_tracking))
                
                # Process parts inspection
                for part_inspection in parts_inspection:
                    sku = part_inspection.get('sku')
                    condition = part_inspection.get('condition', 'unknown')
                    notes = part_inspection.get('notes', '')
                    
                    if sku:
                        # Update service action parts
                        conn.execute("""
                            UPDATE service_action_parts 
                            SET condition_after = ?, notes = ?
                            WHERE action_id = ? AND sku = ?
                        """, (condition, notes, action_id, sku))
                        
                        # Handle damaged parts
                        if condition == 'damaged':
                            _handle_damaged_part_stock(conn, sku, action_id)
                
                # Determine if team leader review is required
                team_leader_review_required = (
                    quality_score < 5 or 
                    product_condition == 'damaged' or 
                    priority in ['high', 'urgent'] or
                    any(p.get('condition') == 'damaged' for p in parts_inspection)
                )
                
                # Update service action status
                if team_leader_review_required:
                    service_action_manager.update_service_action_status(
                        conn, action_id, 'awaiting_review',
                        quality_score=quality_score,
                        product_condition=product_condition,
                        hub_agent=hub_agent
                    )
                    

                else:
                    service_action_manager.update_service_action_status(
                        conn, action_id, 'hub_confirmed',
                        quality_score=quality_score,
                        product_condition=product_condition,
                        hub_agent=hub_agent
                    )
                

                
                conn.commit()
                
                return jsonify(create_api_response(
                    True,
                    {
                        'action_id': action_id,
                        'quality_score': quality_score,
                        'product_condition': product_condition,
                        'team_leader_review_required': team_leader_review_required,
                        'parts_inspected': len(parts_inspection)
                    },
                    message='Hub inspection completed successfully'
                ))
                    
        except sqlite3.OperationalError as e:
            if "database is locked" in str(e) and attempt < MAX_RETRIES - 1:
                logger.warning(f"Database locked on attempt {attempt + 1}. Retrying after {RETRY_DELAY}s...")
                time.sleep(RETRY_DELAY)
                continue
            else:
                logger.error(f"Error processing hub inspection: {e}")
                return jsonify(create_api_response(False, error=str(e))), 500
        except Exception as e:
            logger.error(f"Error processing hub inspection: {e}")
            return jsonify(create_api_response(False, error=str(e))), 500
    
    return jsonify(create_api_response(False, error="Failed to process hub inspection after multiple retries due to database lock.")), 500

# =================== CUSTOMER FOLLOW-UP & COMMUNICATION ===================

@bp.route('/follow-ups', methods=['GET'])
def get_customer_follow_ups():
    """Get customers requiring follow-up based on service actions with enhanced filtering"""
    try:
        # Enhanced filtering parameters
        priority = request.args.get('priority')
        status = request.args.get('status')
        days_back = int(request.args.get('days_back', 7))
        customer_phone = request.args.get('customer_phone')
        tracking_number = request.args.get('tracking_number')
        agent_name = request.args.get('agent_name')
        follow_up_type = request.args.get('follow_up_type')
        
        with get_db() as conn:
            follow_ups = _get_customer_follow_ups_enhanced(
                conn, priority, status, days_back, customer_phone, 
                tracking_number, agent_name, follow_up_type
            )
            
            return jsonify(create_api_response(
                True,
                follow_ups,
                total=len(follow_ups)
            ))
            
    except Exception as e:
        logger.error(f"Error getting follow-ups: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/follow-ups', methods=['POST'])
def create_follow_up():
    """
    Create comprehensive follow-up with all required data for NewServiceActionForm.jsx
    
    Required fields:
    - customer_phone: Customer reference linked by phone number
    - follow_up_type: Type of follow-up (general, technical, delivery, complaint)
    - follow_up_date: Date of follow-up (required)
    - follow_up_priority: Priority level (low, medium, high, urgent)
    - agent_name: Agent making the follow-up
    - follow_up_notes: ملاحظات المتابعة
    
    Optional fields:
    - tracking_number: Order tracking number (optional)
    - follow_up_time: Time of follow-up (optional)
    - action_id: Link to existing service action (optional)
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='Follow-up details are required')), 400
        
        # Validate required fields
        required_fields = [
            'customer_phone',
            'follow_up_type', 
            'follow_up_date',
            'follow_up_priority',
            'agent_name',
            'follow_up_notes'
        ]
        
        for field in required_fields:
            if not data.get(field):
                return jsonify(create_api_response(False, error=f'Required field "{field}" is missing')), 400
        
        # Validate follow_up_type
        valid_follow_up_types = ['general', 'technical', 'delivery', 'complaint']
        if data['follow_up_type'] not in valid_follow_up_types:
            return jsonify(create_api_response(False, error=f'Invalid follow_up_type. Must be one of: {valid_follow_up_types}')), 400
        
        # Validate priority
        valid_priorities = ['low', 'medium', 'high', 'urgent']
        if data['follow_up_priority'] not in valid_priorities:
            return jsonify(create_api_response(False, error=f'Invalid follow_up_priority. Must be one of: {valid_priorities}')), 400
        
        with get_db() as conn:
            # Verify customer exists
            customer_cursor = conn.execute("""
                SELECT full_name, customer_segment FROM customers WHERE phone = ?
            """, (data['customer_phone'],))
            customer_info = customer_cursor.fetchone()
            
            # If tracking number provided, verify it exists
            order_info = None
            if data.get('tracking_number'):
                order_cursor = conn.execute("""
                    SELECT id, product_name, cod, dropoff_city_name, state_code
                    FROM orders WHERE tracking_number = ?
                """, (data['tracking_number'],))
                order_info = order_cursor.fetchone()
                
                if not order_info:
                    return jsonify(create_api_response(False, error='Order with provided tracking number not found')), 404
            
            # Create comprehensive follow-up record
            follow_up_cursor = conn.execute("""
                INSERT INTO service_action_follow_ups (
                    action_id, customer_phone, agent_name, call_type, call_date, 
                    call_time, call_notes, status, created_at, follow_up_priority,
                    tracking_number, customer_name, follow_up_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', CURRENT_TIMESTAMP, ?, ?, ?, ?)
            """, (
                data.get('action_id'),  # Optional - link to existing service action
                data['customer_phone'],
                data['agent_name'],
                data['follow_up_type'],  # Using call_type for follow_up_type
                data['follow_up_date'],
                data.get('follow_up_time'),  # Optional
                data['follow_up_notes'],  # ملاحظات المتابعة
                data['follow_up_priority'],
                data.get('tracking_number'),  # Optional
                customer_info[0] if customer_info else None,  # Customer name
                data['follow_up_type']
            ))
            
            follow_up_id = follow_up_cursor.lastrowid
            conn.commit()
            
            # Prepare response data
            response_data = {
                'follow_up_id': follow_up_id,
                'customer_phone': data['customer_phone'],
                'customer_name': customer_info[0] if customer_info else None,
                'customer_segment': customer_info[1] if customer_info else None,
                'tracking_number': data.get('tracking_number'),
                'order_product_name': order_info[1] if order_info else None,
                'follow_up_type': data['follow_up_type'],
                'follow_up_date': data['follow_up_date'],
                'follow_up_time': data.get('follow_up_time'),
                'follow_up_priority': data['follow_up_priority'],
                'agent_name': data['agent_name'],
                'follow_up_notes': data['follow_up_notes'],
                'status': 'scheduled'
            }
            
            return jsonify(create_api_response(
                True,
                response_data,
                message='Follow-up scheduled successfully'
            )), 201
            
    except Exception as e:
        logger.error(f"Error creating follow-up: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/follow-ups/<int:follow_up_id>', methods=['GET'])
def get_follow_up_details(follow_up_id: int):
    """Get detailed follow-up information"""
    try:
        with get_db() as conn:
            cursor = conn.execute("""
                SELECT 
                    saf.*,
                    c.full_name as customer_name,
                    c.customer_segment,
                    o.product_name as order_product_name,
                    o.cod as order_cod,
                    o.dropoff_city_name as customer_city,
                    sa.action_type as service_action_type
                FROM service_action_follow_ups saf
                LEFT JOIN customers c ON saf.customer_phone = c.phone
                LEFT JOIN orders o ON saf.tracking_number = o.tracking_number
                LEFT JOIN service_actions sa ON saf.action_id = sa.action_id
                WHERE saf.follow_up_id = ?
            """, (follow_up_id,))
            
            follow_up = cursor.fetchone()
            
            if not follow_up:
                return jsonify(create_api_response(False, error='Follow-up not found')), 404
            
            # Convert to dict for response
            columns = [description[0] for description in cursor.description]
            follow_up_dict = dict(zip(columns, follow_up))
            
            return jsonify(create_api_response(True, follow_up_dict))
            
    except Exception as e:
        logger.error(f"Error getting follow-up details: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/follow-ups/<int:follow_up_id>/complete', methods=['PUT'])
def complete_follow_up(follow_up_id: int):
    """Complete a follow-up with results"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='Completion data required')), 400
        
        # Required fields for completion
        required_fields = ['completion_notes']
        for field in required_fields:
            if not data.get(field):
                return jsonify(create_api_response(False, error=f'Required field "{field}" is missing')), 400
        
        with get_db() as conn:
            # Update follow-up record
            cursor = conn.execute("""
                UPDATE service_action_follow_ups SET
                    status = 'completed',
                    completed_at = CURRENT_TIMESTAMP,
                    call_notes = call_notes || char(10) || 'نتائج المتابعة: ' || ?
                WHERE follow_up_id = ?
            """, (
                data['completion_notes'],
                follow_up_id
            ))
            
            if cursor.rowcount == 0:
                return jsonify(create_api_response(False, error='Follow-up not found')), 404
            
            # If need another follow-up, schedule it
            next_follow_up_id = None
            if data.get('schedule_next') and data.get('next_follow_up_date'):
                conn.execute("""
                    INSERT INTO service_action_follow_ups (
                        action_id, customer_phone, agent_name, call_type, call_date,
                        call_time, call_notes, status, created_at, follow_up_priority,
                        tracking_number, follow_up_type
                    )
                    SELECT 
                        action_id, customer_phone, ?, call_type, ?,
                        ?, 'متابعة إضافية مطلوبة من العميل', 'scheduled', CURRENT_TIMESTAMP, follow_up_priority,
                        tracking_number, follow_up_type
                    FROM service_action_follow_ups
                    WHERE follow_up_id = ?
                """, (
                    data.get('next_agent_name', 'System'),
                    data['next_follow_up_date'],
                    data.get('next_follow_up_time'),
                    follow_up_id
                ))
                
                next_follow_up_id = cursor.lastrowid
            
            conn.commit()
            
            response_data = {
                'follow_up_id': follow_up_id,
                'status': 'completed',
                'next_follow_up_id': next_follow_up_id
            }
            
            return jsonify(create_api_response(
                True,
                response_data,
                message='Follow-up completed successfully'
            ))
            
    except Exception as e:
        logger.error(f"Error completing follow-up: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/follow-ups/<int:action_id>/schedule', methods=['POST'])
def schedule_follow_up_call(action_id):
    """
    Legacy endpoint - Schedule follow-up call for service action
    Maintained for backward compatibility but redirects to new comprehensive endpoint
    """
    try:
        action_id = int(action_id)
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='Call details are required')), 400
        
        required_fields = ['agent_name', 'call_date', 'call_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify(create_api_response(False, error=f'Required field "{field}" is missing')), 400
        
        with get_db() as conn:
            # Get service action details
            cursor = conn.execute("""
                SELECT customer_phone, tracking_number, action_type, priority
                FROM service_actions WHERE action_id = ?
            """, (action_id,))
            
            action_result = cursor.fetchone()
            if not action_result:
                return jsonify(create_api_response(False, error='Service action not found')), 404
            
            customer_phone, tracking_number, action_type, priority = action_result
            
            # Create follow-up using enhanced structure
            follow_up_data = {
                'action_id': action_id,
                'customer_phone': customer_phone,
                'tracking_number': tracking_number,
                'follow_up_type': data['call_type'],
                'follow_up_date': data['call_date'],
                'follow_up_time': data.get('call_time'),
                'follow_up_priority': priority or 'medium',
                'agent_name': data['agent_name'],
                'follow_up_notes': data.get('call_notes', f'متابعة تلقائية لإجراء الخدمة #{action_id}')
            }
            
            # Use the new comprehensive follow-up creation
            return create_follow_up_internal(follow_up_data, conn)
            
    except Exception as e:
        logger.error(f"Error scheduling follow-up call: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

def create_follow_up_internal(follow_up_data: dict, conn) -> dict:
    """Internal function to create follow-up with provided connection"""
    try:
        # Verify customer exists
        customer_cursor = conn.execute("""
            SELECT full_name, customer_segment FROM customers WHERE phone = ?
        """, (follow_up_data['customer_phone'],))
        customer_info = customer_cursor.fetchone()
        
        # Create follow-up record
        follow_up_cursor = conn.execute("""
                INSERT INTO service_action_follow_ups (
                    action_id, customer_phone, agent_name, call_type, call_date, 
                call_time, call_notes, status, created_at, follow_up_priority,
                tracking_number, customer_name, follow_up_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', CURRENT_TIMESTAMP, ?, ?, ?, ?)
            """, (
            follow_up_data.get('action_id'),
            follow_up_data['customer_phone'],
            follow_up_data['agent_name'],
            follow_up_data['follow_up_type'],
            follow_up_data['follow_up_date'],
            follow_up_data.get('follow_up_time'),
            follow_up_data['follow_up_notes'],
            follow_up_data['follow_up_priority'],
            follow_up_data.get('tracking_number'),
            customer_info[0] if customer_info else None,
            follow_up_data['follow_up_type']
        ))
        
        follow_up_id = follow_up_cursor.lastrowid
        conn.commit()
        
        return jsonify(create_api_response(
            True,
            {
                    'follow_up_id': follow_up_id,
                'action_id': follow_up_data.get('action_id'),
                'customer_phone': follow_up_data['customer_phone']
                },
                message='Follow-up call scheduled successfully'
            ))
            
    except Exception as e:
        logger.error(f"Error in create_follow_up_internal: {e}")
        raise

def _get_customer_follow_ups_enhanced(conn, priority: str, status: str, days_back: int, 
                                    customer_phone: str, tracking_number: str, 
                                    agent_name: str, follow_up_type: str) -> List[Dict[str, Any]]:
    """Enhanced function to get customers requiring follow-up with comprehensive filtering"""
    try:
        conditions = []
        params = []
        
        # Build dynamic WHERE conditions
        if priority:
            conditions.append("saf.follow_up_priority = ?")
            params.append(priority)
        
        if status:
            conditions.append("saf.status = ?")
            params.append(status)
        
        if customer_phone:
            conditions.append("saf.customer_phone = ?")
            params.append(customer_phone)
            
        if tracking_number:
            conditions.append("saf.tracking_number = ?")
            params.append(tracking_number)
            
        if agent_name:
            conditions.append("saf.agent_name LIKE ?")
            params.append(f'%{agent_name}%')
            
        if follow_up_type:
            conditions.append("saf.follow_up_type = ?")
            params.append(follow_up_type)
        
        # Default time filter
        conditions.append("saf.created_at >= date('now', '-{} days')".format(days_back))
        
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        cursor = conn.execute(f"""
            SELECT 
                saf.follow_up_id,
                saf.action_id,
                saf.customer_phone,
                saf.tracking_number,
                saf.call_type as follow_up_type,
                saf.follow_up_priority,
                saf.status,
                saf.call_date as follow_up_date,
                saf.call_time as follow_up_time,
                saf.agent_name,
                saf.call_notes as follow_up_notes,
                saf.created_at,
                saf.completed_at,
                c.full_name as customer_name,
                c.customer_segment,
                o.product_name as order_product_name,
                o.cod as order_cod,
                o.dropoff_city_name as customer_city,
                sa.action_type as service_action_type,
                sa.action_status as service_action_status
            FROM service_action_follow_ups saf
            LEFT JOIN customers c ON saf.customer_phone = c.phone
            LEFT JOIN orders o ON saf.tracking_number = o.tracking_number
            LEFT JOIN service_actions sa ON saf.action_id = sa.action_id
            {where_clause}
            ORDER BY saf.follow_up_priority DESC, saf.call_date ASC, saf.created_at DESC
        """, params)
        
        columns = [description[0] for description in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
        
    except Exception as e:
        logger.error(f"Error getting customer follow-ups: {e}")
        return []

# =================== ANALYTICS & DASHBOARD ===================

@bp.route('/analytics', methods=['GET'])
def get_service_analytics():
    """Get comprehensive service analytics with real-time metrics"""
    try:
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        with get_db() as conn:
            analytics = _get_comprehensive_analytics(conn, date_from, date_to)
            
            return jsonify(create_api_response(True, analytics))
            
    except Exception as e:
        logger.error(f"Error getting analytics: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/dashboard', methods=['GET'])
def get_unified_dashboard():
    """Get unified service dashboard with real-time status"""
    try:
        with get_db() as conn:
            dashboard_data = _get_unified_dashboard_data(conn)
            
            return jsonify(create_api_response(True, dashboard_data))
            
    except Exception as e:
        logger.error(f"Error getting dashboard: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

# =================== UNIFIED CUSTOMER SERVICE FOLLOW-UP ENDPOINT ===================

@bp.route('/schedule-follow-up', methods=['POST'])
def schedule_follow_up():
    """
    Unified endpoint for scheduling follow-ups from NewServiceActionForm.jsx
    
    This endpoint is specifically designed to match the data structure and requirements
    of the follow-up form in the frontend application.
    
    Required fields (as per NewServiceActionForm.jsx):
    - customer_phone: Customer reference linked by phone number
    - follow_up_type: Type of follow-up (general, technical, delivery, complaint)  
    - follow_up_date: Date of follow-up (required)
    - follow_up_priority: Priority level (low, medium, high, urgent)
    - agent_name: Agent making this follow-up
    - follow_up_notes: ملاحظات المتابعة (Follow-up notes)
    
    Optional fields:
    - tracking_number: Order tracking number (optional) 
    - follow_up_time: Time of follow-up (optional)
    - follow_up_order_id: Link to specific order (optional)
    - action_id: Link to existing service action (optional)
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='Follow-up data is required')), 400
        
        # Validate required fields from NewServiceActionForm.jsx
        required_fields = [
            'customer_phone',       # Customer reference
            'follow_up_type',       # Type of follow-up
            'follow_up_date',       # Date (required)
            'follow_up_priority',   # Priority level  
            'agent_name',           # Agent name
            'follow_up_notes'       # ملاحظات المتابعة
        ]
        
        for field in required_fields:
            if not data.get(field):
                return jsonify(create_api_response(
                    False, 
                    error=f'مطلوب: {field}',
                    error_en=f'Required field: {field}',
                    field=field
                )), 400
        
        # Validate follow_up_type (matches NewServiceActionForm.jsx options)
        valid_follow_up_types = ['general', 'technical', 'delivery', 'complaint']
        if data['follow_up_type'] not in valid_follow_up_types:
            return jsonify(create_api_response(
                False, 
                error=f'نوع المتابعة غير صحيح. يجب أن يكون واحداً من: {valid_follow_up_types}',
                error_en=f'Invalid follow_up_type. Must be one of: {valid_follow_up_types}',
                field='follow_up_type'
            )), 400
        
        # Validate priority (matches NewServiceActionForm.jsx options)  
        valid_priorities = ['low', 'medium', 'high', 'urgent']
        if data['follow_up_priority'] not in valid_priorities:
            return jsonify(create_api_response(
                False,
                error=f'مستوى الأولوية غير صحيح. يجب أن يكون واحداً من: {valid_priorities}',
                error_en=f'Invalid priority. Must be one of: {valid_priorities}',
                field='follow_up_priority'
            )), 400
        
        with get_db() as conn:
            # Get customer information
            customer_cursor = conn.execute("""
                SELECT customer_id, full_name, customer_segment 
                FROM customers WHERE phone = ?
            """, (data['customer_phone'],))
            customer_info = customer_cursor.fetchone()
            
            # Get order information if tracking number or order ID provided
            order_info = None
            tracking_number = data.get('tracking_number')
            follow_up_order_id = data.get('follow_up_order_id')
            
            if tracking_number:
                order_cursor = conn.execute("""
                    SELECT id, tracking_number, product_name, cod, dropoff_city_name, state_code
                    FROM orders WHERE tracking_number = ?
                """, (tracking_number,))
                order_info = order_cursor.fetchone()
            elif follow_up_order_id:
                order_cursor = conn.execute("""
                    SELECT id, tracking_number, product_name, cod, dropoff_city_name, state_code  
                    FROM orders WHERE id = ?
                """, (follow_up_order_id,))
                order_info = order_cursor.fetchone()
                if order_info:
                    tracking_number = order_info[1]  # Set tracking number from order
            
            # Create comprehensive follow-up record
            follow_up_cursor = conn.execute("""
                INSERT INTO service_action_follow_ups (
                    action_id, customer_phone, agent_name, call_type, call_date,
                    call_time, call_notes, status, created_at, follow_up_priority,
                    tracking_number, customer_name, follow_up_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', CURRENT_TIMESTAMP, ?, ?, ?, ?)
            """, (
                data.get('action_id'),          # Optional - existing service action link
                data['customer_phone'],         # Required - customer reference
                data['agent_name'],             # Required - agent name  
                data['follow_up_type'],         # Required - type (using call_type for compatibility)
                data['follow_up_date'],         # Required - date
                data.get('follow_up_time'),     # Optional - time
                data['follow_up_notes'],        # Required - ملاحظات المتابعة
                data['follow_up_priority'],     # Required - priority
                tracking_number,                # Optional - from tracking_number or order
                customer_info[1] if customer_info else None,  # Customer name
                data['follow_up_type']          # follow_up_type field
            ))
            
            follow_up_id = follow_up_cursor.lastrowid
            conn.commit()
            
            # Prepare comprehensive response for frontend
            response_data = {
                'success': True,
                'follow_up_id': follow_up_id,
                
                # Customer information
                'customer': {
                    'phone': data['customer_phone'],
                    'name': customer_info[1] if customer_info else None,
                    'segment': customer_info[2] if customer_info else None
                },
                
                # Order information (if linked)
                'order': {
                    'id': order_info[0] if order_info else None,
                    'tracking_number': tracking_number,
                    'product_name': order_info[2] if order_info else None,
                    'cod': order_info[3] if order_info else None,
                    'city': order_info[4] if order_info else None
                } if order_info else None,
                
                # Follow-up details
                'follow_up': {
                    'type': data['follow_up_type'],
                    'date': data['follow_up_date'],
                    'time': data.get('follow_up_time'),
                    'priority': data['follow_up_priority'],
                    'agent': data['agent_name'],
                    'notes': data['follow_up_notes'],
                    'status': 'scheduled'
                },
                
                # System information
                'created_at': datetime.now().isoformat(),
                'action_id': data.get('action_id')
            }
            
            return jsonify(create_api_response(
                True,
                response_data,
                message='تم جدولة المتابعة بنجاح',
                message_en='Follow-up scheduled successfully'
            )), 201
            
    except Exception as e:
        logger.error(f"Error in schedule_follow_up: {e}")
        return jsonify(create_api_response(
            False, 
            error='خطأ في إنشاء المتابعة',
            error_en=f'Error creating follow-up: {str(e)}'
        )), 500

# =================== HELPER FUNCTIONS ===================

def _enrich_service_action_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Enrich service action data for manual creation - NO AUTO GENERATION"""
    # Add default values and enrich with business context for manual creation
    enriched = data.copy()
    
    # Manual creation requirements
    enriched['requires_service_action'] = True
    enriched['manual_creation'] = True
    enriched['manual_processing'] = True
    
    # If no explicit service type, use the provided action_type
    if not enriched.get('service_type'):
        enriched['service_type'] = enriched.get('action_type', 'manual')
    
    # Set priority if not provided
    if not enriched.get('priority'):
        enriched['priority'] = 'medium'
    
    # Ensure tracking number is available
    if not enriched.get('tracking_number') and enriched.get('receiver_phone'):
        enriched['tracking_number'] = f"MANUAL-{enriched['receiver_phone']}-{int(time.time())}"
    
    return enriched

def _get_service_actions_with_context(conn, filters: Dict[str, Any], page: int, limit: int) -> Dict[str, Any]:
    """Get service actions with customer and order context"""
    try:
        # Build WHERE clause
        where_conditions = []
        params = []
        
        for field, value in filters.items():
            if field == 'date_from':
                where_conditions.append("DATE(sa.created_at) >= ?")
                params.append(value)
            elif field == 'date_to':
                where_conditions.append("DATE(sa.created_at) <= ?")
                params.append(value)
            else:
                where_conditions.append(f"sa.{field} = ?")
                params.append(value)
        
        where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
        
        # Get total count
        count_query = f"""
            SELECT COUNT(*) FROM service_actions sa {where_clause}
        """
        cursor = conn.execute(count_query, params)
        total_count = cursor.fetchone()[0]
        
        # Get paginated results with context
        query = f"""
            SELECT 
                sa.*,
                c.full_name as customer_name,
                c.customer_segment,
                c.total_orders as customer_total_orders,
                o.state_value as order_status,
                o.dropoff_city_name as customer_city,
                COUNT(sap.service_action_part_id) as parts_count
            FROM service_actions sa
            LEFT JOIN customers c ON sa.customer_phone = c.phone
            LEFT JOIN orders o ON sa.tracking_number = o.tracking_number
            LEFT JOIN service_action_parts sap ON sa.action_id = sap.action_id
            {where_clause}
            GROUP BY sa.action_id
            ORDER BY sa.created_at DESC
            LIMIT ? OFFSET ?
        """
        
        offset = (page - 1) * limit
        params.extend([limit, offset])
        
        cursor = conn.execute(query, params)
        columns = [description[0] for description in cursor.description]
        actions = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        return {
            'success': True,
            'actions': actions,
            'total_count': total_count,
            'pagination': {
                'page': page,
                'limit': limit,
                'total_pages': (total_count + limit - 1) // limit
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting service actions with context: {e}")
        return {'success': False, 'error': str(e)}

def _get_service_action_details(conn, action_id: int) -> Optional[Dict[str, Any]]:
    """Get basic service action details"""
    try:
        cursor = conn.execute("""
            SELECT * FROM service_actions WHERE action_id = ?
        """, (action_id,))
        
        row = cursor.fetchone()
        if row:
            columns = [description[0] for description in cursor.description]
            return dict(zip(columns, row))
        return None
        
    except Exception as e:
        logger.error(f"Error getting service action details: {e}")
        return None

def _get_comprehensive_service_action_details(conn, action_id: int) -> Optional[Dict[str, Any]]:
    """Get comprehensive service action details with all related data"""
    try:
        # Get main action details
        action_details = _get_service_action_details(conn, action_id)
        if not action_details:
            return None
        
        # Get customer details
        cursor = conn.execute("""
            SELECT * FROM customers WHERE phone = ?
        """, (action_details['customer_phone'],))
        customer_row = cursor.fetchone()
        if customer_row:
            customer_columns = [description[0] for description in cursor.description]
            action_details['customer_details'] = dict(zip(customer_columns, customer_row))
        
        # Get order details
        cursor = conn.execute("""
            SELECT * FROM orders WHERE tracking_number = ?
        """, (action_details['tracking_number'],))
        order_row = cursor.fetchone()
        if order_row:
            order_columns = [description[0] for description in cursor.description]
            action_details['order_details'] = dict(zip(order_columns, order_row))
        
        # Get parts details
        cursor = conn.execute("""
            SELECT * FROM service_action_parts WHERE action_id = ?
        """, (action_id,))
        parts_columns = [description[0] for description in cursor.description]
        action_details['parts'] = [dict(zip(parts_columns, row)) for row in cursor.fetchall()]
        
        # Get hub confirmation details
        cursor = conn.execute("""
            SELECT * FROM hub_confirmation_workflow WHERE action_id = ?
        """, (action_id,))
        hub_row = cursor.fetchone()
        if hub_row:
            hub_columns = [description[0] for description in cursor.description]
            action_details['hub_confirmation'] = dict(zip(hub_columns, hub_row))
        
        return action_details
        
    except Exception as e:
        logger.error(f"Error getting comprehensive service action details: {e}")
        return None

def _handle_damaged_part_stock(conn, sku: str, action_id: int):
    """Handle stock movements for damaged parts"""
    try:
        # Move part to damaged stock
        conn.execute("""
            UPDATE stock 
            SET quantity = quantity - 1, available_quantity = available_quantity - 1
            WHERE sku = ? AND location = 'main_warehouse'
        """, (sku,))
        
        # Add to damaged stock
        conn.execute("""
            INSERT OR REPLACE INTO stock (sku, location, quantity, available_quantity)
            VALUES (?, 'damaged_stock', 
                COALESCE((SELECT quantity FROM stock WHERE sku = ? AND location = 'damaged_stock'), 0) + 1,
                COALESCE((SELECT available_quantity FROM stock WHERE sku = ? AND location = 'damaged_stock'), 0) + 1
            )
        """, (sku, sku, sku))
        
        # Record stock movement
        conn.execute("""
            INSERT INTO stock_movements (
                sku, location_from, location_to, quantity, movement_type, 
                reference_id, reference_type, notes
            ) VALUES (?, 'main_warehouse', 'damaged_stock', 1, 'service', ?, 'service_action', ?)
        """, (sku, str(action_id), f"Damaged part moved from service action {action_id}"))
        
    except Exception as e:
        logger.error(f"Error handling damaged part stock: {e}")

def _get_comprehensive_analytics(conn, date_from: str, date_to: str) -> Dict[str, Any]:
    """Get comprehensive service analytics"""
    try:
        # Build date filter
        date_filter = ""
        params = []
        if date_from and date_to:
            date_filter = "WHERE DATE(created_at) BETWEEN ? AND ?"
            params = [date_from, date_to]
        
        # Service action stats
        cursor = conn.execute(f"""
            SELECT 
                COUNT(*) as total_actions,
                COUNT(CASE WHEN action_status = 'completed' THEN 1 END) as completed_actions,
                COUNT(CASE WHEN action_status IN ('requested', 'in_progress') THEN 1 END) as active_actions,
                COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_actions,
                COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_actions
            FROM service_actions
            {date_filter}
        """, params)
        
        action_stats = cursor.fetchone()
        
        # Action type breakdown
        cursor = conn.execute(f"""
            SELECT action_type, COUNT(*) as count
            FROM service_actions
            {date_filter}
            GROUP BY action_type
        """, params)
        
        action_types = dict(cursor.fetchall())
        
        # Parts analytics
        cursor = conn.execute(f"""
            SELECT 
                COUNT(DISTINCT sap.sku) as unique_parts,
                COUNT(*) as total_parts_used,
                COUNT(CASE WHEN sap.action_type = 'replaced' THEN 1 END) as parts_replaced,
                COUNT(CASE WHEN sap.condition_after = 'damaged' THEN 1 END) as parts_damaged
            FROM service_action_parts sap
            JOIN service_actions sa ON sap.action_id = sa.action_id
            {date_filter.replace('created_at', 'sa.created_at') if date_filter else ''}
        """, params)
        
        parts_stats = cursor.fetchone()
        
        return {
            'service_actions': {
                'total': action_stats[0],
                'completed': action_stats[1],
                'active': action_stats[2],
                'high_priority': action_stats[3],
                'urgent': action_stats[4]
            },
            'action_types': action_types,
            'parts': {
                'unique_parts': parts_stats[0],
                'total_used': parts_stats[1],
                'replaced': parts_stats[2],
                'damaged': parts_stats[3]
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting comprehensive analytics: {e}")
        return {}

def _get_unified_dashboard_data(conn) -> Dict[str, Any]:
    """Get unified dashboard data"""
    try:
        # Today's activities
        today = datetime.now().date().isoformat()
        
        cursor = conn.execute("""
            SELECT 
                COUNT(*) as actions_created_today,
                COUNT(CASE WHEN action_status = 'completed' THEN 1 END) as actions_completed_today,
                COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_actions_today
            FROM service_actions 
            WHERE DATE(created_at) = ?
        """, (today,))
        
        today_stats = cursor.fetchone()
        
        # Priority breakdown
        cursor = conn.execute("""
            SELECT priority, COUNT(*) as count
            FROM service_actions
            WHERE action_status NOT IN ('completed', 'cancelled')
            GROUP BY priority
        """)
        
        priority_breakdown = dict(cursor.fetchall())
        
        # Status breakdown
        cursor = conn.execute("""
            SELECT action_status, COUNT(*) as count
            FROM service_actions
            GROUP BY action_status
        """)
        
        status_breakdown = dict(cursor.fetchall())
        
        return {
            'today': {
                'actions_created': today_stats[0],
                'actions_completed': today_stats[1],
                'urgent_actions': today_stats[2]
            },
            'priority_breakdown': priority_breakdown,
            'status_breakdown': status_breakdown
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
        return {}

# =================== INTERNAL HELPERS FOR COMMANDS ===================

def _perform_hub_scan(conn, data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        return_tracking = data.get('return_tracking_number')
        hub_agent = data.get('hub_agent', 'Unknown')
        scan_notes = data.get('scan_notes', '')
        if not return_tracking:
            return {'success': False, 'error': 'Return tracking number is required'}

        cursor = conn.execute("""
            SELECT sa.action_id, sa.customer_phone, sa.tracking_number, sa.action_type
            FROM service_actions sa
            WHERE sa.return_tracking_number = ? 
               OR sa.return_tracking_number LIKE ? 
               OR sa.return_tracking_number LIKE ?
               OR sa.tracking_number = ?
        """, (return_tracking, f"RET{return_tracking}%", f"RTN-{return_tracking}%", return_tracking))
        action_result = cursor.fetchone()
        if not action_result:
            return {'success': False, 'error': 'No service action found for this return tracking number'}
        action_id = action_result[0]

        cursor = conn.execute("""
            UPDATE hub_confirmation_workflow 
            SET confirmation_status = 'scanned', 
                inspection_notes = ?,
                confirmed_at = CURRENT_TIMESTAMP
            WHERE return_tracking_number = ?
        """, (f"Scanned by {hub_agent}. {scan_notes}", return_tracking))
        if cursor.rowcount == 0:
            conn.execute("""
                INSERT INTO hub_confirmation_workflow (
                    action_id, return_tracking_number, confirmation_status,
                    inspection_notes, confirmed_at
                ) VALUES (?, ?, 'scanned', ?, CURRENT_TIMESTAMP)
            """, (action_id, return_tracking, f"Scanned by {hub_agent}. {scan_notes}"))

        return {
            'success': True,
            'action_id': action_id,
            'return_tracking_number': return_tracking,
            'status': 'scanned'
        }
    except Exception as e:
        logger.error(f"Error in _perform_hub_scan: {e}")
        return {'success': False, 'error': str(e)}


def _perform_hub_inspection(conn, data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        return_tracking = data.get('return_tracking_number')
        if not return_tracking:
            return {'success': False, 'error': 'Return tracking number is required'}
        product_condition = data.get('product_condition', 'unknown')
        quality_score = data.get('quality_score', 0)
        inspection_notes = data.get('inspection_notes', '')
        parts_inspection = data.get('parts_inspection', [])
        hub_agent = data.get('hub_agent', 'Unknown')

        cursor = conn.execute("""
            SELECT sa.action_id, sa.customer_phone, sa.tracking_number, sa.action_type, sa.priority
            FROM service_actions sa
            WHERE sa.return_tracking_number = ? 
               OR sa.return_tracking_number LIKE ? 
               OR sa.return_tracking_number LIKE ?
               OR sa.tracking_number = ?
        """, (return_tracking, f"RET{return_tracking}%", f"RTN-{return_tracking}%", return_tracking))
        action_result = cursor.fetchone()
        if not action_result:
            return {'success': False, 'error': 'No service action found for this return tracking number'}
        action_id, _, _, _, priority = action_result

        conn.execute("""
            UPDATE hub_confirmation_workflow 
            SET confirmation_status = 'confirmed', 
                product_condition = ?,
                quality_score = ?,
                inspection_notes = ?,
                confirmed_at = CURRENT_TIMESTAMP
            WHERE return_tracking_number = ?
        """, (product_condition, quality_score, inspection_notes, return_tracking))

        for part_inspection in parts_inspection:
            sku = part_inspection.get('sku')
            condition = part_inspection.get('condition', 'unknown')
            notes = part_inspection.get('notes', '')
            if sku:
                conn.execute("""
                    UPDATE service_action_parts 
                    SET condition_after = ?, notes = ?
                    WHERE action_id = ? AND sku = ?
                """, (condition, notes, action_id, sku))
                if condition == 'damaged':
                    _handle_damaged_part_stock(conn, sku, action_id)

        team_leader_review_required = (
            (quality_score or 0) < 5 or 
            product_condition == 'damaged' or 
            (priority in ['high', 'urgent']) or
            any(p.get('condition') == 'damaged' for p in parts_inspection)
        )

        # Update service action status accordingly
        if team_leader_review_required:
            service_action_manager.update_service_action_status(
                conn, action_id, 'awaiting_review',
                quality_score=quality_score,
                product_condition=product_condition,
                hub_agent=hub_agent
            )
        else:
            service_action_manager.update_service_action_status(
                conn, action_id, 'hub_confirmed',
                quality_score=quality_score,
                product_condition=product_condition,
                hub_agent=hub_agent
            )

        return {
            'success': True,
            'action_id': action_id,
            'quality_score': quality_score,
            'product_condition': product_condition,
            'team_leader_review_required': team_leader_review_required,
            'parts_inspected': len(parts_inspection)
        }
    except Exception as e:
        logger.error(f"Error in _perform_hub_inspection: {e}")
        return {'success': False, 'error': str(e)}


def _create_new_order_minimal(conn, data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        from datetime import datetime
        import time
        receiver_phone = data.get('receiver_phone')
        product_name = data.get('product_name', 'Manual Order')
        cod = float(data.get('cod', 0))
        if not receiver_phone:
            return {'success': False, 'error': 'receiver_phone is required'}

        now_iso = datetime.utcnow().isoformat()
        ts = int(time.time())
        order_id = data.get('id') or f"MAN-{receiver_phone}-{ts}"
        tracking_number = data.get('tracking_number') or f"MAN-{receiver_phone}-{ts}"

        notes = (data.get('notes') or '')
        # Append NEW_ORDER_FLOW audit
        notes = f"{notes} [NEW_ORDER_FLOW:{'created'}]".strip()

        conn.execute("""
            INSERT OR REPLACE INTO orders (
                id, tracking_number, state_code, state_value, masked_state,
                is_confirmed_delivery, allow_open_package,
                order_type_code, order_type_value,
                cod, bosta_fees, deposited_amount,
                receiver_phone, receiver_name, receiver_first_name, receiver_last_name, receiver_second_phone,
                notes, specs_items_count, specs_description, product_name, product_count,
                dropoff_city_name, dropoff_city_name_ar, dropoff_zone_name, dropoff_zone_name_ar,
                dropoff_district_name, dropoff_district_name_ar, dropoff_first_line,
                pickup_city, pickup_zone, pickup_district, pickup_address,
                delivery_lat, delivery_lng, star_name, star_phone,
                timeline_json, created_at, scheduled_at, picked_up_at, received_at_warehouse, delivered_at, returned_at, latest_awb_print_date, last_call_time,
                delivery_time_hours, attempts_count, calls_count, order_sla_timestamp, order_sla_exceeded, e2e_sla_timestamp, e2e_sla_exceeded,
                last_synced, created_by_system, is_processed, business_category, cod_category, risk_level
            ) VALUES (
                ?, ?, 10, 'Created', NULL,
                0, 0,
                10, 'Send',
                ?, 0, 0,
                ?, NULL, NULL, NULL, NULL,
                ?, 1, NULL, ?, 1,
                ?, NULL, ?, NULL,
                ?, NULL, ?,
                NULL, NULL, NULL, NULL,
                NULL, NULL, NULL, NULL,
                '[]', ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
                NULL, 0, 0, NULL, 0, NULL, 0,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 'normal', 'created', 'normal'
            )
        """, (
            order_id, tracking_number,
            cod,
            receiver_phone,
            notes, product_name,
            data.get('dropoff_city_name'), data.get('dropoff_zone_name'), data.get('dropoff_district_name'), data.get('dropoff_first_line'),
            now_iso
        ))

        # Initialize/Update customer profile
        # Provide a minimal order dict for the profile manager
        order_stub = {
            'tracking_number': tracking_number,
            'receiver_phone': receiver_phone,
            'receiver_name': data.get('receiver_name'),
            'product_name': product_name,
            'cod': cod,
            'dropoff_city_name': data.get('dropoff_city_name'),
            'dropoff_zone_name': data.get('dropoff_zone_name'),
            'dropoff_district_name': data.get('dropoff_district_name'),
            'dropoff_first_line': data.get('dropoff_first_line'),
            'created_at': now_iso
        }
        customer_profile_manager.process_customer_from_order(conn, order_stub)

        return {
            'success': True,
            'order_id': order_id,
            'tracking_number': tracking_number,
            'state': 'created'
        }
    except Exception as e:
        logger.error(f"Error creating minimal order: {e}")
        return {'success': False, 'error': str(e)}


def _update_new_order_state(conn, data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        target_state = data.get('target_state')
        if not target_state:
            return {'success': False, 'error': 'target_state is required'}
        identifier = data.get('id') or data.get('tracking_number')
        if not identifier:
            return {'success': False, 'error': 'id or tracking_number is required'}

        # Locate order
        if data.get('id'):
            cursor = conn.execute("SELECT tracking_number FROM orders WHERE id = ?", (data['id'],))
        else:
            cursor = conn.execute("SELECT id FROM orders WHERE tracking_number = ?", (data['tracking_number'],))
        row = cursor.fetchone()
        if not row:
            return {'success': False, 'error': 'Order not found'}

        # Update cod_category to reflect new-order state machine
        set_delivered = target_state in ['done', 'completed']
        delivered_at_clause = ", delivered_at = CURRENT_TIMESTAMP" if set_delivered else ""
        conn.execute(f"""
            UPDATE orders 
            SET cod_category = ?, notes = COALESCE(notes,'') || ' [NEW_ORDER_FLOW:{target_state}]'{delivered_at_clause}
            WHERE id = ? OR tracking_number = ?
        """, (target_state if target_state != 'done' else 'completed', data.get('id', ''), data.get('tracking_number', '')))

        # Optional schedule info in notes
        if target_state == 'scheduled' and (data.get('schedule_date') or data.get('schedule_time')):
            schedule_stamp = f" [SCHEDULED:{data.get('schedule_date','')} {data.get('schedule_time','')}]"
            conn.execute("""
                UPDATE orders SET notes = COALESCE(notes,'') || ? WHERE id = ? OR tracking_number = ?
            """, (schedule_stamp, data.get('id', ''), data.get('tracking_number', '')))

        return {'success': True, 'target_state': target_state}
    except Exception as e:
        logger.error(f"Error updating new order state: {e}")
        return {'success': False, 'error': str(e)}

# =================== DATABASE SCHEMA UPDATES ===================

UNIFIED_SERVICE_SCHEMA_ADDITIONS = """
-- Service Action Follow-ups (Enhanced for NewServiceActionForm.jsx)
CREATE TABLE IF NOT EXISTS service_action_follow_ups (
    follow_up_id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id INTEGER, -- Optional - link to existing service action
    customer_phone VARCHAR(20) NOT NULL, -- Required - Customer reference
    tracking_number TEXT, -- Optional - Order tracking number
    agent_name VARCHAR(100) NOT NULL, -- Required - Agent making follow-up
    
    -- Follow-up Type and Priority (Required)
    follow_up_type VARCHAR(50) NOT NULL, -- 'general', 'technical', 'delivery', 'complaint'
    call_type VARCHAR(50) NOT NULL, -- Backward compatibility field
    follow_up_priority VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'urgent'
    
    -- Date and Time (Date required, Time optional)
    call_date DATE NOT NULL, -- Required - Follow-up date
    call_time TIME, -- Optional - Follow-up time
    
    -- Notes and Status
    call_notes TEXT NOT NULL, -- Required - ملاحظات المتابعة (Follow-up notes)
    status VARCHAR(30) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'failed', 'cancelled'
    
    -- Completion tracking
    completed_at TIMESTAMP,
    
    -- Customer context (Auto-populated)
    customer_name VARCHAR(200), -- Auto-filled from customer table
    
    -- System fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (action_id) REFERENCES service_actions(action_id) ON DELETE SET NULL
);

-- Create comprehensive indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_service_follow_ups_customer ON service_action_follow_ups(customer_phone);
CREATE INDEX IF NOT EXISTS idx_service_follow_ups_tracking ON service_action_follow_ups(tracking_number);
CREATE INDEX IF NOT EXISTS idx_service_follow_ups_agent ON service_action_follow_ups(agent_name);
CREATE INDEX IF NOT EXISTS idx_service_follow_ups_type ON service_action_follow_ups(follow_up_type);
CREATE INDEX IF NOT EXISTS idx_service_follow_ups_priority ON service_action_follow_ups(follow_up_priority);
CREATE INDEX IF NOT EXISTS idx_service_follow_ups_status ON service_action_follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_service_follow_ups_date ON service_action_follow_ups(call_date);
CREATE INDEX IF NOT EXISTS idx_service_follow_ups_created ON service_action_follow_ups(created_at);

-- Legacy indexes for backward compatibility  
CREATE INDEX IF NOT EXISTS idx_service_follow_ups_action ON service_action_follow_ups(action_id);
CREATE INDEX IF NOT EXISTS idx_service_follow_ups_phone ON service_action_follow_ups(customer_phone);

-- Add trigger to auto-update timestamp
CREATE TRIGGER IF NOT EXISTS update_follow_up_timestamp 
    AFTER UPDATE ON service_action_follow_ups
    FOR EACH ROW
BEGIN
    UPDATE service_action_follow_ups 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE follow_up_id = NEW.follow_up_id;
END;
"""

def init_unified_service_database():
    """Initialize unified service database additions"""
    try:
        with get_db() as conn:
            # Add unified service schema
            conn.executescript(UNIFIED_SERVICE_SCHEMA_ADDITIONS)
            conn.commit()
            
            logger.info("✅ Unified service database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Error initializing unified service database: {e}")
        raise 