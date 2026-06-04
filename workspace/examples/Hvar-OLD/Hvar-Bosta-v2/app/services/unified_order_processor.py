"""
Expert Unified Order Processor - Complete Cycle Integration
Integrates all pending orders functionality into main orders table without schema changes
Handles scanning, quality control, returns, and customer service cycles
"""

import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import pytz

from app.utils.db_utils import get_db
from app.services.bosta_api import search_orders, get_order_details
from app.services.order_classification import order_classifier
from app.utils.phone_utils import clean_phone

logger = logging.getLogger(__name__)
EGYPT_TZ = pytz.timezone('Africa/Cairo')

# ================================================================================
# ENUMS AND DATA CLASSES
# ================================================================================

class OrderCycleType(Enum):
    """Order cycle types for unified processing"""
    NORMAL = "normal"           # Standard delivery orders
    EXCHANGE = "exchange"       # Product exchanges
    RETURN_PICKUP = "return_pickup"  # Customer returns
    SIGN_AND_RETURN = "sign_and_return"  # Special handling
    MAINTENANCE = "maintenance" # Service/maintenance orders

class ProcessingStage(Enum):
    """Processing stages for unified order lifecycle"""
    INTAKE = "intake"           # Initial order intake
    CLASSIFICATION = "classification"  # Business classification
    SCANNING = "scanning"       # Hub scanning phase
    QUALITY_CHECK = "quality_check"  # Quality inspection
    SERVICE_ACTION = "service_action"  # Service action creation
    MAINTENANCE = "maintenance" # Maintenance cycle
    CUSTOMER_SERVICE = "customer_service"  # Customer service
    RETURN_PROCESSING = "return_processing"  # Return handling
    COMPLETION = "completion"   # Final completion

@dataclass
class UnifiedOrderData:
    """Unified order data structure"""
    tracking_number: str
    order_type_code: int
    order_type_value: str
    state_code: int
    state_value: str
    cycle_type: OrderCycleType
    processing_stage: ProcessingStage
    is_pending_cycle: bool = False
    pending_status: str = None
    hub_scan_required: bool = False
    quality_check_required: bool = False
    service_action_required: bool = False
    maintenance_required: bool = False
    customer_service_required: bool = False
    return_processing_required: bool = False

# ================================================================================
# EXPERT UNIFIED ORDER PROCESSOR
# ================================================================================

class UnifiedOrderProcessor:
    """
    Expert Unified Order Processor
    Integrates all pending orders functionality into main orders table
    Handles complete cycle: scanning, quality, returns, customer service
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def process_order_complete_cycle(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process order through complete unified cycle
        Integrates all pending orders functionality into main orders table
        """
        try:
            # Step 1: Classify order type and determine cycle
            unified_data = self._classify_order_cycle(order_data)
            
            # Step 2: Save to main orders table (no schema changes)
            save_result = self._save_to_main_orders_table(order_data, unified_data)
            if not save_result['success']:
                return save_result
            
            # Step 3: Initialize customer profile for this order
            customer_result = self._initialize_customer_profile(order_data)
            
            # Step 4: Process based on cycle type
            if unified_data.cycle_type == OrderCycleType.NORMAL:
                return self._process_normal_order_cycle(order_data, unified_data)
            elif unified_data.cycle_type == OrderCycleType.EXCHANGE:
                return self._process_exchange_order_cycle(order_data, unified_data)
            elif unified_data.cycle_type == OrderCycleType.RETURN_PICKUP:
                return self._process_return_pickup_cycle(order_data, unified_data)
            elif unified_data.cycle_type == OrderCycleType.MAINTENANCE:
                return self._process_maintenance_cycle(order_data, unified_data)
            else:
                return self._process_special_cycle(order_data, unified_data)
                
        except Exception as e:
            self.logger.error(f"Error in complete cycle processing: {e}")
            return {'success': False, 'error': str(e)}
    
    def _classify_order_cycle(self, order_data: Dict[str, Any]) -> UnifiedOrderData:
        """Classify order and determine processing cycle"""
        order_type_code = order_data.get('order_type_code', 10)
        state_code = order_data.get('state_code', 0)
        
        # Determine cycle type based on order type
        if order_type_code == 30:  # Exchange
            cycle_type = OrderCycleType.EXCHANGE
            is_pending_cycle = True
        elif order_type_code == 25:  # Customer Return Pickup
            cycle_type = OrderCycleType.RETURN_PICKUP
            is_pending_cycle = True
        elif order_type_code == 10:  # Send
            cycle_type = OrderCycleType.NORMAL
            is_pending_cycle = False
        else:
            cycle_type = OrderCycleType.NORMAL
            is_pending_cycle = False
        
        # Determine processing requirements
        hub_scan_required = cycle_type in [OrderCycleType.EXCHANGE, OrderCycleType.RETURN_PICKUP]
        quality_check_required = cycle_type in [OrderCycleType.EXCHANGE, OrderCycleType.RETURN_PICKUP]
        service_action_required = cycle_type in [OrderCycleType.EXCHANGE, OrderCycleType.RETURN_PICKUP, OrderCycleType.MAINTENANCE]
        maintenance_required = cycle_type == OrderCycleType.MAINTENANCE
        customer_service_required = cycle_type in [OrderCycleType.RETURN_PICKUP, OrderCycleType.MAINTENANCE]
        return_processing_required = cycle_type in [OrderCycleType.EXCHANGE, OrderCycleType.RETURN_PICKUP]
        
        return UnifiedOrderData(
            tracking_number=order_data.get('tracking_number', ''),
            order_type_code=order_type_code,
            order_type_value=order_data.get('order_type_value', ''),
            state_code=state_code,
            state_value=order_data.get('state_value', ''),
            cycle_type=cycle_type,
            processing_stage=ProcessingStage.INTAKE,
            is_pending_cycle=is_pending_cycle,
            pending_status='pending' if is_pending_cycle else None,
            hub_scan_required=hub_scan_required,
            quality_check_required=quality_check_required,
            service_action_required=service_action_required,
            maintenance_required=maintenance_required,
            customer_service_required=customer_service_required,
            return_processing_required=return_processing_required
        )
    
    def _save_to_main_orders_table(self, order_data: Dict[str, Any], unified_data: UnifiedOrderData) -> Dict[str, Any]:
        """Save order to main orders table with cycle information in existing fields"""
        try:
            with get_db() as conn:
                # Use existing fields to store cycle information
                # business_category field for cycle type
                # cod_category field for processing stage
                # risk_level field for pending status
                
                enhanced_order_data = order_data.copy()
                enhanced_order_data['business_category'] = unified_data.cycle_type.value
                enhanced_order_data['cod_category'] = unified_data.processing_stage.value
                enhanced_order_data['risk_level'] = unified_data.pending_status or 'normal'
                
                # Add cycle flags to notes field (JSON format)
                cycle_flags = {
                    'is_pending_cycle': unified_data.is_pending_cycle,
                    'hub_scan_required': unified_data.hub_scan_required,
                    'quality_check_required': unified_data.quality_check_required,
                    'service_action_required': unified_data.service_action_required,
                    'maintenance_required': unified_data.maintenance_required,
                    'customer_service_required': unified_data.customer_service_required,
                    'return_processing_required': unified_data.return_processing_required
                }
                
                # Append cycle flags to existing notes
                existing_notes = order_data.get('notes', '')
                cycle_notes = f" [CYCLE_FLAGS:{json.dumps(cycle_flags)}]"
                enhanced_order_data['notes'] = existing_notes + cycle_notes
                
                # Save to main orders table
                cursor = conn.execute("""
                    INSERT OR REPLACE INTO orders (
                        id, tracking_number, state_code, state_value, order_type_code,
                        order_type_value, cod, bosta_fees, receiver_phone, receiver_name,
                        product_name, notes, dropoff_city_name, dropoff_zone_name,
                        dropoff_district_name, dropoff_first_line, created_at, delivered_at,
                        timeline_json, business_category, risk_level, last_synced
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """, (
                    enhanced_order_data['id'], enhanced_order_data['tracking_number'],
                    enhanced_order_data['state_code'], enhanced_order_data['state_value'],
                    enhanced_order_data['order_type_code'], enhanced_order_data['order_type_value'],
                    enhanced_order_data['cod'], enhanced_order_data['bosta_fees'],
                    enhanced_order_data['receiver_phone'], enhanced_order_data['receiver_name'],
                    enhanced_order_data['product_name'], enhanced_order_data['notes'],
                    enhanced_order_data['dropoff_city_name'], enhanced_order_data['dropoff_zone_name'],
                    enhanced_order_data['dropoff_district_name'], enhanced_order_data['dropoff_first_line'],
                    enhanced_order_data['created_at'], enhanced_order_data['delivered_at'],
                    enhanced_order_data['timeline_json'], enhanced_order_data['business_category'],
                    enhanced_order_data['risk_level']
                ))
                
                conn.commit()
                return {'success': True, 'order_id': enhanced_order_data['id']}
                
        except Exception as e:
            self.logger.error(f"Error saving to main orders table: {e}")
            return {'success': False, 'error': str(e)}
    
    def _process_normal_order_cycle(self, order_data: Dict[str, Any], unified_data: UnifiedOrderData) -> Dict[str, Any]:
        """Process normal order cycle"""
        try:
            # Update processing stage
            unified_data.processing_stage = ProcessingStage.CLASSIFICATION
            
            # Apply business classification
            classification_result = self._apply_business_classification(order_data)
            
            # Update order with classification
            self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            return {
                'success': True,
                'cycle_type': 'normal',
                'processing_stage': unified_data.processing_stage.value,
                'classification': classification_result
            }
            
        except Exception as e:
            self.logger.error(f"Error in normal order cycle: {e}")
            return {'success': False, 'error': str(e)}
    
    def _process_exchange_order_cycle(self, order_data: Dict[str, Any], unified_data: UnifiedOrderData) -> Dict[str, Any]:
        """Process exchange order cycle with all pending functionality"""
        try:
            results = {}
            
            # Step 1: Hub Scanning
            if unified_data.hub_scan_required:
                unified_data.processing_stage = ProcessingStage.SCANNING
                scan_result = self._perform_hub_scanning(order_data)
                results['hub_scan'] = scan_result
                self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            # Step 2: Quality Check
            if unified_data.quality_check_required:
                unified_data.processing_stage = ProcessingStage.QUALITY_CHECK
                quality_result = self._perform_quality_check(order_data)
                results['quality_check'] = quality_result
                self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            # Step 3: Service Action
            if unified_data.service_action_required:
                unified_data.processing_stage = ProcessingStage.SERVICE_ACTION
                service_result = self._create_service_action(order_data, 'exchange')
                results['service_action'] = service_result
                self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            # Step 4: Return Processing
            if unified_data.return_processing_required:
                unified_data.processing_stage = ProcessingStage.RETURN_PROCESSING
                return_result = self._process_return_handling(order_data)
                results['return_processing'] = return_result
                self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            # Step 5: Completion
            unified_data.processing_stage = ProcessingStage.COMPLETION
            self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            return {
                'success': True,
                'cycle_type': 'exchange',
                'processing_stage': unified_data.processing_stage.value,
                'results': results
            }
            
        except Exception as e:
            self.logger.error(f"Error in exchange order cycle: {e}")
            return {'success': False, 'error': str(e)}
    
    def _process_return_pickup_cycle(self, order_data: Dict[str, Any], unified_data: UnifiedOrderData) -> Dict[str, Any]:
        """Process return pickup cycle with customer service integration"""
        try:
            results = {}
            
            # Step 1: Customer Service
            if unified_data.customer_service_required:
                unified_data.processing_stage = ProcessingStage.CUSTOMER_SERVICE
                customer_service_result = self._initiate_customer_service(order_data)
                results['customer_service'] = customer_service_result
                self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            # Step 2: Hub Scanning
            if unified_data.hub_scan_required:
                unified_data.processing_stage = ProcessingStage.SCANNING
                scan_result = self._perform_hub_scanning(order_data)
                results['hub_scan'] = scan_result
                self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            # Step 3: Quality Check
            if unified_data.quality_check_required:
                unified_data.processing_stage = ProcessingStage.QUALITY_CHECK
                quality_result = self._perform_quality_check(order_data)
                results['quality_check'] = quality_result
                self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            # Step 4: Service Action
            if unified_data.service_action_required:
                unified_data.processing_stage = ProcessingStage.SERVICE_ACTION
                service_result = self._create_service_action(order_data, 'return_pickup')
                results['service_action'] = service_result
                self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            # Step 5: Return Processing
            if unified_data.return_processing_required:
                unified_data.processing_stage = ProcessingStage.RETURN_PROCESSING
                return_result = self._process_return_handling(order_data)
                results['return_processing'] = return_result
                self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            # Step 6: Completion
            unified_data.processing_stage = ProcessingStage.COMPLETION
            self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            return {
                'success': True,
                'cycle_type': 'return_pickup',
                'processing_stage': unified_data.processing_stage.value,
                'results': results
            }
            
        except Exception as e:
            self.logger.error(f"Error in return pickup cycle: {e}")
            return {'success': False, 'error': str(e)}
    
    def _process_maintenance_cycle(self, order_data: Dict[str, Any], unified_data: UnifiedOrderData) -> Dict[str, Any]:
        """Process maintenance cycle with full service integration"""
        try:
            results = {}
            
            # Step 1: Service Action
            if unified_data.service_action_required:
                unified_data.processing_stage = ProcessingStage.SERVICE_ACTION
                service_result = self._create_service_action(order_data, 'maintenance')
                results['service_action'] = service_result
                self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            # Step 2: Maintenance
            if unified_data.maintenance_required:
                unified_data.processing_stage = ProcessingStage.MAINTENANCE
                maintenance_result = self._create_maintenance_cycle(order_data)
                results['maintenance'] = maintenance_result
                self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            # Step 3: Customer Service
            if unified_data.customer_service_required:
                unified_data.processing_stage = ProcessingStage.CUSTOMER_SERVICE
                customer_service_result = self._initiate_customer_service(order_data)
                results['customer_service'] = customer_service_result
                self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            # Step 4: Completion
            unified_data.processing_stage = ProcessingStage.COMPLETION
            self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            return {
                'success': True,
                'cycle_type': 'maintenance',
                'processing_stage': unified_data.processing_stage.value,
                'results': results
            }
            
        except Exception as e:
            self.logger.error(f"Error in maintenance cycle: {e}")
            return {'success': False, 'error': str(e)}
    
    def _process_special_cycle(self, order_data: Dict[str, Any], unified_data: UnifiedOrderData) -> Dict[str, Any]:
        """Process special order cycles"""
        try:
            # Apply all available processing steps
            results = {}
            
            # Hub Scanning
            if unified_data.hub_scan_required:
                unified_data.processing_stage = ProcessingStage.SCANNING
                scan_result = self._perform_hub_scanning(order_data)
                results['hub_scan'] = scan_result
            
            # Quality Check
            if unified_data.quality_check_required:
                unified_data.processing_stage = ProcessingStage.QUALITY_CHECK
                quality_result = self._perform_quality_check(order_data)
                results['quality_check'] = quality_result
            
            # Service Action
            if unified_data.service_action_required:
                unified_data.processing_stage = ProcessingStage.SERVICE_ACTION
                service_result = self._create_service_action(order_data, 'special')
                results['service_action'] = service_result
            
            # Customer Service
            if unified_data.customer_service_required:
                unified_data.processing_stage = ProcessingStage.CUSTOMER_SERVICE
                customer_service_result = self._initiate_customer_service(order_data)
                results['customer_service'] = customer_service_result
            
            # Return Processing
            if unified_data.return_processing_required:
                unified_data.processing_stage = ProcessingStage.RETURN_PROCESSING
                return_result = self._process_return_handling(order_data)
                results['return_processing'] = return_result
            
            # Completion
            unified_data.processing_stage = ProcessingStage.COMPLETION
            self._update_order_processing_stage(order_data['tracking_number'], unified_data)
            
            return {
                'success': True,
                'cycle_type': 'special',
                'processing_stage': unified_data.processing_stage.value,
                'results': results
            }
            
        except Exception as e:
            self.logger.error(f"Error in special cycle: {e}")
            return {'success': False, 'error': str(e)}
    
    # ================================================================================
    # PROCESSING COMPONENTS
    # ================================================================================
    
    def _apply_business_classification(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Apply business classification to order"""
        try:
            # Use existing order classification service
            classification = order_classifier.classify_order(order_data)
            return classification
        except Exception as e:
            self.logger.error(f"Error in business classification: {e}")
            return {'success': False, 'error': str(e)}
    
    def _perform_hub_scanning(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform hub scanning for order"""
        try:
            tracking_number = order_data.get('tracking_number')
            
            # Create hub confirmation workflow entry
            with get_db() as conn:
                cursor = conn.execute("""
                    INSERT INTO hub_confirmation_workflow (
                        return_tracking_number, confirmation_status, created_at
                    ) VALUES (?, 'pending', CURRENT_TIMESTAMP)
                """, (tracking_number,))
                
                workflow_id = cursor.lastrowid
                
                return {
                    'success': True,
                    'workflow_id': workflow_id,
                    'status': 'pending',
                    'message': 'Hub scanning workflow created'
                }
                
        except Exception as e:
            self.logger.error(f"Error in hub scanning: {e}")
            return {'success': False, 'error': str(e)}
    
    def _perform_quality_check(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform quality check for order"""
        try:
            tracking_number = order_data.get('tracking_number')
            
            # Update hub confirmation workflow with quality check
            with get_db() as conn:
                conn.execute("""
                    UPDATE hub_confirmation_workflow 
                    SET confirmation_status = 'quality_check',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE return_tracking_number = ?
                """, (tracking_number,))
                
                return {
                    'success': True,
                    'status': 'quality_check',
                    'message': 'Quality check initiated'
                }
                
        except Exception as e:
            self.logger.error(f"Error in quality check: {e}")
            return {'success': False, 'error': str(e)}
    
    def _create_service_action(self, order_data: Dict[str, Any], action_type: str) -> Dict[str, Any]:
        """Create service action for order"""
        try:
            tracking_number = order_data.get('tracking_number')
            customer_phone = order_data.get('receiver_phone')
            product_name = order_data.get('product_name', '')
            
            with get_db() as conn:
                cursor = conn.execute("""
                    INSERT INTO service_actions (
                        customer_phone, tracking_number, action_type, action_status,
                        service_reason, product_name, created_at
                    ) VALUES (?, ?, ?, 'requested', ?, ?, CURRENT_TIMESTAMP)
                """, (customer_phone, tracking_number, action_type, f"{action_type} processing", product_name))
                
                action_id = cursor.lastrowid
                
                return {
                    'success': True,
                    'action_id': action_id,
                    'action_type': action_type,
                    'status': 'requested'
                }
                
        except Exception as e:
            self.logger.error(f"Error creating service action: {e}")
            return {'success': False, 'error': str(e)}
    
    def _create_maintenance_cycle(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create maintenance cycle for order"""
        try:
            tracking_number = order_data.get('tracking_number')
            customer_phone = order_data.get('receiver_phone')
            
            # Get service action ID
            with get_db() as conn:
                cursor = conn.execute("""
                    SELECT action_id FROM service_actions 
                    WHERE tracking_number = ? ORDER BY created_at DESC LIMIT 1
                """, (tracking_number,))
                
                action_row = cursor.fetchone()
                if not action_row:
                    return {'success': False, 'error': 'No service action found'}
                
                action_id = action_row[0]
                
                # Create maintenance cycle
                cursor = conn.execute("""
                    INSERT INTO maintenance_cycles (
                        action_id, customer_phone, tracking_number, cycle_type,
                        cycle_status, priority, created_at
                    ) VALUES (?, ?, ?, 'corrective', 'scheduled', 'medium', CURRENT_TIMESTAMP)
                """, (action_id, customer_phone, tracking_number))
                
                cycle_id = cursor.lastrowid
                
                return {
                    'success': True,
                    'cycle_id': cycle_id,
                    'cycle_type': 'corrective',
                    'status': 'scheduled'
                }
                
        except Exception as e:
            self.logger.error(f"Error creating maintenance cycle: {e}")
            return {'success': False, 'error': str(e)}
    
    def _initiate_customer_service(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Initiate customer service for order"""
        try:
            tracking_number = order_data.get('tracking_number')
            customer_phone = order_data.get('receiver_phone')
            
            # Create customer service ticket
            with get_db() as conn:
                cursor = conn.execute("""
                    INSERT INTO service_actions (
                        customer_phone, tracking_number, action_type, action_status,
                        service_reason, created_at
                    ) VALUES (?, ?, 'customer_service', 'requested', 'Customer service initiated', CURRENT_TIMESTAMP)
                """, (customer_phone, tracking_number))
                
                action_id = cursor.lastrowid
                
                return {
                    'success': True,
                    'action_id': action_id,
                    'action_type': 'customer_service',
                    'status': 'requested'
                }
                
        except Exception as e:
            self.logger.error(f"Error initiating customer service: {e}")
            return {'success': False, 'error': str(e)}
    
    def _process_return_handling(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process return handling for order"""
        try:
            tracking_number = order_data.get('tracking_number')
            
            # Update hub confirmation workflow to completed
            with get_db() as conn:
                conn.execute("""
                    UPDATE hub_confirmation_workflow 
                    SET confirmation_status = 'completed',
                        confirmed_at = CURRENT_TIMESTAMP
                    WHERE return_tracking_number = ?
                """, (tracking_number,))
                
                return {
                    'success': True,
                    'status': 'completed',
                    'message': 'Return processing completed'
                }
                
        except Exception as e:
            self.logger.error(f"Error in return handling: {e}")
            return {'success': False, 'error': str(e)}
    
    def _update_order_processing_stage(self, tracking_number: str, unified_data: UnifiedOrderData):
        """Update order processing stage in main orders table"""
        try:
            with get_db() as conn:
                conn.execute("""
                    UPDATE orders 
                    SET cod_category = ?, risk_level = ?
                    WHERE tracking_number = ?
                """, (unified_data.processing_stage.value, unified_data.pending_status or 'normal', tracking_number))
                
        except Exception as e:
            self.logger.error(f"Error updating processing stage: {e}")
    
    # ================================================================================
    # BATCH PROCESSING
    # ================================================================================
    
    def process_batch_unified(self, orders: List[Dict[str, Any]], max_workers: int = 5) -> Dict[str, Any]:
        """Process batch of orders through unified cycle"""
        try:
            results = []
            successful = 0
            failed = 0
            
            for order in orders:
                try:
                    result = self.process_order_complete_cycle(order)
                    results.append(result)
                    
                    if result['success']:
                        successful += 1
                    else:
                        failed += 1
                        
                except Exception as e:
                    self.logger.error(f"Error processing order {order.get('tracking_number')}: {e}")
                    results.append({'success': False, 'error': str(e)})
                    failed += 1
            
            return {
                'success': True,
                'total_processed': len(orders),
                'successful': successful,
                'failed': failed,
                'results': results
            }
            
        except Exception as e:
            self.logger.error(f"Error in batch processing: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_orders_by_cycle_type(self, cycle_type: OrderCycleType = None) -> Dict[str, Any]:
        """Get orders filtered by cycle type"""
        try:
            with get_db() as conn:
                if cycle_type:
                    cursor = conn.execute("""
                        SELECT * FROM orders 
                        WHERE business_category = ?
                        ORDER BY created_at DESC
                    """, (cycle_type.value,))
                else:
                    cursor = conn.execute("""
                        SELECT * FROM orders 
                        WHERE business_category IN ('exchange', 'return_pickup', 'maintenance')
                        ORDER BY created_at DESC
                    """)
                
                columns = [column[0] for column in cursor.description]
                orders = [dict(zip(columns, row)) for row in cursor.fetchall()]
                
                return {
                    'success': True,
                    'orders': orders,
                    'count': len(orders)
                }
                
        except Exception as e:
            self.logger.error(f"Error getting orders by cycle type: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_orders_by_processing_stage(self, stage: ProcessingStage = None) -> Dict[str, Any]:
        """Get orders filtered by processing stage"""
        try:
            with get_db() as conn:
                if stage:
                    cursor = conn.execute("""
                        SELECT * FROM orders 
                        WHERE cod_category = ?
                        ORDER BY created_at DESC
                    """, (stage.value,))
                else:
                    cursor = conn.execute("""
                        SELECT * FROM orders 
                        WHERE cod_category IN ('scanning', 'quality_check', 'service_action', 'maintenance', 'customer_service', 'return_processing')
                        ORDER BY created_at DESC
                    """)
                
                columns = [column[0] for column in cursor.description]
                orders = [dict(zip(columns, row)) for row in cursor.fetchall()]
                
                return {
                    'success': True,
                    'orders': orders,
                    'count': len(orders)
                }
                
        except Exception as e:
            self.logger.error(f"Error getting orders by processing stage: {e}")
            return {'success': False, 'error': str(e)}
    
    def _initialize_customer_profile(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Initialize customer profile for each order from Bosta
        
        This method ensures that every order creates/updates a customer profile
        in real-time during the order processing cycle.
        
        Args:
            order_data: Order data from Bosta API
            
        Returns:
            Dict containing customer initialization results
        """
        try:
            from app.services.customer_profile_manager import CustomerProfileManager
            
            # Initialize customer profile manager
            customer_manager = CustomerProfileManager()
            
            # Process customer from order data
            with get_db() as conn:
                customer_results = customer_manager.process_customer_from_order(conn, order_data)
            
            if customer_results.get('success'):
                self.logger.info(f"Customer initialized for order {order_data.get('tracking_number')}: "
                               f"Customer ID {customer_results.get('customer_id')}, "
                               f"Segment: {customer_results.get('new_segment')}")
                
                return {
                    'success': True,
                    'customer_id': customer_results.get('customer_id'),
                    'new_segment': customer_results.get('new_segment'),
                    'profile_updated': customer_results.get('profile_updated', False),
                    'addresses_updated': customer_results.get('addresses_updated', 0),
                    'analytics_updated': customer_results.get('analytics_updated', False)
                }
            else:
                self.logger.error(f"Failed to initialize customer for order {order_data.get('tracking_number')}: "
                                f"{customer_results.get('error')}")
                
                return {
                    'success': False,
                    'error': customer_results.get('error'),
                    'customer_id': None,
                    'new_segment': None
                }
                
        except Exception as e:
            self.logger.error(f"Error initializing customer profile for order {order_data.get('tracking_number')}: {e}")
            return {
                'success': False,
                'error': str(e),
                'customer_id': None,
                'new_segment': None
            }

# ================================================================================
# GLOBAL INSTANCE
# ================================================================================

unified_order_processor = UnifiedOrderProcessor()
