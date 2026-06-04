"""
Comprehensive Maintenance API Endpoints
Modular maintenance cycle management with integrated stock management, 
SLA tracking, and automated workflows according to HVAR_COMPLETE_CYCLE_SYSTEM.md.

Endpoints:
- Maintenance cycle creation and management
- Real-time stock allocation and usage tracking
- SLA monitoring and escalation
- Quality control and inspection workflows
- Technician assignment and workload management
- Performance analytics and reporting
"""

import logging
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

from app.services.maintenance_service_manager import MaintenanceServiceManager
from app.services.maintenance_stock_integration import MaintenanceStockIntegration
from app.services.maintenance_sla_monitor import MaintenanceSLAMonitor
from app.utils.api_response import create_api_response
from app.utils.db_utils import get_db
from app.models.escalation_rules import get_active_escalation_rules, update_escalation_rule

# Setup logging
logger = logging.getLogger(__name__)

# Instantiate services
# maintenance_service_manager = MaintenanceServiceManager()
# maintenance_stock_integration = MaintenanceStockIntegration()
# maintenance_sla_monitor = MaintenanceSLAMonitor()

# Create Blueprint
bp = Blueprint('maintenance', __name__, url_prefix='/api/maintenance')

def register_maintenance_services(app):
    """Initialize and register maintenance services and blueprint."""
    with app.app_context():
        maintenance_service_manager = MaintenanceServiceManager()
        maintenance_stock_integration = MaintenanceStockIntegration()
        maintenance_sla_monitor = MaintenanceSLAMonitor()
        
        # You can attach them to the app context if needed elsewhere
        app.maintenance_service_manager = maintenance_service_manager
        app.maintenance_stock_integration = maintenance_stock_integration
        app.maintenance_sla_monitor = maintenance_sla_monitor

    app.register_blueprint(bp)

    # Escalation Rules Management
    @app.route('/api/maintenance/escalation-rules', methods=['GET'])
    def get_escalation_rules():
        """Get all active escalation rules"""
        result = get_active_escalation_rules()
        if result['success']:
            return jsonify(create_api_response(True, {'rules': result['rules']})), 200
        else:
            return jsonify(create_api_response(False, error=result.get('error', 'Failed to retrieve escalation rules'))), 500
    
    @app.route('/api/maintenance/escalation-rules/<int:rule_id>', methods=['PUT'])
    def update_rule(rule_id):
        """Update an escalation rule"""
        data = request.json
        if not data:
            return jsonify(create_api_response(False, error='No data provided')), 400
        
        result = update_escalation_rule(rule_id, **data)
        if result['success']:
            return jsonify(create_api_response(True, {
                'updated': result.get('updated', False)
            }, message=result.get('message', 'Rule updated successfully'))), 200
        else:
            return jsonify(create_api_response(False, error=result.get('error', 'Failed to update escalation rule'))), 500

# =================== MAINTENANCE CYCLE MANAGEMENT ===================

@bp.route('/cycles', methods=['POST'])
def create_maintenance_cycle():
    maintenance_service_manager = MaintenanceServiceManager()
    """Create a comprehensive maintenance cycle with automatic scheduling, parts allocation, and SLA setup"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='No data provided')), 400
        
        # Validate required fields
        required_fields = ['action_id', 'customer_phone', 'cycle_type', 'priority']
        for field in required_fields:
            if not data.get(field):
                return jsonify(create_api_response(False, error=f'Required field "{field}" is missing')), 400
        
        # Create maintenance cycle with full integration
        result = maintenance_service_manager.create_maintenance_cycle(data)
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                {
                    'cycle_id': result['cycle_id'],
                    'technician_assigned': result.get('technician'),
                    'parts_allocated': result.get('parts_allocated', 0),
                    'sla_deadlines': result.get('sla_deadlines', {}),
                    'stock_updated': result.get('stock_updated', False)
                },
                message='Maintenance cycle created successfully with full integration'
            )), 201
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error creating maintenance cycle: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/cycles/<int:cycle_id>', methods=['GET'])
def get_maintenance_cycle(cycle_id: int):
    maintenance_service_manager = MaintenanceServiceManager()
    """Get comprehensive maintenance cycle details including stock, SLA, and progress information"""
    try:
        with get_db() as conn:
            # Get maintenance cycle details
            cursor = conn.execute("""
                SELECT mc.*, 
                       tr.name as technician_name,
                       COUNT(mpa.allocation_id) as parts_allocated_count,
                       COUNT(mqi.inspection_id) as inspections_count
                FROM maintenance_cycles mc
                LEFT JOIN technician_resources tr ON mc.assigned_technician_id = tr.technician_id
                LEFT JOIN maintenance_parts_allocation mpa ON mc.cycle_id = mpa.cycle_id
                LEFT JOIN maintenance_quality_inspections mqi ON mc.cycle_id = mqi.cycle_id
                WHERE mc.cycle_id = ?
                GROUP BY mc.cycle_id
            """, (cycle_id,))
            
            cycle_data = cursor.fetchone()
            if not cycle_data:
                return jsonify(create_api_response(False, error='Maintenance cycle not found')), 404
            
            # Convert to dict
            columns = [description[0] for description in cursor.description]
            cycle_dict = dict(zip(columns, cycle_data))
            
            # Get SLA tracking
            cursor = conn.execute("""
                SELECT sla_type, target_deadline, actual_completion, is_met, violation_minutes
                FROM maintenance_sla_tracking 
                WHERE cycle_id = ?
            """, (cycle_id,))
            
            sla_tracking = [
                {
                    'sla_type': row[0],
                    'target_deadline': row[1],
                    'actual_completion': row[2],
                    'is_met': bool(row[3]) if row[3] is not None else None,
                    'violation_minutes': row[4]
                }
                for row in cursor.fetchall()
            ]
            
            # Get parts allocation details
            cursor = conn.execute("""
                SELECT sku, quantity_required, quantity_allocated, quantity_used, 
                       quantity_returned, allocation_status, unit_cost, total_cost
                FROM maintenance_parts_allocation 
                WHERE cycle_id = ?
            """, (cycle_id,))
            
            parts_allocation = [
                {
                    'sku': row[0],
                    'quantity_required': row[1],
                    'quantity_allocated': row[2],
                    'quantity_used': row[3],
                    'quantity_returned': row[4],
                    'allocation_status': row[5],
                    'unit_cost': float(row[6]) if row[6] else 0,
                    'total_cost': float(row[7]) if row[7] else 0
                }
                for row in cursor.fetchall()
            ]
            
            # Get quality inspections
            cursor = conn.execute("""
                SELECT inspection_type, quality_score, inspection_status, 
                       inspection_notes, completed_at
                FROM maintenance_quality_inspections 
                WHERE cycle_id = ?
                ORDER BY created_at DESC
            """, (cycle_id,))
            
            quality_inspections = [
                {
                    'inspection_type': row[0],
                    'quality_score': row[1],
                    'inspection_status': row[2],
                    'inspection_notes': row[3],
                    'completed_at': row[4]
                }
                for row in cursor.fetchall()
            ]
            
            return jsonify(create_api_response(
                True,
                {
                    'cycle_details': cycle_dict,
                    'sla_tracking': sla_tracking,
                    'parts_allocation': parts_allocation,
                    'quality_inspections': quality_inspections
                }
            ))
            
    except Exception as e:
        logger.error(f"Error getting maintenance cycle {cycle_id}: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/cycles/<int:cycle_id>/start', methods=['POST'])
def start_maintenance_cycle(cycle_id: int):
    maintenance_service_manager = MaintenanceServiceManager()
    """Start maintenance cycle execution with real-time tracking"""
    try:
        data = request.get_json() or {}
        
        result = maintenance_service_manager.start_maintenance_cycle(cycle_id, data)
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                result,
                message='Maintenance cycle started successfully'
            ))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error starting maintenance cycle {cycle_id}: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/cycles/<int:cycle_id>/complete', methods=['POST'])
def complete_maintenance_cycle(cycle_id: int):
    maintenance_service_manager = MaintenanceServiceManager()
    """Complete maintenance cycle with quality control and final stock updates"""
    try:
        data = request.get_json() or {}
        
        result = maintenance_service_manager.complete_maintenance_cycle(cycle_id, data)
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                result,
                message='Maintenance cycle completed successfully'
            ))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error completing maintenance cycle {cycle_id}: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

# =================== STOCK INTEGRATION ENDPOINTS ===================

@bp.route('/cycles/<int:cycle_id>/stock/allocate', methods=['POST'])
def allocate_stock_for_maintenance(cycle_id: int):
    maintenance_stock_integration = MaintenanceStockIntegration()
    """Allocate stock for maintenance cycle with real-time availability checking"""
    try:
        data = request.get_json()
        
        if not data or not data.get('parts_requirements'):
            return jsonify(create_api_response(False, error='Parts requirements are required')), 400
        
        result = maintenance_stock_integration.allocate_stock_for_maintenance(
            cycle_id, data['parts_requirements']
        )
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                result,
                message=f'Stock allocated for {result["total_parts_allocated"]} parts'
            ))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error allocating stock for maintenance cycle {cycle_id}: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/cycles/<int:cycle_id>/stock/usage', methods=['POST'])
def record_stock_usage(cycle_id: int):
    maintenance_stock_integration = MaintenanceStockIntegration()
    """Record real-time stock usage during maintenance operations"""
    try:
        data = request.get_json()
        
        if not data or not data.get('usage_data'):
            return jsonify(create_api_response(False, error='Usage data is required')), 400
        
        result = maintenance_stock_integration.record_stock_usage_real_time(
            cycle_id, data['usage_data']
        )
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                result,
                message=f'Stock usage recorded for {result["parts_used_count"]} parts'
            ))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error recording stock usage for cycle {cycle_id}: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/cycles/<int:cycle_id>/stock/returns', methods=['POST'])
def process_stock_returns(cycle_id: int):
    maintenance_stock_integration = MaintenanceStockIntegration()
    """Process stock returns with comprehensive condition assessment"""
    try:
        data = request.get_json()
        
        if not data or not data.get('return_data'):
            return jsonify(create_api_response(False, error='Return data is required')), 400
        
        result = maintenance_stock_integration.process_stock_returns_with_condition_assessment(
            cycle_id, data['return_data']
        )
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                result,
                message=f'Processed returns for {result["parts_returned_count"]} parts'
            ))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error processing stock returns for cycle {cycle_id}: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/stock/forecast', methods=['GET'])
def get_stock_forecast():
    maintenance_stock_integration = MaintenanceStockIntegration()
    """Generate maintenance stock forecast"""
    try:
        forecast_period = request.args.get('period', 'monthly')
        
        result = maintenance_stock_integration.generate_maintenance_stock_forecast(forecast_period)
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                result,
                message=f'Generated {forecast_period} forecast for {result["total_skus_forecasted"]} SKUs'
            ))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error generating stock forecast: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/stock/alerts', methods=['GET'])
def get_stock_alerts():
    maintenance_stock_integration = MaintenanceStockIntegration()
    """Monitor maintenance stock levels and generate alerts"""
    try:
        result = maintenance_stock_integration.monitor_maintenance_stock_levels()
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                result,
                message=f'Found {result["total_alerts"]} stock alerts'
            ))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error getting stock alerts: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

# =================== SLA MONITORING ENDPOINTS ===================

@bp.route('/sla/monitor/start', methods=['POST'])
def start_sla_monitoring():
    maintenance_sla_monitor = MaintenanceSLAMonitor()
    """Start automated SLA monitoring"""
    try:
        maintenance_sla_monitor.start_automated_monitoring()
        
        return jsonify(create_api_response(
            True,
            {'monitoring_status': 'active'},
            message='SLA monitoring started successfully'
        ))
        
    except Exception as e:
        logger.error(f"Error starting SLA monitoring: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/sla/monitor/stop', methods=['POST'])
def stop_sla_monitoring():
    maintenance_sla_monitor = MaintenanceSLAMonitor()
    """Stop automated SLA monitoring"""
    try:
        maintenance_sla_monitor.stop_automated_monitoring()
        
        return jsonify(create_api_response(
            True,
            {'monitoring_status': 'stopped'},
            message='SLA monitoring stopped successfully'
        ))
        
    except Exception as e:
        logger.error(f"Error stopping SLA monitoring: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/sla/violations/check', methods=['POST'])
def check_sla_violations():
    maintenance_sla_monitor = MaintenanceSLAMonitor()
    """Manually check for SLA violations and send alerts"""
    try:
        result = maintenance_sla_monitor.check_sla_violations()
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                result,
                message=f'Checked {result["total_slas_checked"]} SLAs, sent {result["warnings_sent"]} warnings, processed {result["violations_processed"]} violations'
            ))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error checking SLA violations: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/sla/escalations/process', methods=['POST'])
def process_escalations():
    maintenance_sla_monitor = MaintenanceSLAMonitor()
    """Process pending escalations and take automated actions"""
    try:
        result = maintenance_sla_monitor.process_escalations()
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                result,
                message=f'Processed {result["escalations_processed"]} escalations'
            ))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error processing escalations: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500



# =================== TECHNICIAN MANAGEMENT ENDPOINTS ===================

@bp.route('/technicians', methods=['POST'])
def register_technician():
    maintenance_service_manager = MaintenanceServiceManager()
    """Register a new technician resource"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='No data provided')), 400
        
        # Validate required fields
        required_fields = ['technician_id', 'name']
        for field in required_fields:
            if not data.get(field):
                return jsonify(create_api_response(False, error=f'Required field "{field}" is missing')), 400
        
        result = maintenance_service_manager.register_technician(data)
        
        if result['success']:
            return jsonify(create_api_response(
                True,
                {'technician_id': result['technician_id']},
                message='Technician registered successfully'
            )), 201
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error registering technician: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/technicians/<technician_id>/workload', methods=['GET'])
def get_technician_workload(technician_id: str):
    maintenance_service_manager = MaintenanceServiceManager()
    """Get technician workload information"""
    try:
        result = maintenance_service_manager.get_technician_workload(technician_id)
        
        if result['success']:
            return jsonify(create_api_response(True, result))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 404
            
    except Exception as e:
        logger.error(f"Error getting technician workload: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/technicians/workload', methods=['GET'])
def get_all_technicians_workload():
    maintenance_service_manager = MaintenanceServiceManager()
    """Get workload information for all technicians"""
    try:
        result = maintenance_service_manager.get_technician_workload()
        
        if result['success']:
            return jsonify(create_api_response(True, result))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error getting all technicians workload: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

# =================== ANALYTICS & REPORTING ENDPOINTS ===================

@bp.route('/analytics', methods=['GET'])
def get_maintenance_analytics_summary():
    """Get maintenance analytics summary - simplified endpoint for testing"""
    try:
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        with get_db() as conn:
            # Get basic maintenance analytics
            cursor = conn.execute("""
                SELECT 
                    COUNT(*) as total_cycles,
                    COUNT(CASE WHEN cycle_status = 'completed' THEN 1 END) as completed_cycles,
                    COUNT(CASE WHEN cycle_status = 'in_progress' THEN 1 END) as active_cycles,
                    COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_cycles,
                    AVG(progress_percentage) as avg_progress,
                    AVG(total_cost) as avg_cost
                FROM maintenance_cycles
                WHERE 1=1
            """)
            
            analytics = cursor.fetchone()
            
            return jsonify(create_api_response(True, {
                'total_cycles': analytics[0] if analytics else 0,
                'completed_cycles': analytics[1] if analytics else 0,
                'active_cycles': analytics[2] if analytics else 0,
                'high_priority_cycles': analytics[3] if analytics else 0,
                'avg_progress': float(analytics[4] or 0) if analytics else 0,
                'avg_cost': float(analytics[5] or 0) if analytics else 0
            }))
            
    except Exception as e:
        logger.error(f"Error getting maintenance analytics: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/analytics/performance', methods=['GET'])
def get_maintenance_analytics():
    maintenance_service_manager = MaintenanceServiceManager()
    """Get comprehensive maintenance performance analytics"""
    try:
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        result = maintenance_service_manager.get_maintenance_analytics(date_from, date_to)
        
        if result['success']:
            return jsonify(create_api_response(True, result))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error getting maintenance analytics: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/stock/summary', methods=['GET'])
def get_maintenance_stock_summary():
    """Get maintenance stock summary - simplified endpoint for testing"""
    try:
        with get_db() as conn:
            # Get stock summary for maintenance - using correct column names
            cursor = conn.execute("""
                SELECT 
                    COUNT(DISTINCT p.sku) as total_skus,
                    SUM(s.quantity) as total_stock,
                    COUNT(CASE WHEN s.quantity <= p.alert_quantity THEN 1 END) as low_stock_items,
                    COUNT(CASE WHEN s.quantity = 0 THEN 1 END) as out_of_stock_items,
                    SUM(CASE WHEN s.quantity > 0 THEN s.quantity * p.purchase_price ELSE 0 END) as total_stock_value
                FROM products p
                LEFT JOIN stock s ON p.sku = s.sku
                WHERE p.category = 'Spare Parts' OR p.category = 'Maintenance'
            """)
            
            stock_summary = cursor.fetchone()
            
            return jsonify(create_api_response(True, {
                'total_skus': stock_summary[0] if stock_summary else 0,
                'total_stock': stock_summary[1] if stock_summary else 0,
                'low_stock_items': stock_summary[2] if stock_summary else 0,
                'out_of_stock_items': stock_summary[3] if stock_summary else 0,
                'total_stock_value': float(stock_summary[4] or 0) if stock_summary else 0
            }))
            
    except Exception as e:
        logger.error(f"Error getting maintenance stock summary: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/analytics/sla', methods=['GET'])
def get_sla_performance_report():
    maintenance_sla_monitor = MaintenanceSLAMonitor()
    """Get comprehensive SLA performance report"""
    try:
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        result = maintenance_sla_monitor.get_sla_performance_report(date_from, date_to)
        
        if result['success']:
            return jsonify(create_api_response(True, result))
        else:
            return jsonify(create_api_response(False, error=result['error'])), 400
            
    except Exception as e:
        logger.error(f"Error getting SLA performance report: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/cycles', methods=['GET'])
@bp.route('/cycles/', methods=['GET'])
def list_maintenance_cycles():
    """List maintenance cycles with filtering and pagination"""
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        status = request.args.get('status')
        priority = request.args.get('priority')
        maintenance_type = request.args.get('maintenance_type')
        technician_id = request.args.get('technician_id')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        offset = (page - 1) * limit
        
        with get_db() as conn:
            # Build query
            query = """
                SELECT mc.cycle_id, mc.customer_phone, mc.cycle_type, mc.priority,
                       mc.cycle_status, mc.scheduled_date, mc.created_at,
                       mc.assigned_technician_id, tr.name as technician_name,
                       mc.progress_percentage, mc.total_cost
                FROM maintenance_cycles mc
                LEFT JOIN technician_resources tr ON mc.assigned_technician_id = tr.technician_id
                WHERE 1=1
            """
            params = []
            
            # Apply filters
            if status:
                query += " AND mc.cycle_status = ?"
                params.append(status)
            
            if priority:
                query += " AND mc.priority = ?"
                params.append(priority)
            
            if maintenance_type:
                query += " AND mc.cycle_type = ?"
                params.append(maintenance_type)
            
            if technician_id:
                query += " AND mc.assigned_technician_id = ?"
                params.append(technician_id)
            
            if date_from:
                query += " AND date(mc.created_at) >= ?"
                params.append(date_from)
            
            if date_to:
                query += " AND date(mc.created_at) <= ?"
                params.append(date_to)
            
            # Get total count
            count_query = query.replace(
                "SELECT mc.cycle_id, mc.customer_phone, mc.cycle_type, mc.priority, mc.cycle_status, mc.scheduled_date, mc.created_at, mc.assigned_technician_id, tr.name as technician_name, mc.progress_percentage, mc.total_cost",
                "SELECT COUNT(*)"
            )
            cursor = conn.execute(count_query, params)
            count_result = cursor.fetchone()
            total_count = count_result[0] if count_result else 0
            
            # Add pagination
            query += " ORDER BY mc.created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            # Execute query
            cursor = conn.execute(query, params)
            cycles = []
            
            for row in cursor.fetchall():
                if row and len(row) >= 11:  # Ensure row has enough columns
                    cycles.append({
                        'cycle_id': row[0],
                        'customer_phone': row[1],
                        'cycle_type': row[2],
                        'priority': row[3],
                        'cycle_status': row[4],
                        'scheduled_date': row[5],
                        'created_at': row[6],
                        'assigned_technician_id': row[7],
                        'technician_name': row[8],
                        'progress_percentage': row[9],
                        'total_cost': float(row[10]) if row[10] else 0
                    })
            
            return jsonify(create_api_response(
                True,
                {
                    'cycles': cycles,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total_count': total_count,
                        'total_pages': (total_count + limit - 1) // limit
                    }
                }
            ))
            
    except Exception as e:
        logger.error(f"Error listing maintenance cycles: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

# =================== QUALITY CONTROL ENDPOINTS ===================

@bp.route('/cycles/<int:cycle_id>/inspections', methods=['POST'])
def create_quality_inspection(cycle_id):
    """Create quality inspection for maintenance cycle"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify(create_api_response(False, error='No data provided')), 400
        
        # Validate required fields
        required_fields = ['inspection_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify(create_api_response(False, error=f'Required field "{field}" is missing')), 400
        
        with get_db() as conn:
            cursor = conn.execute("""
                INSERT INTO maintenance_quality_inspections (
                    cycle_id, inspector_id, inspection_type, quality_score,
                    visual_inspection_passed, functional_test_passed, safety_check_passed,
                    inspection_notes, photos_json, inspection_status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                cycle_id,
                data.get('inspector_id'),
                data['inspection_type'],
                data.get('quality_score'),
                data.get('visual_inspection_passed', False),
                data.get('functional_test_passed', False),
                data.get('safety_check_passed', False),
                data.get('inspection_notes', ''),
                data.get('photos', '[]'),
                data.get('inspection_status', 'pending')
            ))
            
            inspection_id = cursor.lastrowid
            conn.commit()
            
            return jsonify(create_api_response(
                True,
                {'inspection_id': inspection_id},
                message='Quality inspection created successfully'
            )), 201
            
    except Exception as e:
        logger.error(f"Error creating quality inspection: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

@bp.route('/cycles/<int:cycle_id>/inspections', methods=['GET'])
def get_quality_inspections(cycle_id: int):
    """Get quality inspections for maintenance cycle"""
    try:
        with get_db() as conn:
            cursor = conn.execute("""
                SELECT inspection_id, inspector_id, inspection_type, quality_score,
                       visual_inspection_passed, functional_test_passed, safety_check_passed,
                       inspection_notes, inspection_status, created_at, completed_at
                FROM maintenance_quality_inspections 
                WHERE cycle_id = ?
                ORDER BY created_at DESC
            """, (cycle_id,))
            
            inspections = []
            for row in cursor.fetchall():
                inspections.append({
                    'inspection_id': row[0],
                    'inspector_id': row[1],
                    'inspection_type': row[2],
                    'quality_score': row[3],
                    'visual_inspection_passed': bool(row[4]) if row[4] is not None else None,
                    'functional_test_passed': bool(row[5]) if row[5] is not None else None,
                    'safety_check_passed': bool(row[6]) if row[6] is not None else None,
                    'inspection_notes': row[7],
                    'inspection_status': row[8],
                    'created_at': row[9],
                    'completed_at': row[10]
                })
            
            return jsonify(create_api_response(
                True,
                {'inspections': inspections}
            ))
            
    except Exception as e:
        logger.error(f"Error getting quality inspections for cycle {cycle_id}: {e}")
        return jsonify(create_api_response(False, error=str(e))), 500

# =================== ERROR HANDLERS ===================

@bp.errorhandler(400)
def bad_request(error):
    return jsonify(create_api_response(False, error='Bad request')), 400

@bp.errorhandler(404)
def not_found(error):
    return jsonify(create_api_response(False, error='Resource not found')), 404

@bp.errorhandler(500)
def internal_error(error):
    return jsonify(create_api_response(False, error='Internal server error')), 500 