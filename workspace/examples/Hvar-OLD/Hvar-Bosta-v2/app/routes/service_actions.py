"""
Enhanced Service Action API Routes
Unified endpoints for service action management with parts tracking
Following HVAR Complete Cycle System specifications
"""

from flask import Blueprint, request, jsonify
import logging
from typing import Dict, Any, List

from app.utils.db_utils import get_db
from app.services.service_action_manager import service_action_manager
from app.utils.api_response import create_api_response

# Setup logging and blueprint
logger = logging.getLogger(__name__)
bp = Blueprint('service_actions', __name__, url_prefix='/api/service-actions')

# =================== SERVICE ACTION MANAGEMENT ===================

@bp.route('', methods=['GET'])
@bp.route('/', methods=['GET'])
def get_service_actions():
    """Get service actions with filtering and pagination"""
    try:
        # Parse query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        
        # Build filters
        filters = {}
        if request.args.get('customer_phone'):
            filters['customer_phone'] = request.args.get('customer_phone')
        if request.args.get('action_status'):
            filters['action_status'] = request.args.get('action_status')
        if request.args.get('action_type'):
            filters['action_type'] = request.args.get('action_type')
        if request.args.get('tracking_number'):
            filters['tracking_number'] = request.args.get('tracking_number')
        
        result = service_action_manager.get_service_actions(filters=filters, page=page, limit=limit)
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                result['actions'],
                pagination=result['pagination']
            ))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error getting service actions: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/<int:action_id>', methods=['GET'])
def get_service_action(action_id: int):
    """Get detailed service action information"""
    try:
        result = service_action_manager.get_service_action_with_details(action_id)
        
        if result['success']:
            return jsonify(create_api_response(True, result))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 404
            
    except Exception as e:
        logger.error(f"Error getting service action {action_id}: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/<int:action_id>/status', methods=['PUT'])
def update_service_action_status(action_id: int):
    """Update service action status with event-driven transitions"""
    try:
        data = request.get_json()
        
        if not data or not data.get('status'):
            return jsonify(create_api_response(False, error='Status is required')), 400
        
        new_status = data['status']
        
        with get_db() as conn:
            result = service_action_manager.update_service_action_status(
                conn, action_id, new_status, **data
            )
            
            if result['success']:
                conn.commit()
                return jsonify(create_api_response(True, result, message=result['message']))
            else:
                return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error updating service action status: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/<int:action_id>/execute', methods=['POST'])
def execute_service_action(action_id: int):
    """Execute service action with parts management"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='No data provided')), 400
        
        execution_type = data.get('execution_type', 'maintenance')
        parts_actions = data.get('parts_actions', [])
        
        with get_db() as conn:
            # Update status to in_progress first
            status_result = service_action_manager.update_service_action_status(
                conn, action_id, 'in_progress',
                technician=data.get('technician'),
                notes=data.get('notes', '')
            )
            
            if not status_result['success']:
                return jsonify(create_api_response(False, error=status_result['error'])), 400
            
            # Execute based on type
            if execution_type == 'maintenance':
                result = _execute_maintenance(conn, action_id, parts_actions, data)
            elif execution_type == 'product_swap':
                result = _execute_product_swap(conn, action_id, parts_actions, data)
            elif execution_type == 'refund':
                result = _execute_refund(conn, action_id, parts_actions, data)
            else:
                return jsonify(create_api_response(False, error='Invalid execution type')), 400
            
            if result['success']:
                conn.commit()
                return jsonify(create_api_response(True, result, message='Service action executed successfully'))
            else:
                return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error executing service action: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/<int:action_id>/parts', methods=['GET'])
def get_service_action_parts(action_id: int):
    """Get parts associated with service action"""
    try:
        with get_db() as conn:
            cursor = conn.execute("""
                SELECT sap.*, p.name as product_name, pp.part_name, pp.part_type
                FROM service_action_parts sap
                LEFT JOIN products p ON sap.sku = p.sku
                LEFT JOIN product_parts pp ON sap.sku = pp.part_sku
                WHERE sap.action_id = ?
                ORDER BY sap.created_at
            """, (action_id,))
            
            parts = [dict(zip([col[0] for col in cursor.description], row)) 
                    for row in cursor.fetchall()]
            
            return jsonify(create_api_response(True, {'parts': parts}))
            
    except Exception as e:
        logger.error(f"Error getting service action parts: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/<int:action_id>/parts', methods=['POST'])
def update_service_action_parts(action_id: int):
    """Update parts status for service action"""
    try:
        data = request.get_json()
        
        if not data or not data.get('parts_updates'):
            return jsonify(create_api_response(False, error='Parts updates required')), 400
        
        parts_updates = data['parts_updates']
        
        with get_db() as conn:
            for part_update in parts_updates:
                sku = part_update.get('sku')
                if not sku:
                    continue
                
                conn.execute("""
                    UPDATE service_action_parts 
                    SET action_type = ?, condition_after = ?, notes = ?
                    WHERE action_id = ? AND sku = ?
                """, (
                    part_update.get('action_type'),
                    part_update.get('condition_after'),
                    part_update.get('notes', ''),
                    action_id,
                    sku
                ))
            
            # Update stock if needed
            if data.get('update_stock', True):
                stock_result = service_action_manager.update_stock_on_service_completion(
                    conn, action_id, parts_updates
                )
                
                if not stock_result['success']:
                    return jsonify(create_api_response(False, error=stock_result['error'])), 400
            
            conn.commit()
            return jsonify(create_api_response(True, message='Parts updated successfully'))
            
    except Exception as e:
        logger.error(f"Error updating service action parts: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

# =================== HUB OPERATIONS ===================

@bp.route('/hub/scan', methods=['POST'])
def hub_scan():
    """Hub scans return order for service action"""
    try:
        data = request.get_json()
        
        if not data or not data.get('return_tracking_number'):
            return jsonify(create_api_response(False, error='Return tracking number required')), 400
        
        return_tracking = data['return_tracking_number']
        
        with get_db() as conn:
            # Find service action by return tracking OR original order tracking
            cursor = conn.execute("""
                SELECT action_id FROM service_actions 
                WHERE return_tracking_number = ? 
                   OR return_tracking_number LIKE ? 
                   OR return_tracking_number LIKE ?
                   OR tracking_number = ?  -- Original order tracking number
            """, (
                return_tracking, 
                f"RET{return_tracking}%",  # Handle simple format: RET + tracking
                f"RTN-{return_tracking}%",  # Handle complex format: RTN-tracking-timestamp
                return_tracking  # Original order tracking number
            ))
            
            action_record = cursor.fetchone()
            if not action_record:
                return jsonify(create_api_response(False, error='Service action not found for tracking number')), 404
            
            action_id = action_record[0]
            
            # Update hub confirmation
            conn.execute("""
                UPDATE hub_confirmation_workflow 
                SET confirmation_status = 'scanned',
                    product_condition = ?,
                    inspection_notes = ?
                WHERE action_id = ?
            """, (
                data.get('product_condition', 'received'),
                data.get('inspection_notes', 'Hub scanned'),
                action_id
            ))
            
            # Update service action status
            service_action_manager.update_service_action_status(
                conn, action_id, 'hub_confirmed'
            )
            
            conn.commit()
            return jsonify(create_api_response(True, {
                'action_id': action_id,
                'status': 'scanned'
            }, message='Hub scan completed'))
            
    except Exception as e:
        logger.error(f"Error processing hub scan: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/hub/inspection', methods=['POST'])
def hub_inspection():
    """Complete hub inspection with parts assessment"""
    try:
        data = request.get_json()
        
        if not data or not data.get('action_id'):
            return jsonify(create_api_response(False, error='Action ID required')), 400
        
        action_id = data['action_id']
        
        with get_db() as conn:
            # Update hub confirmation
            conn.execute("""
                UPDATE hub_confirmation_workflow 
                SET confirmation_status = 'confirmed',
                    product_condition = ?,
                    quality_score = ?,
                    inspection_notes = ?,
                    confirmed_at = CURRENT_TIMESTAMP
                WHERE action_id = ?
            """, (
                data.get('product_condition', 'good'),
                data.get('quality_score', 5),
                data.get('inspection_notes', ''),
                action_id
            ))
            
            # Update parts inspection if provided
            parts_inspection = data.get('parts_inspection', [])
            for part_inspection in parts_inspection:
                conn.execute("""
                    UPDATE service_action_parts 
                    SET condition_after = ?, notes = ?
                    WHERE action_id = ? AND sku = ?
                """, (
                    part_inspection.get('condition'),
                    part_inspection.get('notes', ''),
                    action_id,
                    part_inspection.get('sku')
                ))
            
            conn.commit()
            return jsonify(create_api_response(True, {
                'action_id': action_id,
                'quality_score': data.get('quality_score', 5)
            }, message='Hub inspection completed'))
            
    except Exception as e:
        logger.error(f"Error processing hub inspection: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

# =================== HELPER FUNCTIONS ===================

def _execute_maintenance(conn, action_id: int, parts_actions: List[Dict], data: Dict) -> Dict[str, Any]:
    """Execute maintenance service action"""
    try:
        # Update service action
        conn.execute("""
            UPDATE service_actions 
            SET assigned_technician = ?, service_notes = ?
            WHERE action_id = ?
        """, (
            data.get('technician'),
            data.get('notes', ''),
            action_id
        ))
        
        # Process parts
        for part_action in parts_actions:
            conn.execute("""
                UPDATE service_action_parts 
                SET action_type = ?, condition_after = ?, notes = ?
                WHERE action_id = ? AND sku = ?
            """, (
                part_action.get('action_type'),
                part_action.get('condition_after'),
                part_action.get('notes', ''),
                action_id,
                part_action.get('sku')
            ))
        
        return {
            'success': True,
            'execution_type': 'maintenance',
            'parts_processed': len(parts_actions)
        }
        
    except Exception as e:
        logger.error(f"Error executing maintenance: {e}")
        return {'success': False, 'error': str(e)}

def _execute_product_swap(conn, action_id: int, parts_actions: List[Dict], data: Dict) -> Dict[str, Any]:
    """Execute product swap service action (handles both full and partial swaps) with stock updates."""
    try:
        from app.services.service_action_manager import service_action_manager

        swap_type = data.get('swap_type', 'full')  # 'full' or 'partial'
        swap_reason = data.get('swap_reason', 'Product swap request')

        # Update service action with swap details and mark completed
        conn.execute(
            """
            UPDATE service_actions
            SET action_status = 'completed',
                completed_at = CURRENT_TIMESTAMP,
                service_notes = ?,
                assigned_technician = ?
            WHERE action_id = ?
            """,
            (
                f"{swap_reason} - {swap_type} swap completed",
                data.get('technician'),
                action_id,
            ),
        )

        swap_summary = {'swap_type': swap_type}

        if swap_type == 'full':
            # Expect payload: new_products: [{sku, quantity}], old_products: [{sku, quantity}]
            new_products = data.get('new_products', [])
            old_products = data.get('old_products', [])

            full_result = service_action_manager.process_full_product_swap(
                conn, action_id, old_products=old_products, new_products=new_products
            )
            if not full_result.get('success'):
                return {'success': False, 'error': full_result.get('error')}

            swap_summary.update(full_result)

        else:
            # Partial swap: we rely on parts_actions list with each item including {sku, quantity, action_type}
            swapped_parts = []
            returned_parts = []

            for part_action in parts_actions:
                sku = part_action.get('sku')
                action_type = part_action.get('action_type')
                quantity = int(part_action.get('quantity', 1))
                condition_after = part_action.get('condition_after', 'unknown')
                notes = part_action.get('notes', '')

                if not sku:
                    continue

                if action_type in ['swapped', 'replaced']:
                    conn.execute(
                        """
                        UPDATE service_action_parts
                        SET action_type = ?, condition_after = ?, notes = ?, quantity = ?
                        WHERE action_id = ? AND sku = ?
                        """,
                        (action_type, condition_after, notes, quantity, action_id, sku),
                    )
                    swapped_parts.append({'sku': sku, 'quantity': quantity})
                elif action_type == 'returned':
                    conn.execute(
                        """
                        UPDATE service_action_parts
                        SET action_type = 'returned', condition_after = 'returned', notes = ?, quantity = ?
                        WHERE action_id = ? AND sku = ?
                        """,
                        (notes, quantity, action_id, sku),
                    )
                    returned_parts.append({'sku': sku, 'quantity': quantity})
                elif action_type == 'kept':
                    conn.execute(
                        """
                        UPDATE service_action_parts
                        SET action_type = 'kept', condition_after = ?, notes = ?, quantity = ?
                        WHERE action_id = ? AND sku = ?
                        """,
                        (condition_after, notes, quantity, action_id, sku),
                    )

            # Update stock based on part actions
            stock_result = service_action_manager.update_stock_on_service_completion(
                conn, action_id, parts_actions
            )
            if not stock_result.get('success'):
                return {'success': False, 'error': stock_result.get('error')}

            swap_summary.update({
                'total_parts_processed': len(parts_actions),
                'parts_swapped': len(swapped_parts),
                'parts_returned': len(returned_parts),
                'parts_kept': len([p for p in parts_actions if p.get('action_type') == 'kept'])
            })

        return {
            'success': True,
            'execution_type': 'product_swap',
            'swap_summary': swap_summary,
            'message': f"{swap_type.capitalize()} product swap completed successfully",
        }

    except Exception as e:
        logger.error(f"Error executing product swap: {e}")
        return {'success': False, 'error': str(e)}

def _execute_refund(conn, action_id: int, parts_actions: List[Dict], data: Dict) -> Dict[str, Any]:
    """Execute refund service action"""
    try:
        refund_amount = data.get('refund_amount', 0)
        
        # Update service action
        conn.execute("""
            UPDATE service_actions 
            SET action_status = 'completed', refund_amount = ?, completed_at = CURRENT_TIMESTAMP
            WHERE action_id = ?
        """, (refund_amount, action_id))
        
        return {
            'success': True,
            'execution_type': 'refund',
            'refund_amount': refund_amount
        }
        
    except Exception as e:
        logger.error(f"Error executing refund: {e}")
        return {'success': False, 'error': str(e)} 