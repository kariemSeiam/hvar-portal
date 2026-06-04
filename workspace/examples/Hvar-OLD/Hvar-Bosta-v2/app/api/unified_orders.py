"""
Expert Unified Orders API - Complete Cycle Integration
Integrates all pending orders functionality into main orders table
Handles scanning, quality control, returns, and customer service cycles
"""

from flask import Blueprint, request, jsonify
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime, timedelta

from app.services.unified_order_processor import unified_order_processor, OrderCycleType, ProcessingStage
from app.utils.api_response import create_api_response
from app.utils.db_utils import get_db
from flask import current_app

logger = logging.getLogger(__name__)
bp = Blueprint('unified_orders', __name__, url_prefix='/api/unified-orders')

# ================================================================================
# CORE UNIFIED ORDERS ENDPOINTS
# ================================================================================

@bp.route('/', methods=['GET'])
def get_unified_orders():
    """
    🎯 Get unified orders with complete cycle integration
    
    Query Parameters:
        cycle_type: Filter by cycle type (normal, exchange, return_pickup, maintenance)
        processing_stage: Filter by processing stage (intake, scanning, quality_check, etc.)
        include_pending: Include pending cycle orders (default: true)
        limit: Results per page (default: 50, max: 1000)
        offset: Pagination offset
        sort_by: Sort field (created_at, tracking_number, etc.)
        sort_dir: Sort direction (ASC, DESC)
    """
    try:
        # Parse filters
        cycle_type = request.args.get('cycle_type')
        processing_stage = request.args.get('processing_stage')
        include_pending = request.args.get('include_pending', 'true').lower() == 'true'
        
        # Pagination
        limit = min(int(request.args.get('limit', 50)), 1000)
        offset = max(int(request.args.get('offset', 0)), 0)
        
        # Sorting
        sort_by = request.args.get('sort_by', 'created_at')
        sort_dir = request.args.get('sort_dir', 'DESC').upper()
        
        with get_db() as conn:
            # Build query based on filters
            query = "SELECT * FROM orders WHERE 1=1"
            params = []
            
            # Cycle type filter
            if cycle_type:
                query += " AND business_category = ?"
                params.append(cycle_type)
            elif not include_pending:
                query += " AND business_category = 'normal'"
            
            # Processing stage filter
            if processing_stage:
                query += " AND cod_category = ?"
                params.append(processing_stage)
            
            # Add sorting and pagination
            query += f" ORDER BY {sort_by} {sort_dir} LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            # Execute query
            cursor = conn.execute(query, params)
            columns = [column[0] for column in cursor.description]
            orders = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            # Get total count
            count_query = query.split('ORDER BY')[0]
            cursor = conn.execute(count_query, params[:-2])  # Remove LIMIT and OFFSET
            total_count = cursor.fetchone()[0]
            
            # Parse cycle flags from notes
            for order in orders:
                order['cycle_flags'] = _parse_cycle_flags(order.get('notes', ''))
            
            return create_api_response(True, data={
                'orders': orders,
                'pagination': {
                    'total': total_count,
                    'limit': limit,
                    'offset': offset,
                    'has_more': (offset + limit) < total_count
                }
            })
            
    except Exception as e:
        logger.error(f"Error in get_unified_orders: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/<tracking_number>', methods=['GET'])
def get_unified_order_details(tracking_number: str):
    """
    🔍 Get unified order details with complete cycle information
    
    Args:
        tracking_number: Order tracking number
        
    Returns:
        Complete order details with cycle information and processing status
    """
    try:
        with get_db() as conn:
            # Get main order data
            cursor = conn.execute("""
                SELECT * FROM orders WHERE tracking_number = ?
            """, (tracking_number,))
            
            order_row = cursor.fetchone()
            if not order_row:
                return create_api_response(False, error="Order not found"), 404
            
            columns = [column[0] for column in cursor.description]
            order = dict(zip(columns, order_row))
            
            # Parse cycle flags
            order['cycle_flags'] = _parse_cycle_flags(order.get('notes', ''))
            
            # Get related service actions
            cursor = conn.execute("""
                SELECT * FROM service_actions 
                WHERE tracking_number = ?
                ORDER BY created_at DESC
            """, (tracking_number,))
            
            service_actions = []
            for row in cursor.fetchall():
                action_columns = [column[0] for column in cursor.description]
                service_actions.append(dict(zip(action_columns, row)))
            
            # Get hub confirmation workflow
            cursor = conn.execute("""
                SELECT * FROM hub_confirmation_workflow 
                WHERE return_tracking_number = ?
                ORDER BY created_at DESC
            """, (tracking_number,))
            
            hub_workflows = []
            for row in cursor.fetchall():
                workflow_columns = [column[0] for column in cursor.description]
                hub_workflows.append(dict(zip(workflow_columns, row)))
            
            # Get maintenance cycles
            cursor = conn.execute("""
                SELECT mc.* FROM maintenance_cycles mc
                JOIN service_actions sa ON mc.action_id = sa.action_id
                WHERE sa.tracking_number = ?
                ORDER BY mc.created_at DESC
            """, (tracking_number,))
            
            maintenance_cycles = []
            for row in cursor.fetchall():
                cycle_columns = [column[0] for column in cursor.description]
                maintenance_cycles.append(dict(zip(cycle_columns, row)))
            
            return create_api_response(True, data={
                'order': order,
                'service_actions': service_actions,
                'hub_workflows': hub_workflows,
                'maintenance_cycles': maintenance_cycles
            })
            
    except Exception as e:
        logger.error(f"Error in get_unified_order_details: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/process', methods=['POST'])
def process_order_unified():
    """
    🔄 Process order through complete unified cycle
    
    Request Body:
        order_data: Complete order data from Bosta API
        cycle_type: Optional cycle type override
        processing_mode: Processing mode (standard, priority, critical)
    """
    try:
        data = request.get_json() or {}
        order_data = data.get('order_data')
        cycle_type = data.get('cycle_type')
        processing_mode = data.get('processing_mode', 'standard')
        
        if not order_data:
            return create_api_response(False, error="Order data is required")
        
        # Process order through unified cycle
        # If AUTO_LINK_PRODUCTS is disabled, processor will only use explicit items
        result = unified_order_processor.process_order_complete_cycle(order_data)
        
        return create_api_response(True, data=result)
        
    except Exception as e:
        logger.error(f"Error in process_order_unified: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/process/batch', methods=['POST'])
def process_batch_unified():
    """
    🔄 Process batch of orders through unified cycle
    
    Request Body:
        orders: List of order data
        max_workers: Maximum parallel workers (default: 5)
    """
    try:
        data = request.get_json() or {}
        orders = data.get('orders', [])
        max_workers = data.get('max_workers', 5)
        
        if not orders:
            return create_api_response(False, error="Orders list is required")
        
        # Process batch through unified cycle
        result = unified_order_processor.process_batch_unified(orders, max_workers)
        
        return create_api_response(True, data=result)
        
    except Exception as e:
        logger.error(f"Error in process_batch_unified: {e}")
        return create_api_response(False, error=str(e))

# ================================================================================
# CYCLE-SPECIFIC ENDPOINTS
# ================================================================================

@bp.route('/exchange', methods=['GET'])
def get_exchange_orders():
    """Get exchange orders with complete cycle processing"""
    try:
        result = unified_order_processor.get_orders_by_cycle_type(OrderCycleType.EXCHANGE)
        return create_api_response(True, data=result)
    except Exception as e:
        logger.error(f"Error in get_exchange_orders: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/return-pickup', methods=['GET'])
def get_return_pickup_orders():
    """Get return pickup orders with customer service integration"""
    try:
        result = unified_order_processor.get_orders_by_cycle_type(OrderCycleType.RETURN_PICKUP)
        return create_api_response(True, data=result)
    except Exception as e:
        logger.error(f"Error in get_return_pickup_orders: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/maintenance', methods=['GET'])
def get_maintenance_orders():
    """Get maintenance orders with full service integration"""
    try:
        result = unified_order_processor.get_orders_by_cycle_type(OrderCycleType.MAINTENANCE)
        return create_api_response(True, data=result)
    except Exception as e:
        logger.error(f"Error in get_maintenance_orders: {e}")
        return create_api_response(False, error=str(e))

# ================================================================================
# PROCESSING STAGE ENDPOINTS
# ================================================================================

@bp.route('/scanning', methods=['GET'])
def get_scanning_orders():
    """Get orders in hub scanning stage"""
    try:
        result = unified_order_processor.get_orders_by_processing_stage(ProcessingStage.SCANNING)
        return create_api_response(True, data=result)
    except Exception as e:
        logger.error(f"Error in get_scanning_orders: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/quality-check', methods=['GET'])
def get_quality_check_orders():
    """Get orders in quality check stage"""
    try:
        result = unified_order_processor.get_orders_by_processing_stage(ProcessingStage.QUALITY_CHECK)
        return create_api_response(True, data=result)
    except Exception as e:
        logger.error(f"Error in get_quality_check_orders: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/service-action', methods=['GET'])
def get_service_action_orders():
    """Get orders in service action stage"""
    try:
        result = unified_order_processor.get_orders_by_processing_stage(ProcessingStage.SERVICE_ACTION)
        return create_api_response(True, data=result)
    except Exception as e:
        logger.error(f"Error in get_service_action_orders: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/maintenance-stage', methods=['GET'])
def get_maintenance_stage_orders():
    """Get orders in maintenance stage"""
    try:
        result = unified_order_processor.get_orders_by_processing_stage(ProcessingStage.MAINTENANCE)
        return create_api_response(True, data=result)
    except Exception as e:
        logger.error(f"Error in get_maintenance_stage_orders: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/customer-service', methods=['GET'])
def get_customer_service_orders():
    """Get orders in customer service stage"""
    try:
        result = unified_order_processor.get_orders_by_processing_stage(ProcessingStage.CUSTOMER_SERVICE)
        return create_api_response(True, data=result)
    except Exception as e:
        logger.error(f"Error in get_customer_service_orders: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/return-processing', methods=['GET'])
def get_return_processing_orders():
    """Get orders in return processing stage"""
    try:
        result = unified_order_processor.get_orders_by_processing_stage(ProcessingStage.RETURN_PROCESSING)
        return create_api_response(True, data=result)
    except Exception as e:
        logger.error(f"Error in get_return_processing_orders: {e}")
        return create_api_response(False, error=str(e))

# ================================================================================
# CYCLE MANAGEMENT ENDPOINTS
# ================================================================================

@bp.route('/<tracking_number>/advance-stage', methods=['POST'])
def advance_processing_stage(tracking_number: str):
    """
    🔄 Advance order to next processing stage
    
    Request Body:
        target_stage: Target processing stage
        stage_data: Optional data for the stage
    """
    try:
        data = request.get_json() or {}
        target_stage = data.get('target_stage')
        stage_data = data.get('stage_data', {})
        
        if not target_stage:
            return create_api_response(False, error="Target stage is required")
        
        # Get current order
        with get_db() as conn:
            cursor = conn.execute("""
                SELECT * FROM orders WHERE tracking_number = ?
            """, (tracking_number,))
            
            order_row = cursor.fetchone()
            if not order_row:
                return create_api_response(False, error="Order not found"), 404
            
            columns = [column[0] for column in cursor.description]
            order = dict(zip(columns, order_row))
        
        # Process stage advancement
        if target_stage == 'scanning':
            result = unified_order_processor._perform_hub_scanning(order)
        elif target_stage == 'quality_check':
            result = unified_order_processor._perform_quality_check(order)
        elif target_stage == 'service_action':
            action_type = stage_data.get('action_type', 'general')
            result = unified_order_processor._create_service_action(order, action_type)
        elif target_stage == 'maintenance':
            result = unified_order_processor._create_maintenance_cycle(order)
        elif target_stage == 'customer_service':
            result = unified_order_processor._initiate_customer_service(order)
        elif target_stage == 'return_processing':
            result = unified_order_processor._process_return_handling(order)
        else:
            return create_api_response(False, error=f"Unknown target stage: {target_stage}")
        
        # Update processing stage
        with get_db() as conn:
            conn.execute("""
                UPDATE orders 
                SET cod_category = ?, risk_level = 'processing'
                WHERE tracking_number = ?
            """, (target_stage, tracking_number))
        
        return create_api_response(True, data={
            'tracking_number': tracking_number,
            'new_stage': target_stage,
            'stage_result': result
        })
        
    except Exception as e:
        logger.error(f"Error in advance_processing_stage: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/<tracking_number>/complete-cycle', methods=['POST'])
def complete_order_cycle(tracking_number: str):
    """
    ✅ Complete order cycle and mark as finished
    
    Request Body:
        completion_notes: Optional completion notes
        final_status: Final status (completed, cancelled, failed)
    """
    try:
        data = request.get_json() or {}
        completion_notes = data.get('completion_notes', '')
        final_status = data.get('final_status', 'completed')
        
        with get_db() as conn:
            # Update order to completion stage
            conn.execute("""
                UPDATE orders 
                SET cod_category = 'completion',
                    risk_level = ?,
                    notes = notes || ?
                WHERE tracking_number = ?
            """, (final_status, f" [COMPLETION:{completion_notes}]", tracking_number))
            
            # Update related service actions
            conn.execute("""
                UPDATE service_actions 
                SET action_status = 'completed',
                    completed_at = CURRENT_TIMESTAMP
                WHERE tracking_number = ?
            """, (tracking_number,))
            
            # Update hub confirmation workflow
            conn.execute("""
                UPDATE hub_confirmation_workflow 
                SET confirmation_status = 'completed',
                    confirmed_at = CURRENT_TIMESTAMP
                WHERE return_tracking_number = ?
            """, (tracking_number,))
            
            # Update maintenance cycles
            conn.execute("""
                UPDATE maintenance_cycles 
                SET cycle_status = 'completed',
                    completed_at = CURRENT_TIMESTAMP
                WHERE tracking_number = ?
            """, (tracking_number,))
        
        return create_api_response(True, data={
            'tracking_number': tracking_number,
            'status': 'completed',
            'message': 'Order cycle completed successfully'
        })
        
    except Exception as e:
        logger.error(f"Error in complete_order_cycle: {e}")
        return create_api_response(False, error=str(e))

# ================================================================================
# ANALYTICS ENDPOINTS
# ================================================================================

@bp.route('/analytics/cycle-distribution', methods=['GET'])
def get_cycle_distribution_analytics():
    """Get analytics for cycle type distribution"""
    try:
        with get_db() as conn:
            cursor = conn.execute("""
                SELECT 
                    business_category as cycle_type,
                    COUNT(*) as count,
                    AVG(cod) as avg_cod,
                    SUM(cod) as total_cod
                FROM orders 
                WHERE business_category IN ('normal', 'exchange', 'return_pickup', 'maintenance')
                GROUP BY business_category
            """)
            
            distribution = []
            for row in cursor.fetchall():
                distribution.append({
                    'cycle_type': row[0],
                    'count': row[1],
                    'avg_cod': row[2],
                    'total_cod': row[3]
                })
            
            return create_api_response(True, data={
                'cycle_distribution': distribution
            })
            
    except Exception as e:
        logger.error(f"Error in get_cycle_distribution_analytics: {e}")
        return create_api_response(False, error=str(e))

@bp.route('/analytics/processing-stages', methods=['GET'])
def get_processing_stages_analytics():
    """Get analytics for processing stages"""
    try:
        with get_db() as conn:
            cursor = conn.execute("""
                SELECT 
                    cod_category as processing_stage,
                    COUNT(*) as count,
                    AVG(cod) as avg_cod
                FROM orders 
                WHERE cod_category IN ('intake', 'scanning', 'quality_check', 'service_action', 'maintenance', 'customer_service', 'return_processing', 'completion')
                GROUP BY cod_category
            """)
            
            stages = []
            for row in cursor.fetchall():
                stages.append({
                    'processing_stage': row[0],
                    'count': row[1],
                    'avg_cod': row[2]
                })
            
            return create_api_response(True, data={
                'processing_stages': stages
            })
            
    except Exception as e:
        logger.error(f"Error in get_processing_stages_analytics: {e}")
        return create_api_response(False, error=str(e))

# ================================================================================
# HELPER FUNCTIONS
# ================================================================================

def _parse_cycle_flags(notes: str) -> Dict[str, Any]:
    """Parse cycle flags from order notes"""
    try:
        if '[CYCLE_FLAGS:' in notes:
            start = notes.find('[CYCLE_FLAGS:') + 13
            end = notes.find(']', start)
            if start > 12 and end > start:
                flags_json = notes[start:end]
                import json
                return json.loads(flags_json)
    except Exception as e:
        logger.error(f"Error parsing cycle flags: {e}")
    
    return {
        'is_pending_cycle': False,
        'hub_scan_required': False,
        'quality_check_required': False,
        'service_action_required': False,
        'maintenance_required': False,
        'customer_service_required': False,
        'return_processing_required': False
    }
